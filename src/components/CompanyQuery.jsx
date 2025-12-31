import React, { useState } from 'react'
import './CompanyQuery.css'

const CompanyQuery = () => {
  const [queryType, setQueryType] = useState('taxId') // 'taxId' or 'name'
  const [queryValue, setQueryValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const formatCurrency = (amount) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('zh-TW').format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString || dateString === '-') return '-'
    
    // 嘗試解析各種日期格式
    try {
      // 如果是 ISO 格式 (YYYY-MM-DD 或 YYYY-MM-DDTHH:mm:ss)
      if (dateString.includes('-')) {
        const date = new Date(dateString)
        if (!isNaN(date.getTime())) {
          // 格式化為 YYYY-MM-DD
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }
      }
      
      // 經濟部商業司 API 使用 YYYYMMDD 格式（例如：1140630 表示民國 114 年 6 月 30 日）
      if (/^\d{7}$/.test(dateString)) {
        // 民國年格式：YYYMMDD（例如：1140630）
        const year = parseInt(dateString.substring(0, 3), 10)
        const month = dateString.substring(3, 5)
        const day = dateString.substring(5, 7)
        return `${year}/${month}/${day}`
      }
      
      // 如果是民國年格式 (YYY/MM/DD)
      if (dateString.includes('/') && /^\d{3}\/\d{2}\/\d{2}$/.test(dateString)) {
        return dateString
      }
      
      // 如果是 YYYYMMDD 格式（西元年）
      if (/^\d{8}$/.test(dateString)) {
        const year = dateString.substring(0, 4)
        const month = dateString.substring(4, 6)
        const day = dateString.substring(6, 8)
        return `${year}-${month}-${day}`
      }
      
      // 其他格式直接返回
      return dateString
    } catch (error) {
      console.warn('日期格式化錯誤:', error, dateString)
      return dateString || '-'
    }
  }

  const handleQuery = async () => {
    if (!queryValue.trim()) {
      setError('請輸入統一編號或公司名稱')
      return
    }

    if (queryType === 'taxId' && queryValue.length !== 8) {
      setError('統一編號必須為 8 位數字')
      return
    }

    if (queryType === 'name' && queryValue.length < 2) {
      setError('公司名稱至少需要 2 個字元')
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)

    try {
      // 查詢後端 API
      let basicInfoData = []
      
      try {
        console.log('開始查詢後端 API...')
        
        // 設置總體超時保護
        const queryTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('查詢超時')), 15000) // 15 秒總超時
        })
        
        const response = await Promise.race([
          fetch('/api/company/query', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              queryType: queryType,
              queryValue: queryValue
            })
          }),
          queryTimeout
        ])
        
        if (!response.ok) {
          let errorData
          try {
            const responseText = await response.text()
            if (responseText) {
              errorData = JSON.parse(responseText)
            } else {
              errorData = { error: `HTTP ${response.status}` }
            }
          } catch (e) {
            errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
          }
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }
        
        const responseText = await response.text()
        if (!responseText || !responseText.trim()) {
          throw new Error('伺服器返回空回應')
        }
        
        let result
        try {
          result = JSON.parse(responseText)
        } catch (e) {
          console.error('JSON 解析錯誤:', e)
          console.error('回應內容:', responseText.substring(0, 500))
          throw new Error('伺服器回應格式錯誤，無法解析 JSON')
        }
        
        if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
          basicInfoData = result.data
          console.log('使用後端 API 資料:', basicInfoData)
        } else {
          throw new Error(result.error || '查無資料')
        }
      } catch (error) {
        console.error('查詢過程發生錯誤:', error)
        if (error.message === '查詢超時') {
          setError('查詢超時，請稍後再試')
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          setError('無法連接到伺服器。請確認後端服務是否正在運行（http://localhost:5000）')
        } else {
          setError(error.message || '查詢失敗，請檢查網路連線或稍後再試')
        }
        setLoading(false)
        return
      }
      
      console.log('最終查詢結果:', basicInfoData)
      console.log('查詢結果類型:', typeof basicInfoData)
      console.log('查詢結果是否為陣列:', Array.isArray(basicInfoData))
      console.log('查詢結果長度:', basicInfoData ? basicInfoData.length : 'undefined')
      
      if (!basicInfoData || !Array.isArray(basicInfoData) || basicInfoData.length === 0) {
        setError('查無資料，請確認輸入的統一編號或公司名稱是否正確')
        setLoading(false)
        return
      }
      
      // 輸出第一筆資料的所有欄位，以便調試
      if (basicInfoData.length > 0) {
        console.log('第一筆資料的所有欄位:', Object.keys(basicInfoData[0]))
        console.log('第一筆資料完整內容:', JSON.stringify(basicInfoData[0], null, 2))
        console.log('第一筆資料的實收資本額相關欄位:', {
          paidInCapital: basicInfoData[0].paidInCapital,
          capitalTotal: basicInfoData[0].capitalTotal,
          allKeys: Object.keys(basicInfoData[0]).filter(key => 
            key.toLowerCase().includes('capital') || 
            key.toLowerCase().includes('paid') ||
            key.includes('資本') ||
            key.includes('實收')
          )
        })
        console.log('第一筆資料的公司狀態相關欄位:', {
          allKeys: Object.keys(basicInfoData[0]).filter(key => 
            key.toLowerCase().includes('status') ||
            key.includes('狀態')
          ),
          values: Object.keys(basicInfoData[0])
            .filter(key => key.toLowerCase().includes('status') || key.includes('狀態'))
            .reduce((acc, key) => ({ ...acc, [key]: basicInfoData[0][key] }), {})
        })
        console.log('第一筆資料的日期相關欄位:', {
          allKeys: Object.keys(basicInfoData[0]).filter(key => 
            key.toLowerCase().includes('date') ||
            key.toLowerCase().includes('date') ||
            key.includes('日期')
          ),
          values: Object.keys(basicInfoData[0])
            .filter(key => key.toLowerCase().includes('date') || key.includes('日期'))
            .reduce((acc, key) => ({ ...acc, [key]: basicInfoData[0][key] }), {})
        })
      }
      
      // 輔助函數：取得欄位值
      const getField = (item, possibleNames) => {
        for (const name of possibleNames) {
          if (item[name] !== undefined && item[name] !== null && item[name] !== '') {
            return item[name]
          }
        }
        return null
      }
      
      // 轉換公司狀態代碼為文字
      const getCompanyStatusText = (statusCode) => {
        if (!statusCode || statusCode === '-') return '-'
        
        const statusMap = {
          '01': '核准設立',
          '02': '核准登記',
          '03': '撤銷登記',
          '04': '解散',
          '05': '廢止',
          '06': '合併',
          '07': '分割',
          '08': '變更組織',
          '09': '停業',
          '10': '歇業',
          '11': '復業',
          '12': '清算',
          '13': '破產',
          '14': '重整',
          '15': '其他',
          '核准設立': '核准設立',
          '核准登記': '核准登記',
          '撤銷登記': '撤銷登記',
          '解散': '解散',
          '廢止': '廢止',
          '合併': '合併',
          '分割': '分割',
          '變更組織': '變更組織',
          '停業': '停業',
          '歇業': '歇業',
          '復業': '復業',
          '清算': '清算',
          '破產': '破產',
          '重整': '重整',
          'Active': '核准設立',
          'Inactive': '停業',
          'Dissolved': '解散',
          'active': '核准設立',
          'inactive': '停業',
          'dissolved': '解散',
        }
        
        // 如果是數字字串，轉換為文字
        const code = String(statusCode).trim()
        
        // 先檢查精確匹配
        if (statusMap[code]) {
          return statusMap[code]
        }
        
        // 檢查是否包含狀態文字
        const lowerCode = code.toLowerCase()
        for (const [key, value] of Object.entries(statusMap)) {
          if (lowerCode.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerCode)) {
            return value
          }
        }
        
        // 如果都不匹配，返回原始值
        return statusCode
      }
      
      const data = {
        basicInfo: basicInfoData
      }
      
      console.log('合併後的資料:', data)
      
      // 輸出原始資料以便調試
      if (data.basicInfo && data.basicInfo.length > 0) {
        console.log('原始基本資料欄位:', Object.keys(data.basicInfo[0]))
        console.log('原始基本資料完整內容:', JSON.stringify(data.basicInfo[0], null, 2))
        console.log('原始資料的所有鍵值對:', Object.entries(data.basicInfo[0]).map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`))
      }
      
      // 轉換 API 資料格式為組件使用的格式
      
      // 處理基本資料 - 直接從原始資料中提取所有欄位
      const formattedBasicData = data.basicInfo.map((item, index) => {
        // 保留原始資料
        const originalData = { ...item }
        
        console.log(`[DEBUG] ========== 處理第 ${index + 1} 筆資料 ==========`)
        console.log(`[DEBUG] 原始資料的所有鍵名:`, Object.keys(originalData))
        console.log(`[DEBUG] 原始資料的鍵值對:`, Object.entries(originalData).map(([key, value]) => {
          const displayValue = typeof value === 'object' && value !== null 
            ? (Array.isArray(value) ? `[陣列，長度: ${value.length}]` : `{物件，鍵: ${Object.keys(value).join(', ')}}`)
            : String(value).substring(0, 100)
          return `${key}: ${displayValue}`
        }))
        console.log(`[DEBUG] 原始資料完整 JSON:`, JSON.stringify(originalData, null, 2))
        
        // 檢查關鍵欄位是否存在
        console.log(`[DEBUG] 關鍵欄位檢查:`, {
          'Company_Name': originalData['Company_Name'],
          'Business_Accounting_NO': originalData['Business_Accounting_NO'],
          'Company_Status_Desc': originalData['Company_Status_Desc'],
          'Company_Setup_Date': originalData['Company_Setup_Date'],
          'Change_Of_Approval_Data': originalData['Change_Of_Approval_Data'],
          'Register_Organization_Desc': originalData['Register_Organization_Desc'],
          'Capital_Stock_Amount': originalData['Capital_Stock_Amount'],
          'Paid_In_Capital_Amount': originalData['Paid_In_Capital_Amount'],
          'Responsible_Name': originalData['Responsible_Name'],
          'Company_Location': originalData['Company_Location']
        })
        
        // 輔助函數：從原始資料中查找欄位值（支援多種可能的鍵名）
        const findValue = (possibleKeys, transformFn = null, fieldName = '') => {
          // 先嘗試直接匹配
          for (const key of possibleKeys) {
            if (originalData[key] !== undefined && originalData[key] !== null && originalData[key] !== '') {
              const value = transformFn ? transformFn(originalData[key]) : originalData[key]
              if (fieldName) console.log(`[DEBUG] ${fieldName} 找到於鍵: ${key}, 值: ${value}`)
              return value
            }
          }
          
          // 如果找不到，嘗試不區分大小寫匹配
          const lowerKeys = possibleKeys.map(k => k.toLowerCase())
          for (const key in originalData) {
            if (lowerKeys.includes(key.toLowerCase())) {
              const value = originalData[key]
              if (value !== undefined && value !== null && value !== '') {
                const result = transformFn ? transformFn(value) : value
                if (fieldName) console.log(`[DEBUG] ${fieldName} 找到於鍵（不區分大小寫）: ${key}, 值: ${result}`)
                return result
              }
            }
          }
          
          // 如果還是找不到，嘗試部分匹配
          for (const possibleKey of possibleKeys) {
            const keyLower = possibleKey.toLowerCase()
            for (const key in originalData) {
              if (key.toLowerCase().includes(keyLower) || keyLower.includes(key.toLowerCase())) {
                const value = originalData[key]
                if (value !== undefined && value !== null && value !== '') {
                  const result = transformFn ? transformFn(value) : value
                  if (fieldName) console.log(`[DEBUG] ${fieldName} 找到於鍵（部分匹配）: ${key}, 值: ${result}`)
                  return result
                }
              }
            }
          }
          
          if (fieldName) console.log(`[DEBUG] ${fieldName} 未找到，嘗試的鍵:`, possibleKeys.slice(0, 5), '...')
          return null
        }
        
        // 提取公司名稱 - 優先使用實際 API 的鍵名
        const name = findValue([
          'Company_Name', // 實際 API 鍵名（優先）
          'company_name', 'CompanyName', 'COMPANY_NAME', 'companyName',
          'name', 'Name', 'NAME', 'company_name_cn', 'companyNameCn',
          'company_name_zh', 'companyNameZh',
          '公司名稱', '名稱', '公司名', '公司全名', '企業名稱',
          'title', 'Title', 'TITLE', 'company_title', 'companyTitle'
        ], null, '公司名稱') || '-'
        
        // 提取統一編號 - 優先使用實際 API 的鍵名
        const taxId = findValue([
          'Business_Accounting_NO', // 實際 API 鍵名（優先）
          'business_accounting_no', 'BusinessAccountingNO',
          'BUSINESS_ACCOUNTING_NO', 'business_no', 'businessNo', 'business_number', 'businessNumber',
          'taxId', 'TaxId', 'TAX_ID', 'tax_id', 'taxNo', 'tax_no',
          '統一編號', '統編', '統編號', '統一編號號碼', '稅籍編號',
          'id', 'Id', 'ID', 'company_id', 'companyId', 'companyID'
        ], null, '統一編號') || '-'
        
        // 提取公司狀態 - 優先使用 Company_Status_Desc（描述），如果沒有則使用 Company_Status（代碼）
        const statusRaw = findValue([
          'Company_Status_Desc', // 實際 API 鍵名（描述，優先）
          'Company_Status', // 實際 API 鍵名（代碼）
          'company_status_desc', 'company_status', 'CompanyStatus', 'COMPANY_STATUS',
          'status', 'Status', 'STATUS', 'companyStatus',
          'statusDesc', 'status_desc',
          'Status_Code', 'status_code', 'STATUS_CODE', 'statusCode',
          '公司狀態', '狀態', '狀態代碼', '狀態描述', '公司狀態描述',
          'state', 'State', 'STATE', 'company_state', 'companyState'
        ], null, '公司狀態')
        const status = statusRaw ? getCompanyStatusText(statusRaw) : '-'
        
        // 提取設立日期 - 優先使用實際 API 的鍵名
        const establishDate = findValue([
          'Company_Setup_Date', // 實際 API 鍵名（優先）
          'company_setup_date', 'CompanySetupDate', 'COMPANY_SETUP_DATE',
          'Company_Establishment_Date', 'company_establishment_date', 'CompanyEstablishmentDate',
          'COMPANY_ESTABLISHMENT_DATE', 'Setup_Date', 'setup_date',
          'establishDate', 'EstablishDate', 'establishmentDate', 'EstablishmentDate',
          'Establishment_Date', 'establishment_date', 'establish_date',
          '設立日期', '成立日期', '設立年月日', '成立年月日', '設立時間', '成立時間',
          'created_date', 'createdDate', 'CreatedDate', 'create_date', 'createDate'
        ], null, '設立日期') || '-'
        
        // 提取最後變更日期 - 優先使用實際 API 的鍵名
        const lastChangeDate = findValue([
          'Change_Of_Approval_Data', // 實際 API 鍵名（優先）
          'change_of_approval_data', 'ChangeOfApprovalData',
          'CHANGE_OF_APPROVAL_DATA',
          'Company_Last_Change_Date', 'company_last_change_date', 'CompanyLastChangeDate',
          'COMPANY_LAST_CHANGE_DATE', 'lastChangeDate', 'LastChangeDate',
          'Last_Change_Date', 'last_change_date', 'Change_Date', 'change_date',
          'Last_Update_Date', 'last_update_date', 'Update_Date', 'update_date',
          'Modified_Date', 'modified_date', 'modifiedDate', 'ModifiedDate',
          '最後變更日期', '變更日期', '更新日期', '最後更新日期', '修改日期',
          'updated_date', 'updatedDate', 'UpdatedDate', 'updateDate', 'UpdateDate'
        ], null, '最後變更日期') || '-'
        
        // 提取登記機關 - 優先使用 Register_Organization_Desc（描述）
        const registrationAuthority = findValue([
          'Register_Organization_Desc', // 實際 API 鍵名（描述，優先）
          'Register_Organization', // 實際 API 鍵名（代碼）
          'register_organization_desc', 'register_organization', 'RegisterOrganizationDesc',
          'REGISTER_ORGANIZATION_DESC',
          'Agency', 'agency', 'AGENCY', 'registrationAgency', 'registration_agency',
          'Registration_Authority', 'registration_authority', 'RegistrationAuthority',
          'REGISTRATION_AUTHORITY', 'registrationAuthority',
          'Registration_Office', 'registration_office', 'Register_Office', 'register_office',
          '登記機關', '登記單位', '登記處', '登記所', '主管機關', '登記機構',
          'org', 'Org', 'ORG', 'organization', 'Organization', 'ORGANIZATION'
        ], null, '登記機關') || '-'
        
        // 提取資本總額 - 優先使用實際 API 的鍵名
        const capitalTotalRaw = findValue([
          'Capital_Stock_Amount', // 實際 API 鍵名（優先）
          'capital_stock_amount', 'CapitalStockAmount', 'CAPITAL_STOCK_AMOUNT',
          'Capital_Stock_Total', 'capital_stock_total', 'CapitalStockTotal', 'CAPITAL_STOCK_TOTAL',
          'Capital_Amount', 'capital_amount', 'CapitalAmount', 'CAPITAL_AMOUNT',
          'capitalTotal', 'CapitalTotal', 'capital_total', 'CAPITAL_TOTAL',
          '資本總額', '資本額', '總資本額', '資本總額新台幣', '資本總額(元)',
          'capital', 'Capital', 'CAPITAL', 'totalCapital', 'total_capital'
        ], null, '資本總額')
        const capitalTotal = capitalTotalRaw ? (parseInt(capitalTotalRaw) || parseFloat(capitalTotalRaw) || null) : null
        
        // 提取實收資本額 - 優先使用實際 API 的鍵名
        const paidInCapitalRaw = findValue([
          'Paid_In_Capital_Amount', // 實際 API 鍵名（優先）
          'paid_in_capital_amount', 'PaidInCapitalAmount', 'PAID_IN_CAPITAL_AMOUNT',
          'Capital_Stock_Total_Paid_In', 'capital_stock_total_paid_in', 'CapitalStockTotalPaidIn',
          'CAPITAL_STOCK_TOTAL_PAID_IN',
          'Paid_In_Capital', 'paid_in_capital', 'PaidInCapital', 'PAID_IN_CAPITAL',
          'PaidCapital', 'paid_capital', 'Paid_Capital', 'PAID_CAPITAL',
          'Total_Paid_In', 'total_paid_in', 'TotalPaidIn', 'totalPaidIn',
          'paidInCapital', 'paid_in_capital_amount', 'paidInCapitalAmount',
          '實收資本額', '實收資本', '實收', '實收額', '實收資本額新台幣', '實收資本額(元)',
          'paidCapital', 'paid_capital', 'paidCapitalAmount'
        ], null, '實收資本額')
        const paidInCapital = paidInCapitalRaw ? (parseInt(paidInCapitalRaw) || parseFloat(paidInCapitalRaw) || null) : null
        
        // 提取公司負責人 - 直接使用 Responsible_Name（實際 API 鍵名）
        let Responsible_Name = '-'
        
        // 直接從原始資料中提取 Responsible_Name
        if (originalData['Responsible_Name'] !== undefined && originalData['Responsible_Name'] !== null && originalData['Responsible_Name'] !== '') {
          const Responsible_NameValue = originalData['Responsible_Name']
          if (typeof Responsible_NameValue === 'string') {
            Responsible_Name = Responsible_NameValue
            console.log(`[DEBUG] 公司負責人 找到於鍵: Responsible_Name, 值: ${Responsible_Name}`)
          } else if (Array.isArray(Responsible_NameValue) && Responsible_NameValue.length > 0) {
            // 如果是陣列，取第一個
            const first = Responsible_NameValue[0]
            if (typeof first === 'string') {
              Responsible_Name = first
            } else if (typeof first === 'object' && first !== null) {
              Responsible_Name = getField(first, ['Name', 'name', '姓名', 'Responsible_Name', 'responsible_name']) || '-'
            }
          } else if (typeof Responsible_NameValue === 'object' && Responsible_NameValue !== null) {
            // 如果是物件，提取姓名
            Responsible_Name = getField(Responsible_NameValue, ['Name', 'name', '姓名', 'Responsible_Name', 'responsible_name']) || '-'
          }
        }
        
        if (Responsible_Name === '-') {
          console.log(`[DEBUG] 公司負責人 未找到，原始資料中的鍵:`, Object.keys(originalData))
        }
        
        // 提取地址 - 優先使用實際 API 的鍵名
        const address = findValue([
          'Company_Location', // 實際 API 鍵名
          'company_location', 'CompanyLocation', 'COMPANY_LOCATION',
          '公司地址', 'address', 'Address', 'ADDRESS', 'Company_Address', 'company_address',
          'location', 'Location', '公司所在地', 'addr', 'Addr', 'ADDR'
        ], null, '地址') || '-'
        
        const formattedItem = {
          name: name,
          taxId: taxId,
          status: status,
          establishDate: establishDate,
          lastChangeDate: lastChangeDate,
          registrationAuthority: registrationAuthority,
          address: address,
          capitalTotal: capitalTotal,
          paidInCapital: paidInCapital,
          Responsible_Name: Responsible_Name,
          Responsible_Name: Responsible_Name,
          president: Responsible_Name, // 為了向後兼容，同時保留 president 欄位
          originalData: originalData, // 保留原始資料以便顯示所有欄位
        }
        
        console.log(`[DEBUG] 格式化後的資料:`, formattedItem)
        console.log(`[DEBUG] 提取結果摘要:`, {
          name: name !== '-' ? `✓ ${name}` : '✗ 未找到',
          taxId: taxId !== '-' ? `✓ ${taxId}` : '✗ 未找到',
          status: status !== '-' ? `✓ ${status}` : '✗ 未找到',
          establishDate: establishDate !== '-' ? `✓ ${establishDate}` : '✗ 未找到',
          lastChangeDate: lastChangeDate !== '-' ? `✓ ${lastChangeDate}` : '✗ 未找到',
          registrationAuthority: registrationAuthority !== '-' ? `✓ ${registrationAuthority}` : '✗ 未找到',
          capitalTotal: capitalTotal !== null ? `✓ ${capitalTotal}` : '✗ 未找到',
          paidInCapital: paidInCapital !== null ? `✓ ${paidInCapital}` : '✗ 未找到',
          Responsible_Name: Responsible_Name !== '-' ? `✓ ${Responsible_Name}` : '✗ 未找到',
          president: Responsible_Name !== '-' ? `✓ ${Responsible_Name}` : '✗ 未找到'
        })
        
        return formattedItem
      })
      
      // 處理資本額資料（如果資本額 API 有資料，優先使用）
      if (data.capital && data.capital.length > 0) {
        const capitalItem = data.capital[0]
        const capitalTotal = getField(capitalItem, [
          'Capital_Stock_Amount', 'capital_stock_amount', 'CapitalStockAmount',
          'CAPITAL_STOCK_AMOUNT', 'Capital_Stock_Total', 'capital_stock_total', 'CapitalStockTotal',
          'CAPITAL_STOCK_TOTAL', '資本總額', 'capitalTotal', 'CapitalTotal', 'capital_total',
          'Capital_Amount', 'capital_amount', '資本額', '總資本額'
        ])
        const paidInCapital = getField(capitalItem, [
          'Capital_Stock_Total_Paid_In', 'capital_stock_total_paid_in', 'CapitalStockTotalPaidIn',
          'CAPITAL_STOCK_TOTAL_PAID_IN', '實收資本額', 'paidInCapital', 'PaidInCapital',
          'Paid_In_Capital', 'paid_in_capital', '實收資本', 'PaidCapital', 'paid_capital'
        ])
        
        if (formattedBasicData.length > 0) {
          // 如果資本額 API 有資料，覆蓋基本資料中的資本額
          if (capitalTotal) {
            formattedBasicData[0].capitalTotal = parseInt(capitalTotal) || parseFloat(capitalTotal) || null
          }
          if (paidInCapital) {
            formattedBasicData[0].paidInCapital = parseInt(paidInCapital) || parseFloat(paidInCapital) || null
          }
        }
      }
      
      // 處理董監事資料
      const formattedDirectors = (data.directors || []).map(item => ({
        name: getField(item, [
          'Name', 'name', '姓名', 'Director_Name', 'director_name',
          'Name_CN', 'name_cn', '中文姓名', '姓名_中文'
        ]) || '-',
        title: getField(item, [
          'Title', 'title', '職稱', 'Position', 'position',
          'Director_Title', 'director_title', '職務', '職位',
          'Role', 'role', '職責'
        ]) || '-',
        identity: getField(item, [
          'Identity', 'identity', '身份證字號', 'ID_No', 'id_no',
          'ID', 'id', '身份證', 'IDNumber', 'id_number'
        ]) || '-',
      }))
      
      // 處理負責人資料
      const formattedPresident = data.president && data.president.length > 0 ? data.president.map(item => ({
        name: getField(item, ['Name', 'name', '姓名', 'President_Name', 'president_name']) || '-',
        identity: getField(item, ['Identity', 'identity', '身份證字號', 'ID_No', 'id_no', 'President_ID', 'president_id']) || '-',
        address: getField(item, ['Address', 'address', '地址', 'President_Address', 'president_address']) || '-',
        phone: getField(item, ['Phone', 'phone', '電話', 'President_Phone', 'president_phone']) || '-',
      })) : []
      
      // 合併資料
      if (formattedBasicData.length > 0) {
        formattedBasicData[0].directors = formattedDirectors
        formattedBasicData[0].president = formattedPresident
      }
      
      // 處理董監事和負責人資料（如果存在於基本資料中）
      formattedBasicData.forEach((item, index) => {
        const originalItem = data.basicInfo[index]
        
        // 處理董監事資料 - 嘗試多種可能的欄位名稱
        let directorsData = null
        
        // 檢查多種可能的欄位名稱
        const possibleDirectorKeys = [
          'directors', 'Directors', 'DIRECTORS', '董監事', 'director_list',
          'directorList', 'DirectorList', 'board_members', 'boardMembers',
          'BoardMembers', '監事', '董事', '董事名單', '監事名單'
        ]
        
        for (const key of possibleDirectorKeys) {
          if (originalItem[key] && Array.isArray(originalItem[key])) {
            directorsData = originalItem[key]
            break
          }
        }
        
        // 如果找到董監事資料，處理它
        if (directorsData && directorsData.length > 0) {
          item.directors = directorsData.map(director => ({
            name: getField(director, [
              'Name', 'name', '姓名', 'Director_Name', 'director_name',
              'Name_CN', 'name_cn', '中文姓名', '姓名_中文'
            ]) || '-',
            title: getField(director, [
              'Title', 'title', '職稱', 'Position', 'position',
              'Director_Title', 'director_title', '職務', '職位',
              'Role', 'role', '職責'
            ]) || '-',
            identity: getField(director, [
              'Identity', 'identity', '身份證字號', 'ID_No', 'id_no',
              'ID', 'id', '身份證', 'IDNumber', 'id_number'
            ]) || '-',
          }))
        } else {
          // 如果沒有找到，使用已有的 directors 資料（從 API 查詢結果）
          item.directors = item.directors || []
        }
        
        // 處理負責人資料 - 嘗試多種可能的欄位名稱
        // 注意：如果 item.president 已經是字串（從 Responsible_Name 提取），不要覆蓋它
        if (typeof item.president === 'string') {
          // 如果已經是字串（包括 '-'），保留它，不進行處理
          console.log(`[DEBUG] 公司負責人已是字串，保留: ${item.president}`)
        } else {
          // 如果還不是字串，嘗試從原始資料中查找陣列或物件格式的負責人資料
          let presidentData = null
          
          const possiblePresidentKeys = [
            'president', 'President', 'PRESIDENT', '負責人', '負責人資訊',
            'responsible_person', 'responsiblePerson', 'ResponsiblePerson',
            '法人代表', '代表人', '代表'
          ]
          
          for (const key of possiblePresidentKeys) {
            if (originalItem[key] && Array.isArray(originalItem[key])) {
              presidentData = originalItem[key]
              break
            } else if (originalItem[key] && typeof originalItem[key] === 'object') {
              // 如果是單一物件，包裝成陣列
              presidentData = [originalItem[key]]
              break
            }
          }
          
          if (presidentData && presidentData.length > 0) {
            item.president = presidentData.map(president => ({
              name: getField(president, [
                'Name', 'name', '姓名', 'President_Name', 'president_name',
                'Name_CN', 'name_cn', '中文姓名'
              ]) || '-',
              identity: getField(president, [
                'Identity', 'identity', '身份證字號', 'ID_No', 'id_no',
                'President_ID', 'president_id', 'ID', 'id', '身份證'
              ]) || '-',
              address: getField(president, [
                'Address', 'address', '地址', 'President_Address', 'president_address',
                '住所', '住址'
              ]) || '-',
              phone: getField(president, [
                'Phone', 'phone', '電話', 'President_Phone', 'president_phone',
                'Tel', 'tel', '電話號碼', '聯絡電話'
              ]) || '-',
            }))
          } else {
            // 如果沒有找到陣列或物件格式的負責人資料，且 item.president 也不是字串，則設為空陣列
            if (typeof item.president !== 'string') {
              item.president = item.president || []
            }
          }
        }
        
        // 處理股東資料 - 嘗試多種可能的欄位名稱
        let shareholdersData = null
        
        const possibleShareholderKeys = [
          'shareholders', 'Shareholders', 'SHAREHOLDERS', '股東', '股東名單',
          'stockholders', 'Stockholders', '股東資訊', '股東資料'
        ]
        
        for (const key of possibleShareholderKeys) {
          if (originalItem[key] && Array.isArray(originalItem[key])) {
            shareholdersData = originalItem[key]
            break
          }
        }
        
        if (shareholdersData && shareholdersData.length > 0) {
          item.shareholders = shareholdersData.map(shareholder => ({
            name: getField(shareholder, [
              'Name', 'name', '姓名', 'Shareholder_Name', 'shareholder_name',
              'Name_CN', 'name_cn', '中文姓名', '股東名稱'
            ]) || '-',
            shares: getField(shareholder, [
              'Shares', 'shares', '持股', '持股數', 'Share_Amount', 'share_amount',
              '持股比例', 'Share_Percentage', 'share_percentage', '股份'
            ]) || null,
            percentage: getField(shareholder, [
              'Percentage', 'percentage', '持股比例', '比例', '持股百分比'
            ]) || null,
          }))
        } else {
          item.shareholders = item.shareholders || []
        }
      })
      
      // 如果是統一編號查詢且只有一筆結果，直接顯示詳細資料
      if (queryType === 'taxId' && formattedBasicData.length === 1) {
        setResults(formattedBasicData[0])
      } else {
        // 多筆結果（公司名稱查詢）
        setResults(formattedBasicData)
      }
    } catch (err) {
      console.error('查詢錯誤:', err)
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError('無法連接到伺服器，可能是 CORS 問題或網路連線問題。請檢查瀏覽器控制台以獲取更多資訊。')
      } else {
        setError(err.message || '查詢失敗，請檢查網路連線或稍後再試')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleQuery()
    }
  }


  return (
    <div className="company-query-page">
      <div className="company-query-container">
        <div className="query-header">
          <h1 className="query-title">公司資料查詢</h1>
          <p className="query-description">
            輸入統一編號或公司名稱，查詢公司的公開登記資料。
          </p>
        </div>

        <div className="query-section">
          <div className="query-type-selector">
            <button
              className={`query-type-btn ${queryType === 'taxId' ? 'active' : ''}`}
              onClick={() => {
                setQueryType('taxId')
                setQueryValue('')
                setResults(null)
                setError(null)
              }}
            >
              統一編號
            </button>
            <button
              className={`query-type-btn ${queryType === 'name' ? 'active' : ''}`}
              onClick={() => {
                setQueryType('name')
                setQueryValue('')
                setResults(null)
                setError(null)
              }}
            >
              公司名稱
            </button>
          </div>

          <div className="query-input-group">
            <input
              type="text"
              className="query-input"
              value={queryValue}
              onChange={(e) => setQueryValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={queryType === 'taxId' ? '請輸入 8 位統一編號' : '請輸入公司名稱（至少 2 個字元）'}
              maxLength={queryType === 'taxId' ? 8 : undefined}
            />
            <button
              className="query-btn"
              onClick={handleQuery}
              disabled={loading}
            >
              {loading ? '查詢中...' : '查詢'}
            </button>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        {results && (
          <div className="results-section">
            {Array.isArray(results) ? (
              // 多筆結果（公司名稱查詢）
              <div className="results-list">
                <h3 className="results-title">查詢結果 ({results.length} 筆)</h3>
                {results.map((company, index) => (
                  <div key={index} className="company-card">
                    <div className="company-header">
                      <h4 className="company-name">{company.name || '-'}</h4>
                      <span className="company-tax-id">統一編號：{company.taxId || '-'}</span>
                    </div>
                    <div className="company-info">
                      <div className="info-row">
                        <span className="info-label">公司狀態：</span>
                        <span className={`info-value status ${company.status === '核准設立' ? 'active' : ''}`}>
                          {company.status || '-'}
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">登記機關：</span>
                        <span className="info-value">{company.registrationAuthority || '-'}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">資本總額：</span>
                        <span className="info-value">{formatCurrency(company.capitalTotal)}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">實收資本額：</span>
                        <span className="info-value">{formatCurrency(company.paidInCapital)}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">設立日期：</span>
                        <span className="info-value">{formatDate(company.establishDate)}</span>
                      </div>
                    <div className="info-row">
                      <span className="info-label">最後變更日期：</span>
                      <span className="info-value">{formatDate(company.lastChangeDate)}</span>
                    </div>
                      <div className="info-row">
                        <span className="info-label">公司負責人：</span>
                        <span className="info-value">
                          {company.Responsible_Name || (typeof company.president === 'string' 
                            ? company.president 
                            : (Array.isArray(company.president) && company.president.length > 0 
                              ? company.president.map(p => (typeof p === 'string' ? p : (p.name || '-'))).join(', ')
                              : '-'))}
                        </span>
                      </div>
                    <div className="info-row">
                      <span className="info-label">公司地址：</span>
                      <span className="info-value">{company.address || '-'}</span>
                    </div>
                  </div>
                    {company.detail && (
                      <div className="company-detail-expanded">
                        <h5 className="detail-expanded-title">詳細資料</h5>
                        <pre className="detail-json">{JSON.stringify(company.detail, null, 2)}</pre>
                      </div>
                    )}
                    
                  </div>
                ))}
              </div>
            ) : (
              // 單筆結果（統一編號查詢）
              <div className="company-detail">
                <div className="results-header">
                  <h3 className="results-title">查詢結果</h3>
                </div>
                {results.detail && (
                  <div className="detail-expanded-section">
                    <h4 className="detail-expanded-title">詳細資料</h4>
                    <pre className="detail-json">{JSON.stringify(results.detail, null, 2)}</pre>
                  </div>
                )}
                <div className="detail-section">
                  <h4 className="detail-section-title">基本資料</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">公司名稱</span>
                      <span className="detail-value">{results.name || '-'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">統一編號</span>
                      <span className="detail-value">{results.taxId || '-'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">公司狀態</span>
                      <span className={`detail-value status ${results.status === '核准設立' ? 'active' : ''}`}>
                        {results.status || '-'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">登記機關</span>
                      <span className="detail-value">{results.registrationAuthority || '-'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">設立日期</span>
                      <span className="detail-value">{formatDate(results.establishDate)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">最後變更日期</span>
                      <span className="detail-value">{formatDate(results.lastChangeDate)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">公司負責人</span>
                      <span className="detail-value">
                        {results.Responsible_Name || (typeof results.president === 'string' 
                          ? results.president 
                          : (Array.isArray(results.president) && results.president.length > 0 
                            ? results.president.map(p => (typeof p === 'string' ? p : (p.name || '-'))).join(', ')
                            : '-'))}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">公司地址</span>
                      <span className="detail-value">{results.address || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4 className="detail-section-title">資本額資訊</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">資本總額</span>
                      <span className="detail-value">{formatCurrency(results.capitalTotal)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">實收資本額</span>
                      <span className="detail-value">{formatCurrency(results.paidInCapital)}</span>
                    </div>
                  </div>
                </div>

                {results.president && (
                  Array.isArray(results.president) && results.president.length > 0 ? (
                    <div className="detail-section">
                      <h4 className="detail-section-title">負責人資訊 ({results.president.length} 位)</h4>
                      <div className="president-list">
                        {results.president.map((president, index) => (
                          <div key={index} className="president-item">
                            <div className="president-info">
                              <span className="president-name">{president.name || '-'}</span>
                              {president.identity && president.identity !== '-' && (
                                <span className="president-identity">身份證：{president.identity}</span>
                              )}
                              {president.address && president.address !== '-' && (
                                <span className="president-address">地址：{president.address}</span>
                              )}
                              {president.phone && president.phone !== '-' && (
                                <span className="president-phone">電話：{president.phone}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : typeof results.president === 'string' && results.president !== '-' ? (
                    // 如果 president 是字串，已經在基本資料中顯示了，不需要重複顯示
                    null
                  ) : null
                )}

                {results.directors && results.directors.length > 0 && (
                  <div className="detail-section">
                    <h4 className="detail-section-title">董監事資訊 ({results.directors.length} 位)</h4>
                    <div className="directors-list">
                      {results.directors.map((director, index) => (
                        <div key={index} className="director-item">
                          <div className="director-info">
                            <span className="director-name">{director.name || '-'}</span>
                            {director.title && director.title !== '-' && (
                              <span className="director-title">職稱：{director.title}</span>
                            )}
                            {director.identity && director.identity !== '-' && (
                              <span className="director-identity">身份證：{director.identity}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.shareholders && results.shareholders.length > 0 && (
                  <div className="detail-section">
                    <h4 className="detail-section-title">股東資訊 ({results.shareholders.length} 位)</h4>
                    <div className="shareholders-list">
                      {results.shareholders.map((shareholder, index) => (
                        <div key={index} className="shareholder-item">
                          <span className="shareholder-name">{shareholder.name || '-'}</span>
                          {shareholder.shares && (
                            <span className="shareholder-shares">持股：{formatCurrency(shareholder.shares)}</span>
                          )}
                          {shareholder.percentage && (
                            <span className="shareholder-percentage">持股比例：{shareholder.percentage}%</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

        <div className="usage-instructions">
          <h3 className="instructions-title">使用說明</h3>
          <ul className="instructions-list">
            <li>統一編號查詢：輸入完整的 8 位統一編號，可精確查詢單一公司資料</li>
            <li>公司名稱查詢：輸入公司名稱關鍵字（至少 2 個字元），會顯示相關的查詢結果</li>
            <li>顯示資訊包括：公司基本資料、資本額資訊（資本總額、實收資本額）、登記機關、設立日期、最後變更日期、公司狀態等</li>
            <li>資料來源：本功能使用經濟部商業司開放資料 API，資料僅供參考</li>
            <li>如有疑問，請以經濟部商業司官方資料為準</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default CompanyQuery


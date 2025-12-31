import React, { useState } from 'react'
import './CompanyQuery.css'

const CompanyQuery = () => {
  const [queryType, setQueryType] = useState('taxId') // 'taxId' or 'name'
  const [queryValue, setQueryValue] = useState('')
  const [includeDetails, setIncludeDetails] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [selectedCompany, setSelectedCompany] = useState(null) // 選中要查詢詳細資料的公司

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
        basicInfo: basicInfoData,
        capital: [],
        directors: [],
        president: []
      }
      
      console.log('合併後的資料:', data)
      
      // 輸出原始資料以便調試
      if (data.basicInfo && data.basicInfo.length > 0) {
        console.log('原始基本資料欄位:', Object.keys(data.basicInfo[0]))
        console.log('原始基本資料完整內容:', JSON.stringify(data.basicInfo[0], null, 2))
      }
      if (data.capital && data.capital.length > 0) {
        console.log('原始資本額資料欄位:', Object.keys(data.capital[0]))
        console.log('原始資本額資料完整內容:', JSON.stringify(data.capital[0], null, 2))
      }
      
      // 轉換 API 資料格式為組件使用的格式
      
      // 處理基本資料 - 使用 TEJ API 的資料
      const formattedBasicData = data.basicInfo.map((item, index) => {
        // 使用 getField 函數直接從 TEJ API 資料中提取欄位
        
        // 先從基本資料中提取資本額（可能直接包含在基本資料中）
        // 第二個 API 使用 Capital_Stock_Amount 和 Paid_In_Capital_Amount
        const capitalTotal = getField(item, [
          'Capital_Stock_Amount', 'capital_stock_amount', 'CapitalStockAmount',
          'CAPITAL_STOCK_AMOUNT', 'Capital_Stock_Total', 'capital_stock_total', 'CapitalStockTotal',
          'CAPITAL_STOCK_TOTAL', '資本總額', 'capitalTotal', 'CapitalTotal', 'capital_total',
          'Capital_Amount', 'capital_amount', '資本額', '總資本額'
        ])
        
        const paidInCapital = getField(item, [
          'Paid_In_Capital_Amount', 'paid_in_capital_amount', 'PaidInCapitalAmount', 'PAID_IN_CAPITAL_AMOUNT',
          'Capital_Stock_Total_Paid_In', 'capital_stock_total_paid_in', 'CapitalStockTotalPaidIn',
          'CAPITAL_STOCK_TOTAL_PAID_IN', '實收資本額', 'paidInCapital', 'PaidInCapital',
          'Paid_In_Capital', 'paid_in_capital', '實收資本', 'PaidCapital', 'paid_capital',
          'paid_in', 'PaidIn', '實收', '實收額', 'Capital_Paid', 'capital_paid',
          'Total_Paid_In', 'total_paid_in', 'TotalPaidIn', 'totalPaidIn',
          '實收資本額_新台幣'
        ])
        
        // 提取公司狀態
        const status = getField(item, [
          'Company_Status', 'company_status', 'CompanyStatus', 'COMPANY_STATUS',
          '公司狀態', 'status', 'Status', 'STATUS', 'companyStatus',
          'Company_Status_Desc', 'company_status_desc', '狀態', '狀態代碼',
          'Status_Code', 'status_code', 'STATUS_CODE'
        ])
        
        // 提取設立日期（經濟部商業司 API 使用 Company_Setup_Date）
        const establishDate = getField(item, [
          'Company_Setup_Date', 'company_setup_date', 'CompanySetupDate', 'COMPANY_SETUP_DATE',
          'Company_Establishment_Date', 'company_establishment_date', 'CompanyEstablishmentDate',
          'COMPANY_ESTABLISHMENT_DATE', '設立日期', 'establishDate', 'EstablishDate',
          'Establishment_Date', 'establishment_date', 'establish_date', '成立日期',
          'establishmentDate', 'establishment', '設立', '成立', '設立年月日',
          'Establishment', 'ESTABLISHMENT_DATE', 'Setup_Date', 'setup_date'
        ])
        
        // 提取最後變更日期（優先讀取 Change_Of_Approval_Data）
        const lastChangeDate = getField(item, [
          'Change_Of_Approval_Data', 'change_of_approval_data', 'ChangeOfApprovalData',
          'CHANGE_OF_APPROVAL_DATA'
        ]) || getField(item, [
          '最後變更日期', '變更日期',
          'Company_Last_Change_Date', 'company_last_change_date', 'CompanyLastChangeDate',
          'COMPANY_LAST_CHANGE_DATE', 'lastChangeDate', 'LastChangeDate',
          'Last_Change_Date', 'last_change_date',
          'Change_Date', 'change_date', 'Last_Update_Date', 'last_update_date',
          'Update_Date', 'update_date', 'Modified_Date', 'modified_date'
        ])
        
        // 提取登記機關（經濟部商業司 API 使用 Register_Organization_Desc）
        const registrationAuthority = getField(item, [
          'Register_Organization_Desc', 'register_organization_desc', 'RegisterOrganizationDesc',
          'REGISTER_ORGANIZATION_DESC', '登記機關', '登記單位',
          'Agency', 'agency', 'AGENCY',
          'Registration_Authority', 'registration_authority', 'RegistrationAuthority',
          'REGISTRATION_AUTHORITY', 'registrationAuthority',
          'Registration_Office', 'registration_office', '登記處',
          'Register_Office', 'register_office', '登記所'
        ])
        
        return {
          name: getField(item, [
            'Company_Name', 'company_name', 'CompanyName', 'COMPANY_NAME',
            '公司名稱', 'name', 'Name', 'NAME', 'companyName'
          ]) || '-',
          taxId: getField(item, [
            'Business_Accounting_NO', 'business_accounting_no', 'BusinessAccountingNO',
            'BUSINESS_ACCOUNTING_NO', '統一編號', 'taxId', 'TaxId', 'TAX_ID',
            'tax_id', 'taxNo', 'tax_no', '統編'
          ]) || '-',
          status: getCompanyStatusText(status),
          establishDate: establishDate || '-',
          lastChangeDate: lastChangeDate || '-',
          registrationAuthority: registrationAuthority || '-',
          address: getField(item, [
            'Company_Location', 'company_location', 'CompanyLocation', 'COMPANY_LOCATION',
            '公司地址', 'address', 'Address', 'ADDRESS', 'Company_Address', 'company_address',
            'location', 'Location', '公司所在地'
          ]) || '-',
          capitalTotal: capitalTotal ? (parseInt(capitalTotal) || parseFloat(capitalTotal) || null) : null,
          paidInCapital: paidInCapital ? (parseInt(paidInCapital) || parseFloat(paidInCapital) || null) : null,
        }
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
          item.president = item.president || []
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

  // 查詢詳細資料
  const handleQueryDetail = async (company) => {
    if (!company || !company.taxId) {
      setError('無法查詢詳細資料：缺少統一編號')
      return
    }

    setLoadingDetail(true)
    setSelectedCompany(company)
    setError(null)

    try {
      const apiKey = '03922ECED6CA49669B3C1504E9FE6'
      const functionName = 'company' // 或根據實際 API 文檔調整為 'detail' 或其他
      const targetUrl = `https://kyc.tej.com.tw/api/search/${functionName}/${encodeURIComponent(company.taxId)}?api_key=${apiKey}`
      const apiUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`

      console.log('查詢詳細資料 URL:', apiUrl)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 秒超時

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors',
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`查詢詳細資料失敗 (${response.status})`)
      }

      const responseText = await response.text()
      if (!responseText || responseText.trim() === '') {
        throw new Error('詳細資料回應為空')
      }

      const detailData = JSON.parse(responseText)
      console.log('詳細資料回應:', detailData)

      // 合併詳細資料到現有結果
      const updatedResults = Array.isArray(results) 
        ? results.map(item => item.taxId === company.taxId ? { ...item, detail: detailData } : item)
        : { ...results, detail: detailData }

      setResults(updatedResults)
    } catch (error) {
      console.error('查詢詳細資料錯誤:', error)
      setError(`查詢詳細資料失敗：${error.message}`)
    } finally {
      setLoadingDetail(false)
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

          <div className="query-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeDetails}
                onChange={(e) => setIncludeDetails(e.target.checked)}
              />
              <span>包含詳細資訊（董事、股東等）</span>
            </label>
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

                {includeDetails && results.president && results.president.length > 0 && (
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

                {includeDetails && results.shareholders && results.shareholders.length > 0 && (
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


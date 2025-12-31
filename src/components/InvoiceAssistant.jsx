import React, { useState, useRef } from 'react'
import html2canvas from 'html2canvas'
import './InvoiceAssistant.css'

const InvoiceAssistant = () => {
  const [invoiceType, setInvoiceType] = useState('company') // 'company' or 'personal'
  const [showSteps, setShowSteps] = useState(false) // 控制步驟教學顯示
  const [buyerInfo, setBuyerInfo] = useState({
    taxId: '',
    name: '',
    address: {
      city: '',
      district: '',
      street: '',
      section: '',
      lane: '',
      alley: '',
      number: '',
      floor: '',
      room: ''
    }
  })
  const [salesAmount, setSalesAmount] = useState('')
  const [taxRate, setTaxRate] = useState('taxable') // 'taxable' or 'tax-free'
  const [totalAmount, setTotalAmount] = useState('')
  const [items, setItems] = useState([
    { name: '', quantity: 1, unitPrice: 0, amount: 0, note: '' }
  ])
  const [isDownloading, setIsDownloading] = useState(false)
  const invoiceRef = useRef(null)
  
  // 年份和月份選擇
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW').format(amount)
  }

  const numberToChinese = (num) => {
    if (num === 0) return '零'
    
    const chineseNums = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖']
    const units = ['', '拾', '佰', '仟']
    const bigUnits = ['', '萬', '億']
    
    if (num < 0) return '負' + numberToChinese(-num)
    
    let result = ''
    let numStr = num.toString()
    let unitIndex = 0
    
    // 從右到左處理
    for (let i = numStr.length - 1; i >= 0; i--) {
      const digit = parseInt(numStr[i])
      const pos = numStr.length - 1 - i
      
      if (digit !== 0) {
        result = chineseNums[digit] + units[pos % 4] + result
      } else if (pos % 4 === 0 && pos > 0) {
        // 萬、億位
        result = bigUnits[Math.floor(pos / 4)] + result
      } else if (result && !result.startsWith('零')) {
        result = '零' + result
      }
    }
    
    // 處理萬、億單位
    let finalResult = result
    for (let i = 1; i < bigUnits.length; i++) {
      const unit = bigUnits[i]
      if (finalResult.includes(unit)) {
        const index = finalResult.indexOf(unit)
        if (index > 0 && finalResult[index - 1] !== '零') {
          // 已經有正確的單位
        }
      }
    }
    
    return finalResult || '零'
  }

  const calculateTotal = () => {
    const itemsTotal = items.reduce((sum, item) => sum + (item.amount || 0), 0)
    return itemsTotal
  }

  const calculateTax = () => {
    const total = calculateTotal()
    if (taxRate === 'taxable') {
      return Math.round(total * 0.05)
    }
    return 0
  }

  const calculateGrandTotal = () => {
    return calculateTotal() + calculateTax()
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = parseFloat(newItems[index].quantity) || 0
      const price = parseFloat(newItems[index].unitPrice) || 0
      newItems[index].amount = Math.round(qty * price)
    }
    
    setItems(newItems)
  }

  const addItem = () => {
    setItems([...items, { name: '', quantity: 1, unitPrice: 0, amount: 0, note: '' }])
  }

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const clearData = () => {
    setBuyerInfo({
      taxId: '',
      name: '',
      address: {
        city: '',
        district: '',
        street: '',
        section: '',
        lane: '',
        alley: '',
        number: '',
        floor: '',
        room: ''
      }
    })
    setSalesAmount('')
    setTotalAmount('')
    setItems([{ name: '', quantity: 1, unitPrice: 0, amount: 0, note: '' }])
  }

  const handleDownload = async () => {
    if (!invoiceRef.current) return

    setIsDownloading(true)
    
    // 滾動到發票預覽區域
    invoiceRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    
    // 等待滾動完成
    await new Promise(resolve => setTimeout(resolve, 500))

    try {
      const previewElement = invoiceRef.current.querySelector('.invoice-preview')
      if (!previewElement) return

      // 記錄原始樣式
      const originalWidth = previewElement.style.width
      const originalMaxWidth = previewElement.style.maxWidth
      const originalPosition = invoiceRef.current.style.position
      const originalTop = invoiceRef.current.style.top

      // 設定固定尺寸以確保截圖不跑版
      previewElement.style.width = `${previewElement.offsetWidth}px`
      previewElement.style.maxWidth = `${previewElement.offsetWidth}px`
      invoiceRef.current.style.position = 'relative'
      invoiceRef.current.style.top = '0'

      const canvas = await html2canvas(previewElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        removeContainer: false,
        imageTimeout: 15000,
        width: previewElement.offsetWidth,
        height: previewElement.scrollHeight,
        x: 0,
        y: 0
      })

      // 恢復原始樣式
      previewElement.style.width = originalWidth
      previewElement.style.maxWidth = originalMaxWidth
      invoiceRef.current.style.position = originalPosition
      invoiceRef.current.style.top = originalTop

      const link = document.createElement('a')
      link.download = `統一發票_${new Date().toISOString().split('T')[0]}.jpg`
      link.href = canvas.toDataURL('image/jpeg', 0.95)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('下載失敗:', error)
      alert('下載失敗，請稍後再試')
    } finally {
      setIsDownloading(false)
    }
  }

  const getFullAddress = () => {
    const addr = buyerInfo.address
    return `${addr.city}${addr.district}${addr.street}${addr.section}${addr.lane}${addr.alley}${addr.number}${addr.floor}${addr.room}`.replace(/\s+/g, '')
  }

  const getCurrentDate = () => {
    const day = now.getDate()
    const rocYear = selectedYear - 1911 // 民國年
    return `中華民國 ${rocYear}年${selectedMonth}月${day}日`
  }

  const getPeriod = () => {
    const rocYear = selectedYear - 1911 // 民國年
    // 兩個月兩個月顯示
    if (selectedMonth <= 2) return `${rocYear}年一、二月份`
    if (selectedMonth <= 4) return `${rocYear}年三、四月份`
    if (selectedMonth <= 6) return `${rocYear}年五、六月份`
    if (selectedMonth <= 8) return `${rocYear}年七、八月份`
    if (selectedMonth <= 10) return `${rocYear}年九、十月份`
    return `${rocYear}年十一、十二月份`
  }

  // 生成年份選項（民國年，最近5年）
  const getYearOptions = () => {
    const years = []
    const currentYear = now.getFullYear()
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
      years.push(i)
    }
    return years
  }

  // 生成月份選項
  const getMonthOptions = () => {
    return Array.from({ length: 12 }, (_, i) => i + 1)
  }

  return (
    <div className="invoice-assistant-page">
      <div className="invoice-assistant-container">
        <div className="invoice-header">
          <h1 className="invoice-title">開發票小助理</h1>
          <p className="invoice-description">
            教你開發票 · 協助計算發票內容，可下載為 JPG 圖片
          </p>
        </div>

        <div className="invoice-content">
          {/* 左側：輸入區域 */}
          <div className="invoice-input-section">
            <div className="invoice-type-selector">
              <div className="section-header-with-toggle">
                <h3 className="section-title">發票類型</h3>
                <button
                  className="toggle-steps-btn"
                  onClick={() => setShowSteps(!showSteps)}
                  aria-label={showSteps ? '收起步驟' : '展開步驟'}
                >
                  步驟教學 {showSteps ? '▲' : '▼'}
                </button>
              </div>
              <div className="type-buttons">
                <button
                  className={`type-btn ${invoiceType === 'company' ? 'active' : ''}`}
                  onClick={() => setInvoiceType('company')}
                >
                  開給公司
                  <span className="type-subtitle">三聯式發票</span>
                </button>
                <button
                  className={`type-btn ${invoiceType === 'personal' ? 'active' : ''}`}
                  onClick={() => setInvoiceType('personal')}
                >
                  開給個人
                  <span className="type-subtitle">二聯式發票</span>
                </button>
              </div>
              
              {showSteps && (
                <div className="invoice-steps-guide">
                  {invoiceType === 'company' ? (
                    <div className="steps-content">
                      <h4 className="steps-title">三聯式發票開立步驟：</h4>
                      <ol className="steps-list">
                        <li>
                          <strong>填寫買受人資訊</strong>
                          <ul>
                            <li>統一編號：必填，請確認正確的統一編號</li>
                            <li>發票抬頭：必填，填寫公司全名</li>
                            <li>地址：建議填寫完整地址（縣市、鄉鎮市區、路街、段、巷、弄、號、樓、室）</li>
                          </ul>
                        </li>
                        <li>
                          <strong>填寫品項明細</strong>
                          <ul>
                            <li>品項名稱：清楚描述商品或服務內容</li>
                            <li>數量、單價：填入正確的數量與單價</li>
                            <li>金額會自動計算（數量 × 單價）</li>
                            <li>備註：可選填額外說明</li>
                          </ul>
                        </li>
                        <li>
                          <strong>確認稅率</strong>
                          <ul>
                            <li>應稅（5%）：一般商品或服務，需加收 5% 營業稅</li>
                            <li>免稅（0%）：免稅商品或服務</li>
                            <li>零稅率：出口商品等零稅率項目</li>
                          </ul>
                        </li>
                        <li>
                          <strong>檢查發票內容</strong>
                          <ul>
                            <li>確認所有必填欄位都已填寫</li>
                            <li>檢查金額計算是否正確</li>
                            <li>確認發票日期與期別</li>
                          </ul>
                        </li>
                        <li>
                          <strong>開立發票</strong>
                          <ul>
                            <li>在實體發票本上填寫相同內容</li>
                            <li>蓋上統一發票專用章</li>
                            <li>自己留存第一聯（存根聯）</li>
                            <li>交付第二聯（扣抵聯）和第三聯（收執聯）給客戶</li>
                          </ul>
                        </li>
                      </ol>
                    </div>
                  ) : (
                    <div className="steps-content">
                      <h4 className="steps-title">二聯式發票開立步驟：</h4>
                      <ol className="steps-list">
                        <li>
                          <strong>填寫買受人資訊</strong>
                          <ul>
                            <li>發票抬頭：必填，填寫個人姓名或公司名稱</li>
                            <li>統一編號：開給個人時不需要填寫</li>
                            <li>地址：開給個人時通常不需要填寫</li>
                          </ul>
                        </li>
                        <li>
                          <strong>填寫品項明細</strong>
                          <ul>
                            <li>品項名稱：清楚描述商品或服務內容</li>
                            <li>數量、單價：填入正確的數量與單價</li>
                            <li>金額會自動計算（數量 × 單價）</li>
                            <li>備註：可選填額外說明</li>
                          </ul>
                        </li>
                        <li>
                          <strong>確認稅率</strong>
                          <ul>
                            <li>應稅（5%）：一般商品或服務，需加收 5% 營業稅</li>
                            <li>免稅（0%）：免稅商品或服務</li>
                            <li>零稅率：出口商品等零稅率項目</li>
                          </ul>
                        </li>
                        <li>
                          <strong>檢查發票內容</strong>
                          <ul>
                            <li>確認所有必填欄位都已填寫</li>
                            <li>檢查金額計算是否正確</li>
                            <li>確認發票日期與期別</li>
                          </ul>
                        </li>
                        <li>
                          <strong>開立發票</strong>
                          <ul>
                            <li>在實體發票本上填寫相同內容</li>
                            <li>蓋上統一發票專用章</li>
                            <li>自己留存第一聯（存根聯）</li>
                            <li>交付第二聯（收執聯）給客戶</li>
                          </ul>
                        </li>
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="input-section">
              <h3 className="section-title">發票日期</h3>
              <div className="date-selector-group">
                <div className="input-group">
                  <label className="input-label">年份（民國）</label>
                  <select
                    className="input-field"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  >
                    {getYearOptions().map(year => {
                      const rocYear = year - 1911
                      return (
                        <option key={year} value={year}>民國 {rocYear}年</option>
                      )
                    })}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">月份</label>
                  <select
                    className="input-field"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  >
                    {getMonthOptions().map(month => (
                      <option key={month} value={month}>{month}月</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="input-section">
              <h3 className="section-title">買受人</h3>
              {invoiceType === 'company' && (
                <div className="input-group">
                  <label className="input-label">統一編號 <span className="required">*</span></label>
                  <input
                    type="text"
                    className="input-field"
                    value={buyerInfo.taxId}
                    onChange={(e) => setBuyerInfo({ ...buyerInfo, taxId: e.target.value })}
                    placeholder="請輸入統一編號"
                  />
                </div>
              )}
              <div className="input-group">
                <label className="input-label">發票抬頭 <span className="required">*</span></label>
                <input
                  type="text"
                  className="input-field"
                  value={buyerInfo.name}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo, name: e.target.value })}
                  placeholder="請輸入發票抬頭"
                />
              </div>
              {invoiceType === 'company' && (
                <div className="input-group">
                  <label className="input-label">地址</label>
                  <div className="address-grid">
                    <input
                      type="text"
                      className="input-field"
                      placeholder="縣市"
                      value={buyerInfo.address.city}
                      onChange={(e) => setBuyerInfo({
                        ...buyerInfo,
                        address: { ...buyerInfo.address, city: e.target.value }
                      })}
                    />
                    <input
                      type="text"
                      className="input-field"
                      placeholder="鄉鎮市區"
                      value={buyerInfo.address.district}
                      onChange={(e) => setBuyerInfo({
                        ...buyerInfo,
                        address: { ...buyerInfo.address, district: e.target.value }
                      })}
                    />
                    <input
                      type="text"
                      className="input-field"
                      placeholder="路街"
                      value={buyerInfo.address.street}
                      onChange={(e) => setBuyerInfo({
                        ...buyerInfo,
                        address: { ...buyerInfo.address, street: e.target.value }
                      })}
                    />
                    <input
                      type="text"
                      className="input-field"
                      placeholder="段"
                      value={buyerInfo.address.section}
                      onChange={(e) => setBuyerInfo({
                        ...buyerInfo,
                        address: { ...buyerInfo.address, section: e.target.value }
                      })}
                    />
                    <input
                      type="text"
                      className="input-field"
                      placeholder="巷"
                      value={buyerInfo.address.lane}
                      onChange={(e) => setBuyerInfo({
                        ...buyerInfo,
                        address: { ...buyerInfo.address, lane: e.target.value }
                      })}
                    />
                    <input
                      type="text"
                      className="input-field"
                      placeholder="弄"
                      value={buyerInfo.address.alley}
                      onChange={(e) => setBuyerInfo({
                        ...buyerInfo,
                        address: { ...buyerInfo.address, alley: e.target.value }
                      })}
                    />
                    <input
                      type="text"
                      className="input-field"
                      placeholder="號"
                      value={buyerInfo.address.number}
                      onChange={(e) => setBuyerInfo({
                        ...buyerInfo,
                        address: { ...buyerInfo.address, number: e.target.value }
                      })}
                    />
                    <input
                      type="text"
                      className="input-field"
                      placeholder="樓"
                      value={buyerInfo.address.floor}
                      onChange={(e) => setBuyerInfo({
                        ...buyerInfo,
                        address: { ...buyerInfo.address, floor: e.target.value }
                      })}
                    />
                    <input
                      type="text"
                      className="input-field"
                      placeholder="室"
                      value={buyerInfo.address.room}
                      onChange={(e) => setBuyerInfo({
                        ...buyerInfo,
                        address: { ...buyerInfo.address, room: e.target.value }
                      })}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="input-section">
              <h3 className="section-title">銷售額(未稅價)</h3>
              <div className="input-group">
                <div className="amount-input-wrapper">
                  <span className="currency-symbol">NT$</span>
                  <input
                    type="number"
                    className="amount-input"
                    value={salesAmount}
                    onChange={(e) => setSalesAmount(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">稅率</label>
                <div className="tax-radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="taxRate"
                      value="tax-free"
                      checked={taxRate === 'tax-free'}
                      onChange={(e) => setTaxRate(e.target.value)}
                    />
                    <span>免稅 (0%)</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="taxRate"
                      value="taxable"
                      checked={taxRate === 'taxable'}
                      onChange={(e) => setTaxRate(e.target.value)}
                    />
                    <span>應稅 (5%)</span>
                  </label>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">收款金額(含稅價)</label>
                <div className="amount-input-wrapper">
                  <span className="currency-symbol">NT$</span>
                  <input
                    type="number"
                    className="amount-input"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              <button className="clear-btn" onClick={clearData}>
                清除資料
              </button>
            </div>

            <div className="input-section">
              <div className="section-header-row">
                <h3 className="section-title">品項明細</h3>
                <button className="add-item-btn" onClick={addItem}>
                  新增品項
                </button>
              </div>
              <div className="items-table">
                <div className="items-header">
                  <div>品項</div>
                  <div>數量</div>
                  <div>單價</div>
                  <div>金額</div>
                  <div>備註</div>
                  <div></div>
                </div>
                {items.map((item, index) => (
                  <div key={index} className="item-row">
                    <input
                      type="text"
                      className="item-input"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      placeholder="填入品項名稱"
                    />
                    <input
                      type="number"
                      className="item-input number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    />
                    <input
                      type="number"
                      className="item-input number"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                    />
                    <div className="item-amount">{formatCurrency(item.amount)}</div>
                    <input
                      type="text"
                      className="item-input"
                      value={item.note}
                      onChange={(e) => handleItemChange(index, 'note', e.target.value)}
                    />
                    {items.length > 1 && (
                      <button
                        className="remove-item-btn"
                        onClick={() => removeItem(index)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              className="download-btn"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? '處理中...' : '下載 JPG'}
            </button>
          </div>

          {/* 右側：發票預覽 */}
          <div className="invoice-preview-section" ref={invoiceRef}>
            <div className="invoice-preview">
              <div className="invoice-header-preview">
                <div className="invoice-title-preview">
                  統一發票 ({invoiceType === 'company' ? '三聯式' : '二聯式'})
                </div>
                <div className="invoice-period">{getPeriod()}</div>
              </div>

              <div className="invoice-buyer-info">
                <div>買受人: <span className="required-field">{buyerInfo.name || '必填'}</span></div>
                {invoiceType === 'company' && (
                  <>
                    <div>統一編號: <span className="required-field">{buyerInfo.taxId || '必填'}</span></div>
                    <div>地址: {getFullAddress() || '縣市鄉鎮市區路街段巷弄號樓室'}</div>
                  </>
                )}
              </div>

              <table className="invoice-items-table">
                <thead>
                  <tr>
                    <th>品名</th>
                    <th>數量</th>
                    <th>單價</th>
                    <th>金額</th>
                    <th>備註</th>
                    <th>註</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name || '填入品項名稱'}</td>
                      <td>{item.quantity || 1}</td>
                      <td>{item.unitPrice || 0}</td>
                      <td>{formatCurrency(item.amount)}</td>
                      <td>{item.note}</td>
                      <td></td>
                    </tr>
                  ))}
                  {items.length < 3 && Array.from({ length: 3 - items.length }).map((_, i) => (
                    <tr key={`empty-${i}`}>
                      <td>/</td>
                      <td>/</td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <table className="invoice-summary-table">
                <tbody>
                  <tr>
                    <td>銷售額</td>
                    <td>
                      <span className={taxRate === 'taxable' ? 'checked' : ''}>√</span>應稅
                      <span className={taxRate === 'zero' ? 'checked' : ''}>√</span>零稅率
                      <span className={taxRate === 'tax-free' ? 'checked' : ''}>√</span>免稅
                    </td>
                    <td>{formatCurrency(calculateTotal())}</td>
                  </tr>
                  <tr>
                    <td>營業稅</td>
                    <td>
                      <span className={taxRate === 'taxable' ? 'checked' : ''}>√</span>應稅
                      <span className={taxRate === 'zero' ? 'checked' : ''}>√</span>零稅率
                      <span className={taxRate === 'tax-free' ? 'checked' : ''}>√</span>免稅
                    </td>
                    <td>{formatCurrency(calculateTax())}</td>
                  </tr>
                  <tr className="total-row">
                    <td>總計</td>
                    <td></td>
                    <td>{formatCurrency(calculateGrandTotal())}</td>
                  </tr>
                </tbody>
              </table>

              <div className="invoice-total-chinese">
                總計新台幣 (中文大寫): {numberToChinese(calculateGrandTotal())}元
              </div>

              <div className="invoice-stamp-area">
                <div>營業人蓋用統一發票專用章</div>
                <div className="stamp-placeholder">請蓋上發票用章</div>
              </div>

              <div className="invoice-footer-note">
                <div className="invoice-note">
                  *應稅、零稅率、免稅之銷售額應分別開立統一發票，並應於各該欄打「√」。
                </div>
                <div className="invoice-union">第一聯 存根聯</div>
                <div className="invoice-instruction">
                  {invoiceType === 'company' ? (
                    <>注意：自己留存第一聯存根聯、交付「第二聯扣抵聯」跟「第三聯收執聯」給客戶。<br />(若有買有副聯的發票本，副聯可自行留存)</>
                  ) : (
                    <>注意：自己留存第一聯存根聯、交付「第二聯收執聯」給客戶。</>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvoiceAssistant


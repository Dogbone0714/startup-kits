import React, { useState, useRef } from 'react'
import html2canvas from 'html2canvas'
import './SalaryCalculator.css'

const SalaryCalculator = () => {
  const [monthlySalary, setMonthlySalary] = useState(29500)
  const [dependents, setDependents] = useState(1)
  const [isDownloading, setIsDownloading] = useState(false)
  const resultRef = useRef(null)

  // 勞保級距表 (2025年)
  const laborInsuranceBrackets = [
    1500, 3000, 4500, 6000, 7500, 8700, 9900, 11100, 12540, 13500,
    15840, 16500, 17280, 17880, 19047, 20008, 21009, 22000, 23100, 24000,
    25200, 26400, 27600, 28800, 30300, 31800, 33300, 34800, 36300, 38200,
    40100, 42000, 43900, 45800
  ]

  // 健保級距表 (2025年)
  const healthInsuranceBrackets = [
    28590, 30000, 30300, 31200, 32400, 33600, 34800, 36000, 38200, 40100,
    42000, 43900, 45800, 48200, 50600, 53000, 55400, 57800, 60800, 63800,
    66800, 69800, 72800, 75800, 78800, 81800, 84800, 87800, 90800, 93800,
    96800, 99800, 104000, 109100, 114200, 119300, 124400, 129500, 135400, 141800,
    148200, 154600, 161000, 167400, 174800, 182200, 189600, 197000, 204400, 211800,
    219200, 226600, 234000, 241400, 250000
  ]

  // 計算投保級距
  const calculateInsuredAmount = (salary, brackets) => {
    for (let i = brackets.length - 1; i >= 0; i--) {
      if (salary >= brackets[i]) {
        return brackets[i]
      }
    }
    return brackets[0]
  }

  const laborInsuredAmount = calculateInsuredAmount(monthlySalary, laborInsuranceBrackets)
  const healthInsuredAmount = calculateInsuredAmount(monthlySalary, healthInsuranceBrackets)

  // 勞保費率 (2025年)
  const laborInsuranceRate = 0.12 // 12%
  const laborInsuranceEmployeeRate = 0.20 // 員工負擔 20%
  const laborInsuranceEmployerRate = 0.70 // 雇主負擔 70%

  // 健保費率 (2025年)
  const healthInsuranceRate = 0.0517 // 5.17%
  const healthInsuranceEmployeeRate = 0.30 // 員工負擔 30%
  const healthInsuranceEmployerRate = 0.60 // 雇主負擔 60%

  // 勞退提繳率
  const laborPensionRate = 0.06 // 6%

  // 計算勞保
  const laborInsuranceTotal = Math.round(laborInsuredAmount * laborInsuranceRate)
  const laborInsuranceEmployee = Math.round(laborInsuranceTotal * laborInsuranceEmployeeRate)
  const laborInsuranceEmployer = Math.round(laborInsuranceTotal * laborInsuranceEmployerRate)

  // 計算健保（根據扶養眷屬人數）
  const healthInsuranceDependentRate = dependents === 1 ? 1 : dependents === 2 ? 1.58 : dependents === 3 ? 2.08 : 2.58
  const healthInsuranceTotal = Math.round(healthInsuredAmount * healthInsuranceRate * healthInsuranceDependentRate)
  const healthInsuranceEmployee = Math.round(healthInsuranceTotal * healthInsuranceEmployeeRate)
  const healthInsuranceEmployer = Math.round(healthInsuranceTotal * healthInsuranceEmployerRate)

  // 計算勞退
  const laborPension = Math.round(monthlySalary * laborPensionRate)

  // 員工負擔總計
  const employeeTotalDeduction = laborInsuranceEmployee + healthInsuranceEmployee

  // 雇主負擔總計
  const employerTotalCost = laborInsuranceEmployer + healthInsuranceEmployer + laborPension

  // 員工實領薪資
  const employeeNetSalary = monthlySalary - employeeTotalDeduction

  // 雇主實際支出
  const employerActualExpenditure = monthlySalary + employerTotalCost

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW').format(amount)
  }

  const handleQuickSalary = (amount) => {
    setMonthlySalary(amount)
  }

  const handleDependentsChange = (e) => {
    setDependents(parseInt(e.target.value))
  }

  const getDependentsText = (num) => {
    if (num === 1) return '本人 (1人)'
    return `${num}人`
  }

  const handleDownloadImage = async () => {
    if (!resultRef.current) return

    setIsDownloading(true)
    try {
      const canvas = await html2canvas(resultRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      })

      const link = document.createElement('a')
      link.download = `薪資計算結果_${formatCurrency(monthlySalary)}_${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('下載圖片失敗:', error)
      alert('下載圖片失敗，請稍後再試')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="salary-calculator-page">
      <div className="salary-calculator-container">
        <div className="calculator-header">
          <div className="header-content">
            <div>
              <h1 className="calculator-title">薪資成本計算</h1>
              <p className="calculator-description">
                輸入月薪，即時算出 115 年度勞健保分擔明細（基本工資：29,500 元）
              </p>
            </div>
            <button
              className="download-btn"
              onClick={handleDownloadImage}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <span className="download-icon">⏳</span>
                  處理中...
                </>
              ) : (
                <>
                  <span className="download-icon">📥</span>
                  存成圖片
                </>
              )}
            </button>
          </div>
        </div>

        <div className="calculator-content">
          {/* 左側：輸入區域 */}
          <div className="calculator-input-section">
            <div className="input-group">
              <label className="input-label">員工月薪</label>
              <div className="salary-input-wrapper">
                <span className="currency-symbol">NT$</span>
                <input
                  type="number"
                  className="salary-input"
                  value={monthlySalary}
                  onChange={(e) => setMonthlySalary(parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
              <div className="quick-buttons">
                <button 
                  className="quick-btn"
                  onClick={() => handleQuickSalary(29500)}
                >
                  基本薪資
                </button>
                <button 
                  className="quick-btn"
                  onClick={() => handleQuickSalary(45800)}
                >
                  勞保最高
                </button>
                <button 
                  className="quick-btn"
                  onClick={() => handleQuickSalary(50000)}
                >
                  50000
                </button>
                <button 
                  className="quick-btn"
                  onClick={() => handleQuickSalary(100000)}
                >
                  100000
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">扶養眷屬</label>
              <select
                className="dependents-select"
                value={dependents}
                onChange={handleDependentsChange}
              >
                <option value={1}>本人 (1人)</option>
                <option value={2}>2人</option>
                <option value={3}>3人</option>
                <option value={4}>4人以上</option>
              </select>
            </div>

            <div className="insured-amount-box">
              <div className="insured-amount-title">投保級距金額</div>
              <div className="insured-amount-value">NT$ {formatCurrency(laborInsuredAmount)}</div>
              <div className="insured-amount-info">
                <span>勞保級距最高 45,800</span>
                <span>健保最低 28,590</span>
              </div>
            </div>
          </div>

          {/* 右側：計算結果 */}
          <div className="calculator-result-section" ref={resultRef}>
            <div className="result-header">
              <p className="result-summary">
                月薪：NT${formatCurrency(monthlySalary)} · 扶養眷屬：{getDependentsText(dependents)} · 2025年12月31日
              </p>
            </div>

            <div className="result-details">
              <div className="result-section">
                <h3 className="result-section-title">員工負擔</h3>
                <div className="result-item">
                  <span>勞保自付 (20%)</span>
                  <span>{formatCurrency(laborInsuranceEmployee)}</span>
                </div>
                <div className="result-item">
                  <span>健保自付 (30%)</span>
                  <span>{formatCurrency(healthInsuranceEmployee)}</span>
                </div>
                <div className="result-item total-deduction">
                  <span>代扣總計</span>
                  <span className="negative-amount">- NT$ {formatCurrency(employeeTotalDeduction)}</span>
                </div>
              </div>

              <div className="result-section">
                <h3 className="result-section-title">雇主負擔</h3>
                <div className="result-item">
                  <span>勞保負擔 (70%)</span>
                  <span>{formatCurrency(laborInsuranceEmployer)}</span>
                </div>
                <div className="result-item">
                  <span>健保負擔 (60%)</span>
                  <span>{formatCurrency(healthInsuranceEmployer)}</span>
                </div>
                <div className="result-item">
                  <span>勞退提繳 (6%)</span>
                  <span>{formatCurrency(laborPension)}</span>
                </div>
                <div className="result-item total-cost">
                  <span>公司成本合計</span>
                  <span className="positive-amount">+ NT$ {formatCurrency(employerTotalCost)}</span>
                </div>
              </div>
            </div>

            <div className="final-results">
              <div className="final-result-box employee-box">
                <div className="final-result-label">員工實領薪資</div>
                <div className="final-result-value">NT$ {formatCurrency(employeeNetSalary)}</div>
              </div>
              <div className="final-result-box employer-box">
                <div className="final-result-label">雇主實際支出</div>
                <div className="final-result-value">NT$ {formatCurrency(employerActualExpenditure)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SalaryCalculator


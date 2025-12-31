import React, { useState } from 'react'
import './InsuranceRates.css'

const InsuranceRates = () => {
  const [searchAmount, setSearchAmount] = useState('')

  // 完整的級距表資料（參考 https://startup.laushu.app/rates）
  const ratesData = [
    { level: 1500, laborEmployee: 277, laborEmployer: 972, healthEmployee: 458, healthEmployer: 1428, pension: 90, label: '' },
    { level: 3000, laborEmployee: 277, laborEmployer: 972, healthEmployee: 458, healthEmployer: 1428, pension: 180, label: '' },
    { level: 4500, laborEmployee: 277, laborEmployer: 972, healthEmployee: 458, healthEmployer: 1428, pension: 270, label: '' },
    { level: 6000, laborEmployee: 277, laborEmployer: 972, healthEmployee: 458, healthEmployer: 1428, pension: 360, label: '' },
    { level: 7500, laborEmployee: 277, laborEmployer: 972, healthEmployee: 458, healthEmployer: 1428, pension: 450, label: '' },
    { level: 8700, laborEmployee: 277, laborEmployer: 972, healthEmployee: 458, healthEmployer: 1428, pension: 522, label: '' },
    { level: 9900, laborEmployee: 277, laborEmployer: 972, healthEmployee: 458, healthEmployer: 1428, pension: 594, label: '' },
    { level: 11100, laborEmployee: 277, laborEmployer: 972, healthEmployee: 458, healthEmployer: 1428, pension: 666, label: '' },
    { level: 12540, laborEmployee: 313, laborEmployer: 1097, healthEmployee: 458, healthEmployer: 1428, pension: 752, label: '' },
    { level: 13500, laborEmployee: 338, laborEmployer: 1182, healthEmployee: 458, healthEmployer: 1428, pension: 810, label: '' },
    { level: 15840, laborEmployee: 396, laborEmployer: 1386, healthEmployee: 458, healthEmployer: 1428, pension: 950, label: '' },
    { level: 16500, laborEmployee: 413, laborEmployer: 1444, healthEmployee: 458, healthEmployer: 1428, pension: 990, label: '' },
    { level: 17280, laborEmployee: 432, laborEmployer: 1512, healthEmployee: 458, healthEmployer: 1428, pension: 1037, label: '' },
    { level: 17880, laborEmployee: 447, laborEmployer: 1564, healthEmployee: 458, healthEmployer: 1428, pension: 1073, label: '' },
    { level: 19047, laborEmployee: 476, laborEmployer: 1666, healthEmployee: 458, healthEmployer: 1428, pension: 1143, label: '' },
    { level: 20008, laborEmployee: 500, laborEmployer: 1751, healthEmployee: 458, healthEmployer: 1428, pension: 1200, label: '' },
    { level: 21009, laborEmployee: 525, laborEmployer: 1838, healthEmployee: 458, healthEmployer: 1428, pension: 1261, label: '' },
    { level: 22000, laborEmployee: 550, laborEmployer: 1925, healthEmployee: 458, healthEmployer: 1428, pension: 1320, label: '' },
    { level: 23100, laborEmployee: 577, laborEmployer: 2022, healthEmployee: 458, healthEmployer: 1428, pension: 1386, label: '' },
    { level: 24000, laborEmployee: 600, laborEmployer: 2100, healthEmployee: 458, healthEmployer: 1428, pension: 1440, label: '' },
    { level: 25250, laborEmployee: 632, laborEmployer: 2210, healthEmployee: 458, healthEmployer: 1428, pension: 1515, label: '' },
    { level: 26400, laborEmployee: 660, laborEmployer: 2310, healthEmployee: 458, healthEmployer: 1428, pension: 1584, label: '' },
    { level: 27600, laborEmployee: 690, laborEmployer: 2415, healthEmployee: 458, healthEmployer: 1428, pension: 1656, label: '' },
    { level: 28590, laborEmployee: 715, laborEmployer: 2501, healthEmployee: 458, healthEmployer: 1428, pension: 1715, label: '' },
    { level: 28800, laborEmployee: 720, laborEmployer: 2520, healthEmployee: 458, healthEmployer: 1428, pension: 1728, label: '' },
    { level: 29500, laborEmployee: 738, laborEmployer: 2582, healthEmployee: 458, healthEmployer: 1428, pension: 1770, label: '基本工資' },
    { level: 30300, laborEmployee: 758, laborEmployer: 2651, healthEmployee: 470, healthEmployer: 1466, pension: 1818, label: '' },
    { level: 31800, laborEmployee: 795, laborEmployer: 2783, healthEmployee: 493, healthEmployer: 1539, pension: 1908, label: '' },
    { level: 33300, laborEmployee: 833, laborEmployer: 2914, healthEmployee: 516, healthEmployer: 1611, pension: 1998, label: '' },
    { level: 34800, laborEmployee: 870, laborEmployer: 3045, healthEmployee: 540, healthEmployer: 1684, pension: 2088, label: '' },
    { level: 36300, laborEmployee: 908, laborEmployer: 3176, healthEmployee: 563, healthEmployer: 1757, pension: 2178, label: '' },
    { level: 38200, laborEmployee: 955, laborEmployer: 3342, healthEmployee: 592, healthEmployer: 1849, pension: 2292, label: '' },
    { level: 40100, laborEmployee: 1002, laborEmployer: 3509, healthEmployee: 622, healthEmployer: 1940, pension: 2406, label: '' },
    { level: 42000, laborEmployee: 1050, laborEmployer: 3675, healthEmployee: 651, healthEmployer: 2032, pension: 2520, label: '' },
    { level: 43900, laborEmployee: 1098, laborEmployer: 3841, healthEmployee: 681, healthEmployer: 2124, pension: 2634, label: '' },
    { level: 45800, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 710, healthEmployer: 2216, pension: 2748, label: '勞保上限' },
    { level: 48200, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 748, healthEmployer: 2332, pension: 2892, label: '' },
    { level: 50600, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 785, healthEmployer: 2449, pension: 3036, label: '' },
    { level: 53000, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 822, healthEmployer: 2565, pension: 3180, label: '' },
    { level: 55400, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 859, healthEmployer: 2681, pension: 3324, label: '' },
    { level: 57800, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 896, healthEmployer: 2797, pension: 3468, label: '' },
    { level: 60800, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 943, healthEmployer: 2942, pension: 3648, label: '' },
    { level: 63800, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 990, healthEmployer: 3087, pension: 3828, label: '' },
    { level: 66800, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 1036, healthEmployer: 3233, pension: 4008, label: '' },
    { level: 69800, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 1083, healthEmployer: 3378, pension: 4188, label: '' },
    { level: 72800, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 1129, healthEmployer: 3523, pension: 4368, label: '' },
    { level: 76500, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 1187, healthEmployer: 3702, pension: 4590, label: '' },
    { level: 80200, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 1244, healthEmployer: 3881, pension: 4812, label: '' },
    { level: 83900, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 1301, healthEmployer: 4060, pension: 5034, label: '' },
    { level: 87600, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 1359, healthEmployer: 4239, pension: 5256, label: '' },
    { level: 92100, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 1428, healthEmployer: 4457, pension: 5526, label: '' },
    { level: 96600, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 1498, healthEmployer: 4675, pension: 5796, label: '' },
    { level: 101100, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 1568, healthEmployer: 4892, pension: 6066, label: '' },
    { level: 105600, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 1638, healthEmployer: 5110, pension: 6336, label: '' },
    { level: 110100, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 1708, healthEmployer: 5328, pension: 6606, label: '' },
    { level: 115500, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 1791, healthEmployer: 5589, pension: 6930, label: '' },
    { level: 120900, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 1875, healthEmployer: 5850, pension: 7254, label: '' },
    { level: 126300, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 1959, healthEmployer: 6112, pension: 7578, label: '' },
    { level: 131700, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 2043, healthEmployer: 6373, pension: 7902, label: '' },
    { level: 137100, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 2126, healthEmployer: 6634, pension: 8226, label: '' },
    { level: 142500, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 2210, healthEmployer: 6896, pension: 8550, label: '' },
    { level: 147900, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 2294, healthEmployer: 7157, pension: 8874, label: '' },
    { level: 150000, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 2327, healthEmployer: 7259, pension: 9000, label: '高薪' },
    { level: 156400, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 2426, healthEmployer: 7568, pension: 9000, label: '' },
    { level: 162800, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 2525, healthEmployer: 7878, pension: 9000, label: '' },
    { level: 169200, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 2624, healthEmployer: 8188, pension: 9000, label: '' },
    { level: 175600, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 2724, healthEmployer: 8497, pension: 9000, label: '' },
    { level: 182000, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 2823, healthEmployer: 8807, pension: 9000, label: '' },
    { level: 189500, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 2939, healthEmployer: 9170, pension: 9000, label: '' },
    { level: 197000, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 3055, healthEmployer: 9533, pension: 9000, label: '' },
    { level: 204500, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 3172, healthEmployer: 9896, pension: 9000, label: '' },
    { level: 212000, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 3288, healthEmployer: 10259, pension: 9000, label: '' },
    { level: 219500, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 3404, healthEmployer: 10622, pension: 9000, label: '' },
    { level: 228200, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 3404, healthEmployer: 10622, pension: 9000, label: '' },
    { level: 236900, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 3404, healthEmployer: 10622, pension: 9000, label: '' },
    { level: 245600, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 3404, healthEmployer: 10622, pension: 9000, label: '' },
    { level: 254300, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 3404, healthEmployer: 10622, pension: 9000, label: '' },
    { level: 263000, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 3404, healthEmployer: 10622, pension: 9000, label: '' },
    { level: 273000, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 3404, healthEmployer: 10622, pension: 9000, label: '' },
    { level: 283000, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 3404, healthEmployer: 10622, pension: 9000, label: '' },
    { level: 293000, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 3404, healthEmployer: 10622, pension: 9000, label: '' },
    { level: 303000, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 3404, healthEmployer: 10622, pension: 9000, label: '' },
    { level: 313000, laborEmployee: 1145, laborEmployer: 4008, healthEmployee: 3404, healthEmployer: 10622, pension: 9000, label: '' },
  ]

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW').format(amount)
  }

  const filteredRates = searchAmount
    ? ratesData.filter(rate => rate.level >= parseInt(searchAmount) || 0)
    : ratesData

  return (
    <div className="insurance-rates-page">
      <div className="insurance-rates-container">
        <div className="rates-header">
          <h1 className="rates-title">勞健保費率</h1>
          <p className="rates-description">
            115 年度勞保、健保、勞退投保薪資分級表（基本工資：29,500 元）
          </p>
        </div>

        <div className="rates-summary">
          <div className="summary-item">
            <div className="summary-label">級距總數</div>
            <div className="summary-value">{ratesData.length}</div>
            <div className="summary-unit">個級距</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">最低級距</div>
            <div className="summary-value">{formatCurrency(ratesData[0].level)}</div>
            <div className="summary-unit">元/月</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">最高級距</div>
            <div className="summary-value">{formatCurrency(ratesData[ratesData.length - 1].level)}</div>
            <div className="summary-unit">元/月</div>
          </div>
        </div>

        <div className="search-section">
          <label className="search-label">搜尋級距</label>
          <input
            type="number"
            className="search-input"
            placeholder="輸入金額後，會顯示所有大於等於該金額的級距"
            value={searchAmount}
            onChange={(e) => setSearchAmount(e.target.value)}
          />
          {searchAmount && (
            <button
              className="clear-btn"
              onClick={() => setSearchAmount('')}
            >
              清除
            </button>
          )}
        </div>

        <div className="rates-table-wrapper">
          <table className="rates-table">
            <thead>
              <tr>
                <th>月薪級距</th>
                <th>勞保勞/資</th>
                <th>健保勞/資</th>
                <th>勞退(6%)</th>
              </tr>
            </thead>
            <tbody>
              {filteredRates.map((rate, index) => (
                <tr key={index} className={rate.label ? 'highlight-row' : ''}>
                  <td>
                    {formatCurrency(rate.level)}
                    {rate.label && <span className="rate-label">{rate.label}</span>}
                  </td>
                  <td>{rate.laborEmployee} / {rate.laborEmployer}</td>
                  <td>{rate.healthEmployee} / {rate.healthEmployer}</td>
                  <td>{formatCurrency(rate.pension)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rates-info">
          <h3>使用說明</h3>
          <ul>
            <li>輸入金額後，會顯示所有大於等於該金額的級距</li>
            <li>基本工資標記為 <span className="info-badge">基本工資</span>，勞保上限標記為 <span className="info-badge">勞保上限</span></li>
            <li>勞保費率為 12.5%（普通保險 11.5% + 就業保險 1%），健保費率為 5.17%</li>
            <li>勞退為雇主額外提撥，不得從員工薪資扣除</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default InsuranceRates


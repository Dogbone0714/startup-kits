import React from 'react'
import './Disclaimer.css'

const Disclaimer = ({ onBack }) => {
  return (
    <div className="disclaimer-page">
      <div className="disclaimer-container">
        <button className="back-button" onClick={onBack}>
          ← 返回首頁
        </button>
        
        <div className="disclaimer-content">
          <h1 className="disclaimer-title">免責條款</h1>
          
          <div className="disclaimer-section">
            <h2>重要聲明</h2>
            <p>
              閱覽此網站即表示您已閱讀、理解並同意本免責條款。請務必自行做好資料正確性的調查與確認，所有基於本網站資訊做出的決策與本網站無關，請自行承擔相關責任。
            </p>
          </div>

          <div className="disclaimer-section">
            <h2>1. 資訊正確性</h2>
            <p>本網站提供的所有資訊、工具、資源連結等內容，僅供參考使用。雖然我們盡力確保資訊的準確性，但：</p>
            <ul>
              <li>第三方網站內容可能隨時更新，本網站資訊可能無法即時反映最新變動</li>
              <li>實際情況可能因個案而異，本網站無法涵蓋所有特殊情況</li>
              <li>本網站不對任何資訊的準確性、完整性或時效性做出任何保證</li>
            </ul>
          </div>

          <div className="disclaimer-section">
            <h2>2. 使用者責任</h2>
            <p>使用本網站時，您同意：</p>
            <ul>
              <li><strong>自行驗證資訊的正確性</strong>：在使用本網站提供的資訊做出任何決策前，請務必自行查證相關資訊、諮詢專業人士</li>
              <li><strong>自行承擔決策責任</strong>：所有基於本網站資訊做出的決策、行動或判斷，均由您自行承擔責任，本網站不承擔任何責任</li>
              <li><strong>不依賴本網站作為唯一資訊來源</strong>：本網站不應作為您做出重要決策的唯一依據，請多方查證並尋求專業建議</li>
            </ul>
          </div>

          <div className="disclaimer-section">
            <h2>3. 第三方連結</h2>
            <p>
              本網站包含指向第三方網站的連結，這些連結僅為方便使用者而提供。本網站不對這些第三方網站的內容、隱私政策或服務承擔任何責任。使用第三方網站時，請遵守該網站的條款和政策。
            </p>
          </div>

          <div className="disclaimer-section">
            <h2>4. 責任限制</h2>
            <p>在法律允許的最大範圍內，本網站及其營運者：</p>
            <ul>
              <li>不對因使用或無法使用本網站而產生的任何直接、間接、附帶、特殊或衍生性損害承擔責任</li>
              <li>不對因本網站資訊錯誤、遺漏或不完整而導致的任何損失承擔責任</li>
              <li>不對因本網站服務中斷、延遲或錯誤而產生的任何損失承擔責任</li>
              <li>不對任何第三方網站連結的內容或服務承擔責任</li>
            </ul>
          </div>

          <div className="disclaimer-section">
            <h2>5. 同意條款</h2>
            <p>使用本網站即表示您：</p>
            <ul>
              <li>已閱讀、理解並同意本免責條款</li>
              <li>了解本網站提供的資訊僅供參考，不構成專業建議</li>
              <li>同意自行承擔使用本網站資訊的所有風險和責任</li>
              <li>同意不會因使用本網站而對本網站及其營運者提出任何索賠或訴訟</li>
            </ul>
          </div>

          <div className="disclaimer-section">
            <h2>聯絡我們</h2>
            <p>
              如果您發現本網站資訊有誤，或有任何建議，歡迎來信至：
              <br />
              <a href="mailto:contacts@opennuu.com" className="contact-link">contacts@opennuu.com</a>
            </p>
            <p>我們會感謝您的貢獻，並盡力改進網站內容。</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Disclaimer


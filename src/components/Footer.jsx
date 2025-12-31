import React from 'react'
import './Footer.css'

const Footer = ({ onShowDisclaimer }) => {
  const handleDisclaimerClick = (e) => {
    e.preventDefault()
    // 更新 URL hash
    window.location.hash = '#terms'
    // 滾動到頁面頂部
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (onShowDisclaimer) {
      onShowDisclaimer()
    }
  }

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-main">
          <div className="footer-left">
            <div className="footer-logo">
              <span className="logo-icon">🚀</span>
              <span className="logo-text">Startup Kits</span>
            </div>
            <p className="footer-description">
              為新創公司提供最完整的資源和工具集合
            </p>
          </div>

          <div className="footer-right">
            <p className="footer-disclaimer-text">
              閱覽此網站即表示您同意我們的 <a href="#" onClick={handleDisclaimerClick} className="footer-disclaimer-link">免責條款</a>。請自行做好資料正確性的調查與確認，做出的決策與本網站無關，請自行承擔。
            </p>
            <p className="footer-contact-text">
              若資訊有誤或者有建議，請來信至 <a href="mailto:contacts@opennuu.com" className="footer-contact-link">contacts@opennuu.com</a>
            </p>
            <p>Startup Kits 新創公司資源站 © 2025 | Made with <a href="https://hhk.one/" target="_blank" rel="noopener noreferrer" className="footer-author-link">康皓雄(康康)</a> in 康普思生活通有限公司</p>
            <p className="footer-update-text">最後更新：2025-12-31</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer


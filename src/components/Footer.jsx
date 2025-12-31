import React from 'react'
import './Footer.css'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <span className="logo-icon">🚀</span>
              <span className="logo-text">Startup Kits</span>
            </div>
            <p className="footer-description">
              為新創公司提供最完整的資源和工具集合
            </p>
          </div>

          <div className="footer-section">
            <h4 className="footer-title">快速連結</h4>
            <ul className="footer-links">
              <li><a href="#resources">資源</a></li>
              <li><a href="#tools">工具</a></li>
              <li><a href="#guides">指南</a></li>
              <li><a href="#community">社群</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-title">關於</h4>
            <ul className="footer-links">
              <li><a href="#about">關於我們</a></li>
              <li><a href="#contact">聯絡我們</a></li>
              <li><a href="#contribute">貢獻資源</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2024 Startup Kits. 保留所有權利。</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer


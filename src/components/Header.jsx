import React, { useState } from 'react'
import './Header.css'
import logo from '../assets/logo.png'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <img src={logo} alt="Startup Kits Logo" className="logo-icon" />
          <span className="logo-text">Startup Kits</span>
        </div>
        
        <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
          <a href="#resources" className="nav-link">資源</a>
          <a href="#tools" className="nav-link">工具</a>
          <a href="#guides" className="nav-link">指南</a>
          <a href="#community" className="nav-link">社群</a>
        </nav>

        <button 
          className="menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  )
}

export default Header


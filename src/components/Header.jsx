import React, { useState } from 'react'
import './Header.css'
import logo from '../assets/logo.png'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="header">
      <div className="header-container">
        <a 
          href="#" 
          className="logo"
          onClick={(e) => {
            e.preventDefault()
            window.location.hash = ''
            setIsMenuOpen(false)
          }}
        >
          <img src={logo} alt="Startup Kits Logo" className="logo-icon" />
          <span className="logo-text">Startup Kits</span>
        </a>
        
        <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
          <a 
            href="#resources" 
            className="nav-link"
            onClick={() => {
              window.location.hash = ''
              setIsMenuOpen(false)
            }}
          >
            資源
          </a>
          <a 
            href="#tools" 
            className="nav-link"
            onClick={(e) => {
              e.preventDefault()
              window.location.hash = '#tools'
              setIsMenuOpen(false)
            }}
          >
            工具
          </a>
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


import React from 'react'
import './Hero.css'

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-container">
        <div className="hero-content">
          <h1 className="hero-title">
            新創公司資源站
            <span className="gradient-text">Startup Kits</span>
          </h1>
          <p className="hero-description">
            一站式收集所有新創公司需要的工具、資源和指南。
            從想法到上市，我們為你提供完整的創業工具箱。
          </p>
          <div className="hero-buttons">
            <a href="#resources" className="btn btn-primary">
              探索資源
            </a>
            <a href="#guides" className="btn btn-secondary">
              查看指南
            </a>
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-card card-1">
            <span className="card-icon">💡</span>
            <span className="card-text">創意</span>
          </div>
          <div className="floating-card card-2">
            <span className="card-icon">⚡</span>
            <span className="card-text">快速</span>
          </div>
          <div className="floating-card card-3">
            <span className="card-icon">🎯</span>
            <span className="card-text">精準</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero


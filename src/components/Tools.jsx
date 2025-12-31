import React from 'react'
import './Tools.css'

const Tools = () => {
  return (
    <section id="tools" className="tools">
      <div className="tools-container">
        <div className="section-header">
          <h2 className="section-title">實用工具</h2>
          <p className="section-description">
            為新創公司提供各種實用的線上工具，提升工作效率
          </p>
        </div>

        <div className="tools-grid">
          <a 
            href="#salary-calculator"
            className="tool-card tool-card-link"
            onClick={(e) => {
              e.preventDefault()
              window.location.hash = '#salary-calculator'
            }}
          >
            <div className="tool-icon">💰</div>
            <h3 className="tool-title">薪資計算機</h3>
            <p className="tool-description">
              快速計算員工薪資、勞健保費用和實領金額
            </p>
            <div className="tool-status">
              <span className="status-badge available">立即使用</span>
            </div>
          </a>

          <a 
            href="#insurance-rates"
            className="tool-card tool-card-link"
            onClick={(e) => {
              e.preventDefault()
              window.location.hash = '#insurance-rates'
            }}
          >
            <div className="tool-icon">📊</div>
            <h3 className="tool-title">勞健保費率</h3>
            <p className="tool-description">
              查詢最新的勞保、健保費率級距表
            </p>
            <div className="tool-status">
              <span className="status-badge available">立即使用</span>
            </div>
          </a>

          <div className="tool-card">
            <div className="tool-icon">🧾</div>
            <h3 className="tool-title">開發票小助理</h3>
            <p className="tool-description">
              協助計算發票金額、稅額和總計
            </p>
            <div className="tool-status">
              <span className="status-badge coming-soon">即將推出</span>
            </div>
          </div>

          <div className="tool-card">
            <div className="tool-icon">🏢</div>
            <h3 className="tool-title">公司資料查詢</h3>
            <p className="tool-description">
              快速查詢公司統一編號和基本資料
            </p>
            <div className="tool-status">
              <span className="status-badge coming-soon">即將推出</span>
            </div>
          </div>

          <div className="tool-card">
            <div className="tool-icon">💼</div>
            <h3 className="tool-title">資遣費計算機</h3>
            <p className="tool-description">
              計算資遣費、預告工資和相關權益
            </p>
            <div className="tool-status">
              <span className="status-badge coming-soon">即將推出</span>
            </div>
          </div>

          <div className="tool-card">
            <div className="tool-icon">⏰</div>
            <h3 className="tool-title">加班費計算機</h3>
            <p className="tool-description">
              計算平日、假日和國定假日的加班費
            </p>
            <div className="tool-status">
              <span className="status-badge coming-soon">即將推出</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Tools


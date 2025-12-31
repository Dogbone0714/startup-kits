import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import Resources from './components/Resources'
import Tools from './components/Tools'
import SalaryCalculator from './components/SalaryCalculator'
import Footer from './components/Footer'
import Disclaimer from './components/Disclaimer'
import ScrollToTop from './components/ScrollToTop'
import './App.css'

function App() {
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [currentPage, setCurrentPage] = useState('home')

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      
      if (hash === '#terms') {
        setShowDisclaimer(true)
        setCurrentPage('terms')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else if (hash === '#tools') {
        setShowDisclaimer(false)
        setCurrentPage('tools')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else if (hash === '#salary-calculator') {
        setShowDisclaimer(false)
        setCurrentPage('salary-calculator')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setShowDisclaimer(false)
        setCurrentPage('home')
      }
    }

    // 檢查初始 hash
    handleHashChange()

    // 監聽 hash 變化
    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  useEffect(() => {
    // 當顯示免責條款頁面時，滾動到頂部
    if (showDisclaimer) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [showDisclaimer])

  const handleShowDisclaimer = () => {
    window.location.hash = '#terms'
    setShowDisclaimer(true)
    setCurrentPage('terms')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBack = () => {
    window.location.hash = ''
    setShowDisclaimer(false)
    setCurrentPage('home')
  }

  if (showDisclaimer) {
    return (
      <div className="App">
        <Disclaimer onBack={handleBack} />
        <Footer onShowDisclaimer={handleShowDisclaimer} />
      </div>
    )
  }

  if (currentPage === 'salary-calculator') {
    return (
      <div className="App">
        <Header />
        <SalaryCalculator />
        <Footer onShowDisclaimer={handleShowDisclaimer} />
        <ScrollToTop />
      </div>
    )
  }

  if (currentPage === 'tools') {
    return (
      <div className="App">
        <Header />
        <Tools />
        <Footer onShowDisclaimer={handleShowDisclaimer} />
        <ScrollToTop />
      </div>
    )
  }

  return (
    <div className="App">
      <Header />
      <Hero />
      <Resources />
      <Footer onShowDisclaimer={handleShowDisclaimer} />
      <ScrollToTop />
    </div>
  )
}

export default App


import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './HeaderLanding.css'

function HeaderLanding({ activeSection, setActiveSection }) {
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)
  const [mouseY, setMouseY] = useState(0)

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouseY(e.clientY)
      // Hiện header khi chuột ở gần top (100px từ trên xuống)
      if (e.clientY < 100) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleNavClick = (section) => {
    const sectionMap = {
      'home': 'hero-section',
      'intro': 'intro-section',
      'gallery': 'gallery-section',
      'features': 'features-section',
      'artists': 'artists-section'
    }

    const targetId = sectionMap[section]
    const element = document.getElementById(targetId)
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveSection(section)
    }
  }

  return (
    <motion.header 
      className="header-landing"
      initial={{ y: -100, opacity: 0 }}
      animate={{ 
        y: isVisible ? 0 : -100, 
        opacity: isVisible ? 1 : 0 
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <nav className="nav-pill-landing">
        <button 
          className={`nav-btn-landing ${activeSection === 'home' ? 'active' : ''}`}
          onClick={() => handleNavClick('home')}
        >
          Trang Chủ
        </button>
        <button 
          className={`nav-btn-landing ${activeSection === 'intro' ? 'active' : ''}`}
          onClick={() => handleNavClick('intro')}
        >
          Giới Thiệu
        </button>
        <button 
          className={`nav-btn-landing ${activeSection === 'gallery' ? 'active' : ''}`}
          onClick={() => handleNavClick('gallery')}
        >
          Vai Diễn
        </button>
        <button 
          className={`nav-btn-landing ${activeSection === 'features' ? 'active' : ''}`}
          onClick={() => handleNavClick('features')}
        >
          Chức Năng
        </button>
        <button 
          className={`nav-btn-landing ${activeSection === 'artists' ? 'active' : ''}`}
          onClick={() => handleNavClick('artists')}
        >
          Lịch Biểu Diễn
        </button>
      </nav>
      
      <button 
        className="nav-btn-experience"
        onClick={() => navigate('/app')}
      >
        Trải Nghiệm
      </button>
    </motion.header>
  )
}

export default HeaderLanding

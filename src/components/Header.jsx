import { motion } from 'framer-motion'
import './Header.css'

function Header({ activeSection, setActiveSection }) {
  return (
    <motion.header 
      className="header"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="header-content">
        <div className="logo">
          <span className="logo-icon">🎭</span>
          <h1>Tuồng Việt Nam</h1>
        </div>
        <nav className="nav">
          <button 
            className={`nav-btn ${activeSection === 'home' ? 'active' : ''}`}
            onClick={() => setActiveSection('home')}
          >
            Trang Chủ
          </button>
          <button 
            className={`nav-btn ${activeSection === 'experience' ? 'active' : ''}`}
            onClick={() => setActiveSection('experience')}
          >
            Trải Nghiệm
          </button>
          <button 
            className={`nav-btn ${activeSection === 'watch' ? 'active' : ''}`}
            onClick={() => setActiveSection('watch')}
          >
            Xem Tuồng
          </button>
          <button 
            className={`nav-btn ${activeSection === 'tryRole' ? 'active' : ''}`}
            onClick={() => setActiveSection('tryRole')}
          >
            Thử vai
          </button>
          <button 
            className={`nav-btn ${activeSection === 'learning' ? 'active' : ''}`}
            onClick={() => setActiveSection('learning')}
          >
            Học tập
          </button>
        </nav>
      </div>
    </motion.header>
  )
}

export default Header


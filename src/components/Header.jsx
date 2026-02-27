import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LogoutButton from './Auth/LogoutButton'
import './Header.css'

function Header({ activeSection, setActiveSection }) {
  const navigate = useNavigate()
  const { user, profile, loading } = useAuth()

  return (
    <motion.header 
      className="header"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="header-container">
        {/* Left Navigation */}
        <div className="header-left">
          <button 
            className={`header-btn ${activeSection === 'experience' ? 'active' : ''}`}
            onClick={() => setActiveSection('experience')}
          >
            Trải Nghiệm
          </button>
          <button 
            className={`header-btn ${activeSection === 'watch' ? 'active' : ''}`}
            onClick={() => setActiveSection('watch')}
          >
            Xem Tuồng
          </button>
        </div>

        {/* Center Logo */}
        <div className="header-center" onClick={() => navigate('/')}>
          <img src="/src/img/logo_mo_man.png" alt="Tuồng Việt Nam" className="header-logo" />
        </div>

        {/* Right Navigation */}
        <div className="header-right">
          <button 
            className={`header-btn ${activeSection === 'learning' ? 'active' : ''}`}
            onClick={() => setActiveSection('learning')}
          >
            Học tập
          </button>
          <button 
            className={`header-btn ${activeSection === 'tryRole' ? 'active' : ''}`}
            onClick={() => setActiveSection('tryRole')}
          >
            Giới thiệu
          </button>
          
          {!loading && user && <LogoutButton />}
          {!loading && !user && (
            <button 
              className="header-btn header-btn-login"
              onClick={() => navigate('/login')}
            >
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </motion.header>
  )
}

export default Header

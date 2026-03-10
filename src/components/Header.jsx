import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { signOut } from '../services/authService'
import './Header.css'

function Header({ activeSection, setActiveSection }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, loading, isAdmin, isTheater } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User'
  const displayRole = profile?.role === 'admin' ? 'Admin' : profile?.role === 'theater' ? 'Theater' : 'User'

  const goToSection = (section) => {
    if (typeof setActiveSection === 'function') {
      setActiveSection(section)
    }

    const target = `/app?section=${encodeURIComponent(section)}`
    if (`${location.pathname}${location.search}` !== target) {
      navigate(target)
    }
  }

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
            onClick={() => goToSection('experience')}
          >
            Trải Nghiệm
          </button>
          <button 
            className={`header-btn ${activeSection === 'watch' ? 'active' : ''}`}
            onClick={() => goToSection('watch')}
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
            onClick={() => goToSection('learning')}
          >
            Học tập
          </button>
          <button 
            className={`header-btn ${activeSection === 'tryRole' ? 'active' : ''}`}
            onClick={() => goToSection('tryRole')}
          >
            Giới thiệu
          </button>
          
          {!loading && user ? (
            <div className="header-user-menu">
              <button 
                className="header-user-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="user-info">
                  <span className="user-name">{displayName}</span>
                  <span className="user-role">{displayRole}</span>
                </div>
                <div className="user-avatar">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={displayName} />
                  ) : (
                    <span className="avatar-placeholder">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </button>

              {showUserMenu && (
                <div className="user-dropdown">
                  <button 
                    className="dropdown-item"
                    onClick={() => {
                      setShowUserMenu(false)
                      goToSection('profile')
                    }}
                  >
                    <span className="material-symbols-outlined">person</span>
                    <span>Hồ sơ</span>
                  </button>
                  
                  {isAdmin && (
                    <button 
                      className="dropdown-item"
                      onClick={() => {
                        setShowUserMenu(false)
                        navigate('/admin')
                      }}
                    >
                      <span className="material-symbols-outlined">admin_panel_settings</span>
                      <span>Admin Dashboard</span>
                    </button>
                  )}
                  
                  {isTheater && (
                    <button 
                      className="dropdown-item"
                      onClick={() => {
                        setShowUserMenu(false)
                        navigate('/theater')
                      }}
                    >
                      <span className="material-symbols-outlined">theater_comedy</span>
                      <span>Theater Manager</span>
                    </button>
                  )}
                  
                  <div className="dropdown-divider"></div>
                  
                  <button 
                    className="dropdown-item logout-item"
                    onClick={() => {
                      setShowUserMenu(false)
                      handleLogout()
                    }}
                  >
                    <span className="material-symbols-outlined">logout</span>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : !loading && (
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

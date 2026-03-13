import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from '../../services/authService'

function AdminHeader({ user, profile }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleBackToApp = () => {
    navigate('/app')
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Admin'

  return (
    <header className="admin-header flex items-center justify-end">
      <div className="header-search">
        <span className="material-symbols-outlined search-icon">search</span>
        <input
          type="text"
          placeholder="Search data, theaters, shows..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="header-actions flex items-center gap-4">
        <button className="header-icon-btn" title="Notifications">
          <span className="material-symbols-outlined">notifications</span>
          <span className="notification-badge"></span>
        </button>

        <button className="header-icon-btn" title="Help">
          <span className="material-symbols-outlined">help_outline</span>
        </button>

        <button className="header-icon-btn" onClick={handleBackToApp} title="Back to App">
          <span className="material-symbols-outlined">home</span>
        </button>

        <div className="header-divider"></div>

        <div className="header-user" onClick={() => setShowUserMenu(!showUserMenu)}>
          <div className="user-info">
            <p className="user-name">{displayName}</p>
            <p className="user-role">System Admin</p>
          </div>
          <div className="user-avatar">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={displayName} />
            ) : (
              <span className="material-symbols-outlined">account_circle</span>
            )}
          </div>

          {showUserMenu && (
            <div className="user-menu">
              <button onClick={handleBackToApp}>
                <span className="material-symbols-outlined text-primary">home</span>
                <p className="text-primary">Trở về App</p>
              </button>
              <button onClick={handleLogout}>
                <span className="material-symbols-outlined text-primary">logout</span>
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default AdminHeader

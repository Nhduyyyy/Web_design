import { useState } from 'react'
import { signOut } from '../../services/authService'
import { useAuth } from '../../contexts/AuthContext'

function LogoutButton({ className = '' }) {
  const [loading, setLoading] = useState(false)
  const { profile } = useAuth()

  const handleLogout = async () => {
    if (loading) return
    
    setLoading(true)
    
    try {
      // Start logout process
      await Promise.race([
        signOut(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 2000)
        )
      ])
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Always redirect, even on error
      window.location.href = '/'
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {profile && (
        <span style={{ 
          fontSize: '14px', 
          color: '#fff',
          fontWeight: '500',
          opacity: 0.9
        }}>
          {profile.full_name || profile.email?.split('@')[0]}
        </span>
      )}
      <button
        onClick={handleLogout}
        disabled={loading}
        className={className}
        style={{
          padding: '8px 16px',
          background: loading 
            ? 'linear-gradient(135deg, #999 0%, #777 100%)'
            : 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 8px rgba(255, 107, 107, 0.3)',
          whiteSpace: 'nowrap'
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.target.style.transform = 'translateY(-2px)'
            e.target.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.4)'
          }
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)'
          e.target.style.boxShadow = '0 2px 8px rgba(255, 107, 107, 0.3)'
        }}
      >
        {loading ? 'Đang xuất...' : 'Đăng xuất'}
      </button>
    </div>
  )
}

export default LogoutButton

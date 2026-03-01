import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEffect } from 'react'

function AdminRoute({ children }) {
  const { user, profile, loading, isAdmin } = useAuth()

  useEffect(() => {
    console.log('🔒 AdminRoute - Auth State:')
    console.log('  Loading:', loading)
    console.log('  User:', user?.email)
    console.log('  Profile:', profile)
    console.log('  Profile Role:', profile?.role)
    console.log('  isAdmin:', isAdmin)
  }, [user, profile, loading, isAdmin])

  // Wait for both loading to finish AND profile to be loaded
  if (loading || (user && !profile)) {
    console.log('⏳ AdminRoute: Still loading... (loading:', loading, ', profile:', profile, ')')
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#121212'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#d4af35'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #333',
            borderTopColor: '#d4af35',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p>Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    console.log('❌ AdminRoute: No user, redirecting to /login')
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    console.log('❌ AdminRoute: Not admin, redirecting to /app')
    console.log('   Profile role:', profile?.role)
    console.log('   isAdmin flag:', isAdmin)
    return <Navigate to="/app" replace />
  }

  console.log('✅ AdminRoute: Access granted!')
  return children
}

export default AdminRoute

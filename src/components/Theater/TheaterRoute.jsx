import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const TheaterRoute = ({ children }) => {
  const { user, profile, loading } = useAuth()

  console.log('🎭 TheaterRoute - user:', user?.email)
  console.log('🎭 TheaterRoute - profile:', profile)
  console.log('🎭 TheaterRoute - loading:', loading)

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    console.log('🎭 TheaterRoute - No user, redirecting to login')
    return <Navigate to="/login" replace />
  }

  if (profile?.role !== 'theater' && profile?.role !== 'admin') {
    console.log('🎭 TheaterRoute - Not theater/admin role, redirecting to home')
    return <Navigate to="/" replace />
  }

  console.log('🎭 TheaterRoute - Access granted!')
  return children
}

export default TheaterRoute

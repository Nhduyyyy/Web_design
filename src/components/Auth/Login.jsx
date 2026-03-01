import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signIn } from '../../services/authService'
import { supabase } from '../../lib/supabase'
import './Auth.css'

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('') // Clear error when user types
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('🚀 Starting login...')
      
      const result = await signIn({
        email: formData.email,
        password: formData.password
      })
      
      console.log('✅ Login successful:', result)
      console.log('📧 User email:', result.user.email)
      console.log('🆔 User ID:', result.user.id)
      
      // Try to get role from profile first, then fallback to user_metadata
      let userRole = 'user'
      
      try {
        console.log('🔍 Fetching profile from database...')
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, email, full_name')
          .eq('id', result.user.id)
          .single()
        
        console.log('📊 Profile data:', profile)
        console.log('❌ Profile error:', profileError)
        
        if (profile?.role) {
          userRole = profile.role
          console.log('✅ Role from profile:', userRole)
        } else {
          userRole = result.user?.user_metadata?.role || 'user'
          console.log('⚠️ No profile role, using metadata:', userRole)
        }
      } catch (profileErr) {
        console.warn('⚠️ Could not fetch profile, using metadata:', profileErr)
        userRole = result.user?.user_metadata?.role || 'user'
        console.log('📝 Fallback role:', userRole)
      }
      
      console.log('🎯 Final role decision:', userRole)
      
      if (userRole === 'admin') {
        console.log('👑 Admin user detected, redirecting to admin dashboard')
        console.log('🔄 Redirecting to: /admin')
        window.location.href = '/admin'
      } else if (userRole === 'theater') {
        console.log('🎭 Theater user detected, redirecting to theater manager')
        console.log('🔄 Redirecting to: /theater')
        window.location.href = '/theater'
      } else {
        console.log('👤 Regular user, redirecting to app')
        console.log('🔄 Redirecting to: /app')
        window.location.href = '/app'
      }
    } catch (err) {
      console.error('❌ Login error:', err)
      setLoading(false)
      
      // Handle specific errors
      if (err.message?.includes('Email not confirmed') || err.message?.includes('Email chưa được xác nhận')) {
        setError('⚠️ Email chưa được xác nhận. Vui lòng:\n1. Kiểm tra email để xác nhận\n2. Hoặc liên hệ admin để được hỗ trợ')
      } else if (err.message?.includes('Invalid login credentials')) {
        setError('Email hoặc mật khẩu không đúng. Vui lòng thử lại.')
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Email chưa được xác nhận. Vui lòng kiểm tra email của bạn.')
      } else if (err.message?.includes('network')) {
        setError('Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.')
      } else {
        setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.')
      }
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-background"></div>
      
      <div className="auth-content">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Đăng Nhập</h1>
            <p className="auth-subtitle">Chào mừng trở lại với Tuồng Opera</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="auth-error">
                <span>⚠️</span>
                <p>{error}</p>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mật khẩu</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                minLength={6}
              />
            </div>

            <div className="form-footer">
              <Link to="/forgot-password" className="forgot-link">
                Quên mật khẩu?
              </Link>
            </div>

            <button 
              type="submit" 
              className="auth-btn auth-btn-primary"
              disabled={loading}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
            </button>
          </form>

          <div className="auth-divider">
            <span>hoặc</span>
          </div>

          <div className="auth-footer">
            <p>
              Chưa có tài khoản?{' '}
              <Link to="/register" className="auth-link">
                Đăng ký ngay
              </Link>
            </p>
          </div>

          <div className="auth-back">
            <Link to="/" className="back-link">
              ← Quay lại trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

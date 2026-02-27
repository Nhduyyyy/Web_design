import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signUp } from '../../services/authService'
import './Auth.css'

function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    role: 'user'
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

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return false
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      return false
    }

    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
      setError('Số điện thoại không hợp lệ (10 chữ số)')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      console.log('🚀 Starting registration...')
      
      const result = await signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone,
        role: formData.role
      })
      
      console.log('✅ Registration successful:', result)
      
      // Show success message and redirect
      alert('Đăng ký thành công! Bạn có thể đăng nhập ngay.')
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('❌ Registration error:', err)
      
      // Handle specific errors
      if (err.message?.includes('already registered')) {
        setError('Email này đã được đăng ký. Vui lòng đăng nhập hoặc sử dụng email khác.')
      } else if (err.message?.includes('rate limit')) {
        setError('⚠️ Đã vượt quá giới hạn đăng ký. Vui lòng:\n1. Đợi 5-10 phút rồi thử lại\n2. Hoặc sử dụng email khác\n3. Hoặc liên hệ admin để được hỗ trợ')
      } else if (err.message?.includes('Invalid email')) {
        setError('Email không hợp lệ. Vui lòng kiểm tra lại.')
      } else if (err.message?.includes('Password')) {
        setError('Mật khẩu không đủ mạnh. Vui lòng sử dụng mật khẩu khác.')
      } else if (err.message?.includes('network')) {
        setError('Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.')
      } else {
        setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-background"></div>
      
      <div className="auth-content">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Đăng Ký</h1>
            <p className="auth-subtitle">Tạo tài khoản để trải nghiệm Tuồng Opera</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="auth-error">
                <span>⚠️</span>
                <p>{error}</p>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="fullName">Họ và tên</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                required
                autoComplete="name"
              />
            </div>

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
              <label htmlFor="phone">Số điện thoại</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0123456789"
                required
                autoComplete="tel"
                pattern="[0-9]{10}"
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
                autoComplete="new-password"
                minLength={6}
              />
              <small className="form-hint">Tối thiểu 6 ký tự</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Loại tài khoản</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="user">Người dùng</option>
                <option value="theater">Nhà hát</option>
              </select>
              <small className="form-hint">
                {formData.role === 'theater' 
                  ? 'Dành cho chủ nhà hát muốn đăng ký địa điểm và tổ chức sự kiện'
                  : 'Dành cho người dùng muốn xem và đặt vé'}
              </small>
            </div>

            <button 
              type="submit" 
              className="auth-btn auth-btn-primary"
              disabled={loading}
            >
              {loading ? 'Đang đăng ký...' : 'Đăng Ký'}
            </button>
          </form>

          <div className="auth-divider">
            <span>hoặc</span>
          </div>

          <div className="auth-footer">
            <p>
              Đã có tài khoản?{' '}
              <Link to="/login" className="auth-link">
                Đăng nhập ngay
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

export default Register

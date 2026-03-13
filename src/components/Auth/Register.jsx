import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp } from '../../services/authService'

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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    setError('')
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
      
      alert('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.')
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('❌ Registration error:', err)
      setLoading(false)
      
      if (err.message?.includes('already registered')) {
        setError('Email này đã được đăng ký. Vui lòng đăng nhập hoặc sử dụng email khác.')
      } else if (err.message?.includes('rate limit')) {
        setError('Đã vượt quá giới hạn đăng ký. Vui lòng đợi 5-10 phút rồi thử lại.')
      } else if (err.message?.includes('Invalid email')) {
        setError('Email không hợp lệ. Vui lòng kiểm tra lại.')
      } else if (err.message?.includes('network')) {
        setError('Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.')
      } else {
        setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.')
      }
    }
  }

  return (
    <>
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active,
        select:-webkit-autofill,
        select:-webkit-autofill:hover,
        select:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #1a1a1a inset !important;
          -webkit-text-fill-color: white !important;
          box-shadow: 0 0 0 1000px #1a1a1a inset !important;
          transition: background-color 5000s ease-in-out 0s;
          font-size: 16px !important;
          font-family: Arial, sans-serif !important;
          font-weight: 400 !important;
          letter-spacing: normal !important;
          line-height: 1.5 !important;
          caret-color: white !important;
        }
        input, select {
          font-size: 16px !important;
          font-family: Arial, sans-serif !important;
          font-weight: 400 !important;
          letter-spacing: normal !important;
          line-height: 1.5 !important;
          transform: none !important;
        }
      `}</style>
      <div className="flex h-screen w-full overflow-hidden bg-[#120808]">
        {/* Visual Side: Cinematic Mask */}
        <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden bg-black">
          <div 
            className="absolute inset-0 bg-cover bg-center scale-110 transition-transform duration-[20s] hover:scale-100"
            style={{
              backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCeG0vltYHc5rIObU9H8o2T8ZOCO4CN2kb8ttz1r4b_JpYcfFLh0_5azdzYhF5V6OhrN7Y-Tokkk0GPin9jwQkIbNaXV4GEdFUk0IPb0T4vlsqNLdqHbvU9awD3K3tsH3l5gDOIZ37WxczSWb9-GXsNUOsSagIT_EXaa7FrEmzWF7JMj2IIV21cuYqo7rfogvouGxV1ynfm4qUpPcaIOsCh_bvaRvc82MmWQecMNiTOpnsUWjP8PbCwokzx-0-01H_8x5GvaGZg')"
            }}
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-[#120808] via-transparent to-[#120808]/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#120808]/95" />
          
          <div className="absolute bottom-20 left-20 z-10 max-w-lg">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-[2px] w-12 bg-[#d33131]" />
              <span className="text-[#d33131] font-bold tracking-[0.3em] uppercase text-sm">
                Nghệ Thuật Truyền Thống
              </span>
            </div>
            <h1 className="text-6xl font-extrabold tracking-tighter text-white leading-tight">
              Linh Hồn Của <span className="text-[#d33131]">Tuồng</span>
              <br />
              <span className="text-[#d4af37]" style={{ textShadow: '0 0 10px rgba(212, 175, 55, 0.3)' }}>
                Việt Nam
              </span>
            </h1>
            <p className="mt-6 text-slate-400 text-lg leading-relaxed max-w-md">
              Hòa mình vào thế giới huy hoàng của Tuồng Việt Nam. Trải nghiệm sự kịch tính, màu sắc và di sản vượt thời gian.
            </p>
          </div>
          
          <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-[#d33131]/20 rounded-full blur-[120px]" />
        </div>

        {/* Form Side */}
        <div className="w-full lg:w-2/5 flex flex-col bg-[#120808] border-l border-white/5 relative z-20 overflow-y-auto">
          {/* Header */}
          <header className="flex items-center justify-between px-8 py-8 lg:px-12">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="size-10 bg-[#d33131] flex items-center justify-center rounded-lg rotate-45 group-hover:rotate-0 transition-transform duration-300">
                <span className="text-white text-2xl -rotate-45 group-hover:rotate-0 transition-transform">
                  🎭
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                Tuồng <span className="text-[#d33131]">Theatre</span>
              </h2>
            </Link>
            <Link 
              to="/login" 
              className="text-sm font-semibold text-[#d33131] hover:underline"
            >
              Đã có tài khoản
            </Link>
          </header>

          {/* Form Container */}
          <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 max-w-xl mx-auto w-full py-8">
            <div className="mb-8">
              <h3 className="text-3xl font-bold text-white mb-2">
                Tạo Tài Khoản Mới
              </h3>
              <p className="text-slate-400">
                Đăng ký để tham gia cộng đồng Tuồng Việt Nam
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-800 dark:text-red-200 whitespace-pre-line">
                    {error}
                  </p>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium text-slate-300 ml-1">
                  Họ và tên
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#d33131] transition-colors text-xl">
                    👤
                  </span>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/10 bg-[#1a1a1a] focus:bg-[#1a1a1a] focus:ring-2 focus:ring-[#d33131]/20 focus:border-[#d33131] outline-none transition-all text-white placeholder:text-slate-500"
                    style={{ fontSize: '16px', fontFamily: 'Arial, sans-serif' }}
                    placeholder="Nguyễn Văn A"
                    required
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-300 ml-1">
                  Email
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#d33131] transition-colors text-xl">
                    ✉️
                  </span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/10 bg-[#1a1a1a] focus:bg-[#1a1a1a] focus:ring-2 focus:ring-[#d33131]/20 focus:border-[#d33131] outline-none transition-all text-white placeholder:text-slate-500"
                    style={{ fontSize: '16px', fontFamily: 'Arial, sans-serif' }}
                    placeholder="actor@tuongtheatre.vn"
                    required
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-slate-300 ml-1">
                  Số điện thoại
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#d33131] transition-colors text-xl">
                    📱
                  </span>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/10 bg-[#1a1a1a] focus:bg-[#1a1a1a] focus:ring-2 focus:ring-[#d33131]/20 focus:border-[#d33131] outline-none transition-all text-white placeholder:text-slate-500"
                    style={{ fontSize: '16px', fontFamily: 'Arial, sans-serif' }}
                    placeholder="0123456789"
                    required
                    autoComplete="off"
                    pattern="[0-9]{10}"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-300 ml-1">
                  Mật khẩu
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#d33131] transition-colors text-xl">
                    🔒
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-12 pr-12 py-3 rounded-xl border border-white/10 bg-[#1a1a1a] focus:bg-[#1a1a1a] focus:ring-2 focus:ring-[#d33131]/20 focus:border-[#d33131] outline-none transition-all text-white placeholder:text-slate-500"
                    style={{ fontSize: '16px', fontFamily: 'Arial, sans-serif' }}
                    placeholder="••••••••"
                    required
                    autoComplete="off"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xl"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <p className="text-xs text-slate-500 ml-1">Tối thiểu 6 ký tự</p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-300 ml-1">
                  Xác nhận mật khẩu
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#d33131] transition-colors text-xl">
                    🔒
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-12 pr-12 py-3 rounded-xl border border-white/10 bg-[#1a1a1a] focus:bg-[#1a1a1a] focus:ring-2 focus:ring-[#d33131]/20 focus:border-[#d33131] outline-none transition-all text-white placeholder:text-slate-500"
                    style={{ fontSize: '16px', fontFamily: 'Arial, sans-serif' }}
                    placeholder="••••••••"
                    required
                    autoComplete="off"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xl"
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#d33131] hover:bg-[#d33131]/90 disabled:bg-[#d33131]/50 text-white font-bold py-4 rounded-xl shadow-lg shadow-[#d33131]/20 transition-all flex items-center justify-center gap-2 group mt-6"
              >
                <span>{loading ? 'ĐANG ĐĂNG KÝ...' : 'VÀO SÂN KHẤU'}</span>
                {!loading && (
                  <span className="group-hover:translate-x-1 transition-transform text-xl">
                    →
                  </span>
                )}
              </button>

              {/* Divider */}
              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-slate-200 dark:border-white/5" />
                <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
                  Hoặc tiếp tục với
                </span>
                <div className="flex-grow border-t border-slate-200 dark:border-white/5" />
              </div>

              {/* Social Login - Google Only */}
              <button
                type="button"
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.152-1.896 4.14-1.232 1.232-3.152 2.572-6.424 2.572-5.184 0-9.22-4.184-9.22-9.356s4.036-9.356 9.22-9.356c2.8 0 4.912 1.108 6.4 2.52l2.312-2.312C18.428 1.164 15.824 0 12.48 0 6.168 0 1.056 5.112 1.056 11.424s5.112 11.424 11.424 11.424c3.424 0 6.012-1.124 8.044-3.244 2.084-2.084 2.744-4.996 2.744-7.392 0-.704-.064-1.376-.184-2.032H12.48z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="text-sm font-semibold text-white">
                  Google
                </span>
              </button>
            </form>
          </div>

          {/* Footer */}
          <footer className="px-8 py-8 lg:px-12 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-500 dark:text-slate-600">
              © 2024 Vietnamese Tuồng Theatre Association
            </p>
            <div className="flex gap-4">
              <Link to="/privacy" className="text-xs text-slate-500 hover:text-[#d33131] transition-colors">
                Quyền riêng tư
              </Link>
              <Link to="/terms" className="text-xs text-slate-500 hover:text-[#d33131] transition-colors">
                Điều khoản
              </Link>
              <Link to="/" className="text-xs text-slate-500 hover:text-[#d33131] transition-colors">
                ← Trang chủ
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </>
  )
}

export default Register

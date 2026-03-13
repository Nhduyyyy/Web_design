import { useState } from 'react'
import { Link } from 'react-router-dom'
import { signIn } from '../../services/authService'
import { supabase } from '../../lib/supabase'

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
    setError('')
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
        window.location.href = '/admin'
      } else if (userRole === 'theater') {
        console.log('🎭 Theater user detected, redirecting to theater manager')
        window.location.href = '/theater'
      } else {
        console.log('👤 Regular user, redirecting to app')
        window.location.href = '/app'
      }
    } catch (err) {
      console.error('❌ Login error:', err)
      setLoading(false)
      
      if (err.message?.includes('Email not confirmed') || err.message?.includes('Email chưa được xác nhận')) {
        setError('⚠️ Email chưa được xác nhận. Vui lòng kiểm tra email để xác nhận hoặc liên hệ admin.')
      } else if (err.message?.includes('Invalid login credentials')) {
        setError('Email hoặc mật khẩu không đúng. Vui lòng thử lại.')
      } else if (err.message?.includes('network')) {
        setError('Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.')
      } else {
        setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.')
      }
    }
  }

  return (
    <>
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
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
        input {
          font-size: 16px !important;
          font-family: Arial, sans-serif !important;
          font-weight: 400 !important;
          letter-spacing: normal !important;
          line-height: 1.5 !important;
          transform: none !important;
        }
        input:focus {
          font-size: 16px !important;
          font-family: Arial, sans-serif !important;
          font-weight: 400 !important;
          letter-spacing: normal !important;
          line-height: 1.5 !important;
          transform: none !important;
        }
        input:hover {
          font-size: 16px !important;
          transform: none !important;
        }
      `}</style>
      <div className="flex h-screen w-full overflow-hidden bg-[#120808]">
      {/* Visual Side: Cinematic Mask */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden bg-black">
        {/* Background Image with Mask */}
        <div 
          className="absolute inset-0 bg-cover bg-center scale-110 transition-transform duration-[20s] hover:scale-100"
          style={{
            backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCeG0vltYHc5rIObU9H8o2T8ZOCO4CN2kb8ttz1r4b_JpYcfFLh0_5azdzYhF5V6OhrN7Y-Tokkk0GPin9jwQkIbNaXV4GEdFUk0IPb0T4vlsqNLdqHbvU9awD3K3tsH3l5gDOIZ37WxczSWb9-GXsNUOsSagIT_EXaa7FrEmzWF7JMj2IIV21cuYqo7rfogvouGxV1ynfm4qUpPcaIOsCh_bvaRvc82MmWQecMNiTOpnsUWjP8PbCwokzx-0-01H_8x5GvaGZg')"
          }}
        />
        
        {/* Atmospheric Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#120808] via-transparent to-[#120808]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#120808]/95" />
        
        {/* Floating Elements */}
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
        
        {/* Subtle Red Light Effect */}
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-[#d33131]/20 rounded-full blur-[120px]" />
      </div>

      {/* Form Side */}
      <div className="w-full lg:w-2/5 flex flex-col bg-[#120808] border-l border-white/5 relative z-20">
        {/* Header/Logo */}
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
            to="/register" 
            className="text-sm font-semibold text-[#d33131] hover:underline"
          >
            Tạo tài khoản mới
          </Link>
        </header>

        {/* Login Form Container */}
        <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 max-w-xl mx-auto w-full">
          <div className="mb-10">
            <h3 className="text-3xl font-bold text-white mb-2">
              Chào Mừng Trở Lại
            </h3>
            <p className="text-slate-400">
              Đăng nhập để truy cập sân khấu số của bạn
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-200 whitespace-pre-line">
                  {error}
                </p>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-2">
              <label 
                htmlFor="email"
                className="text-sm font-medium text-slate-300 ml-1"
              >
                Email hoặc Tên Sân Khấu
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#d33131] transition-colors text-xl">
                  👤
                </span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-white/10 bg-[#1a1a1a] focus:bg-[#1a1a1a] focus:ring-2 focus:ring-[#d33131]/20 focus:border-[#d33131] outline-none transition-all text-white placeholder:text-slate-500 text-base font-sans"
                  style={{ 
                    fontSize: '16px',
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: '400',
                    letterSpacing: 'normal',
                    lineHeight: '1.5'
                  }}
                  placeholder="actor@tuongtheatre.vn"
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label 
                  htmlFor="password"
                  className="text-sm font-medium text-slate-300"
                >
                  Mật khẩu
                </label>
                <Link 
                  to="/forgot-password" 
                  className="text-xs font-semibold text-[#d33131] hover:text-[#d33131]/80"
                >
                  Quên mật khẩu?
                </Link>
              </div>
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
                  className="w-full pl-12 pr-12 py-4 rounded-xl border border-white/10 bg-[#1a1a1a] focus:bg-[#1a1a1a] focus:ring-2 focus:ring-[#d33131]/20 focus:border-[#d33131] outline-none transition-all text-white placeholder:text-slate-500 text-base font-sans"
                  style={{ 
                    fontSize: '16px',
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: '400',
                    letterSpacing: 'normal',
                    lineHeight: '1.5'
                  }}
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
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-3 px-1">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="w-5 h-5 rounded border-slate-300 text-[#d33131] focus:ring-[#d33131] bg-transparent cursor-pointer"
              />
              <label 
                htmlFor="rememberMe"
                className="text-sm text-slate-400 select-none cursor-pointer"
              >
                Duy trì đăng nhập
              </label>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#d33131] hover:bg-[#d33131]/90 disabled:bg-[#d33131]/50 text-white font-bold py-4 rounded-xl shadow-lg shadow-[#d33131]/20 transition-all flex items-center justify-center gap-2 group"
            >
              <span>{loading ? 'ĐANG ĐĂNG NHẬP...' : 'VÀO SÂN KHẤU'}</span>
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
            <Link 
              to="/privacy" 
              className="text-xs text-slate-500 hover:text-[#d33131] transition-colors"
            >
              Quyền riêng tư
            </Link>
            <Link 
              to="/terms" 
              className="text-xs text-slate-500 hover:text-[#d33131] transition-colors"
            >
              Điều khoản
            </Link>
            <Link 
              to="/" 
              className="text-xs text-slate-500 hover:text-[#d33131] transition-colors"
            >
              ← Trang chủ
            </Link>
          </div>
        </footer>
      </div>
    </div>
    </>
  )
}

export default Login

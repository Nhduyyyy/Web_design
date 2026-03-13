import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { NavLink } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext'

const TheaterHeader = ({ theater }) => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="flex items-center justify-between border-b border-border-gold px-6 py-4 bg-surface-dark/50 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-3 text-primary">
          <span className="material-symbols-outlined text-3xl">theater_comedy</span>
          <h2 className="text-xl font-bold leading-tight tracking-tight">Tuồng Platform</h2>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          <NavLink
            to="/theater"
            end
            className={({ isActive }) =>
              isActive
                ? "text-primary text-sm font-medium border-b-2 border-primary pb-1"
                : "text-slate-400 hover:text-primary text-sm font-medium transition-colors"
            }
          >
            Tổng quan
          </NavLink>

          <NavLink
            to="/theater/profile"
            className={({ isActive }) =>
              isActive
                ? "text-primary text-sm font-medium border-b-2 border-primary pb-1"
                : "text-slate-400 hover:text-primary text-sm font-medium transition-colors"
            }
          >
            Thông tin Nhà hát
          </NavLink>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            search
          </span>
          <input 
            className="bg-surface-dark border-border-gold rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-primary focus:border-primary w-64" 
            placeholder="Tìm kiếm địa điểm..." 
            type="text"
          />
        </div>

        <button className="p-2 text-slate-400 hover:text-primary transition-colors relative">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1 right-1 h-2 w-2 bg-accent-red rounded-full"></span>
        </button>

        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="h-10 w-10 rounded-full border-2 border-primary overflow-hidden hover:border-primary/70 transition-colors"
          >
            {user?.user_metadata?.avatar_url ? (
              <img 
                alt="Avatar" 
                className="h-full w-full object-cover" 
                src={user.user_metadata.avatar_url}
              />
            ) : (
              <div className="h-full w-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-surface-dark border border-border-gold rounded-lg shadow-xl py-2 z-50">
              <div className="px-4 py-2 border-b border-border-gold">
                <p className="text-sm font-medium text-slate-200">{user?.email}</p>
                <p className="text-xs text-slate-400">Quản lý Nhà hát</p>
              </div>
              {/* <Link 
                to="/theater/settings" 
                className="block px-4 py-2 text-sm text-slate-300 hover:bg-background-dark hover:text-primary transition-colors"
              >
                Cài đặt
              </Link> */}
              <button 
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-background-dark transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default TheaterHeader

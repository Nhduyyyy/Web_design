import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './PromotionBanner.css'

const PromotionBanner = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [nextShowTimer, setNextShowTimer] = useState(null)

  // Không hiện banner ở LandingPage và Kiem-Lua-Phaser
  const shouldShowBanner = () => {
    const path = location.pathname
    return path !== '/' && path !== '/kiem-lua-phaser'
  }

  useEffect(() => {
    // Chỉ hiện banner nếu không phải trang landing hoặc game
    if (!shouldShowBanner()) {
      return
    }

    // Hiện banner lần đầu sau 1 giây
    const initialTimer = setTimeout(() => {
      showBanner()
    }, 1000) // 1 giây

    return () => {
      clearTimeout(initialTimer)
      if (nextShowTimer) clearTimeout(nextShowTimer)
    }
  }, [location.pathname])

  const showBanner = () => {
    setIsVisible(true)
    setIsClosing(false)

    // Tự động ẩn sau 5 giây
    const hideTimer = setTimeout(() => {
      hideBanner(false) // false = tự động ẩn
    }, 5000) // 5 giây

    return () => {
      clearTimeout(hideTimer)
    }
  }

  const hideBanner = (isManualClose = false) => {
    setIsClosing(true)
    
    setTimeout(() => {
      setIsVisible(false)
      setIsClosing(false)
      
      // Lên lịch hiện lại
      const delay = isManualClose ? 300000 : 180000 // 5 phút nếu đóng thủ công, 3 phút nếu tự động
      const timer = setTimeout(() => {
        showBanner()
      }, delay)
      
      setNextShowTimer(timer)
    }, 500) // Thời gian animation
  }

  const handleClose = () => {
    // Clear timer tự động ẩn nếu có
    hideBanner(true) // true = đóng thủ công
  }

  const handleClick = () => {
    // Chuyển đến trang game Kiếm Lửa Phaser
    navigate('/kiem-lua-phaser')
    // Đóng banner sau khi click
    hideBanner(true)
  }

  // Không hiện banner nếu đang ở trang landing hoặc game
  if (!shouldShowBanner() || !isVisible) return null

  return (
    <div className={`promotion-banner ${isClosing ? 'closing' : ''}`}>
      <button 
        className="promotion-banner-close"
        onClick={handleClose}
        aria-label="Đóng"
      >
        <span className="material-symbols-outlined">close</span>
      </button>
      
      <div 
        className="promotion-banner-content"
        onClick={handleClick}
        role="button"
        tabIndex={0}
      >
        <img 
          src="/game-assets/promotion.png" 
          alt="Khuyến mãi đặc biệt"
          className="promotion-banner-image"
          onError={(e) => {
            // Fallback nếu không tìm thấy ảnh
            e.target.style.display = 'none'
            e.target.parentElement.innerHTML = `
              <div style="padding: 2rem; text-align: center; background: linear-gradient(135deg, #d33131, #D4AF37); border-radius: 1rem;">
                <h3 style="color: white; margin-bottom: 0.5rem;">🎭 Khuyến Mãi Đặc Biệt!</h3>
                <p style="color: white; font-size: 0.9rem;">Nhấn để xem chi tiết</p>
              </div>
            `
          }}
        />
      </div>

      {/* Pulse animation indicator */}
      <div className="promotion-banner-pulse"></div>
    </div>
  )
}

export default PromotionBanner

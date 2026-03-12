import { useEffect, useState } from 'react'
import './TuongRainEffect.css'

const TuongRainEffect = () => {
  const [raindrops, setRaindrops] = useState([])

  // Các icon liên quan đến Tuồng
  const tuongIcons = [
    'theater_comedy',      // Mặt nạ hài kịch
    'masks',              // Mặt nạ
    'music_note',         // Nốt nhạc
    'piano',              // Đàn
    'celebration',        // Lễ hội
    'auto_awesome',       // Lấp lánh
    'star',               // Ngôi sao
    'favorite',           // Trái tim
    'local_florist',      // Hoa
    'wb_twilight',        // Hoàng hôn
    'light_mode',         // Ánh sáng
    'filter_vintage',     // Vintage
    'emoji_events',       // Cúp
    'military_tech',      // Huy chương
    'workspace_premium',  // Premium
    'diamond',            // Kim cương
    'crown',              // Vương miện
    'swords'              // Kiếm
  ]

  useEffect(() => {
    // Tạo 30 raindrops với vị trí và timing ngẫu nhiên
    const drops = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      icon: tuongIcons[Math.floor(Math.random() * tuongIcons.length)],
      left: Math.random() * 100, // Vị trí ngang (%)
      animationDuration: 8 + Math.random() * 12, // 8-20 giây
      animationDelay: Math.random() * 5, // Delay 0-5 giây
      size: 20 + Math.random() * 20, // Kích thước 20-40px
      opacity: 0.1 + Math.random() * 0.3, // Độ mờ 0.1-0.4
      rotation: Math.random() * 360 // Góc xoay ban đầu
    }))
    
    setRaindrops(drops)
  }, [])

  return (
    <div className="tuong-rain-container">
      {raindrops.map((drop) => (
        <span
          key={drop.id}
          className="material-symbols-outlined tuong-raindrop"
          style={{
            left: `${drop.left}%`,
            fontSize: `${drop.size}px`,
            opacity: drop.opacity,
            animationDuration: `${drop.animationDuration}s`,
            animationDelay: `${drop.animationDelay}s`,
            '--rotation': `${drop.rotation}deg`
          }}
        >
          {drop.icon}
        </span>
      ))}
    </div>
  )
}

export default TuongRainEffect

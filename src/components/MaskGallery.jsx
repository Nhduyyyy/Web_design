import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { maskData } from '../data/tuongData'
import './MaskGallery.css'

// Trên macOS tên file thường ở dạng NFD; chuẩn hóa path để ảnh load đúng từ public/masks
function getMaskImageSrc(imagePath) {
  if (!imagePath || imagePath.startsWith('http')) return imagePath
  const i = imagePath.lastIndexOf('/')
  const dir = i >= 0 ? imagePath.slice(0, i + 1) : ''
  const file = i >= 0 ? imagePath.slice(i + 1) : imagePath
  const nfdFile = file.normalize('NFD')
  return dir + encodeURI(nfdFile)
}

function MaskGallery({ selectedItem, setSelectedItem }) {
  const [hoveredMask, setHoveredMask] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const scrollContainerRef = useRef(null)

  // Debug: Log khi component mount
  useEffect(() => {
    console.log('MaskGallery mounted')
    console.log('maskData length:', maskData.length)
    console.log('isAutoPlaying:', isAutoPlaying)
  }, [])

  // Auto scroll effect
  useEffect(() => {
    if (!isAutoPlaying) {
      console.log('Auto-play is paused')
      return
    }

    console.log('Starting auto-play, total masks:', maskData.length)

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % maskData.length
        console.log('Auto-scrolling from', prev, 'to', next)
        return next
      })
    }, 3000) // Chuyển sau mỗi 3 giây

    return () => {
      console.log('Clearing interval')
      clearInterval(interval)
    }
  }, [isAutoPlaying])

  const scroll = (direction) => {
    setIsAutoPlaying(false)
    if (direction === 'left') {
      setCurrentIndex((prev) => (prev - 1 + maskData.length) % maskData.length)
    } else {
      setCurrentIndex((prev) => (prev + 1) % maskData.length)
    }
  }

  const getCardStyle = (index) => {
    const diff = index - currentIndex
    const totalCards = maskData.length

    // Tính khoảng cách ngắn nhất (xử lý vòng tròn)
    let distance = diff
    if (Math.abs(diff) > totalCards / 2) {
      distance = diff > 0 ? diff - totalCards : diff + totalCards
    }

    // Hiển thị 9 cards: 4 bên trái, 1 giữa, 4 bên phải
    const isVisible = Math.abs(distance) <= 4

    if (!isVisible) {
      return {
        transform: 'translateX(0) translateZ(-500px) scale(0.3)',
        opacity: 0,
        zIndex: -1,
        pointerEvents: 'none'
      }
    }

    // Tính toán scale, opacity, position dựa trên khoảng cách
    // Card giữa có khoảng cách lớn, các card xa thì gần nhau hơn
    let scale, opacity, translateX, translateZ

    switch (Math.abs(distance)) {
      case 0:
        // Card ở giữa
        scale = 1.15
        opacity = 1
        translateX = 0
        translateZ = 0
        break
      case 1:
        // Card sát bên - khoảng cách lớn từ giữa
        scale = 0.85
        opacity = 0.8
        translateX = distance * 350
        translateZ = -50
        break
      case 2:
        // Card thứ 2 - gần như sát card 1
        scale = 0.7
        opacity = 0.6
        translateX = distance * 350.5
        translateZ = -100
        break
      case 3:
        // Card thứ 3 - gần như sát card 2
        scale = 0.55
        opacity = 0.4
        translateX = distance * 351
        translateZ = -150
        break
      case 4:
        // Card xa nhất - gần như sát card 3
        scale = 0.45
        opacity = 0.25
        translateX = distance * 351.5
        translateZ = -200
        break
      default:
        scale = 0.3
        opacity = 0
        translateX = 0
        translateZ = -300
    }

    return {
      transform: `translateX(${translateX}px) translateZ(${translateZ}px) scale(${scale})`,
      opacity,
      zIndex: 10 - Math.abs(distance),
      pointerEvents: 'auto'
    }
  }

  return (
    <section className="mask-gallery">
      <div className="gallery-container">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="gallery-subtitle-top"
        >
          KHO LƯU TRỮ GIÁO DỤC
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="gallery-title"
        >
          Vai Diễn Nhân Vật
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="gallery-subtitle"
        >
          Trong Tuồng, mỗi màu sắc và nét vẽ đều là một biểu tượng ngôn ngữ. Từ khuôn mặt đỏ trung thành đến khuôn mặt trắng gian trá, khám phá những nguyên mẫu định hình nghệ thuật kể chuyện truyền thống của chúng ta.
        </motion.p>

        <div className="slider-wrapper">
          <button
            className="slider-arrow slider-arrow-left"
            onClick={() => scroll('left')}
            aria-label="Scroll left"
          >
            ‹
          </button>

          <div className="carousel-3d" ref={scrollContainerRef}>
            <div className="carousel-track">
              {maskData.map((mask, index) => (
                <motion.div
                  key={mask.id}
                  className={`poster-card ${selectedItem?.id === mask.id ? 'selected' : ''} ${index === currentIndex ? 'active' : ''}`}
                  style={getCardStyle(index)}
                  onMouseEnter={() => {
                    setHoveredMask(mask.id)
                  }}
                  onMouseLeave={() => {
                    setHoveredMask(null)
                  }}
                  onClick={() => {
                    setSelectedItem(mask)
                    setCurrentIndex(index)
                    setIsAutoPlaying(false)
                  }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                >
                  <div
                    className="poster-image"
                    style={{ borderColor: mask.color }}
                  >
                    <img
                      src={getMaskImageSrc(mask.imagePath)}
                      alt={mask.name}
                      className="poster-mask-img"
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        const fallback = e.target.nextElementSibling
                        if (fallback) fallback.style.display = 'inline'
                      }}
                    />
                    <span className="poster-emoji poster-emoji-fallback" style={{ display: 'none' }}>{mask.emoji}</span>
                  </div>

                  <AnimatePresence>
                    {(hoveredMask === mask.id || index === currentIndex) && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="poster-info"
                      >
                        <h3 className="poster-title">{mask.name}</h3>
                        <p className="poster-description">{mask.description}</p>
                        <div className="poster-actions">
                          <button className="btn-play">▶ Xem</button>
                          <button className="btn-info">ⓘ Chi tiết</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>

          <button
            className="slider-arrow slider-arrow-right"
            onClick={() => scroll('right')}
            aria-label="Scroll right"
          >
            ›
          </button>
        </div>

        {/* Indicators */}
        <div className="carousel-indicators">
          {maskData.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => {
                setCurrentIndex(index)
                setIsAutoPlaying(false)
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default MaskGallery





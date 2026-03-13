import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import './Introduction.css'
import tuongHueImage from '../img/tuong-hue.jpg'
import tuongDoImage from '../img/tuong-do.jpg'
import tuongHaiImage from '../img/tuong-hai.jpg'

const tuongTypes = [
  {
    id: 1,
    label: 'DI SẢN HOÀNG CUNG',
    title: 'TUỒNG CUNG ĐÌNH',
    subtitle: 'Nghệ Thuật Hoàng Gia',
    description: 'Nghệ thuật sân khấu độc đáo của triều đình nhà Nguyễn, kết hợp nhã nhạc cung đình, múa lễ và kịch truyền thống.',
    image: tuongHueImage,
    features: [
      { icon: '🎭', label: 'Mặt Nạ' },
      { icon: '👑', label: 'Trang Phục' },
      { icon: '🎵', label: 'Âm Nhạc' },
      { icon: '💃', label: 'Múa' }
    ]
  },
  {
    id: 2,
    label: 'NGHỆ THUẬT DÂN GIAN',
    title: 'TUỒNG ĐỒ',
    subtitle: 'Tuồng Truyền Thống',
    description: 'Loại hình tuồng dân gian gần gũi với đời sống nhân dân, thể hiện các câu chuyện lịch sử và truyền thuyết.',
    image: tuongDoImage,
    features: [
      { icon: '🎭', label: 'Mặt Nạ' },
      { icon: '🎪', label: 'Sân Khấu' },
      { icon: '🥁', label: 'Nhạc Cụ' },
      { icon: '⚔️', label: 'Võ Thuật' }
    ]
  },
  {
    id: 3,
    label: 'GIẢI TRÍ TRUYỀN THỐNG',
    title: 'TUỒNG HÀI',
    subtitle: 'Nghệ Thuật Hài Hước',
    description: 'Tuồng hài kết hợp yếu tố hài hước, châm biếm xã hội, mang đến tiếng cười và bài học ý nghĩa.',
    image: tuongHaiImage,
    features: [
      { icon: '😄', label: 'Hài Hước' },
      { icon: '🎭', label: 'Diễn Xuất' },
      { icon: '🎪', label: 'Biểu Diễn' },
      { icon: '🎉', label: 'Giải Trí' }
    ]
  }
]

function Introduction() {
  const [[currentIndex, direction], setPage] = useState([0, 0])

  const currentType = tuongTypes[currentIndex]

  const paginate = (newDirection) => {
    let newIndex = currentIndex + newDirection
    if (newIndex < 0) newIndex = tuongTypes.length - 1
    if (newIndex >= tuongTypes.length) newIndex = 0
    setPage([newIndex, newDirection])
  }

  const variants = {
    enter: (direction) => {
      return {
        x: direction > 0 ? 1000 : -1000,
        opacity: 0
      }
    },
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => {
      return {
        zIndex: 0,
        x: direction < 0 ? 1000 : -1000,
        opacity: 0
      }
    }
  }

  const swipeConfidenceThreshold = 10000
  const swipePower = (offset, velocity) => {
    return Math.abs(offset) * velocity
  }

  return (
    <section className="introduction-section">
      <div className="introduction-container">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x)

              if (swipe < -swipeConfidenceThreshold) {
                paginate(1)
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1)
              }
            }}
            className="slide-wrapper"
          >
            {/* Left Content */}
            <div className="introduction-content">
              <div className="content-wrapper">
                <span className="intro-label">{currentType.label}</span>
                <h2 className="intro-title">
                  {currentType.title}
                  <br />
                  <span className="intro-subtitle">{currentType.subtitle}</span>
                </h2>
                <p className="intro-description">
                  {currentType.description}
                </p>
              </div>
            </div>

            {/* Right Media */}
            <div className="introduction-media">
              <div className="media-container">
                <img 
                  src={currentType.image} 
                  alt={`${currentType.title} - Nghệ thuật truyền thống Việt Nam`} 
                  className="media-image"
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <button 
          className="nav-arrow nav-arrow-left" 
          onClick={() => paginate(-1)}
          aria-label="Previous"
        >
          <span>‹</span>
        </button>
        <button 
          className="nav-arrow nav-arrow-right" 
          onClick={() => paginate(1)}
          aria-label="Next"
        >
          <span>›</span>
        </button>

        {/* Pagination Dots */}
        <div className="pagination-dots">
          {tuongTypes.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => {
                const newDirection = index > currentIndex ? 1 : -1
                setPage([index, newDirection])
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Introduction

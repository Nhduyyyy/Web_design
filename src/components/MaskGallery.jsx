import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { maskData } from '../data/tuongData'
import './MaskGallery.css'

function getMaskImageUrl(imagePath) {
  if (!imagePath || imagePath.startsWith('http')) return imagePath
  const path = imagePath.normalize('NFD')
  return window.location.origin + encodeURI(path)
}

function MaskGallery({ selectedItem, setSelectedItem }) {
  const [hoveredMask, setHoveredMask] = useState(null)

  return (
    <section className="mask-gallery">
      <div className="container">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mask-gallery-title"
        >
          Bộ Sưu Tập Mặt Nạ Tuồng
        </motion.h2>
        <p className="mask-gallery-subtitle">
          Chọn mặt nạ để xem thông tin — thử đeo mặt nạ tại mục Trải nghiệm
        </p>
        <div className="mask-grid">
          {maskData.map((mask, index) => (
            <motion.button
              type="button"
              key={mask.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(index * 0.05, 0.3) }}
              className={`mask-card ${selectedItem?.id === mask.id ? 'selected' : ''}`}
              onMouseEnter={() => setHoveredMask(mask.id)}
              onMouseLeave={() => setHoveredMask(null)}
              onClick={() => setSelectedItem(mask)}
              whileHover={{ y: -6 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="mask-card-preview">
                {mask.imagePath ? (
                  <img src={getMaskImageUrl(mask.imagePath)} alt={mask.name} loading="lazy" />
                ) : (
                  <span className="mask-card-emoji">{mask.emoji}</span>
                )}
              </div>
              <h3 className="mask-card-name">{mask.name}</h3>
              <p className="mask-card-desc">{mask.description}</p>
              <AnimatePresence>
                {hoveredMask === mask.id && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mask-card-hint"
                  >
                    Xem chi tiết
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default MaskGallery




import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { maskData } from '../data/tuongData'
import './MaskGallery.css'

function MaskGallery({ selectedItem, setSelectedItem }) {
  const [hoveredMask, setHoveredMask] = useState(null)

  return (
    <section className="mask-gallery">
      <div className="container">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-title"
        >
          Bộ Sưu Tập Mặt Nạ Tuồng
        </motion.h2>
        <p className="section-subtitle">
          Click vào mặt nạ để khám phá ý nghĩa và lịch sử
        </p>
        
        <div className="mask-grid">
          {maskData.map((mask, index) => (
            <motion.div
              key={mask.id}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`mask-card ${selectedItem?.id === mask.id ? 'selected' : ''}`}
              onHoverStart={() => setHoveredMask(mask.id)}
              onHoverEnd={() => setHoveredMask(null)}
              onClick={() => setSelectedItem(mask)}
              whileHover={{ y: -10, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div 
                className="mask-icon-large"
                style={{ 
                  backgroundColor: mask.color + '20',
                  borderColor: mask.color
                }}
              >
                <span style={{ fontSize: '4rem' }}>{mask.emoji}</span>
              </div>
              <h3 className="mask-name">{mask.name}</h3>
              <p className="mask-description">{mask.description}</p>
              
              <AnimatePresence>
                {hoveredMask === mask.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mask-hover-info"
                  >
                    <p className="hover-text">Click để tìm hiểu thêm →</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default MaskGallery




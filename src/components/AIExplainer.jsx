import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { maskData, characterData } from '../data/tuongData'
import './AIExplainer.css'

function AIExplainer({ selectedItem }) {
  const [isTyping, setIsTyping] = useState(false)
  const [displayedText, setDisplayedText] = useState('')
  const [currentItem, setCurrentItem] = useState(selectedItem || maskData[0])

  useEffect(() => {
    if (selectedItem) {
      setCurrentItem(selectedItem)
    }
  }, [selectedItem])

  useEffect(() => {
    if (currentItem) {
      setIsTyping(true)
      setDisplayedText('')
      const fullText = generateExplanation(currentItem)
      let index = 0
      
      const typingInterval = setInterval(() => {
        if (index < fullText.length) {
          setDisplayedText(fullText.slice(0, index + 1))
          index++
        } else {
          setIsTyping(false)
          clearInterval(typingInterval)
        }
      }, 30)

      return () => clearInterval(typingInterval)
    }
  }, [currentItem])

  const generateExplanation = (item) => {
    if (item.details) {
      // It's a mask
      return `🎭 ${item.name}\n\n` +
             `📖 Ý Nghĩa: ${item.details.meaning}\n\n` +
             `📚 Lịch Sử: ${item.details.history}\n\n` +
             `🎪 Vai Trò: ${item.details.role}\n\n` +
             `✨ Đặc Điểm: ${item.details.characteristics}`
    } else {
      // It's a character
      return `👤 ${item.name} - ${item.type}\n\n` +
             `🎭 Vai Trò: ${item.role}\n\n` +
             `👗 Trang Phục:\n` +
             `   - Màu sắc: ${item.costume.color}\n` +
             `   - Mô tả: ${item.costume.description}\n` +
             `   - Ý nghĩa: ${item.costume.meaning}\n\n` +
             `📖 Câu Chuyện: ${item.story}`
    }
  }

  return (
    <div className="ai-explainer">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="explainer-header"
        >
          <h2 className="section-title">
            <span className="ai-icon">🤖</span> AI Giải Thích
          </h2>
          <p className="section-subtitle">
            Tìm hiểu chi tiết về từng yếu tố của Tuồng
          </p>
        </motion.div>

        <div className="explainer-content">
          <div className="item-selector">
            <h3>Chọn để khám phá:</h3>
            <div className="selector-buttons">
              <button 
                className="selector-tab"
                onClick={() => setCurrentItem(maskData[0])}
              >
                Mặt Nạ
              </button>
              <button 
                className="selector-tab"
                onClick={() => setCurrentItem(characterData[0])}
              >
                Nhân Vật
              </button>
            </div>
          </div>

          <motion.div
            key={currentItem?.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="explanation-card"
          >
            <div className="item-display">
              <div className="item-icon-large">
                <span style={{ fontSize: '6rem' }}>
                  {currentItem?.emoji || '🎭'}
                </span>
              </div>
              <h3 className="item-title">{currentItem?.name}</h3>
            </div>

            <div className="explanation-text">
              <div className="ai-message">
                <div className="ai-avatar">🤖</div>
                <div className="message-content">
                  <AnimatePresence mode="wait">
                    <motion.pre
                      key={displayedText}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="explanation-pre"
                    >
                      {displayedText}
                      {isTyping && <span className="cursor">|</span>}
                    </motion.pre>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {currentItem?.details && (
              <div className="quick-facts">
                <h4>Thông Tin Nhanh</h4>
                <div className="facts-grid">
                  <div className="fact-item">
                    <span className="fact-icon">🎨</span>
                    <span className="fact-label">Màu sắc</span>
                    <span className="fact-value" style={{ color: currentItem.color }}>
                      {currentItem.color}
                    </span>
                  </div>
                  <div className="fact-item">
                    <span className="fact-icon">📅</span>
                    <span className="fact-label">Thời kỳ</span>
                    <span className="fact-value">Thế kỷ 17-19</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          <div className="item-list">
            <h4>Khám phá thêm:</h4>
            <div className="item-mini-grid">
              {(currentItem?.details ? maskData : characterData).slice(0, 3).map((item) => (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="mini-item"
                  onClick={() => setCurrentItem(item)}
                >
                  <span style={{ fontSize: '2rem' }}>{item.emoji}</span>
                  <span>{item.name}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIExplainer




import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { maskData, characterData, glossaryData } from '../data/tuongData'
import './AIExplainer.css'

const TAB_MASK = 'mask'
const TAB_CHARACTER = 'character'
const TAB_GLOSSARY = 'glossary'

function AIExplainer({ selectedItem }) {
  const [activeTab, setActiveTab] = useState(TAB_MASK)
  const [isTyping, setIsTyping] = useState(false)
  const [displayedText, setDisplayedText] = useState('')
  const [currentItem, setCurrentItem] = useState(selectedItem || maskData[0])
  const [currentGlossary, setCurrentGlossary] = useState(glossaryData[0])

  useEffect(() => {
    if (selectedItem) {
      setCurrentItem(selectedItem)
      setActiveTab(selectedItem.details ? TAB_MASK : TAB_CHARACTER)
    }
  }, [selectedItem])

  useEffect(() => {
    setDisplayedText('')
    if (activeTab === TAB_GLOSSARY && currentGlossary) {
      setIsTyping(true)
      const fullText = `📖 ${currentGlossary.term}\n\n${currentGlossary.definition}`
      let index = 0
      const typingInterval = setInterval(() => {
        if (index < fullText.length) {
          setDisplayedText(fullText.slice(0, index + 1))
          index++
        } else {
          setIsTyping(false)
          clearInterval(typingInterval)
        }
      }, 25)
      return () => clearInterval(typingInterval)
    }
    if ((activeTab === TAB_MASK || activeTab === TAB_CHARACTER) && currentItem) {
      setIsTyping(true)
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
  }, [currentItem, activeTab, currentGlossary])

  const generateExplanation = (item) => {
    if (!item) return ''
    if (item.details && item.details.meaning) {
      return `🎭 ${item.name}\n\n` +
             `📖 Ý Nghĩa: ${item.details.meaning}\n\n` +
             `📚 Lịch Sử: ${item.details.history}\n\n` +
             `🎪 Vai Trò: ${item.details.role}\n\n` +
             `✨ Đặc Điểm: ${item.details.characteristics}`
    }
    if (item.costume) {
      return `👤 ${item.name} - ${item.type}\n\n` +
             `🎭 Vai Trò: ${item.role}\n\n` +
             `👗 Trang Phục:\n` +
             `   - Màu sắc: ${item.costume.color}\n` +
             `   - Mô tả: ${item.costume.description}\n` +
             `   - Ý nghĩa: ${item.costume.meaning}\n\n` +
             `📖 Câu Chuyện: ${item.story}`
    }
    return ''
  }

  const getListForTab = () => {
    if (activeTab === TAB_MASK) return maskData
    if (activeTab === TAB_CHARACTER) return characterData
    return glossaryData
  }

  const handleSelect = (item) => {
    if (activeTab === TAB_GLOSSARY) setCurrentGlossary(item)
    else setCurrentItem(item)
  }

  const getCurrentDisplay = () => {
    if (activeTab === TAB_GLOSSARY) {
      return { emoji: currentGlossary?.emoji, name: currentGlossary?.term }
    }
    return { emoji: currentItem?.emoji || '🎭', name: currentItem?.name }
  }

  const showQuickFacts = activeTab === TAB_MASK && currentItem?.details

  return (
    <div className="ai-explainer">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="explainer-header"
        >
          <h2 className="section-title">
            <span className="ai-icon">🤖</span> Khám Phá Tuồng
          </h2>
          <p className="section-subtitle">
            Tìm hiểu mặt nạ, nhân vật và thuật ngữ Tuồng
          </p>
        </motion.div>

        <div className="explainer-content">
          <div className="item-selector">
            <h3>Chọn chủ đề:</h3>
            <div className="selector-buttons">
              <button
                className={`selector-tab ${activeTab === TAB_MASK ? 'active' : ''}`}
                onClick={() => { setActiveTab(TAB_MASK); setCurrentItem(maskData[0]) }}
              >
                🎭 Mặt Nạ
              </button>
              <button
                className={`selector-tab ${activeTab === TAB_CHARACTER ? 'active' : ''}`}
                onClick={() => { setActiveTab(TAB_CHARACTER); setCurrentItem(characterData[0]) }}
              >
                👤 Nhân Vật
              </button>
              <button
                className={`selector-tab ${activeTab === TAB_GLOSSARY ? 'active' : ''}`}
                onClick={() => { setActiveTab(TAB_GLOSSARY); setCurrentGlossary(glossaryData[0]) }}
              >
                📖 Thuật Ngữ
              </button>
            </div>
          </div>

          <motion.div
            key={activeTab === TAB_GLOSSARY ? currentGlossary?.id : currentItem?.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="explanation-card"
          >
            <div className="item-display">
              <div className="item-icon-large">
                <span style={{ fontSize: '5rem' }}>{getCurrentDisplay().emoji}</span>
              </div>
              <h3 className="item-title">{getCurrentDisplay().name}</h3>
            </div>

            <div className="explanation-text">
              <div className="ai-message">
                <div className="ai-avatar">🤖</div>
                <div className="message-content">
                  <AnimatePresence mode="wait">
                    <motion.pre
                      key={displayedText.slice(0, 20)}
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

            {showQuickFacts && (
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
            <h4>Khám phá thêm — {activeTab === TAB_MASK ? 'Mặt nạ' : activeTab === TAB_CHARACTER ? 'Nhân vật' : 'Thuật ngữ'}:</h4>
            <div className="item-mini-grid">
              {getListForTab().map((item) => (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`mini-item ${(activeTab === TAB_GLOSSARY ? currentGlossary?.id === item.id : currentItem?.id === item.id) ? 'selected' : ''}`}
                  onClick={() => handleSelect(item)}
                >
                  <span style={{ fontSize: '1.8rem' }}>{item.emoji}</span>
                  <span>{item.name || item.term}</span>
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




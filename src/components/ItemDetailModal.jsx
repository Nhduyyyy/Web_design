import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './ItemDetailModal.css'

/** Map item + type → { headerLabel, emoji, title, description, grid, aiSuggestion } */
function getModalContent(item, type) {
  if (!item) return null

  if (type === 'prop') {
    const d = item.details || {}
    return {
      headerLabel: 'Thông Tin Đạo Cụ',
      emoji: item.emoji || '🗡️',
      title: item.name,
      description: item.description || '',
      grid: [
        { icon: 'construction', label: 'Chất liệu', value: d.material || '—' },
        { icon: 'military_tech', label: 'Ý nghĩa', value: d.meaning || '—' },
        { icon: 'history_edu', label: 'Lịch sử', value: d.history || '—' },
        { icon: 'front_hand', label: 'Cách sử dụng', value: d.usage || '—' }
      ],
      aiSuggestion: item.aiSuggestion || `Trong các vở diễn kinh điển, ${item.name} là đạo cụ mang ý nghĩa biểu tượng sâu sắc. Bạn có thể tìm hiểu thêm về nhân vật và vở Tuồng liên quan.`
    }
  }

  if (type === 'mask') {
    const d = item.details || {}
    return {
      headerLabel: 'Thông Tin Mặt Nạ',
      emoji: item.emoji || '🎭',
      title: item.name,
      description: item.description || '',
      grid: [
        { icon: 'psychology', label: 'Ý nghĩa', value: d.meaning || '—' },
        { icon: 'history_edu', label: 'Lịch sử', value: d.history || '—' },
        { icon: 'theater_comedy', label: 'Vai trò', value: d.role || '—' },
        { icon: 'palette', label: 'Đặc trưng', value: d.characteristics || '—' }
      ],
      aiSuggestion: item.aiSuggestion || `Mặt nạ ${item.name} là một phần quan trọng của nghệ thuật Tuồng. Bạn có thể thử đeo mặt nạ tại mục Trải nghiệm AR.`
    }
  }

  if (type === 'character') {
    const costume = item.costume || {}
    return {
      headerLabel: 'Thông Tin Nhân Vật',
      emoji: item.emoji || '⚔️',
      title: item.name,
      description: item.story || item.role || '',
      grid: [
        { icon: 'checkroom', label: 'Trang phục', value: [costume.color, costume.description].filter(Boolean).join(' — ') || '—' },
        { icon: 'military_tech', label: 'Ý nghĩa trang phục', value: costume.meaning || '—' },
        { icon: 'theater_comedy', label: 'Vai diễn', value: item.role || '—' },
        { icon: 'menu_book', label: 'Câu chuyện', value: item.story || '—' }
      ],
      aiSuggestion: item.aiSuggestion || `Nhân vật ${item.name} là một trong những hình tượng nổi bật của Tuồng. Bạn có thể khám phá thêm đạo cụ và cảnh diễn liên quan.`
    }
  }

  return null
}

function ItemDetailModal({ item, type = 'prop', onClose }) {
  const [exiting, setExiting] = useState(false)
  const content = getModalContent(item, type)

  const handleClose = () => setExiting(true)

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  useEffect(() => {
    if (!item) setExiting(false)
  }, [item])

  if (!content) return null

  return (
    <AnimatePresence onExitComplete={onClose}>
      {!exiting && (
      <>
      <motion.div
        key="item-detail-overlay"
        className="item-detail-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      />
      <motion.div
        key="item-detail-modal"
        className="item-detail-modal"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="item-detail-modal-header">
          <div className="item-detail-modal-header-left">
            <div className="item-detail-modal-icon-wrap">
              <svg className="item-detail-modal-shield" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.57829 8.57829C5.52816 11.6284 3.451 15.5145 2.60947 19.7452C1.76794 23.9758 2.19984 28.361 3.85056 32.3462C5.50128 36.3314 8.29667 39.7376 11.8832 42.134C15.4698 44.5305 19.6865 45.8096 24 45.8096C28.3135 45.8096 32.5302 44.5305 36.1168 42.134C39.7033 39.7375 42.4987 36.3314 44.1494 32.3462C45.8002 28.361 46.2321 23.9758 45.3905 19.7452C44.549 15.5145 42.4718 11.6284 39.4217 8.57829L24 24L8.57829 8.57829Z" fill="currentColor" />
              </svg>
            </div>
            <span className="item-detail-modal-header-label">{content.headerLabel}</span>
          </div>
          <button type="button" className="item-detail-modal-close" onClick={handleClose} aria-label="Đóng">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="item-detail-modal-body">
          <div className="item-detail-modal-hero">
            <div className="item-detail-modal-hero-emoji">{content.emoji}</div>
            <h1 className="item-detail-modal-title">{content.title}</h1>
            <p className="item-detail-modal-desc">{content.description}</p>
          </div>

          <div className="item-detail-modal-grid">
            {content.grid.map((row) => (
              <div key={row.label} className="item-detail-modal-card">
                <div className="item-detail-modal-card-icon">
                  <span className="material-symbols-outlined">{row.icon}</span>
                </div>
                <div className="item-detail-modal-card-content">
                  <h2 className="item-detail-modal-card-label">{row.label}</h2>
                  <p className="item-detail-modal-card-value">{row.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="item-detail-modal-ai-wrap">
            <div className="item-detail-modal-ai">
              <div className="item-detail-modal-ai-head">
                <span className="material-symbols-outlined item-detail-modal-ai-icon">auto_awesome</span>
                <p className="item-detail-modal-ai-title">Gợi ý AI</p>
              </div>
              <p className="item-detail-modal-ai-text">"{content.aiSuggestion}"</p>
              <button type="button" className="item-detail-modal-ai-btn">Tìm hiểu thêm</button>
            </div>
          </div>
        </div>

        <footer className="item-detail-modal-footer">
          <button type="button" className="item-detail-modal-btn-close" onClick={handleClose}>
            Đóng
          </button>
        </footer>
      </motion.div>
      </>
      )}
    </AnimatePresence>
  )
}

export default ItemDetailModal

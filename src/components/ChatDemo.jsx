import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { glossaryData, maskData, characterData } from '../data/tuongData'
import './ChatDemo.css'

const BOT_NAME = 'Trợ lý Tuồng'
const PLACEHOLDER = 'Hỏi về mặt nạ, nhân vật, thuật ngữ Tuồng...'

function getDemoReply(userText) {
  const q = (userText || '').toLowerCase().trim()
  if (!q) return 'Bạn muốn hỏi gì về Tuồng? Thử hỏi "Tuồng là gì?", "Mặt nạ Tuồng", "Quan văn", "Đào võ"...'

  // Thuật ngữ (glossary)
  for (const g of glossaryData) {
    if (q.includes(g.term.toLowerCase()) || q.includes(g.id.replace(/-/g, ' '))) {
      return `${g.emoji} **${g.term}**: ${g.definition}`
    }
  }

  // Mặt nạ
  for (const m of maskData) {
    if (q.includes(m.name.toLowerCase())) {
      const d = m.details || {}
      return `🎭 **${m.name}**: ${m.description}\n\n📖 Ý nghĩa: ${d.meaning || '—'}\n📚 Lịch sử: ${d.history || '—'}\n🎪 Vai trò: ${d.role || '—'}`
    }
  }

  // Nhân vật
  for (const c of characterData) {
    if (q.includes(c.name.toLowerCase())) {
      const costume = c.costume || {}
      return `👤 **${c.name}** (${c.type})\n${c.role}\n\n👗 Trang phục: ${costume.color} — ${costume.description || ''}\n\n📖 ${c.story || ''}`
    }
  }

  // Gợi ý theo từ khóa
  if (q.includes('tuồng') && (q.includes('là gì') || q.includes('la gi') || q.length < 15)) {
    const g = glossaryData.find(x => x.id === 'tuong')
    return g ? `${g.emoji} **${g.term}**: ${g.definition}` : getDemoReply('tuong')
  }
  if (q.includes('mặt nạ') || q.includes('mat na')) {
    const g = glossaryData.find(x => x.id === 'mat-na')
    return g ? `${g.emoji} **${g.term}**: ${g.definition}` : 'Mặt nạ Tuồng là đạo cụ đặc trưng để hóa thân nhân vật. Bạn có thể thử đeo mặt nạ tại mục **Trải nghiệm** (trong app).'
  }
  if (q.includes('đào') || q.includes('kép') || q.includes('tướng') || q.includes('nịnh') || q.includes('lão') || q.includes('mụ')) {
    return 'Trong Tuồng có các mô hình nhân vật: Đào (nữ), Kép (nam trẻ), Tướng, Nịnh, Lão, Mụ... Bạn vào mục **Học tập** để xem chi tiết từng loại nhân vật.'
  }

  return `Tôi chưa có thông tin chi tiết cho câu hỏi này. Bạn thử hỏi:\n• "Tuồng là gì?"\n• "Mặt nạ Tuồng"\n• "Quan văn", "Quan võ", "Hề"\n• Tên mặt nạ: Bác Vương, Bình Vương, Cáp Tô Văn...\n• Nhân vật: Quan Công, Thị Kính, Lưu Bị`
}

function formatMessage(text) {
  if (!text) return ''
  return text
    .split(/\n/g)
    .map((line) => {
      const bold = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      return bold
    })
    .join('<br/>')
}

export default function ChatDemo() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Chào bạn! Tôi là **${BOT_NAME}** — demo trả lời câu hỏi về Tuồng (mặt nạ, nhân vật, thuật ngữ). Thử hỏi "Tuồng là gì?" hoặc "Quan võ", "Mặt nạ Tuồng"...`,
      id: 'welcome',
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, isTyping])

  const sendMessage = () => {
    const text = input.trim()
    if (!text) return

    const userMsg = { role: 'user', content: text, id: `u-${Date.now()}` }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const reply = getDemoReply(text)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: reply, id: `a-${Date.now()}` },
      ])
      setIsTyping(false)
    }, 600 + Math.min(text.length * 20, 800))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="chat-demo-wrap">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chat-demo-panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            <header className="chat-demo-header">
              <span className="chat-demo-header-icon">🎭</span>
              <div className="chat-demo-header-text">
                <h3 className="chat-demo-title">{BOT_NAME}</h3>
                <span className="chat-demo-subtitle">Demo · Hỏi đáp về Tuồng</span>
              </div>
              <button
                type="button"
                className="chat-demo-close"
                onClick={() => setIsOpen(false)}
                aria-label="Đóng chat"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <div className="chat-demo-messages" ref={listRef}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-demo-msg chat-demo-msg--${msg.role}`}
                >
                  {msg.role === 'assistant' && (
                    <span className="chat-demo-avatar">🎭</span>
                  )}
                  <div
                    className="chat-demo-bubble"
                    dangerouslySetInnerHTML={{
                      __html: formatMessage(msg.content),
                    }}
                  />
                </div>
              ))}
              {isTyping && (
                <div className="chat-demo-msg chat-demo-msg--assistant">
                  <span className="chat-demo-avatar">🎭</span>
                  <div className="chat-demo-typing">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
            </div>

            <div className="chat-demo-input-wrap">
              <input
                type="text"
                className="chat-demo-input"
                placeholder={PLACEHOLDER}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
              />
              <button
                type="button"
                className="chat-demo-send"
                onClick={sendMessage}
                disabled={!input.trim() || isTyping}
                aria-label="Gửi"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        className="chat-demo-toggle"
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? 'Đóng chat' : 'Mở chat'}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <span className="material-symbols-outlined">close</span>
        ) : (
          <span className="material-symbols-outlined">forum</span>
        )}
      </motion.button>
    </div>
  )
}

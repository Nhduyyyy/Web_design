import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import StreamPlayer from './StreamPlayer'
import { liveStreams, replays, getLiveStreams, getReplaysByType, formatDuration } from '../data/streamData'
import { formatPrice, processPayment, generateBookingId } from '../utils/booking'
import { validateStreamAccess, validateReplayAccess, validatePayment } from '../utils/validation'
import './LiveStream.css'

const REPLAY_TYPES = [
  { id: 'all', label: 'Tất cả', icon: '📺' },
  { id: 'free', label: 'Miễn phí', icon: '🆓' },
  { id: 'paid', label: 'Trả phí', icon: '💰' },
  { id: 'ad-supported', label: 'Có quảng cáo', icon: '📢' }
]

export default function LiveStream() {
  const [selectedStream, setSelectedStream] = useState(null)
  const [replayFilter, setReplayFilter] = useState('all')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentReplay, setPaymentReplay] = useState(null)

  const activeLiveStreams = useMemo(() => getLiveStreams(), [])
  const filteredReplays = useMemo(() => getReplaysByType(replayFilter), [replayFilter])

  const [streamError, setStreamError] = useState(null)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [paymentResult, setPaymentResult] = useState(null)

  const handleWatchLive = (stream) => {
    // Validate stream access
    const validation = validateStreamAccess(stream, !stream.isFree)
    if (!validation.valid) {
      if (validation.requiresPayment) {
        // Handle paid live stream payment
        setPaymentReplay({ ...stream, type: 'live', accessType: 'paid', price: stream.price })
        setShowPaymentModal(true)
        return
      }
      setStreamError(validation.error)
      setTimeout(() => setStreamError(null), 5000)
      return
    }
    
    setSelectedStream({ ...stream, type: 'live' })
  }

  const handleWatchReplay = (replay) => {
    // Validate replay access
    const validation = validateReplayAccess(replay, false) // Assume user hasn't paid yet
    if (!validation.valid) {
      if (validation.requiresPayment) {
        setPaymentReplay(replay)
        setShowPaymentModal(true)
        return
      }
      setStreamError(validation.error)
      setTimeout(() => setStreamError(null), 5000)
      return
    }
    
    setSelectedStream({ ...replay, type: 'replay' })
  }

  const handlePaymentSuccess = async () => {
    if (!paymentReplay) return
    
    // Validate payment
    const paymentValidation = validatePayment('wallet', paymentReplay.price)
    if (!paymentValidation.valid) {
      setPaymentResult({
        success: false,
        message: Object.values(paymentValidation.errors)[0]
      })
      return
    }
    
    setPaymentProcessing(true)
    
    // Process payment
    const bookingId = generateBookingId()
    const result = await processPayment('wallet', paymentReplay.price, bookingId)
    setPaymentResult(result)
    
    if (result.success) {
      // Grant access after successful payment
      setSelectedStream({ ...paymentReplay, type: paymentReplay.type || 'replay' })
      setShowPaymentModal(false)
      setPaymentReplay(null)
      setPaymentResult(null)
    }
    
    setPaymentProcessing(false)
  }

  const handleClosePlayer = () => {
    setSelectedStream(null)
  }

  if (selectedStream) {
    return (
      <StreamPlayer
        stream={selectedStream}
        onClose={handleClosePlayer}
      />
    )
  }

  return (
    <div className="live-stream-page">
      <div className="container">
        {/* Live Streams Section */}
        <section className="live-streams-section">
          <div className="section-header">
            <h2>📡 Live Stream</h2>
            <p className="section-description">
              Xem trực tiếp các buổi diễn Tuồng đang diễn ra hoặc sắp diễn ra
            </p>
          </div>

          {streamError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="stream-error"
              style={{
                background: '#fff1f2',
                border: '2px solid #f44336',
                color: '#c62828',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                fontWeight: 600
              }}
            >
              ⚠️ {streamError}
            </motion.div>
          )}

          {activeLiveStreams.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📺</div>
              <p>Hiện tại không có live stream nào đang diễn ra</p>
              <p className="empty-subtitle">Vui lòng quay lại sau hoặc xem các replay bên dưới</p>
            </div>
          ) : (
            <div className="streams-grid">
              {activeLiveStreams.map((stream) => (
                <motion.div
                  key={stream.id}
                  className={`stream-card ${stream.status}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  onClick={() => handleWatchLive(stream)}
                >
                  <div className="stream-thumbnail">
                    <img src={stream.thumbnail} alt={stream.title} />
                    {stream.status === 'live' && (
                      <div className="live-badge">
                        <span className="live-dot"></span>
                        ĐANG PHÁT TRỰC TIẾP
                      </div>
                    )}
                    {stream.status === 'upcoming' && (
                      <div className="upcoming-badge">
                        SẮP PHÁT SÓNG
                      </div>
                    )}
                    {!stream.isFree && (
                      <div className="price-badge">
                        {formatPrice(stream.price)}
                      </div>
                    )}
                  </div>
                  <div className="stream-info">
                    <h3>{stream.title}</h3>
                    <p className="stream-description">{stream.description}</p>
                    <div className="stream-meta">
                      <div className="meta-item">
                        <span className="meta-icon">👥</span>
                        <span>{stream.viewers.toLocaleString()} người xem</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-icon">🏢</span>
                        <span>{stream.partner}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-icon">🕐</span>
                        <span>{new Date(stream.startTime).toLocaleString('vi-VN')}</span>
                      </div>
                    </div>
                    <div className="stream-actions">
                      {stream.status === 'live' && (
                        <button className="btn-watch-live">
                          ▶️ Xem ngay
                        </button>
                      )}
                      {stream.status === 'upcoming' && (
                        <button className="btn-watch-upcoming" disabled>
                          ⏰ Sắp phát sóng
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Replays Section */}
        <section className="replays-section">
          <div className="section-header">
            <h2>📼 Replay</h2>
            <p className="section-description">
              Xem lại các buổi diễn đã qua - miễn phí, trả phí hoặc với quảng cáo
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="replay-filters">
            {REPLAY_TYPES.map((type) => (
              <button
                key={type.id}
                className={`filter-tab ${replayFilter === type.id ? 'active' : ''}`}
                onClick={() => setReplayFilter(type.id)}
              >
                <span className="filter-icon">{type.icon}</span>
                <span className="filter-label">{type.label}</span>
              </button>
            ))}
          </div>

          {filteredReplays.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📺</div>
              <p>Không có replay nào trong danh mục này</p>
            </div>
          ) : (
            <div className="replays-grid">
              {filteredReplays.map((replay) => (
                <motion.div
                  key={replay.id}
                  className="replay-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                >
                  <div className="replay-thumbnail">
                    <img src={replay.thumbnail} alt={replay.title} />
                    <div className="replay-overlay">
                      <div className="play-button">▶️</div>
                    </div>
                    {replay.accessType === 'paid' && (
                      <div className="price-badge">
                        {formatPrice(replay.price)}
                      </div>
                    )}
                    {replay.accessType === 'ad-supported' && (
                      <div className="ad-badge">
                        📢 Có quảng cáo
                      </div>
                    )}
                    {replay.accessType === 'free' && (
                      <div className="free-badge">
                        🆓 Miễn phí
                      </div>
                    )}
                  </div>
                  <div className="replay-info">
                    <h3>{replay.title}</h3>
                    <p className="replay-description">{replay.description}</p>
                    <div className="replay-meta">
                      <div className="meta-item">
                        <span className="meta-icon">⏱️</span>
                        <span>{formatDuration(replay.duration)}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-icon">👁️</span>
                        <span>{replay.views.toLocaleString()} lượt xem</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-icon">📅</span>
                        <span>{new Date(replay.originalDate).toLocaleDateString('vi-VN')}</span>
                      </div>
                      {replay.accessType === 'ad-supported' && (
                        <div className="meta-item">
                          <span className="meta-icon">📢</span>
                          <span>{replay.adCount} quảng cáo</span>
                        </div>
                      )}
                    </div>
                    <button
                      className={`btn-watch-replay ${replay.accessType}`}
                      onClick={() => handleWatchReplay(replay)}
                    >
                      {replay.accessType === 'paid' && '💰 Mua và xem'}
                      {replay.accessType === 'ad-supported' && '📢 Xem với quảng cáo'}
                      {replay.accessType === 'free' && '▶️ Xem miễn phí'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Payment Modal for Paid Replays */}
      {showPaymentModal && paymentReplay && (
        <div className="payment-modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <motion.div
            className="payment-modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setShowPaymentModal(false)}>✕</button>
            <h3>Mua Replay</h3>
            <div className="payment-content">
              <div className="replay-preview">
                <img src={paymentReplay.thumbnail} alt={paymentReplay.title} />
                <h4>{paymentReplay.title}</h4>
                <p>{paymentReplay.description}</p>
                <div className="payment-summary">
                  <div className="summary-row">
                    <span>Giá:</span>
                    <span className="price">{formatPrice(paymentReplay.price)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Thời lượng:</span>
                    <span>{formatDuration(paymentReplay.duration)}</span>
                  </div>
                </div>
              </div>
              <AnimatePresence>
                {paymentResult && !paymentResult.success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="payment-error"
                    style={{
                      background: '#fff1f2',
                      border: '2px solid #f44336',
                      color: '#c62828',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      marginBottom: '1rem'
                    }}
                  >
                    ⚠️ {paymentResult.message}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="payment-actions">
                <button 
                  className="btn-secondary" 
                  onClick={() => {
                    setShowPaymentModal(false)
                    setPaymentReplay(null)
                    setPaymentResult(null)
                  }}
                  disabled={paymentProcessing}
                >
                  Hủy
                </button>
                <button
                  className="btn-primary"
                  onClick={handlePaymentSuccess}
                  disabled={paymentProcessing}
                >
                  {paymentProcessing ? (
                    <>
                      <span className="spinner"></span>
                      Đang xử lý...
                    </>
                  ) : (
                    `Thanh toán ${formatPrice(paymentReplay.price)}`
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

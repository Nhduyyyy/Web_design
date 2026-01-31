import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import StreamPlayer from './StreamPlayer'
import { liveStreams, replays, getLiveStreams, getReplaysByType, formatDuration } from '../data/streamData'
import { formatPrice, processPayment, generateBookingId } from '../utils/booking'
import { validateStreamAccess, validateReplayAccess, validatePayment } from '../utils/validation'
import './LiveStream.css'

const REPLAY_TYPES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'free', label: 'Miễn phí' },
  { id: 'paid', label: 'Trả phí' },
  { id: 'ad-supported', label: 'Có quảng cáo' }
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
          <header className="ls-header">
            <h1 className="ls-header-title">Live Stream</h1>
            <p className="ls-header-desc">
              Trải nghiệm nghệ thuật Tuồng cổ truyền qua những buổi phát sóng trực tiếp chất lượng cao.
            </p>
          </header>

          {streamError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="stream-error"
            >
              {streamError}
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
                  whileHover={{ y: -4 }}
                  onClick={() => handleWatchLive(stream)}
                >
                  <div className="stream-thumbnail cinematic-gradient">
                    <img src={stream.thumbnail} alt={stream.title} />
                    {stream.status === 'live' && (
                      <div className="live-badge">
                        <span className="live-dot" />
                        ĐANG PHÁT TRỰC TIẾP
                      </div>
                    )}
                    {stream.status === 'upcoming' && (
                      <div className="upcoming-badge">SẮP PHÁT SÓNG</div>
                    )}
                    {!stream.isFree && (
                      <div className="price-badge">{formatPrice(stream.price)}</div>
                    )}
                  </div>
                  <div className="stream-info">
                    <h3>{stream.title}</h3>
                    <p className="stream-description">{stream.description}</p>
                    <div className="stream-meta">
                      <div className="meta-item">
                        <span className="meta-icon" aria-hidden />
                        <span>{stream.status === 'live' ? `${stream.viewers.toLocaleString()} người đang xem` : 'Chưa bắt đầu'}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-icon" aria-hidden />
                        <span>{stream.partner}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-icon" aria-hidden />
                        <span>{new Date(stream.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • {new Date(stream.startTime).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                    {stream.status === 'live' && (
                      <button type="button" className="btn-watch-live">Xem ngay</button>
                    )}
                    {stream.status === 'upcoming' && (
                      <button type="button" className="btn-watch-upcoming">Đặt lịch nhắc</button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Replays Section */}
        <section className="replays-section">
          <header className="ls-header">
            <h2 className="ls-header-title">Replay</h2>
            <p className="ls-header-desc">Xem lại các buổi diễn đã qua - miễn phí, trả phí hoặc với quảng cáo</p>
          </header>

          <div className="replay-filters">
            {REPLAY_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                className={`filter-tab ${replayFilter === type.id ? 'active' : ''}`}
                onClick={() => setReplayFilter(type.id)}
              >
                {type.label}
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
                  whileHover={{ y: -4 }}
                >
                  <div className="replay-thumbnail">
                    <img src={replay.thumbnail} alt={replay.title} />
                    <div className="replay-overlay">
                      <div className="play-button" aria-hidden>▶</div>
                    </div>
                    {replay.accessType === 'paid' && (
                      <div className="price-badge">{formatPrice(replay.price)}</div>
                    )}
                    {replay.accessType === 'ad-supported' && (
                      <div className="ad-badge">CÓ QUẢNG CÁO</div>
                    )}
                    {replay.accessType === 'free' && (
                      <div className="free-badge">MIỄN PHÍ</div>
                    )}
                  </div>
                  <div className="replay-info">
                    <h3>{replay.title}</h3>
                    <p className="replay-description">{replay.description}</p>
                    <div className="replay-meta">
                      <div className="meta-item">
                        <span>{formatDuration(replay.duration)}</span>
                      </div>
                      <div className="meta-item">
                        <span>{replay.views.toLocaleString()} lượt xem</span>
                      </div>
                      <div className="meta-item">
                        <span>{new Date(replay.originalDate).toLocaleDateString('vi-VN')}</span>
                      </div>
                      {replay.accessType === 'ad-supported' && replay.adCount && (
                        <div className="meta-item">
                          <span>{replay.adCount} quảng cáo</span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className={`btn-watch-replay ${replay.accessType}`}
                      onClick={() => handleWatchReplay(replay)}
                    >
                      {replay.accessType === 'paid' && 'Mua và xem'}
                      {replay.accessType === 'ad-supported' && 'Xem với quảng cáo'}
                      {replay.accessType === 'free' && 'Xem miễn phí'}
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
                  >
                    {paymentResult.message}
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

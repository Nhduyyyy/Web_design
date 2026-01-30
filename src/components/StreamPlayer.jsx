import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import './StreamPlayer.css'

export default function StreamPlayer({ stream, onClose }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [showAd, setShowAd] = useState(false)
  const [adCountdown, setAdCountdown] = useState(0)
  const intervalRef = useRef(null)
  const adIntervalRef = useRef(null)

  const isLive = stream.type === 'live' && stream.status === 'live'
  const isReplay = stream.type === 'replay'
  const hasAds = isReplay && stream.accessType === 'ad-supported'

  // Simulate ad breaks for ad-supported replays
  useEffect(() => {
    if (hasAds && isPlaying && stream.adCount && stream.duration) {
      const adTimes = [30, stream.duration / 2, stream.duration - 60] // Ads at 30s, middle, and near end
      
      const checkAd = () => {
        const currentSeconds = Math.floor(currentTime / 100 * stream.duration)
        const shouldShowAd = adTimes.some(adTime => 
          Math.abs(currentSeconds - adTime) < 2 && !showAd
        )
        
        if (shouldShowAd) {
          setIsPlaying(false)
          setShowAd(true)
          setAdCountdown(15) // 15 second ad
        }
      }

      const interval = setInterval(checkAd, 1000)
      return () => clearInterval(interval)
    }
  }, [hasAds, isPlaying, currentTime, stream.duration, stream.adCount, showAd])

  // Handle ad countdown
  useEffect(() => {
    if (showAd && adCountdown > 0) {
      const timer = setInterval(() => {
        setAdCountdown(prev => {
          if (prev <= 1) {
            setShowAd(false)
            setIsPlaying(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [showAd, adCountdown])

  // Simulate playback progress
  useEffect(() => {
    if (isPlaying && !isLive && !showAd) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= 100) {
            setIsPlaying(false)
            return 100
          }
          return prev + 0.1
        })
      }, 100)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying, isLive, showAd])

  const handlePlayPause = () => {
    if (showAd) return
    setIsPlaying(!isPlaying)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const currentSeconds = isLive ? 0 : (stream.duration ? Math.floor(currentTime / 100 * stream.duration) : 0)
  const totalSeconds = isLive ? 0 : (stream.duration || 0)

  return (
    <div className="stream-player-container">
      <div className="stream-player-header">
        <div className="player-title">
          <h2>{stream.title}</h2>
          {isLive && (
            <div className="live-indicator">
              <span className="live-dot"></span>
              ĐANG PHÁT TRỰC TIẾP
            </div>
          )}
        </div>
        <button className="close-player" onClick={onClose}>✕</button>
      </div>

      <div className="stream-player-wrapper">
        {/* Ad Overlay */}
        {showAd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="ad-overlay"
          >
            <div className="ad-content">
              <div className="ad-label">QUẢNG CÁO</div>
              <div className="ad-placeholder">
                <div className="ad-icon">📢</div>
                <p>Quảng cáo đang phát...</p>
              </div>
              <div className="ad-countdown">
                Bỏ qua sau {adCountdown}s
              </div>
            </div>
          </motion.div>
        )}

        {/* Video Player */}
        <div className="video-player">
          <div className="video-placeholder">
            {isLive ? (
              <div className="live-stream-display">
                <div className="streaming-icon">📡</div>
                <p>Đang phát trực tiếp...</p>
                <div className="viewers-count">
                  👥 {stream.viewers?.toLocaleString() || 0} người đang xem
                </div>
              </div>
            ) : (
              <div className="replay-display">
                <div className="replay-icon">🎭</div>
                <p>{isPlaying ? 'Đang phát...' : 'Nhấn Play để xem'}</p>
                {isPlaying && stream.duration && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: stream.duration / 10 }}
                    className="progress-bar"
                  />
                )}
              </div>
            )}
          </div>

          {/* Player Controls */}
          <div className="player-controls">
            <button
              className="control-btn play-pause"
              onClick={handlePlayPause}
              disabled={showAd}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>

            {!isLive && stream.duration && (
              <>
                <div className="progress-container">
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${currentTime}%` }}
                    />
                  </div>
                  <span className="time-display">
                    {formatTime(currentSeconds)} / {formatTime(totalSeconds)}
                  </span>
                </div>
              </>
            )}

            <div className="volume-control">
              <span>🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
              />
            </div>

            <button className="control-btn fullscreen">⛶</button>
          </div>
        </div>

        {/* Stream Info Sidebar */}
        <div className="stream-info-sidebar">
          <div className="info-section">
            <h3>Thông tin</h3>
            <p className="stream-description">{stream.description}</p>
            {stream.partner && (
              <div className="info-item">
                <strong>Đối tác:</strong> {stream.partner}
              </div>
            )}
            {isReplay && (
              <>
                <div className="info-item">
                  <strong>Ngày phát sóng:</strong>{' '}
                  {new Date(stream.originalDate).toLocaleString('vi-VN')}
                </div>
                {stream.duration && (
                  <div className="info-item">
                    <strong>Thời lượng:</strong> {formatTime(stream.duration)}
                  </div>
                )}
                <div className="info-item">
                  <strong>Lượt xem:</strong> {stream.views?.toLocaleString() || 0}
                </div>
                {stream.accessType === 'ad-supported' && (
                  <div className="info-item">
                    <strong>Quảng cáo:</strong> {stream.adCount} lần
                  </div>
                )}
              </>
            )}
            {isLive && (
              <>
                <div className="info-item">
                  <strong>Bắt đầu:</strong>{' '}
                  {new Date(stream.startTime).toLocaleString('vi-VN')}
                </div>
                <div className="info-item">
                  <strong>Kết thúc:</strong>{' '}
                  {new Date(stream.endTime).toLocaleString('vi-VN')}
                </div>
                <div className="info-item">
                  <strong>Người xem:</strong> {stream.viewers?.toLocaleString() || 0}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

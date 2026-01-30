import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { maskData } from '../data/tuongData'
import FaceMaskAR from './FaceMaskAR'
import './CameraExperience.css'

// Helper: URL ảnh mặt nạ (khớp tên file NFD trên macOS)
function getMaskImageUrl(imagePath) {
  if (!imagePath || imagePath.startsWith('http')) return imagePath
  const path = imagePath.normalize('NFD')
  return window.location.origin + encodeURI(path)
}

// Ảnh nền từ public/backgrounds — nhãn theo mẫu Premium
const BACKGROUND_IMAGES = [
  { id: 0, path: null, label: 'Không nền' },
  { id: 1, path: '/backgrounds/580081de0d4e4238f2435f48b510249f.jpg', label: 'Hoàng Cung' },
  { id: 2, path: '/backgrounds/86d43775d9b7e5099c3a5bb74ddc17bd.jpg', label: 'Sơn Thủy' },
  { id: 3, path: '/backgrounds/bec029d1937648da5a7c3ac4205a7af3.jpg', label: 'Đình Làng' },
  { id: 4, path: '/backgrounds/d5ae63e2b4e5c731cd19b2564c246b26.jpg', label: 'Nền 4' },
  { id: 5, path: '/backgrounds/d8aa722a4883585459eb023c344be145.jpg', label: 'Nền 5' }
]

function CameraExperience() {
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [selectedMask, setSelectedMask] = useState(null)
  const [showMaskOverlay, setShowMaskOverlay] = useState(false)
  const [useAR, setUseAR] = useState(true)
  const [showShareHint, setShowShareHint] = useState(false)
  const [selectedBackground, setSelectedBackground] = useState(BACKGROUND_IMAGES[1]) // mặc định Nền 1 để thấy nền khi bật camera
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const arCanvasRef = useRef(null) // canvas từ FaceMaskAR để chụp ảnh khi dùng AR

  useEffect(() => {
    if (isCameraActive) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isCameraActive])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Không thể truy cập camera. Vui lòng cho phép quyền truy cập camera.')
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
  }

  const handleMaskSelect = (mask) => {
    setSelectedMask(mask)
    if (useAR) {
      setShowMaskOverlay(true)
    } else {
      setShowMaskOverlay(true)
    }
  }

  const capturePhoto = () => {
    // Khi dùng AR: canvas đã có nền + người tách nền + mặt nạ (xem trước). Chỉ cần lật và tải.
    if (useAR && selectedMask && arCanvasRef.current) {
      const source = arCanvasRef.current
      if (source.width === 0 || source.height === 0) return
      const out = document.createElement('canvas')
      out.width = source.width
      out.height = source.height
      const ctx = out.getContext('2d')
      ctx.translate(out.width, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(source, 0, 0)
      downloadImage(out.toDataURL('image/png'))
      return
    }
    // Fallback: không AR hoặc chưa có canvas AR
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      if (video.videoWidth === 0 || video.videoHeight === 0) return
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.save()
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      ctx.restore()
      if (selectedMask) {
        ctx.font = 'bold 60px Arial'
        ctx.fillStyle = selectedMask.color
        ctx.textAlign = 'center'
        ctx.fillText(selectedMask.emoji, canvas.width / 2, canvas.height / 2 - 50)
      }
      downloadImage(canvas.toDataURL('image/png'))
    }
  }

  const downloadImage = (dataUrl) => {
    const link = document.createElement('a')
    link.download = `tuong-mask-${Date.now()}.png`
    link.href = dataUrl
    link.click()
    setShowShareHint(true)
  }

  // Tự ẩn toast "Ảnh đã tải về" sau 4 giây
  useEffect(() => {
    if (!showShareHint) return
    const timer = setTimeout(() => setShowShareHint(false), 4000)
    return () => clearTimeout(timer)
  }, [showShareHint])

  return (
    <div className={`camera-experience exp-premium ${isCameraActive ? 'exp-footer-visible' : ''}`}>
      <header className="exp-header">
        <h1 className="exp-title">Thử Mặt Nạ Tuồng</h1>
        <p className="exp-lead">
          Khám phá nghệ thuật truyền thống qua công nghệ AR. Chọn mặt nạ và hòa mình vào không gian sân khấu cổ điển.
        </p>
      </header>

      <main className="exp-main">
        <div className="exp-grid">
          <div className="exp-left">
            <div className="camera-frame">
              {!isCameraActive ? (
                <div className="camera-placeholder">
                  <div className="camera-placeholder-icon">
                    <span className="material-symbols-outlined" aria-hidden>photo_camera</span>
                  </div>
                  <h3 className="camera-placeholder-title">Sân khấu của bạn</h3>
                  <p className="camera-placeholder-desc">Bật camera để bắt đầu trải nghiệm mặt nạ Tuồng</p>
                  <button
                    type="button"
                    className="gold-gradient-btn exp-btn-camera"
                    onClick={() => setIsCameraActive(true)}
                  >
                    <span className="material-symbols-outlined" aria-hidden>videocam</span>
                    Bật Camera
                  </button>
                </div>
              ) : (
                <div className="camera-viewport">
                  {useAR && selectedMask ? (
                    <FaceMaskAR
                      selectedMask={selectedMask}
                      isActive={isCameraActive}
                      captureCanvasRef={arCanvasRef}
                      backgroundImageUrl={selectedBackground?.path || null}
                    />
                  ) : (
                    <>
                      <video ref={videoRef} autoPlay playsInline muted className="stage-video" />
                      <AnimatePresence>
                        {showMaskOverlay && selectedMask && (
                          <motion.div
                            className="stage-mask-overlay"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            style={{ color: selectedMask.color }}
                          >
                            <span className="stage-mask-emoji">{selectedMask.emoji}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>
              )}
              {isCameraActive && (
                <div className="camera-live-badge">
                  <span className="camera-live-dot" />
                  <span>Live Preview</span>
                </div>
              )}
            </div>

            <div className="glass-panel exp-guide">
              <div className="exp-guide-heading">
                <span className="material-symbols-outlined exp-guide-icon" aria-hidden>info</span>
                <h4 className="exp-guide-title">Hướng dẫn nhanh</h4>
              </div>
              <ul className="exp-guide-list">
                <li><span className="exp-guide-num">1.</span> Chọn mặt nạ phù hợp với nhân vật bạn muốn hóa thân.</li>
                <li><span className="exp-guide-num">2.</span> Chọn phông nền sân khấu truyền thống.</li>
                <li><span className="exp-guide-num">3.</span> Chụp ảnh và chia sẻ khoảnh khắc nghệ thuật của bạn.</li>
              </ul>
            </div>
          </div>

          <aside className="exp-sidebar">
            <section className="glass-panel exp-panel exp-panel-masks">
              <div className="exp-panel-head">
                <div className="exp-panel-head-inner">
                  <span className="material-symbols-outlined exp-panel-icon" aria-hidden>theater_comedy</span>
                  <h3 className="exp-panel-title">Chọn mặt nạ</h3>
                </div>
                <span className="exp-panel-count">{maskData.length} Mẫu có sẵn</span>
              </div>
              <div className="mask-grid custom-scrollbar">
                {maskData.map((mask) => (
                  <button
                    key={mask.id}
                    type="button"
                    className={`mask-card ${selectedMask?.id === mask.id ? 'selected' : ''}`}
                    onClick={() => handleMaskSelect(mask)}
                  >
                    <div className="mask-card-preview">
                      {mask.imagePath ? (
                        <img src={getMaskImageUrl(mask.imagePath)} alt={mask.name} loading="lazy" />
                      ) : (
                        <span className="mask-card-emoji">{mask.emoji}</span>
                      )}
                    </div>
                    <span className="mask-card-name">{mask.name}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="glass-panel exp-panel exp-panel-backgrounds">
              <div className="exp-panel-head">
                <span className="material-symbols-outlined exp-panel-icon" aria-hidden>landscape</span>
                <h3 className="exp-panel-title">Nền sân khấu</h3>
              </div>
              <div className="background-grid">
                {BACKGROUND_IMAGES.map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    className={`bg-thumb ${selectedBackground?.id === bg.id ? 'selected' : ''} ${!bg.path ? 'no-bg' : ''}`}
                    onClick={() => setSelectedBackground(bg)}
                  >
                    {bg.path ? (
                      <>
                        <img src={bg.path} alt={bg.label} loading="lazy" />
                        {selectedBackground?.id === bg.id && <div className="bg-thumb-overlay" />}
                      </>
                    ) : (
                      <span className="bg-thumb-empty material-symbols-outlined" aria-hidden>block</span>
                    )}
                    <span className={`bg-thumb-label ${selectedBackground?.id === bg.id ? 'selected' : ''}`}>{bg.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <div className="glass-panel exp-panel exp-panel-settings">
              <div className="exp-settings-row">
                <div className="exp-settings-label-wrap">
                  <span className="material-symbols-outlined exp-settings-icon" aria-hidden>face</span>
                  <div>
                    <p className="exp-settings-label">Face AR Tracking</p>
                    <p className="exp-settings-desc">Tự động bám theo khuôn mặt</p>
                  </div>
                </div>
                <label className="exp-toggle">
                  <input
                    type="checkbox"
                    checked={useAR}
                    onChange={(e) => {
                      setUseAR(e.target.checked)
                      if (e.target.checked && selectedMask) setShowMaskOverlay(true)
                    }}
                  />
                  <span className="exp-toggle-slider" />
                </label>
              </div>
              <button type="button" className="exp-btn-settings">
                <span className="material-symbols-outlined" aria-hidden>settings</span>
                Cấu hình camera
              </button>
            </div>
          </aside>
        </div>
      </main>

      <AnimatePresence>
        {isCameraActive && (
          <motion.footer
            className="exp-footer glass-panel"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25 }}
          >
            <div className="exp-footer-inner">
              <div className="exp-footer-users">
                <div className="exp-footer-avatars">
                  <span className="exp-avatar" />
                  <span className="exp-avatar" />
                  <span className="exp-avatar" />
                </div>
                <p className="exp-footer-text">Hơn <strong>1,240</strong> người đang cùng trải nghiệm</p>
              </div>
              <div className="exp-footer-actions">
                <button
                  type="button"
                  className="exp-btn-outline"
                  onClick={() => setIsCameraActive(false)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  className="gold-gradient-btn exp-btn-capture"
                  onClick={capturePhoto}
                >
                  <span className="material-symbols-outlined" aria-hidden>photo_camera</span>
                  Chụp & Lưu Ảnh
                </button>
              </div>
              <div className="exp-footer-share">
                <button type="button" className="exp-share-btn" aria-label="Chia sẻ Facebook" />
                <button type="button" className="exp-share-btn" aria-label="Chia sẻ Twitter" />
              </div>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShareHint && (
          <motion.div
            className="share-toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
          >
            <span className="share-toast-icon">✓</span>
            <p>Ảnh đã tải về. Chia sẻ với <strong>#TuongVietNam</strong> nhé!</p>
            <button
              type="button"
              className="share-toast-close"
              onClick={() => setShowShareHint(false)}
              aria-label="Đóng"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default CameraExperience



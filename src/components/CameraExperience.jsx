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

// Ảnh nền từ public/backgrounds (không dấu cách — tránh lỗi load trên Mac)
const BACKGROUND_IMAGES = [
  { id: 0, path: null, label: 'Không nền' },
  { id: 1, path: '/backgrounds/580081de0d4e4238f2435f48b510249f.jpg', label: 'Nền 1' },
  { id: 2, path: '/backgrounds/86d43775d9b7e5099c3a5bb74ddc17bd.jpg', label: 'Nền 2' },
  { id: 3, path: '/backgrounds/bec029d1937648da5a7c3ac4205a7af3.jpg', label: 'Nền 3' },
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

  return (
    <div className="camera-experience">
      <div className="experience-container">
        <motion.header
          className="experience-header"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-badge">🎭 Trải nghiệm</div>
          <h1 className="experience-title">Thử Mặt Nạ Tuồng với Camera</h1>
          <p className="experience-lead">
            Chọn mặt nạ, bật camera và chụp ảnh với nền sân khấu — mặt nạ sẽ bám theo khuôn mặt bạn.
          </p>
        </motion.header>

        <div className="experience-main">
          <motion.section
            className="stage-section"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="stage-frame">
              {!isCameraActive ? (
                <motion.div
                  className="stage-placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="placeholder-ring">
                    <span className="placeholder-icon">📷</span>
                  </div>
                  <p className="placeholder-title">Sân khấu của bạn</p>
                  <p className="placeholder-desc">Bật camera để bắt đầu thử mặt nạ Tuồng</p>
                  <motion.button
                    type="button"
                    className="placeholder-cta"
                    onClick={() => setIsCameraActive(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Bật Camera
                  </motion.button>
                </motion.div>
              ) : (
                <div className="stage-viewport">
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
            </div>

            {isCameraActive && (
              <div className="stage-controls">
                <motion.button
                  type="button"
                  className="stage-btn stage-btn-toggle active"
                  onClick={() => setIsCameraActive(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="stage-btn-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M6 6h12v12H6z"/></svg>
                  </span>
                  <span>Tắt camera</span>
                </motion.button>
                {selectedMask && (
                  <motion.button
                    type="button"
                    className="stage-btn stage-btn-capture"
                    onClick={capturePhoto}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="stage-btn-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="none"/><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>
                    </span>
                    <span>Chụp ảnh</span>
                  </motion.button>
                )}
              </div>
            )}
          </motion.section>

          <motion.aside
            className="panel-section"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <div className="panel-card panel-masks">
              <h2 className="panel-title">
                <span className="panel-title-icon">🎭</span>
                Chọn mặt nạ
              </h2>
              <div className="mask-grid">
                {maskData.map((mask) => (
                  <motion.button
                    key={mask.id}
                    type="button"
                    className={`mask-card ${selectedMask?.id === mask.id ? 'selected' : ''}`}
                    onClick={() => handleMaskSelect(mask)}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="mask-card-preview">
                      {mask.imagePath ? (
                        <img src={getMaskImageUrl(mask.imagePath)} alt={mask.name} loading="lazy" />
                      ) : (
                        <span className="mask-card-emoji">{mask.emoji}</span>
                      )}
                    </div>
                    <span className="mask-card-name">{mask.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="panel-card panel-backgrounds">
              <h2 className="panel-title">
                <span className="panel-title-icon">🖼️</span>
                Nền ảnh
              </h2>
              <p className="panel-hint">Nền sẽ hiển thị khi bật camera và dùng khi chụp ảnh.</p>
              <div className="background-grid">
                {BACKGROUND_IMAGES.map((bg) => (
                  <motion.button
                    key={bg.id}
                    type="button"
                    className={`bg-thumb ${selectedBackground?.id === bg.id ? 'selected' : ''} ${!bg.path ? 'no-bg' : ''}`}
                    onClick={() => setSelectedBackground(bg)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {bg.path ? (
                      <img src={bg.path} alt={bg.label} loading="lazy" />
                    ) : (
                      <span className="bg-thumb-empty">✕</span>
                    )}
                    <span className="bg-thumb-label">{bg.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="panel-card panel-ar-toggle">
              <label className="ar-toggle">
                <input
                  type="checkbox"
                  checked={useAR}
                  onChange={(e) => {
                    setUseAR(e.target.checked)
                    if (e.target.checked && selectedMask) setShowMaskOverlay(true)
                  }}
                />
                <span className="ar-toggle-slider" />
                <span className="ar-toggle-label">Face AR — mặt nạ bám theo khuôn mặt</span>
              </label>
            </div>

            {selectedMask && (
              <motion.div
                className="panel-card panel-selected-info"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <p className="selected-label">Đang dùng</p>
                <p className="selected-name">{selectedMask.name}</p>
                <p className="selected-desc">{selectedMask.description}</p>
              </motion.div>
            )}
          </motion.aside>
        </div>

        <motion.details className="experience-instructions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <summary>Hướng dẫn nhanh</summary>
          <ol>
            <li>Nhấn <strong>Bật camera</strong> và cho phép trình duyệt dùng camera.</li>
            <li>Chọn một mặt nạ và (tuỳ chọn) chọn nền ảnh.</li>
            <li>Bật <strong>Face AR</strong> để mặt nạ bám theo khuôn mặt.</li>
            <li>Nhấn <strong>Chụp ảnh</strong> để tải ảnh về máy.</li>
          </ol>
          <p className="instructions-tip">💡 Ánh sáng đủ và nhìn thẳng camera giúp nhận diện mặt tốt hơn.</p>
        </motion.details>

        {showShareHint && (
          <motion.div
            className="share-toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <span className="share-toast-icon">✓</span>
            <p>Ảnh đã tải về. Chia sẻ với <strong>#TuongVietNam</strong> nhé!</p>
          </motion.div>
        )}
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default CameraExperience



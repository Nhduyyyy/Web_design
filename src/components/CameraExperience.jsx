import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { maskData } from '../data/tuongData'
import FaceMaskAR from './FaceMaskAR'
import FaceMaskAR3D from './FaceMaskAR3D'
import './CameraExperience.css'

function CameraExperience() {
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [selectedMask, setSelectedMask] = useState(null)
  const [showMaskOverlay, setShowMaskOverlay] = useState(false)
  const [useAR, setUseAR] = useState(true)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

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
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)
      
      // Add mask overlay
      if (selectedMask) {
        ctx.font = 'bold 60px Arial'
        ctx.fillStyle = selectedMask.color
        ctx.textAlign = 'center'
        ctx.fillText(
          selectedMask.emoji,
          canvas.width / 2,
          canvas.height / 2 - 50
        )
      }
      
      const dataUrl = canvas.toDataURL('image/png')
      downloadImage(dataUrl)
    }
  }

  const downloadImage = (dataUrl) => {
    const link = document.createElement('a')
    link.download = `tuong-mask-${Date.now()}.png`
    link.href = dataUrl
    link.click()
  }

  return (
    <div className="camera-experience">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="experience-header"
        >
          <h2 className="section-title">
            <span className="ar-icon">📷</span> Trải Nghiệm AR
          </h2>
          <p className="section-subtitle">
            Thử nghiệm mặt nạ Tuồng với camera của bạn
          </p>
        </motion.div>

        <div className="experience-content">
          <div className="camera-section">
            <div className="camera-container">
              {!isCameraActive ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="camera-placeholder"
                >
                  <div className="placeholder-icon">📷</div>
                  <p>Nhấn nút bên dưới để bật camera</p>
                </motion.div>
              ) : (
                <div className="video-wrapper">
                  {useAR && selectedMask ? (
                    // Sử dụng AR 3D nếu mask có modelPath, ngược lại dùng AR 2D
                    selectedMask.modelPath ? (
                      <FaceMaskAR3D 
                        selectedMask={selectedMask}
                        isActive={isCameraActive}
                      />
                    ) : (
                      <FaceMaskAR 
                        selectedMask={selectedMask}
                        isActive={isCameraActive}
                      />
                    )
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="camera-video"
                      />
                      <AnimatePresence>
                        {showMaskOverlay && selectedMask && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="mask-overlay"
                            style={{ color: selectedMask.color }}
                          >
                            <span style={{ fontSize: '8rem' }}>
                              {selectedMask.emoji}
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            <div className="camera-controls">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`control-btn ${isCameraActive ? 'stop' : 'start'}`}
                onClick={() => setIsCameraActive(!isCameraActive)}
              >
                {isCameraActive ? '⏹️ Tắt Camera' : '📷 Bật Camera'}
              </motion.button>
              
              {isCameraActive && selectedMask && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="control-btn capture"
                  onClick={capturePhoto}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  📸 Chụp Ảnh
                </motion.button>
              )}
            </div>
          </div>

          <div className="mask-selector-section">
            <h3>Chọn Mặt Nạ</h3>
            <div className="mask-selector-grid">
              {maskData.map((mask) => (
                <motion.button
                  key={mask.id}
                  whileHover={{ scale: 1.1, y: -5 }}
                  whileTap={{ scale: 0.9 }}
                  className={`mask-selector-btn ${
                    selectedMask?.id === mask.id ? 'selected' : ''
                  }`}
                  onClick={() => handleMaskSelect(mask)}
                  style={{
                    borderColor: mask.color,
                    backgroundColor:
                      selectedMask?.id === mask.id
                        ? mask.color + '30'
                        : 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <span style={{ fontSize: '3rem' }}>{mask.emoji}</span>
                  <span className="mask-selector-name">{mask.name}</span>
                </motion.button>
              ))}
            </div>

            {selectedMask && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="selected-mask-info"
              >
                <h4>Mặt nạ đã chọn: {selectedMask.name}</h4>
                <p>{selectedMask.description}</p>
              </motion.div>
            )}

            <div className="control-section">
              <h3>Điều Khiển</h3>
              <label className="toggle-control">
                <input
                  type="checkbox"
                  checked={useAR}
                  onChange={(e) => {
                    setUseAR(e.target.checked)
                    if (e.target.checked && selectedMask) {
                      setShowMaskOverlay(true)
                    }
                  }}
                />
                <span>🎯 Face Tracking AR (Mặt nạ dính vào mặt)</span>
              </label>
            </div>
          </div>
        </div>

        <div className="ar-instructions">
          <h3>Hướng Dẫn</h3>
          <ol>
            <li>Nhấn "Bật Camera" để kích hoạt camera</li>
            <li>Chọn một mặt nạ từ bộ sưu tập</li>
            <li>Bật "Face Tracking AR" để mặt nạ tự động dính vào mặt</li>
            <li>Mặt nạ sẽ theo dõi và hiển thị trên khuôn mặt của bạn</li>
            <li>Nhấn "Chụp Ảnh" để lưu lại khoảnh khắc</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default CameraExperience



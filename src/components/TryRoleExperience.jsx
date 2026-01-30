import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { characterData } from '../data/tuongData'
import { getSegmenter, getPersonMaskIndex, releaseSegmenter } from '../utils/segmentPerson'
import { drawBackgroundWithMask } from '../utils/drawStagePerson'
import './TryRoleExperience.css'

const STAGE_BACKGROUNDS = [
  { id: 0, path: null, label: 'Không nền' },
  { id: 1, path: '/backgrounds/580081de0d4e4238f2435f48b510249f.jpg', label: 'Nền 1' },
  { id: 2, path: '/backgrounds/86d43775d9b7e5099c3a5bb74ddc17bd.jpg', label: 'Nền 2' },
  { id: 3, path: '/backgrounds/bec029d1937648da5a7c3ac4205a7af3.jpg', label: 'Nền 3' },
  { id: 4, path: '/backgrounds/d5ae63e2b4e5c731cd19b2564c246b26.jpg', label: 'Nền 4' },
  { id: 5, path: '/backgrounds/d8aa722a4883585459eb023c344be145.jpg', label: 'Nền 5' }
]

const CHARACTER_COLORS = { 'Đỏ': '#c0392b', 'Hồng': '#e91e63', 'Vàng': '#d4af37' }

function TryRoleExperience() {
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState(characterData[0])
  const [selectedBackground, setSelectedBackground] = useState(STAGE_BACKGROUNDS[1])
  const [showShareHint, setShowShareHint] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const animationFrameRef = useRef(null)
  const backgroundImageRef = useRef(null)
  const segmenterRef = useRef(null)
  const lastSegmentMaskRef = useRef(null)
  const segmentTimestampRef = useRef(0)
  const frameCountRef = useRef(0)

  useEffect(() => {
    if (selectedBackground?.path) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => { backgroundImageRef.current = img }
      img.onerror = () => { backgroundImageRef.current = null }
      img.src = selectedBackground.path
      getSegmenter().then((seg) => { segmenterRef.current = seg }).catch(() => { segmenterRef.current = null })
    } else {
      backgroundImageRef.current = null
    }
  }, [selectedBackground])

  useEffect(() => {
    if (!isCameraActive) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop())
        videoRef.current.srcObject = null
      }
      segmenterRef.current = null
      lastSegmentMaskRef.current = null
      releaseSegmenter()
      return
    }

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        })
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch (e) {
        console.error('Camera error:', e)
        alert('Không thể truy cập camera. Vui lòng cho phép quyền camera.')
      }
    }

    initCamera()

    const animate = () => {
      const canvas = canvasRef.current
      const video = videoRef.current
      if (!canvas || !video || !isCameraActive || video.readyState !== 4) {
        if (isCameraActive) animationFrameRef.current = requestAnimationFrame(animate)
        return
      }

      const ctx = canvas.getContext('2d')
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      const w = canvas.width
      const h = canvas.height

      ctx.save()
      ctx.scale(-1, 1)
      ctx.translate(-w, 0)

      const bgImage = backgroundImageRef.current
      const hasBg = selectedBackground?.path && bgImage
      if (hasBg && segmenterRef.current) {
        if (frameCountRef.current % 3 === 0) {
          try {
            const result = segmenterRef.current.segmentForVideo(video, segmentTimestampRef.current)
            segmentTimestampRef.current += 33
            const idx = getPersonMaskIndex(result)
            if (idx >= 0 && result.confidenceMasks?.[idx]) lastSegmentMaskRef.current = result.confidenceMasks[idx]
          } catch (_) {}
        }
        if (lastSegmentMaskRef.current) {
          try {
            drawBackgroundWithMask(ctx, canvas, video, bgImage, lastSegmentMaskRef.current)
          } catch (e) {
            lastSegmentMaskRef.current = null
            ctx.drawImage(video, 0, 0, w, h)
          }
        } else {
          ctx.drawImage(video, 0, 0, w, h)
        }
      } else {
        lastSegmentMaskRef.current = null
        ctx.drawImage(video, 0, 0, w, h)
      }

      ctx.restore()

      frameCountRef.current++

      if (selectedCharacter) {
        const color = CHARACTER_COLORS[selectedCharacter.costume?.color] || '#d4af37'
        ctx.fillStyle = color + 'E6'
        ctx.fillRect(0, h - 56, w, 56)
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 22px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`Vai: ${selectedCharacter.name} — ${selectedCharacter.role}`, w / 2, h - 22)
        ctx.font = '14px system-ui, sans-serif'
        ctx.fillText(selectedCharacter.costume?.description || '', w / 2, h - 6)
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop())
        videoRef.current.srcObject = null
      }
      segmenterRef.current = null
      lastSegmentMaskRef.current = null
      releaseSegmenter()
    }
  }, [isCameraActive, selectedCharacter, selectedBackground])

  const capturePhoto = () => {
    const source = canvasRef.current
    if (!source || source.width === 0 || source.height === 0) return
    const out = document.createElement('canvas')
    out.width = source.width
    out.height = source.height
    const ctx = out.getContext('2d')
    ctx.translate(out.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(source, 0, 0)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    const char = selectedCharacter
    const pad = 16
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(0, 0, out.width, 72)
    ctx.fillStyle = '#d4af37'
    ctx.font = 'bold 20px system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(char ? `Vai: ${char.name}  ·  ${char.role}` : 'Thử vai Tuồng', pad, 32)
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.font = '14px system-ui, sans-serif'
    ctx.fillText(char?.story?.slice(0, 60) + (char?.story?.length > 60 ? '…' : '') || '', pad, 54)
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = '12px system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('Tuồng Việt Nam  ·  #TuongVietNam', out.width - pad, out.height - 12)
    const link = document.createElement('a')
    link.download = `vai-${selectedCharacter?.name?.replace(/\s/g, '-') || 'tuong'}-${Date.now()}.png`
    link.href = out.toDataURL('image/png')
    link.click()
    setShowShareHint(true)
  }

  return (
    <div className="try-role-experience">
      <div className="try-role-container">
        <motion.header
          className="try-role-header"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="try-role-badge">🎭 Thử vai</div>
          <h1 className="try-role-title">Vào vai nhân vật Tuồng trong cảnh sân khấu</h1>
          <p className="try-role-lead">
            Chọn vai (Quan Công, Thị Kính, Lưu Bị) — bạn xuất hiện trong nền sân khấu, không đeo mặt nạ. Ảnh chụp có khung “vai diễn” để chia sẻ.
          </p>
        </motion.header>

        <div className="try-role-main">
          <section className="try-role-stage-section">
            <div className="try-role-frame">
              {!isCameraActive ? (
                <motion.div className="try-role-placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="try-role-placeholder-ring">
                    <span className="try-role-placeholder-icon">🎬</span>
                  </div>
                  <p className="try-role-placeholder-title">Sân khấu ảo</p>
                  <p className="try-role-placeholder-desc">Chọn vai và nền sân khấu, bật camera — bạn sẽ đứng trong cảnh (không đeo mặt nạ)</p>
                  <motion.button
                    type="button"
                    className="try-role-placeholder-cta"
                    onClick={() => setIsCameraActive(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Bật camera
                  </motion.button>
                </motion.div>
              ) : (
                <div className="try-role-viewport">
                  <video ref={videoRef} autoPlay playsInline muted className="try-role-video" style={{ transform: 'scaleX(-1)' }} />
                  <canvas ref={canvasRef} className="try-role-canvas" />
                </div>
              )}
            </div>
            {isCameraActive && (
              <div className="try-role-controls">
                <motion.button
                  type="button"
                  className="try-role-btn try-role-btn-stop"
                  onClick={() => setIsCameraActive(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="try-role-btn-icon">■</span>
                  <span>Tắt camera</span>
                </motion.button>
                <motion.button
                  type="button"
                  className="try-role-btn try-role-btn-capture"
                  onClick={capturePhoto}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="try-role-btn-icon">📷</span>
                  <span>Chụp ảnh</span>
                </motion.button>
              </div>
            )}
          </section>

          <aside className="try-role-panel">
            <div className="try-role-card">
              <h2 className="try-role-panel-title">
                <span className="try-role-panel-icon">👤</span>
                Chọn nhân vật (vai)
              </h2>
              <div className="try-role-character-grid">
                {characterData.map((char) => (
                  <motion.button
                    key={char.id}
                    type="button"
                    className={`try-role-character-btn ${selectedCharacter?.id === char.id ? 'selected' : ''}`}
                    onClick={() => setSelectedCharacter(char)}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      borderColor: CHARACTER_COLORS[char.costume?.color] || '#d4af37',
                      backgroundColor: selectedCharacter?.id === char.id ? (CHARACTER_COLORS[char.costume?.color] || '#d4af37') + '25' : 'rgba(0,0,0,0.2)'
                    }}
                  >
                    <span className="try-role-character-emoji">{char.emoji}</span>
                    <span className="try-role-character-name">{char.name}</span>
                    <span className="try-role-character-type">{char.type}</span>
                  </motion.button>
                ))}
              </div>
            </div>
            <div className="try-role-card">
              <h2 className="try-role-panel-title">
                <span className="try-role-panel-icon">🖼️</span>
                Nền sân khấu
              </h2>
              <p className="try-role-hint">Nền sẽ hiển thị khi bật camera (tách nền người thật).</p>
              <div className="try-role-bg-grid">
                {STAGE_BACKGROUNDS.map((bg) => (
                  <motion.button
                    key={bg.id}
                    type="button"
                    className={`try-role-bg-thumb ${selectedBackground?.id === bg.id ? 'selected' : ''} ${!bg.path ? 'no-bg' : ''}`}
                    onClick={() => setSelectedBackground(bg)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {bg.path ? (
                      <img src={bg.path} alt={bg.label} loading="lazy" />
                    ) : (
                      <span className="try-role-bg-empty">✕</span>
                    )}
                    <span className="try-role-bg-label">{bg.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
            {selectedCharacter && (
              <div className="try-role-card try-role-info">
                <p className="try-role-selected-label">Vai đã chọn</p>
                <p className="try-role-selected-name">{selectedCharacter.name}</p>
                <p className="try-role-selected-desc">{selectedCharacter.role}</p>
                <p className="try-role-selected-costume">{selectedCharacter.costume?.description}</p>
              </div>
            )}
          </aside>
        </div>

        {showShareHint && (
          <motion.div
            className="try-role-share-toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="try-role-share-icon">✓</span>
            <p>Ảnh đã tải về. Chia sẻ với <strong>#TuongVietNam</strong> để lan tỏa văn hóa Tuồng!</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default TryRoleExperience

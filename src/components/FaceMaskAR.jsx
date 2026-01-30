import { useEffect, useRef, useState } from 'react'
import * as faceapi from 'face-api.js'
import { getSegmenter, getPersonMaskIndex, releaseSegmenter } from '../utils/segmentPerson'
import './FaceMaskAR.css'

function FaceMaskAR({ selectedMask, isActive, captureCanvasRef, backgroundImageUrl }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const animationFrameRef = useRef(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const faceDetectionRef = useRef(null)
  const frameCountRef = useRef(0)
  const maskImageRef = useRef(null)
  const backgroundImageRef = useRef(null)
  const segmenterRef = useRef(null)
  const lastSegmentMaskRef = useRef(null)
  const maskCanvasRef = useRef(null)
  const segmentTimestampRef = useRef(0)
  const selectedMaskRef = useRef(null)

  // Luôn trỏ tới mask đang chọn (để đổi mask không phải restart camera/nền)
  useEffect(() => {
    selectedMaskRef.current = selectedMask
  }, [selectedMask])

  // Load ảnh nền khi chọn nền (để tách nền + xem trước)
  useEffect(() => {
    if (backgroundImageUrl) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => { backgroundImageRef.current = img }
      img.onerror = () => { backgroundImageRef.current = null }
      img.src = backgroundImageUrl
      getSegmenter().then((seg) => { segmenterRef.current = seg }).catch(() => { segmenterRef.current = null })
    } else {
      backgroundImageRef.current = null
    }
  }, [backgroundImageUrl])

  // Load mask image if available
  // macOS/filesystem dùng NFD (decomposed), code thường dùng NFC → chuẩn hóa NFD + encode URL
  useEffect(() => {
    maskImageRef.current = null
    if (selectedMask?.imagePath) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        maskImageRef.current = img
      }
      img.onerror = () => {
        console.warn('Failed to load mask image:', selectedMask.imagePath)
        maskImageRef.current = null
      }
      const path = selectedMask.imagePath.startsWith('http')
        ? selectedMask.imagePath
        : selectedMask.imagePath.normalize('NFD') // Khớp tên file trên disk (macOS thường NFD)
      const url = path.startsWith('http') ? path : (window.location.origin + encodeURI(path))
      img.src = url
    }
  }, [selectedMask])

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Try multiple CDN sources for models
        const MODEL_URLS = [
          'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/',
          'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/',
          '/weights/'
        ]
        
        let loaded = false
        for (const MODEL_URL of MODEL_URLS) {
          try {
            await Promise.all([
              faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
              faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
            ])
            loaded = true
            console.log('Face detection models loaded from:', MODEL_URL)
            break
          } catch (err) {
            console.warn('Failed to load from:', MODEL_URL, err)
            continue
          }
        }
        
        if (loaded) {
          setModelsLoaded(true)
        } else {
          console.warn('Using fallback face estimation (models not loaded)')
          setModelsLoaded(false)
        }
      } catch (error) {
        console.error('Error loading face detection models:', error)
        // Fallback: models not loaded, will use estimation
        setModelsLoaded(false)
      }
    }

    loadModels()
  }, [])

  useEffect(() => {
    if (!isActive) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      faceDetectionRef.current = null
      return
    }

    const initializeCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            setIsLoaded(true)
            startFaceTracking()
          }
        }
      } catch (error) {
        console.error('Error accessing camera:', error)
        alert('Không thể truy cập camera. Vui lòng cho phép quyền truy cập camera.')
        setIsLoaded(false)
      }
    }

    const startFaceTracking = () => {
      frameCountRef.current = 0
      
      const animate = () => {
        const canvas = canvasRef.current
        const video = videoRef.current
        const currentMask = selectedMaskRef.current
        if (!canvas || !video || !isActive || !currentMask || video.readyState !== 4) {
          if (isActive) {
            animationFrameRef.current = requestAnimationFrame(animate)
          }
          return
        }

        if (captureCanvasRef && typeof captureCanvasRef === 'object') {
          captureCanvasRef.current = canvas
        }

        const ctx = canvas.getContext('2d')
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 480

        ctx.save()
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        const bgImageLoaded = backgroundImageUrl && backgroundImageRef.current
        if (bgImageLoaded) {
          if (segmenterRef.current) {
            const runSegment = frameCountRef.current % 3 === 0
            if (runSegment) {
              try {
                const result = segmenterRef.current.segmentForVideo(video, segmentTimestampRef.current)
                segmentTimestampRef.current += 33
                const idx = getPersonMaskIndex(result)
                if (idx >= 0 && result.confidenceMasks && result.confidenceMasks[idx]) {
                  lastSegmentMaskRef.current = result.confidenceMasks[idx]
                }
              } catch (_) {}
            }
          }
          if (lastSegmentMaskRef.current) {
            try {
              drawBackgroundWithMask(ctx, canvas, video, backgroundImageRef.current, lastSegmentMaskRef.current)
            } catch (e) {
              lastSegmentMaskRef.current = null
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            }
          } else {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          }
        } else {
          lastSegmentMaskRef.current = null
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        }

        let faceData = null
        frameCountRef.current++

        // Detect face every 5 frames (for performance) or use last known position
        const shouldDetect = modelsLoaded && (frameCountRef.current % 5 === 0 || !faceDetectionRef.current)

        if (shouldDetect) {
          // Run face detection asynchronously without blocking animation
          faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .then((detections) => {
              if (detections) {
                const box = detections.detection.box
                const landmarks = detections.landmarks
                
                faceDetectionRef.current = {
                  x: box.x + box.width / 2,
                  y: box.y + box.height / 2,
                  width: box.width,
                  height: box.height,
                  landmarks: landmarks
                }
              }
            })
            .catch((error) => {
              // Silently handle detection errors
            })
        }

        // Use last detected face position or estimate
        if (faceDetectionRef.current) {
          faceData = { ...faceDetectionRef.current }
        } else {
          // Fallback: estimate face position if no detection
          const faceCenterX = canvas.width / 2
          const faceCenterY = canvas.height / 2 - canvas.height * 0.1
          const faceWidth = canvas.width * 0.5
          const faceHeight = canvas.height * 0.6
          
          faceData = {
            x: faceCenterX,
            y: faceCenterY,
            width: faceWidth,
            height: faceHeight,
            landmarks: null
          }
        }

        // Draw mask with face tracking
        drawMaskOnFace(ctx, currentMask, faceData)

        ctx.restore()
        animationFrameRef.current = requestAnimationFrame(animate)
      }
      animate()
    }

    if (isActive) {
      initializeCamera()
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks()
        tracks.forEach(track => track.stop())
        videoRef.current.srcObject = null
      }
      faceDetectionRef.current = null
      segmenterRef.current = null
      lastSegmentMaskRef.current = null
      releaseSegmenter()
    }
    if (captureCanvasRef && typeof captureCanvasRef === 'object') {
      captureCanvasRef.current = null
    }
  }, [isActive, modelsLoaded])

  /**
   * Vẽ nền ảnh + người (từ video, dùng mask tách nền) lên canvas.
   * Không dùng WebGL/DrawingUtils — chỉ 2D canvas để tránh lỗi môi trường.
   */
  function drawBackgroundWithMask(ctx, canvas, video, bgImage, confidenceMask) {
    const w = canvas.width
    const h = canvas.height
    if (!w || !h) return

    // 1. Vẽ nền ảnh (cover)
    const imgAspect = bgImage.width / bgImage.height
    const canvasAspect = w / h
    let sw, sh, sx, sy
    if (imgAspect > canvasAspect) {
      sh = bgImage.height
      sw = bgImage.height * canvasAspect
      sx = (bgImage.width - sw) / 2
      sy = 0
    } else {
      sw = bgImage.width
      sh = bgImage.width / canvasAspect
      sx = 0
      sy = (bgImage.height - sh) / 2
    }
    ctx.drawImage(bgImage, sx, sy, sw, sh, 0, 0, w, h)

    // 2. Lấy mask dạng Float32 (confidence)
    let floatArr
    try {
      floatArr = confidenceMask.getAsFloat32Array()
    } catch (_) {
      return
    }
    const mw = confidenceMask.width
    const mh = confidenceMask.height
    if (!floatArr || !mw || !mh) return

    // 3. Lớp người: vẽ video lên canvas tạm, áp alpha theo mask
    const personCanvas = document.createElement('canvas')
    personCanvas.width = w
    personCanvas.height = h
    const pCtx = personCanvas.getContext('2d')
    pCtx.drawImage(video, 0, 0, w, h)
    const imageData = pCtx.getImageData(0, 0, w, h)
    const data = imageData.data

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4
        const mx = Math.floor((x / w) * mw)
        const my = Math.floor((y / h) * mh)
        const mi = Math.min(my * mw + mx, floatArr.length - 1)
        const alpha = Math.max(0, Math.min(1, floatArr[mi]))
        data[i + 3] = Math.round(alpha * 255)
      }
    }
    pCtx.putImageData(imageData, 0, 0)
    ctx.drawImage(personCanvas, 0, 0, w, h)
  }

  const drawMaskOnFace = (ctx, mask, faceData) => {
    if (!mask || !faceData) return

    const { x, y, width, height, landmarks } = faceData
    
    ctx.save()
    ctx.translate(x, y)
    
    // Calculate rotation if landmarks are available
    let rotation = 0
    if (landmarks) {
      // Calculate face angle from eye positions
      const leftEye = landmarks.getLeftEye()
      const rightEye = landmarks.getRightEye()
      if (leftEye.length > 0 && rightEye.length > 0) {
        const leftEyeCenter = {
          x: leftEye.reduce((sum, p) => sum + p.x, 0) / leftEye.length,
          y: leftEye.reduce((sum, p) => sum + p.y, 0) / leftEye.length
        }
        const rightEyeCenter = {
          x: rightEye.reduce((sum, p) => sum + p.x, 0) / rightEye.length,
          y: rightEye.reduce((sum, p) => sum + p.y, 0) / rightEye.length
        }
        rotation = Math.atan2(
          rightEyeCenter.y - leftEyeCenter.y,
          rightEyeCenter.x - leftEyeCenter.x
        )
        ctx.rotate(rotation)
      }
    }

    // Create mask shape - điều chỉnh vừa với khuôn mặt (nhỏ hơn để không to quá)
    const maskWidth = width * 0.88
    const maskHeight = height * 0.88

    // Nếu có ảnh mặt nạ thật, sử dụng ảnh đó
    if (maskImageRef.current && mask.imagePath) {
      // Draw mask image - không dùng clipping để hiển thị đầy đủ
      ctx.save()
      
      // Draw the mask image với tỷ lệ phù hợp
      const img = maskImageRef.current
      const imgAspect = img.width / img.height
      const maskAspect = maskWidth / maskHeight
      
      let drawWidth = maskWidth
      let drawHeight = maskHeight
      
      // Scale để fit to container nhưng giữ nguyên tỷ lệ
      if (imgAspect > maskAspect) {
        // Image is wider, fit to height và mở rộng width
        drawHeight = maskHeight
        drawWidth = drawHeight * imgAspect
      } else {
        // Image is taller, fit to width và mở rộng height
        drawWidth = maskWidth
        drawHeight = drawWidth / imgAspect
      }
      
      // Vẽ ảnh đầy đủ không bị cắt
      ctx.drawImage(
        img,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight
      )
      
      ctx.restore()
      
      // Add subtle glow effect (nhẹ hơn để không che ảnh)
      const outerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(drawWidth, drawHeight) / 2)
      outerGradient.addColorStop(0, mask.color + '20')
      outerGradient.addColorStop(0.8, mask.color + '05')
      outerGradient.addColorStop(1, 'transparent')
      
      ctx.fillStyle = outerGradient
      ctx.beginPath()
      ctx.ellipse(0, 0, Math.max(drawWidth, drawHeight) / 2, Math.max(drawWidth, drawHeight) / 2, 0, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.restore()
      return
    }

    // Outer glow effect
    const outerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, maskWidth / 2)
    outerGradient.addColorStop(0, mask.color + '40')
    outerGradient.addColorStop(0.5, mask.color + '20')
    outerGradient.addColorStop(1, 'transparent')
    
    ctx.fillStyle = outerGradient
    ctx.beginPath()
    ctx.ellipse(0, 0, maskWidth / 2, maskHeight / 2, 0, 0, Math.PI * 2)
    ctx.fill()

    // Main mask base
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, maskWidth / 2)
    gradient.addColorStop(0, mask.color + 'DD')
    gradient.addColorStop(0.5, mask.color + 'BB')
    gradient.addColorStop(0.8, mask.color + '99')
    gradient.addColorStop(1, mask.color + '66')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.ellipse(0, 0, maskWidth / 2, maskHeight / 2, 0, 0, Math.PI * 2)
    ctx.fill()

    // Mask-specific decorations
    if (mask.name.includes('Quan Văn')) {
      // Scholar hat
      ctx.fillStyle = '#2c3e50'
      ctx.fillRect(-maskWidth * 0.35, -maskHeight * 0.4, maskWidth * 0.7, maskHeight * 0.15)
      // Crown
      ctx.fillStyle = '#d4af37'
      ctx.fillRect(-maskWidth * 0.25, -maskHeight * 0.45, maskWidth * 0.5, maskHeight * 0.1)
      // Crown top
      ctx.fillRect(-maskWidth * 0.1, -maskHeight * 0.5, maskWidth * 0.2, maskHeight * 0.08)
      // Decorative beads
      ctx.fillStyle = '#ffd700'
      ctx.beginPath()
      ctx.arc(-maskWidth * 0.2, -maskHeight * 0.35, maskWidth * 0.03, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(maskWidth * 0.2, -maskHeight * 0.35, maskWidth * 0.03, 0, Math.PI * 2)
      ctx.fill()
    }

    if (mask.name.includes('Quan Võ')) {
      // Warrior helmet
      ctx.fillStyle = '#8b0000'
      ctx.fillRect(-maskWidth * 0.4, -maskHeight * 0.35, maskWidth * 0.8, maskHeight * 0.25)
      // Helmet crest
      ctx.fillStyle = '#c0392b'
      ctx.fillRect(-maskWidth * 0.03, -maskHeight * 0.45, maskWidth * 0.06, maskHeight * 0.15)
      // Side decorations
      ctx.fillStyle = '#e74c3c'
      ctx.beginPath()
      ctx.arc(-maskWidth * 0.35, -maskHeight * 0.25, maskWidth * 0.05, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(maskWidth * 0.35, -maskHeight * 0.25, maskWidth * 0.05, 0, Math.PI * 2)
      ctx.fill()
    }

    if (mask.name.includes('Hề')) {
      // Funny nose
      ctx.fillStyle = '#ff6b6b'
      ctx.beginPath()
      ctx.arc(0, maskHeight * 0.05, maskWidth * 0.08, 0, Math.PI * 2)
      ctx.fill()
      // Funny hat
      ctx.fillStyle = '#f39c12'
      ctx.beginPath()
      ctx.moveTo(-maskWidth * 0.3, -maskHeight * 0.35)
      ctx.lineTo(0, -maskHeight * 0.5)
      ctx.lineTo(maskWidth * 0.3, -maskHeight * 0.35)
      ctx.closePath()
      ctx.fill()
      // Bells
      ctx.fillStyle = '#ffd700'
      ctx.beginPath()
      ctx.arc(-maskWidth * 0.15, -maskHeight * 0.4, maskWidth * 0.03, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(maskWidth * 0.15, -maskHeight * 0.4, maskWidth * 0.03, 0, Math.PI * 2)
      ctx.fill()
    }

    if (mask.name.includes('Nữ')) {
      // Hair decoration
      ctx.strokeStyle = '#e91e63'
      ctx.lineWidth = maskWidth * 0.02
      ctx.beginPath()
      ctx.arc(0, -maskHeight * 0.3, maskWidth * 0.25, 0, Math.PI * 2)
      ctx.stroke()
      // Flowers
      ctx.fillStyle = '#ff69b4'
      ctx.beginPath()
      ctx.arc(-maskWidth * 0.2, -maskHeight * 0.25, maskWidth * 0.03, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(maskWidth * 0.2, -maskHeight * 0.25, maskWidth * 0.03, 0, Math.PI * 2)
      ctx.fill()
    }

    if (mask.name.includes('Quỷ')) {
      // Horns
      ctx.fillStyle = '#8e44ad'
      ctx.beginPath()
      ctx.moveTo(-maskWidth * 0.2, -maskHeight * 0.3)
      ctx.lineTo(-maskWidth * 0.15, -maskHeight * 0.45)
      ctx.lineTo(-maskWidth * 0.25, -maskHeight * 0.45)
      ctx.closePath()
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(maskWidth * 0.2, -maskHeight * 0.3)
      ctx.lineTo(maskWidth * 0.15, -maskHeight * 0.45)
      ctx.lineTo(maskWidth * 0.25, -maskHeight * 0.45)
      ctx.closePath()
      ctx.fill()
      // Fangs
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.moveTo(-maskWidth * 0.1, maskHeight * 0.15)
      ctx.lineTo(-maskWidth * 0.05, maskHeight * 0.25)
      ctx.lineTo(-maskWidth * 0.15, maskHeight * 0.25)
      ctx.closePath()
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(maskWidth * 0.1, maskHeight * 0.15)
      ctx.lineTo(maskWidth * 0.05, maskHeight * 0.25)
      ctx.lineTo(maskWidth * 0.15, maskHeight * 0.25)
      ctx.closePath()
      ctx.fill()
    }

    if (mask.name.includes('Thần')) {
      // Halo
      ctx.strokeStyle = '#00bcd4'
      ctx.lineWidth = maskWidth * 0.02
      ctx.globalAlpha = 0.8
      ctx.beginPath()
      ctx.arc(0, -maskHeight * 0.4, maskWidth * 0.35, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = 1
      // Glowing particles
      ctx.fillStyle = '#00bcd4'
      ctx.globalAlpha = 0.9
      ctx.beginPath()
      ctx.arc(-maskWidth * 0.25, -maskHeight * 0.2, maskWidth * 0.02, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(maskWidth * 0.25, -maskHeight * 0.2, maskWidth * 0.02, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }

    // Emoji overlay (centered on face)
    ctx.font = `bold ${maskWidth * 0.35}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = maskWidth * 0.01
    ctx.strokeText(mask.emoji, 0, 0)
    ctx.fillText(mask.emoji, 0, 0)

    ctx.restore()
  }

  if (!isActive) {
    return null
  }

  return (
    <div className="face-mask-ar">
      <video
        ref={videoRef}
        className="ar-video"
        autoPlay
        playsInline
        muted
        style={{ transform: 'scaleX(-1)' }}
      />
      <canvas
        ref={canvasRef}
        className="ar-canvas"
        style={{ transform: 'scaleX(-1)' }}
      />
      {(!isLoaded || !modelsLoaded) && (
        <div className="ar-loading">
          <div className="loading-spinner"></div>
          <p>
            {!isLoaded ? 'Đang tải camera...' : 'Đang tải face detection...'}
          </p>
        </div>
      )}
    </div>
  )
}

export default FaceMaskAR

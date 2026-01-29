import { useEffect, useRef, useState, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as faceapi from 'face-api.js'
import { Model3DLoader } from './Model3D'
import './FaceMaskAR.css'

// 3D Mask Model Component
function Mask3DModel({ modelPath, faceData, videoWidth, videoHeight }) {
  const groupRef = useRef()
  
  useFrame(() => {
    if (groupRef.current && faceData && videoWidth > 0 && videoHeight > 0) {
      // Convert 2D face coordinates to 3D space
      // Normalize coordinates: -1 to 1 range
      const normalizedX = (faceData.x / videoWidth - 0.5) * 2
      const normalizedY = -(faceData.y / videoHeight - 0.5) * 2
      
      // Calculate scale based on face width and height - tăng scale để lớn hơn
      const faceWidthScale = (faceData.width / videoWidth) * 4
      const faceHeightScale = (faceData.height / videoHeight) * 4
      const faceScale = Math.max(faceWidthScale, faceHeightScale) // Lấy scale lớn hơn
      
      // Position model at face center
      groupRef.current.position.set(normalizedX * 2.5, normalizedY * 2.5, 0)
      
      // Scale model to fit face - tăng scale lên nhiều hơn
      const finalScale = faceScale * 2.5 // Tăng từ 1.2 lên 2.5 để lớn hơn nhiều
      groupRef.current.scale.set(finalScale, finalScale, finalScale)
      
      // Rotate based on face angle if landmarks available
      if (faceData.landmarks) {
        try {
          const leftEye = faceData.landmarks.getLeftEye()
          const rightEye = faceData.landmarks.getRightEye()
          if (leftEye && leftEye.length > 0 && rightEye && rightEye.length > 0) {
            const leftEyeCenter = {
              x: leftEye.reduce((sum, p) => sum + p.x, 0) / leftEye.length,
              y: leftEye.reduce((sum, p) => sum + p.y, 0) / leftEye.length
            }
            const rightEyeCenter = {
              x: rightEye.reduce((sum, p) => sum + p.x, 0) / rightEye.length,
              y: rightEye.reduce((sum, p) => sum + p.y, 0) / rightEye.length
            }
            const angle = Math.atan2(
              rightEyeCenter.y - leftEyeCenter.y,
              rightEyeCenter.x - leftEyeCenter.x
            )
            groupRef.current.rotation.z = angle
          }
        } catch (e) {
          // Ignore landmark errors
        }
      }
    }
  })

  if (!modelPath) return null

  return (
    <group ref={groupRef}>
      <Model3DLoader
        modelPath={modelPath}
        position={[0, 0, 0]}
        rotation={[0, Math.PI, 0]} // Flip để match video mirror
        scale={1}
        autoRotate={false}
      />
    </group>
  )
}

function FaceMaskAR3D({ selectedMask, isActive }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const threeCanvasRef = useRef(null)
  const animationFrameRef = useRef(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const faceDetectionRef = useRef(null)
  const frameCountRef = useRef(0)
  const [faceData, setFaceData] = useState(null)

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
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
          setModelsLoaded(false)
        }
      } catch (error) {
        console.error('Error loading face detection models:', error)
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
      setFaceData(null)
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
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!canvas || !video || !isActive || !selectedMask || video.readyState !== 4) {
          if (isActive) {
            animationFrameRef.current = requestAnimationFrame(animate)
          }
          return
        }

        const ctx = canvas.getContext('2d')
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 480

        ctx.save()
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        let currentFaceData = null
        frameCountRef.current++

        // Detect face every 5 frames (for performance)
        const shouldDetect = modelsLoaded && (frameCountRef.current % 5 === 0 || !faceDetectionRef.current)

        if (shouldDetect) {
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
                setFaceData({ ...faceDetectionRef.current })
              }
            })
            .catch((error) => {
              // Silently handle detection errors
            })
        }

        // Use last detected face position or estimate
        if (faceDetectionRef.current) {
          currentFaceData = { ...faceDetectionRef.current }
          setFaceData(currentFaceData)
        } else {
          // Fallback: estimate face position
          const faceCenterX = canvas.width / 2
          const faceCenterY = canvas.height / 2 - canvas.height * 0.1
          const faceWidth = canvas.width * 0.5
          const faceHeight = canvas.height * 0.6
          
          currentFaceData = {
            x: faceCenterX,
            y: faceCenterY,
            width: faceWidth,
            height: faceHeight,
            landmarks: null
          }
          setFaceData(currentFaceData)
        }

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
      setFaceData(null)
    }
  }, [isActive, selectedMask, modelsLoaded])

  if (!isActive) {
    return null
  }

  const videoWidth = videoRef.current?.videoWidth || 640
  const videoHeight = videoRef.current?.videoHeight || 480

  return (
    <div className="face-mask-ar-3d">
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
      
      {/* 3D Model Overlay */}
      {selectedMask?.modelPath && faceData && videoWidth > 0 && videoHeight > 0 && (
        <div 
          className="ar-3d-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            transform: 'scaleX(-1)',
            zIndex: 3
          }}
        >
          <Canvas
            ref={threeCanvasRef}
            camera={{ position: [0, 0, 5], fov: 50 }}
            style={{ width: '100%', height: '100%', background: 'transparent' }}
            gl={{ alpha: true, antialias: true }}
          >
            <ambientLight intensity={0.8} />
            <directionalLight position={[5, 8, 5]} intensity={1.5} />
            <directionalLight position={[-5, 3, -5]} intensity={0.5} />
            <pointLight position={[0, 5, 5]} intensity={0.8} />
            <Suspense fallback={null}>
              <Mask3DModel
                modelPath={selectedMask.modelPath}
                faceData={faceData}
                videoWidth={videoWidth}
                videoHeight={videoHeight}
              />
            </Suspense>
          </Canvas>
        </div>
      )}

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

export default FaceMaskAR3D

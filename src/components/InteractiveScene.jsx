import { useState, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { sceneObjects, sceneBackgrounds, performanceScenes } from '../data/sceneData'
import ParticleBackground from './ParticleBackground'
import Scene3D from './Scene3D'
import './InteractiveScene.css'

function InteractiveScene({ performanceId, onBack }) {
  const [selectedObject, setSelectedObject] = useState(null)
  const [hoveredObject, setHoveredObject] = useState(null)
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0)
  
  const availableScenes = performanceScenes[performanceId] || []
  const currentScene = availableScenes[currentSceneIndex] || availableScenes[0]
  const objects = sceneObjects[currentScene?.sceneId || performanceId] || []
  const background = sceneBackgrounds[currentScene?.sceneId || performanceId] || sceneBackgrounds[1]

  const handleObjectClick = (obj) => {
    setSelectedObject(obj)
  }

  const closeModal = () => {
    setSelectedObject(null)
  }

  return (
    <div className="interactive-scene">
      <ParticleBackground />
      <div className="scene-header">
        <button className="back-btn" onClick={onBack}>
          ← Quay lại
        </button>
        <h2>Khám Phá Cảnh Tuồng</h2>
        <p>Click vào các vật thể để tìm hiểu thêm</p>
      </div>

      <div className="scene-navigation">
        <h3>Chọn Cảnh:</h3>
        <div className="scene-buttons">
          {availableScenes.map((scene, index) => (
            <motion.button
              key={scene.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`scene-nav-btn ${currentSceneIndex === index ? 'active' : ''}`}
              onClick={() => {
                setCurrentSceneIndex(index)
                setSelectedObject(null)
              }}
            >
              {scene.name}
            </motion.button>
          ))}
        </div>
      </div>

      <div 
        className="scene-container"
        style={{ background: background.gradient }}
      >
        <div className="scene-background">
          <div className="scene-title">{background.name}</div>
          <div className="scene-description">{background.description}</div>
          
          {/* 3D Scene */}
          <div className="scene-3d-container">
            <Canvas shadows camera={{ position: [0, 3, 5], fov: 50 }}>
              <Suspense fallback={null}>
                <PerspectiveCamera makeDefault position={[0, 3, 5]} />
                <ambientLight intensity={0.6} />
                <directionalLight
                  position={[5, 8, 5]}
                  intensity={1}
                  castShadow
                />
                <pointLight position={[-5, 5, -5]} intensity={0.5} />
                
                <OrbitControls
                  enableZoom={true}
                  enablePan={true}
                  minDistance={3}
                  maxDistance={10}
                  minPolarAngle={Math.PI / 6}
                  maxPolarAngle={Math.PI / 2.5}
                />
                
                <Scene3D
                  objects={objects}
                  sceneType={background.sceneType || 'battlefield'}
                  onObjectClick={handleObjectClick}
                />
              </Suspense>
            </Canvas>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedObject && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="modal-overlay"
              onClick={closeModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotateX: -15 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotateX: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="object-modal"
              onClick={(e) => e.stopPropagation()}
              style={{ 
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            >
            <button className="modal-close" onClick={closeModal}>
              ✕
            </button>
            
            <div className="modal-header">
              <span className="modal-emoji" style={{ fontSize: '4rem' }}>
                {selectedObject.emoji}
              </span>
              <h3>{selectedObject.name}</h3>
            </div>

            <div className="modal-content">
              <p className="modal-description">{selectedObject.description}</p>
              
              <div className="modal-details">
                <h4>Chi Tiết</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">📦 Chất liệu:</span>
                    <span className="detail-value">{selectedObject.details.material}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">💡 Ý nghĩa:</span>
                    <span className="detail-value">{selectedObject.details.meaning}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">📚 Lịch sử:</span>
                    <span className="detail-value">{selectedObject.details.history}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">🎭 Cách sử dụng:</span>
                    <span className="detail-value">{selectedObject.details.usage}</span>
                  </div>
                </div>
              </div>

              <div className="ai-insight">
                <div className="ai-avatar">🤖</div>
                <div className="ai-text">
                  <strong>AI Insight:</strong> {selectedObject.name} là một phần quan trọng 
                  trong vở Tuồng này, mang ý nghĩa sâu sắc về {selectedObject.details.meaning.toLowerCase()}.
                </div>
              </div>
            </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="scene-hint">
        <p>💡 Tip: Di chuột qua các vật thể để xem tên, click để xem chi tiết</p>
      </div>
    </div>
  )
}

export default InteractiveScene


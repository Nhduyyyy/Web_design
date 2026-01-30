import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sceneObjects, sceneBackgrounds, performanceSceneIdMap } from '../data/sceneData'
import ItemDetailModal from './ItemDetailModal'
import './InteractiveScene.css'

function getStablePosition(obj, sceneId, i) {
  if (obj.position) return obj.position
  const seed = (sceneId * 10 + i) % 100
  return {
    x: 10 + (seed * 0.7) % 70,
    y: 15 + ((seed * 11) % 60)
  }
}

function InteractiveScene({ performance, performanceId, onBack }) {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0)
  const [foundIds, setFoundIds] = useState(() => new Set())
  const [selectedObject, setSelectedObject] = useState(null)

  const availableScenes = useMemo(() => {
    const scenes = performance?.scenes || []
    const sceneIds = performanceSceneIdMap?.[performanceId] || []
    return scenes.map((s, i) => ({
      id: i + 1,
      name: s.name,
      time: s.time,
      sceneId: sceneIds[i] ?? sceneIds[0] ?? 1
    }))
  }, [performance, performanceId])

  const currentScene = availableScenes[currentSceneIndex] || availableScenes[0]
  const sceneId = currentScene?.sceneId ?? 1
  const objects = sceneObjects[sceneId] || []
  const background = sceneBackgrounds[sceneId] || sceneBackgrounds[1]
  const allFound = objects.length > 0 && foundIds.size >= objects.length
  const isLastScene = currentSceneIndex >= availableScenes.length - 1

  const objectsWithPosition = useMemo(() => {
    return objects.map((obj, i) => {
      const pos = getStablePosition(obj, sceneId, i)
      return { ...obj, displayPos: pos }
    })
  }, [objects, sceneId])

  const score = useMemo(() => {
    const base = currentSceneIndex * 1000
    const found = foundIds.size * 250
    return base + found
  }, [currentSceneIndex, foundIds.size])

  const firstUnfoundIndex = objects.findIndex((o) => !foundIds.has(o.id))

  const handleObjectClick = useCallback((obj) => {
    setFoundIds((prev) => new Set(prev).add(obj.id))
    setSelectedObject(obj)
  }, [])

  const goNextScene = useCallback(() => {
    setFoundIds(new Set())
    setSelectedObject(null)
    if (currentSceneIndex < availableScenes.length - 1) {
      setCurrentSceneIndex((i) => i + 1)
    }
  }, [currentSceneIndex, availableScenes.length])

  const resetToScene = useCallback((index) => {
    setCurrentSceneIndex(index)
    setFoundIds(new Set())
    setSelectedObject(null)
  }, [])

  return (
    <div className="find-props-page">
      <header className="find-props-header">
        <div className="find-props-header-left">
          <button type="button" className="find-props-back" onClick={onBack}>
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Quay lại</span>
          </button>
        </div>
        <div className="find-props-header-center">
          <h1 className="find-props-title">Tìm Đạo Cụ — Giải Đố Tuồng</h1>
          <p className="find-props-subtitle">Khám phá nét đẹp văn hóa qua từng vật phẩm sân khấu</p>
        </div>
        <div className="find-props-header-right">
          <button type="button" className="find-props-help" aria-label="Hướng dẫn">
            <span className="material-symbols-outlined">help</span>
          </button>
          <div className="find-props-score">
            <span>Điểm: {score}</span>
          </div>
        </div>
      </header>

      <main className="find-props-main">
        <div className="find-props-instructions">
          <p>
            Tìm các đạo cụ ẩn giấu trong cảnh diễn bên dưới để mở khóa nội dung tiếp theo và tìm hiểu về ý nghĩa của chúng.
          </p>
        </div>

        <div className="find-props-scene-nav">
          <div className="find-props-scene-chips">
            {availableScenes.map((scene, index) => (
              <button
                key={scene.id}
                type="button"
                className={`find-props-chip ${currentSceneIndex === index ? 'active' : ''}`}
                onClick={() => resetToScene(index)}
              >
                <span className="find-props-chip-time">{scene.time}</span>
                <span className="find-props-chip-name">{scene.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="find-props-grid">
          <aside className="find-props-sidebar">
            <h3 className="find-props-sidebar-title">Danh sách đạo cụ</h3>
            <div className="find-props-checklist">
              {objects.map((obj, index) => {
                const found = foundIds.has(obj.id)
                const isTarget = !found && index === firstUnfoundIndex
                return (
                  <div
                    key={obj.id}
                    className={`find-props-checklist-item ${found ? 'found' : ''} ${isTarget ? 'target' : ''}`}
                  >
                    <div className="find-props-checklist-circle">
                      {found ? (
                        <span className="material-symbols-outlined">check</span>
                      ) : null}
                    </div>
                    <span className="find-props-checklist-label">{obj.name}</span>
                  </div>
                )
              })}
            </div>
            <div className="find-props-progress-block">
              <div className="find-props-progress-head">
                <span className="find-props-progress-label">Tiến trình</span>
                <span className="find-props-progress-value">
                  {foundIds.size} / {objects.length || 1}
                </span>
              </div>
              <div className="find-props-progress-track">
                <div
                  className="find-props-progress-fill"
                  style={{
                    width: `${objects.length ? (foundIds.size / objects.length) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          </aside>

          <div className="find-props-stage-area">
            <div className="find-props-stage stage-gradient">
              <div className="find-props-stage-bg" aria-hidden="true" />
              {objectsWithPosition.map((obj) => {
                const found = foundIds.has(obj.id)
                return (
                  <motion.button
                    key={obj.id}
                    type="button"
                    className={`find-props-prop ${found ? 'found' : ''}`}
                    style={{
                      left: `${obj.displayPos.x}%`,
                      top: `${obj.displayPos.y}%`
                    }}
                    onClick={() => !found && handleObjectClick(obj)}
                    whileHover={!found ? { scale: 1.1 } : {}}
                    whileTap={!found ? { scale: 0.95 } : {}}
                    title={found ? 'Đã tìm' : obj.name}
                  >
                    <span className="find-props-prop-emoji">{obj.emoji}</span>
                    {found && <span className="find-props-prop-badge">ĐÃ TÌM THẤY</span>}
                  </motion.button>
                )
              })}
              <div className="find-props-stage-overlay" aria-hidden="true" />
              <div className="find-props-stage-mode">
                <span className="material-symbols-outlined">visibility</span>
                <span>CHẾ ĐỘ QUAN SÁT</span>
              </div>
            </div>

            <div className="find-props-scene-card">
              <div className="find-props-scene-card-text">
                <h4 className="find-props-scene-card-title">
                  Cảnh: {currentScene?.name}
                </h4>
                <p className="find-props-scene-card-desc">{background.description}</p>
              </div>
              <div className="find-props-scene-card-meta">
                <div className="find-props-avatars">
                  <span>VN</span>
                  <span>TR</span>
                </div>
                <span className="find-props-meta-count">324 người đã tìm thấy</span>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {allFound && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="find-props-completion"
            >
              <div className="find-props-completion-content">
                <div className="find-props-completion-head">
                  <span className="material-symbols-outlined">stars</span>
                  <span className="find-props-completion-badge">Cảnh hoàn tất</span>
                </div>
                <h2 className="find-props-completion-title">Tuyệt vời! Bạn đã khám phá hết bí mật.</h2>
                <p className="find-props-completion-desc">
                  Hành trình của bạn tiếp tục với chương tiếp theo của vở kịch.
                </p>
              </div>
              <div className="find-props-completion-actions">
                <button
                  type="button"
                  className="find-props-btn-next"
                  onClick={isLastScene ? onBack : goNextScene}
                >
                  <span>{isLastScene ? 'Hoàn thành vở — Quay lại' : 'Cảnh tiếp theo'}</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                <button type="button" className="find-props-btn-share">
                  <span className="material-symbols-outlined">share</span>
                  <span>Chia sẻ</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {objects.length === 0 && (
          <div className="find-props-completion">
            <p className="find-props-objects-empty">Cảnh này chưa có đạo cụ.</p>
            <button type="button" className="find-props-btn-next" onClick={goNextScene}>
              {isLastScene ? 'Quay lại' : 'Cảnh tiếp theo'}
            </button>
          </div>
        )}
      </main>

      <footer className="find-props-footer">
        <div className="find-props-footer-inner">
          <div className="find-props-footer-left">
            <span className="find-props-footer-icon" aria-hidden="true">◆</span>
            <span>Dự án Bảo tồn Văn hóa Tuồng Việt Nam © 2024</span>
          </div>
          <div className="find-props-footer-links">
            <a href="#terms">Điều khoản</a>
            <a href="#guide">Hướng dẫn</a>
            <a href="#contact">Liên hệ</a>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {selectedObject && (
          <ItemDetailModal
            item={selectedObject}
            type="prop"
            onClose={() => setSelectedObject(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default InteractiveScene

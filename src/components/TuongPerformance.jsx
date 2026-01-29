import { useState } from 'react'
import { motion } from 'framer-motion'
import InteractiveScene from './InteractiveScene'
import './TuongPerformance.css'

const performances = [
  {
    id: 1,
    title: 'Tuồng Cổ Điển - Quan Công',
    description: 'Vở Tuồng về nhân vật Quan Công, thể hiện lòng trung thành và dũng cảm',
    duration: '45 phút',
    category: 'Cổ Điển',
    scenes: [
      { name: 'Cảnh 1: Xuất hiện', time: '0:00' },
      { name: 'Cảnh 2: Chiến đấu', time: '15:30' },
      { name: 'Cảnh 3: Kết thúc', time: '35:00' }
    ]
  },
  {
    id: 2,
    title: 'Tuồng Thị Kính',
    description: 'Câu chuyện về người phụ nữ đức hạnh, biểu tượng của phụ nữ Việt Nam',
    duration: '60 phút',
    category: 'Truyền Thống',
    scenes: [
      { name: 'Cảnh 1: Gia đình', time: '0:00' },
      { name: 'Cảnh 2: Thử thách', time: '20:00' },
      { name: 'Cảnh 3: Hạnh phúc', time: '45:00' }
    ]
  },
  {
    id: 3,
    title: 'Tuồng Tam Quốc',
    description: 'Vở Tuồng dựa trên tiểu thuyết Tam Quốc Diễn Nghĩa',
    duration: '90 phút',
    category: 'Lịch Sử',
    scenes: [
      { name: 'Cảnh 1: Khởi đầu', time: '0:00' },
      { name: 'Cảnh 2: Xung đột', time: '30:00' },
      { name: 'Cảnh 3: Hòa giải', time: '60:00' },
      { name: 'Cảnh 4: Kết thúc', time: '80:00' }
    ]
  }
]

function TuongPerformance() {
  const [selectedPerformance, setSelectedPerformance] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [showInteractiveScene, setShowInteractiveScene] = useState(false)

  const handlePlay = () => {
    setIsPlaying(true)
    // Simulate video playback
    const interval = setInterval(() => {
      setCurrentTime(prev => {
        if (prev >= 100) {
          setIsPlaying(false)
          clearInterval(interval)
          return 0
        }
        return prev + 1
      })
    }, 100)
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  if (showInteractiveScene && selectedPerformance) {
    return (
      <InteractiveScene 
        performanceId={selectedPerformance.id}
        onBack={() => setShowInteractiveScene(false)}
      />
    )
  }

  return (
    <div className="tuong-performance">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="performance-header"
        >
          <h2 className="section-title">
            <span className="watch-icon">🎬</span> Xem Tuồng
          </h2>
          <p className="section-subtitle">
            Khám phá các vở Tuồng truyền thống Việt Nam
          </p>
        </motion.div>

        <div className="performance-content">
          <div className="performance-list">
            <h3>Danh Sách Vở Tuồng</h3>
            <div className="performance-grid">
              {performances.map((performance, index) => (
                <motion.div
                  key={performance.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`performance-card ${
                    selectedPerformance?.id === performance.id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedPerformance(performance)}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="performance-thumbnail">
                    <div className="thumbnail-placeholder">
                      <span style={{ fontSize: '4rem' }}>🎭</span>
                    </div>
                    <div className="performance-category">{performance.category}</div>
                  </div>
                  <div className="performance-info">
                    <h4>{performance.title}</h4>
                    <p>{performance.description}</p>
                    <div className="performance-meta">
                      <span>⏱️ {performance.duration}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {selectedPerformance && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="performance-player"
            >
              <div className="player-header">
                <h3>{selectedPerformance.title}</h3>
                <button
                  className="close-btn"
                  onClick={() => {
                    setSelectedPerformance(null)
                    setIsPlaying(false)
                    setCurrentTime(0)
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="video-container">
                <div className="video-placeholder">
                  <div className="video-content">
                    <motion.div
                      animate={isPlaying ? { rotate: 360 } : {}}
                      transition={{ duration: 2, repeat: isPlaying ? Infinity : 0 }}
                      className="playing-icon"
                    >
                      🎭
                    </motion.div>
                    <p className="video-text">
                      {isPlaying ? 'Đang phát...' : 'Nhấn Play để xem'}
                    </p>
                    <div className="video-simulation">
                      {isPlaying && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 10 }}
                          className="progress-bar"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="player-controls">
                  <button
                    className="control-btn play-pause"
                    onClick={isPlaying ? handlePause : handlePlay}
                  >
                    {isPlaying ? '⏸️' : '▶️'}
                  </button>
                  <div className="progress-container">
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${currentTime}%` }}
                      />
                    </div>
                    <span className="time-display">
                      {Math.floor(currentTime / 100 * 45)}:00 / {selectedPerformance.duration}
                    </span>
                  </div>
                  <button className="control-btn fullscreen">⛶</button>
                </div>
              </div>

              <div className="performance-details">
                <h4>Thông Tin Vở Tuồng</h4>
                <p>{selectedPerformance.description}</p>
                <div className="scenes-list">
                  <h5>Các Cảnh:</h5>
                  <ul>
                    {selectedPerformance.scenes.map((scene, idx) => (
                      <li key={idx}>
                        <span className="scene-time">{scene.time}</span>
                        <span className="scene-name">{scene.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="interactive-btn"
                  onClick={() => setShowInteractiveScene(true)}
                >
                  🎯 Khám Phá Cảnh Tương Tác
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>

        <div className="performance-info-section">
          <h3>Về Nghệ Thuật Tuồng</h3>
          <div className="info-grid">
            <div className="info-card">
              <span className="info-icon">📚</span>
              <h4>Lịch Sử</h4>
              <p>Tuồng là loại hình nghệ thuật sân khấu cổ truyền của Việt Nam, xuất hiện từ thế kỷ 17</p>
            </div>
            <div className="info-card">
              <span className="info-icon">🎭</span>
              <h4>Đặc Điểm</h4>
              <p>Sử dụng mặt nạ, trang phục đặc trưng và các động tác múa võ thuật</p>
            </div>
            <div className="info-card">
              <span className="info-icon">🎪</span>
              <h4>Vai Trò</h4>
              <p>Giữ gìn và phát huy giá trị văn hóa dân tộc, giáo dục đạo đức</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TuongPerformance


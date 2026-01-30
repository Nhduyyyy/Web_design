import { useState } from 'react'
import { motion } from 'framer-motion'
import InteractiveScene from './InteractiveScene'
import './TuongPerformance.css'

const performances = [
  {
    id: 1,
    title: 'Sơn Hậu (Tam nữ đồ vương)',
    description: 'Cuộc chiến giành ngai vàng — hoàng hậu, công chúa, cung nữ bảo vệ hoàng tử, phục hồi triều đình.',
    duration: '~90 phút',
    category: 'Cổ Điển',
    content: `Vở tuồng kể về cuộc chiến giành ngai vàng của nhà vua nước Sơn Hậu. Sau khi vua mất, gian thần Tạ Ôn Đình âm mưu cướp ngôi, giết hại trung thần và ép hoàng hậu, công chúa phải trốn chạy. Ba người phụ nữ trung nghĩa — Hoàng hậu, Công chúa, Cung nữ — đã vượt qua nhiều nguy hiểm để bảo vệ hoàng tử và phục hồi triều đình. Cuối cùng, chính nghĩa thắng gian tà, triều đình được khôi phục.`,
    meaning: 'Ca ngợi lòng trung thành, đức hy sinh và sự kiên cường của phụ nữ.',
    scenes: [
      { name: 'Vua mất, gian thần cướp ngôi', time: '0:00' },
      { name: 'Hoàng hậu, công chúa, cung nữ trốn chạy', time: '25:00' },
      { name: 'Bảo vệ hoàng tử, phục hồi triều đình', time: '60:00' }
    ]
  },
  {
    id: 2,
    title: 'Đào Tam Xuân loạn trào',
    description: 'Nữ tướng bị hãm hại, mất chồng con — đem quân đòi công lý, loạn trào rồi quay về trung nghĩa.',
    duration: '~75 phút',
    category: 'Truyền Thống',
    content: `Đào Tam Xuân là một nữ tướng tài giỏi. Vì bị gian thần hãm hại, chồng và con bà bị giết oan. Quá đau khổ và phẫn uất, bà đem quân vào triều đình để đòi công lý. Trước cảnh vua quan thối nát, bà nổi giận, làm loạn triều đình. Cuối cùng, bà nhận ra sai lầm và chọn con đường trung nghĩa.`,
    meaning: 'Thể hiện tình mẫu tử sâu sắc, nỗi đau mất người thân và cuộc đấu tranh giữa tình riêng và nghĩa lớn.',
    scenes: [
      { name: 'Gian thần hãm hại, mất chồng con', time: '0:00' },
      { name: 'Đem quân đòi công lý, loạn triều đình', time: '30:00' },
      { name: 'Nhận ra sai lầm, chọn trung nghĩa', time: '60:00' }
    ]
  },
  {
    id: 3,
    title: 'Trần Bình Trọng',
    description: 'Tướng nhà Trần bị bắt, quân Nguyên dụ làm vua bù nhìn — "Ta thà làm quỷ nước Nam..." và hi sinh anh dũng.',
    duration: '~60 phút',
    category: 'Lịch Sử',
    content: `Dựa theo nhân vật lịch sử thời nhà Trần. Khi quân Nguyên – Mông xâm lược, Trần Bình Trọng bị bắt. Quân giặc dụ dỗ ông làm vua bù nhìn để phản bội Tổ quốc. Ông kiên quyết từ chối và nói câu nổi tiếng: "Ta thà làm quỷ nước Nam, còn hơn làm vua đất Bắc." Cuối cùng, ông hi sinh anh dũng.`,
    meaning: 'Tôn vinh lòng yêu nước, khí phách anh hùng và tinh thần bất khuất.',
    scenes: [
      { name: 'Quân Nguyên xâm lược, Trần Bình Trọng bị bắt', time: '0:00' },
      { name: 'Dụ dỗ làm vua bù nhìn, từ chối', time: '20:00' },
      { name: '"Ta thà làm quỷ nước Nam..." — hi sinh', time: '45:00' }
    ]
  },
  {
    id: 4,
    title: 'San Hậu (Hồ Nguyệt Cô hóa cáo)',
    description: 'Hồ ly tinh tu luyện thành người, yêu tướng quân, bị lừa mất ngọc — mất phép, hóa lại thành cáo.',
    duration: '~80 phút',
    category: 'Truyền Thống',
    content: `Hồ Nguyệt Cô là hồ ly tinh tu luyện thành người. Nàng yêu tướng quân Tiết Giao và giúp chàng đánh giặc. Vì quá tin người, nàng bị lừa lấy mất viên ngọc phép thuật. Mất phép, nàng dần trở lại thành cáo. Trong đau khổ và tuyệt vọng, nàng chết trong cô độc.`,
    meaning: 'Nói về tình yêu mù quáng, sự phản bội và bi kịch của lòng tin sai chỗ.',
    scenes: [
      { name: 'Hồ Nguyệt Cô tu luyện, yêu Tiết Giao', time: '0:00' },
      { name: 'Bị lừa mất ngọc, mất phép', time: '35:00' },
      { name: 'Hóa lại thành cáo, chết cô độc', time: '65:00' }
    ]
  },
  {
    id: 5,
    title: 'Lưu Kim Đính giải giá Thọ Châu',
    description: 'Nữ tướng giả trai ra trận, cứu vua bị vây ở Thọ Châu — phá vòng vây, thân phận tiết lộ, được phong thưởng.',
    duration: '~85 phút',
    category: 'Cổ Điển',
    content: `Lưu Kim Đính là nữ tướng giả trai để ra trận. Nàng cứu vua bị vây ở thành Thọ Châu. Trải qua nhiều trận đánh nguy hiểm, nàng phá vòng vây thành công. Sau chiến thắng, thân phận nữ nhi được tiết lộ. Nàng được phong thưởng và ca ngợi.`,
    meaning: 'Ca ngợi tài trí phụ nữ, lòng yêu nước và tinh thần anh hùng.',
    scenes: [
      { name: 'Nữ tướng giả trai, vua bị vây Thọ Châu', time: '0:00' },
      { name: 'Trận đánh, phá vòng vây', time: '35:00' },
      { name: 'Thân phận tiết lộ, phong thưởng', time: '75:00' }
    ]
  }
]

// Lịch diễn mẫu — có thể kết nối API thật sau
const scheduleData = [
  { id: 1, title: 'Sơn Hậu (Tam nữ đồ vương)', venue: 'Nhà hát Tuồng Việt Nam', date: '15/02/2026', time: '19:30', city: 'Hà Nội' },
  { id: 2, title: 'Đào Tam Xuân loạn trào', venue: 'Nhà hát Nghệ thuật Truyền thống', date: '22/02/2026', time: '20:00', city: 'TP.HCM' },
  { id: 3, title: 'Trần Bình Trọng', venue: 'Trung tâm Văn hóa', date: '01/03/2026', time: '19:00', city: 'Đà Nẵng' },
  { id: 4, title: 'San Hậu (Hồ Nguyệt Cô hóa cáo)', venue: 'Nhà hát Tuồng Việt Nam', date: '08/03/2026', time: '19:30', city: 'Hà Nội' },
  { id: 5, title: 'Lưu Kim Đính giải giá Thọ Châu', venue: 'Nhà hát Nghệ thuật Truyền thống', date: '15/03/2026', time: '20:00', city: 'TP.HCM' }
]

const TABS = [
  { id: 'watch', label: 'Vở diễn', icon: '🎬' },
  { id: 'schedule', label: 'Lịch diễn', icon: '📅' },
  { id: 'about', label: 'Giới thiệu', icon: '📚' }
]

function TuongPerformance() {
  const [activeTab, setActiveTab] = useState('watch')
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
          <h2 className="section-title">Xem Tuồng</h2>
          <p className="section-subtitle">
            Khám phá các vở Tuồng truyền thống Việt Nam
          </p>
          <nav className="performance-tabs" aria-label="Chọn mục">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`performance-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </nav>
        </motion.div>

        {activeTab === 'watch' && (
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
                <p className="performance-summary">{selectedPerformance.description}</p>
                {selectedPerformance.content && (
                  <>
                    <h5>📖 Nội dung</h5>
                    <p className="performance-content">{selectedPerformance.content}</p>
                  </>
                )}
                {selectedPerformance.meaning && (
                  <>
                    <h5>🎭 Ý nghĩa</h5>
                    <p className="performance-meaning">{selectedPerformance.meaning}</p>
                  </>
                )}
                <div className="scenes-list">
                  <h5>Các cảnh chính</h5>
                  <ul>
                    {selectedPerformance.scenes.map((scene, idx) => (
                      <li key={idx}>
                        <span className="scene-time">{scene.time}</span>
                        <span className="scene-name">{scene.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="player-actions">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="interactive-btn"
                    onClick={() => setShowInteractiveScene(true)}
                  >
                    🎯 Khám Phá Cảnh Tương Tác
                  </motion.button>
                  <motion.a
                    href="#"
                    className="interactive-btn secondary"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => e.preventDefault()}
                  >
                    🎫 Đặt vé xem trực tiếp
                  </motion.a>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        )}

        {activeTab === 'schedule' && (
        <section className="schedule-section schedule-section-standalone">
          <h3 className="schedule-title">
            <span className="schedule-icon">📅</span> Lịch Diễn Sắp Tới
          </h3>
          <p className="schedule-intro">
            Xem Tuồng trực tiếp tại rạp — đặt vé trước để chọn chỗ ngồi đẹp.
          </p>
          <div className="schedule-grid">
            {scheduleData.map((show) => (
              <motion.div
                key={show.id}
                className="schedule-card"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: show.id * 0.1 }}
              >
                <div className="schedule-card-header">
                  <span className="schedule-emoji">🎭</span>
                  <h4>{show.title}</h4>
                </div>
                <ul className="schedule-details">
                  <li>📍 {show.venue}</li>
                  <li>🏙️ {show.city}</li>
                  <li>📆 {show.date} — {show.time}</li>
                </ul>
                <motion.a
                  href="#"
                  className="schedule-cta"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => e.preventDefault()}
                >
                  🎫 Đặt vé
                </motion.a>
              </motion.div>
            ))}
          </div>
        </section>
        )}

        {activeTab === 'about' && (
        <div className="performance-info-section performance-info-section-standalone">
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
        )}
      </div>
    </div>
  )
}

export default TuongPerformance


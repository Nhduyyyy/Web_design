import { useState, useMemo, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import InteractiveScene from './InteractiveScene'
import Schedule from './Schedule'
import LiveStream from './LiveStream'
import Events from './Events'
import './TuongPerformance.css'

const performances = [
  {
    id: 1,
    title: 'Sơn Hậu (Tam nữ đồ vương)',
    description: 'Cuộc chiến giành ngai vàng — hoàng hậu, công chúa, cung nữ bảo vệ hoàng tử, phục hồi triều đình.',
    duration: '90 phút',
    durationShort: '90 phút',
    category: 'Cổ Điển',
    categoryStyle: 'primary',
    content: `Vở tuồng kể về cuộc chiến giành ngai vàng của nhà vua nước Sơn Hậu. Sau khi vua mất, gian thần Tạ Ôn Đình âm mưu cướp ngôi, giết hại trung thần và ép hoàng hậu, công chúa phải trốn chạy. Ba người phụ nữ trung nghĩa — Hoàng hậu, Công chúa, Cung nữ — đã vượt qua nhiều nguy hiểm để bảo vệ hoàng tử và phục hồi triều đình. Cuối cùng, chính nghĩa thắng gian tà, triều đình được khôi phục.`,
    meaning: 'Ca ngợi lòng trung thành, đức hy sinh và sự kiên cường của phụ nữ.',
    era: 'Cổ điển',
    metaType: 'Tam nữ đồ vương',
    rating: '4.8',
    thumb: '/backgrounds/bec029d1937648da5a7c3ac4205a7af3.jpg',
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
    duration: '75 phút',
    durationShort: '75 phút',
    category: 'Truyền Thống',
    categoryStyle: 'blue',
    content: `Đào Tam Xuân là một nữ tướng tài giỏi. Vì bị gian thần hãm hại, chồng và con bà bị giết oan. Quá đau khổ và phẫn uất, bà đem quân vào triều đình để đòi công lý. Trước cảnh vua quan thối nát, bà nổi giận, làm loạn triều đình. Cuối cùng, bà nhận ra sai lầm và chọn con đường trung nghĩa.`,
    meaning: 'Thể hiện tình mẫu tử sâu sắc, nỗi đau mất người thân và cuộc đấu tranh giữa tình riêng và nghĩa lớn.',
    era: 'Truyền thống',
    metaType: 'Nữ tướng',
    rating: '4.7',
    thumb: '/backgrounds/86d43775d9b7e5099c3a5bb74ddc17bd.jpg',
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
    duration: '60 phút',
    durationShort: '60 phút',
    category: 'Lịch Sử',
    categoryStyle: 'accent',
    content: `Dựa theo nhân vật lịch sử thời nhà Trần. Khi quân Nguyên – Mông xâm lược, Trần Bình Trọng bị bắt. Quân giặc dụ dỗ ông làm vua bù nhìn để phản bội Tổ quốc. Ông kiên quyết từ chối và nói câu nổi tiếng: "Ta thà làm quỷ nước Nam, còn hơn làm vua đất Bắc." Cuối cùng, ông hi sinh anh dũng.`,
    meaning: 'Tôn vinh lòng yêu nước, khí phách anh hùng và tinh thần bất khuất.',
    era: 'Thế kỷ XIII',
    metaType: 'Nhân vật lịch sử',
    rating: '4.9',
    thumb: '/backgrounds/d5ae63e2b4e5c731cd19b2564c246b26.jpg',
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
    duration: '80 phút',
    durationShort: '80 phút',
    category: 'Truyền Thống',
    categoryStyle: 'blue',
    content: `Hồ Nguyệt Cô là hồ ly tinh tu luyện thành người. Nàng yêu tướng quân Tiết Giao và giúp chàng đánh giặc. Vì quá tin người, nàng bị lừa lấy mất viên ngọc phép thuật. Mất phép, nàng dần trở lại thành cáo. Trong đau khổ và tuyệt vọng, nàng chết trong cô độc.`,
    meaning: 'Nói về tình yêu mù quáng, sự phản bội và bi kịch của lòng tin sai chỗ.',
    era: 'Truyền thống',
    metaType: 'Hồ ly',
    rating: '4.6',
    thumb: '/backgrounds/580081de0d4e4238f2435f48b510249f.jpg',
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
    duration: '85 phút',
    durationShort: '85 phút',
    category: 'Cổ Điển',
    categoryStyle: 'primary',
    content: `Lưu Kim Đính là nữ tướng giả trai để ra trận. Nàng cứu vua bị vây ở thành Thọ Châu. Trải qua nhiều trận đánh nguy hiểm, nàng phá vòng vây thành công. Sau chiến thắng, thân phận nữ nhi được tiết lộ. Nàng được phong thưởng và ca ngợi.`,
    meaning: 'Ca ngợi tài trí phụ nữ, lòng yêu nước và tinh thần anh hùng.',
    era: 'Cổ điển',
    metaType: 'Nữ tướng',
    rating: '4.8',
    thumb: '/backgrounds/d8aa722a4883585459eb023c344be145.jpg',
    scenes: [
      { name: 'Nữ tướng giả trai, vua bị vây Thọ Châu', time: '0:00' },
      { name: 'Trận đánh, phá vòng vây', time: '35:00' },
      { name: 'Thân phận tiết lộ, phong thưởng', time: '75:00' }
    ]
  }
]

// Schedule uses shared `src/data/scheduleData.js` for the canonical event list

const TABS = [
  { id: 'watch', label: 'Vở diễn', icon: '🎬' },
  { id: 'schedule', label: 'Lịch diễn', icon: '📅' },
  { id: 'livestream', label: 'Live Stream', icon: '📡' },
  { id: 'events', label: 'Sự Kiện', icon: '🎭' },
  { id: 'about', label: 'Giới thiệu', icon: '📚' }
]

// Chuyển centi-giây (currentTime) thành chuỗi "M:SS" hoặc "H:MM:SS"
function formatTime(centisec) {
  if (centisec == null || centisec < 0) return '0:00'
  const totalSec = Math.floor(centisec / 100)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const pad = (n) => String(n).padStart(2, '0')
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`
  return `${m}:${pad(s)}`
}

// Small helper to highlight matched query in UI — file-local, lightweight
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
function Highlight({ text = '', query = '' }) {
  if (!query) return <span>{text}</span>
  const re = new RegExp(`(${escapeRegExp(query)})`, 'gi')
  const parts = String(text).split(re)
  return (
    <span>
      {parts.map((part, i) => (
        re.test(part) ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>
      ))}
    </span>
  )
}
function TuongPerformance({ setActiveSection }) {
  const [activeTab, setActiveTab] = useState('watch')
  const [selectedPerformance, setSelectedPerformance] = useState(() => performances[0] ?? null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0) // centiseconds
  const [progressPercent, setProgressPercent] = useState(0)
  const [showInteractiveScene, setShowInteractiveScene] = useState(false)

  // Tổng thời lượng vở (từ duration "90 phút" -> phút; centiseconds = phút * 60 * 100)
  const totalMinutes = useMemo(() => {
    const d = selectedPerformance?.duration
    if (!d) return 0
    const m = String(d).match(/\d+/)
    return m ? parseInt(m[0], 10) : 0
  }, [selectedPerformance?.duration])
  const totalCentisec = totalMinutes * 60 * 100

  // Search UI (watch tab)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const intervalRef = useRef(null)

  // debounce search input (250ms)
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 250)
    return () => clearTimeout(id)
  }, [searchQuery])

  // Filter performances by debounced query (cheap client-side filter)
  const filteredPerformances = useMemo(() => {
    const q = (debouncedQuery || '').toLowerCase()
    if (!q) return performances
    return performances.filter((p) => {
      if (p.title?.toLowerCase().includes(q)) return true
      if (p.description?.toLowerCase().includes(q)) return true
      if (p.category?.toLowerCase().includes(q)) return true
      if (p.scenes && p.scenes.some(s => s.name.toLowerCase().includes(q))) return true
      return false
    })
  }, [debouncedQuery])

  // Deselect selected performance if it is filtered out
  useEffect(() => {
    if (selectedPerformance && !filteredPerformances.find(p => p.id === selectedPerformance.id)) {
      setSelectedPerformance(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])

  const handlePlay = () => {
    if (totalCentisec <= 0) return
    setIsPlaying(true)
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 10
        if (next >= totalCentisec) {
          setIsPlaying(false)
          clearInterval(interval)
          return 0
        }
        setProgressPercent((next / totalCentisec) * 100)
        return next
      })
    }, 100)
    intervalRef.current = interval
  }

  const handlePause = () => {
    setIsPlaying(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  if (showInteractiveScene && selectedPerformance) {
    return (
      <InteractiveScene
        performance={selectedPerformance}
        performanceId={selectedPerformance.id}
        onBack={() => setShowInteractiveScene(false)}
      />
    )
  }

  return (
    <div className="tuong-performance luxury-streaming">
      <header className="tp-header">
        <nav className="tp-header-nav" aria-label="Chọn mục">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`tp-nav-link ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tp-tab-icon">{tab.icon}</span>
              <span className="tp-tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>
      </header>

      {activeTab === 'watch' && (
        <main className="tp-main">
          <div className="tp-sidebar">
            <div className="tp-sidebar-head">
              <h2 className="tp-sidebar-title">Danh Sách Vở Tuồng</h2>
              <span className="tp-sidebar-count">{filteredPerformances.length} Tác phẩm</span>
            </div>
            <div className="tp-play-list custom-scrollbar">
              {filteredPerformances.map((performance) => {
                const isSelected = selectedPerformance?.id === performance.id
                return (
                  <div
                    key={performance.id}
                    role="button"
                    tabIndex={0}
                    className={`tp-play-card ${isSelected ? 'selected gold-gradient-border' : ''}`}
                    onClick={() => setSelectedPerformance(performance)}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedPerformance(performance)}
                  >
                    <div className="tp-play-card-inner">
                      <div className="tp-play-card-thumb">
                        <img
                          src={performance.thumb || '/backgrounds/bec029d1937648da5a7c3ac4205a7af3.jpg'}
                          alt=""
                          className={isSelected ? '' : 'opacity-60'}
                        />
                        {isSelected && (
                          <div className="tp-play-card-overlay">
                            <span className="material-symbols-outlined">play_circle</span>
                          </div>
                        )}
                      </div>
                      <div className="tp-play-card-body">
                        <div className="tp-play-card-meta">
                          <span className={`tp-tag tp-tag-${performance.categoryStyle || 'primary'}`}>
                            {performance.category}
                          </span>
                          <span className="tp-duration">
                            <span className="material-symbols-outlined">schedule</span>
                            {performance.duration}
                          </span>
                        </div>
                        <h3 className="tp-play-card-title">{performance.title}</h3>
                        <p className="tp-play-card-desc">{performance.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="tp-content custom-scrollbar">
            <div className="tp-video-block">
              <img
                className="tp-video-bg"
                src={selectedPerformance?.thumb || '/backgrounds/bec029d1937648da5a7c3ac4205a7af3.jpg'}
                alt=""
              />
              <div className="tp-video-overlay">
                <button
                  type="button"
                  className="tp-video-play-btn"
                  onClick={isPlaying ? handlePause : handlePlay}
                  aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
                >
                  <span className="material-symbols-outlined">play_arrow</span>
                </button>
                <p className="tp-video-prompt">Nhấn Play để xem</p>
              </div>
              <div className="tp-video-controls">
                <div className="tp-progress-track">
                  <div
                    className="tp-progress-fill"
                    style={{ width: `${progressPercent || (totalCentisec ? (currentTime / totalCentisec) * 100 : 0)}%` }}
                  >
                    <span className="tp-progress-knob" />
                  </div>
                </div>
                <div className="tp-controls-row">
                  <div className="tp-controls-left">
                    <button type="button" className="tp-control-icon" onClick={isPlaying ? handlePause : handlePlay}>
                      <span className="material-symbols-outlined">play_arrow</span>
                    </button>
                    <button type="button" className="tp-control-icon">
                      <span className="material-symbols-outlined">volume_up</span>
                    </button>
                    <span className="tp-time-text">
                      {formatTime(currentTime)} / {totalMinutes}:00
                    </span>
                  </div>
                  <div className="tp-controls-right">
                    <button type="button" className="tp-control-icon">
                      <span className="material-symbols-outlined">settings</span>
                    </button>
                    <button type="button" className="tp-control-icon">
                      <span className="material-symbols-outlined">fullscreen</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {selectedPerformance && (
              <div className="tp-details-card">
                <div className="tp-details-head">
                  <div>
                    <h2 className="tp-details-title">{selectedPerformance.title}</h2>
                    <div className="tp-details-meta">
                      <span>
                        <span className="material-symbols-outlined tp-meta-icon">calendar_today</span>
                        {selectedPerformance.era}
                      </span>
                      <span>
                        <span className="material-symbols-outlined tp-meta-icon">person</span>
                        {selectedPerformance.metaType}
                      </span>
                      <span className="tp-rating">
                        <span className="material-symbols-outlined">star</span>
                        {selectedPerformance.rating}/5.0
                      </span>
                    </div>
                  </div>
                  <div className="tp-details-actions">
                    <button type="button" className="tp-circle-btn">
                      <span className="material-symbols-outlined">share</span>
                    </button>
                    <button type="button" className="tp-circle-btn">
                      <span className="material-symbols-outlined">bookmark</span>
                    </button>
                  </div>
                </div>
                <div className="tp-details-grid">
                  <section className="tp-detail-section">
                    <h3 className="tp-section-heading">
                      <span className="material-symbols-outlined tp-accent">menu_book</span>
                      Nội dung
                    </h3>
                    <p className="tp-section-text">
                      {selectedPerformance.id === 3 ? (
                        <>
                          Dựa theo nhân vật lịch sử thời nhà Trần. Khi quân Nguyên – Mông xâm lược, Trần Bình Trọng bị bắt. Quân giặc dụ dỗ ông làm vua bù nhìn để phản bội Tổ quốc. Ông kiên quyết từ chối và nói câu nổi tiếng:{' '}
                          <span className="tp-glow-quote">"Ta thà làm quỷ nước Nam, còn hơn làm vương đất Bắc."</span>
                          {' '}Cuối cùng, ông hi sinh anh dũng.
                        </>
                      ) : (
                        selectedPerformance.content
                      )}
                    </p>
                  </section>
                  <section className="tp-detail-section">
                    <h3 className="tp-section-heading">
                      <span className="material-symbols-outlined tp-accent">auto_awesome</span>
                      Ý nghĩa
                    </h3>
                    <p className="tp-section-text">{selectedPerformance.meaning}</p>
                  </section>
                </div>
                <section className="tp-scenes-section">
                  <h3 className="tp-section-heading">Các cảnh chính</h3>
                  <div className="tp-scenes-list">
                    {selectedPerformance.scenes.map((scene, idx) => (
                      <div key={idx} className="tp-scene-item">
                        <span className="tp-scene-time">{scene.time}</span>
                        <p className="tp-scene-desc">{scene.name}</p>
                      </div>
                    ))}
                  </div>
                </section>
                <div className="tp-cta-row">
                  <motion.button
                    type="button"
                    className="tp-btn-gold"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowInteractiveScene(true)}
                  >
                    <span className="material-symbols-outlined">flare</span>
                    Khám Phá Cảnh Tương Tác
                  </motion.button>
                  <motion.a
                    href="https://www.nhahatdal.vn/dat-ve"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tp-btn-red"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="material-symbols-outlined">local_activity</span>
                    Đặt vé xem trực tiếp
                  </motion.a>
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      {activeTab === 'schedule' && (
        <div className="tp-other-tab">
          <Schedule />
        </div>
      )}
      {activeTab === 'livestream' && (
        <div className="tp-other-tab">
          <LiveStream />
        </div>
      )}
      {activeTab === 'events' && (
        <div className="tp-other-tab">
          <Events />
        </div>
      )}
      {activeTab === 'about' && (
        <div className="tp-other-tab tp-about">
          <h3 className="tp-sidebar-title">Về Nghệ Thuật Tuồng</h3>
          <div className="tp-info-grid">
            <div className="tp-info-card">
              <span className="tp-info-icon">📚</span>
              <h4>Lịch Sử</h4>
              <p>Tuồng là loại hình nghệ thuật sân khấu cổ truyền của Việt Nam, xuất hiện từ thế kỷ 17</p>
            </div>
          </div>
        </div>
      )}

      <div className="tp-footer-line" aria-hidden="true" />
    </div>
  )
}

export default TuongPerformance

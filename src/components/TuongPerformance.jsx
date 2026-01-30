import { useState } from 'react'
import { motion } from 'framer-motion'
import InteractiveScene from './InteractiveScene'
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

function TuongPerformance({ setActiveSection }) {
  const [selectedPerformance, setSelectedPerformance] = useState(performances[2]) // Trần Bình Trọng
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0) // centiseconds
  const [progressPercent, setProgressPercent] = useState(0)
  const [showInteractiveScene, setShowInteractiveScene] = useState(false)

  const totalMinutes = selectedPerformance ? parseInt(selectedPerformance.durationShort?.replace(/\D/g, '') || '60', 10) : 60
  const totalCentisec = totalMinutes * 60 * 100

  const formatTime = (centisec) => {
    const sec = Math.floor(centisec / 100)
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const handlePlay = () => {
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
  }

  const handlePause = () => setIsPlaying(false)

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
      <header className="tuong-streaming-header">
        <nav className="header-nav">
          <button type="button" className="nav-link active">VỞ DIỄN</button>
          <button type="button" className="nav-link">LỊCH DIỄN</button>
          <button type="button" className="nav-link">GIỚI THIỆU</button>
        </nav>
      </header>

      <main className="tuong-streaming-main">
        <div className="sidebar-plays">
          <div className="sidebar-header">
            <h2 className="font-display sidebar-title">Danh Sách Vở Tuồng</h2>
            <span className="sidebar-count">{performances.length} TÁC PHẨM</span>
          </div>
          <div className="play-list custom-scrollbar">
            {performances.map((p) => (
              <motion.div
                key={p.id}
                className={`play-card ${selectedPerformance?.id === p.id ? 'selected gold-gradient-border' : ''}`}
                onClick={() => setSelectedPerformance(p)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="play-card-inner">
                  <div className="play-card-thumb">
                    <img src={p.thumb} alt="" />
                    <div className="play-card-overlay">
                      <span className="material-icons-round">play_circle</span>
                    </div>
                  </div>
                  <div className="play-card-body">
                    <div className="play-card-meta">
                      <span className={`tag tag-${p.categoryStyle || 'accent'}`}>{p.category}</span>
                      <span className="duration">
                        <span className="material-icons-round">schedule</span>
                        {p.durationShort}
                      </span>
                    </div>
                    <h3 className="font-display play-card-title">{p.title}</h3>
                    <p className="play-card-desc">{p.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="main-content custom-scrollbar">
          <div className="video-block red-glow">
            <div className="video-stage">
              <img
                className="video-bg"
                src={selectedPerformance?.thumb || '/backgrounds/bec029d1937648da5a7c3ac4205a7af3.jpg'}
                alt=""
              />
              <div className="video-overlay">
                <button
                  type="button"
                  className="video-play-btn"
                  onClick={isPlaying ? handlePause : handlePlay}
                  aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
                >
                  <span className="material-icons-round">play_arrow</span>
                </button>
                <p className="font-display video-prompt">Nhấn Play để xem</p>
              </div>
            </div>
            <div className="video-controls">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progressPercent || (totalCentisec ? (currentTime / totalCentisec) * 100 : 0)}%` }}>
                  <span className="progress-knob" />
                </div>
              </div>
              <div className="controls-row">
                <div className="controls-left">
                  <button type="button" className="control-icon" onClick={isPlaying ? handlePause : handlePlay}>
                    <span className="material-icons-round">play_arrow</span>
                  </button>
                  <button type="button" className="control-icon">
                    <span className="material-icons-round">volume_up</span>
                  </button>
                  <span className="time-text">
                    {formatTime(currentTime)} / {totalMinutes}:00
                  </span>
                </div>
                <div className="controls-right">
                  <button type="button" className="control-icon">
                    <span className="material-icons-round">settings</span>
                  </button>
                  <button type="button" className="control-icon">
                    <span className="material-icons-round">fullscreen</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {selectedPerformance && (
            <div className="details-block">
              <div className="details-header">
                <div>
                  <h2 className="font-display details-title">{selectedPerformance.title}</h2>
                  <div className="details-meta">
                    <span>
                      <span className="material-icons-round">calendar_today</span>
                      {selectedPerformance.era}
                    </span>
                    <span>
                      <span className="material-icons-round">person</span>
                      {selectedPerformance.metaType}
                    </span>
                    <span className="rating">
                      <span className="material-icons-round">star</span>
                      {selectedPerformance.rating}/5.0
                    </span>
                  </div>
                </div>
                <div className="details-actions">
                  <button type="button" className="circle-btn">
                    <span className="material-icons-round">share</span>
                  </button>
                  <button type="button" className="circle-btn">
                    <span className="material-icons-round">bookmark_border</span>
                  </button>
                </div>
              </div>

              <div className="details-grid">
                <section className="detail-section">
                  <h3 className="font-display section-heading">
                    <span className="material-icons-round">menu_book</span>
                    Nội dung
                  </h3>
                  <p className="section-text">
                    {selectedPerformance.id === 3 ? (
                      <>
                        Dựa theo nhân vật lịch sử thời nhà Trần. Khi quân Nguyên – Mông xâm lược, Trần Bình Trọng bị bắt. Quân giặc dụ dỗ ông làm vua bù nhìn để phản bội Tổ quốc. Ông kiên quyết từ chối và nói câu nổi tiếng:{' '}
                        <span className="highlight-quote">"Ta thà làm quỷ nước Nam, còn hơn làm vương đất Bắc."</span>
                        {' '}Cuối cùng, ông hi sinh anh dũng.
                      </>
                    ) : (
                      selectedPerformance.content
                    )}
                  </p>
                </section>
                <section className="detail-section">
                  <h3 className="font-display section-heading">
                    <span className="material-icons-round">auto_awesome</span>
                    Ý nghĩa
                  </h3>
                  <p className="section-text">{selectedPerformance.meaning}</p>
                </section>
              </div>

              <section className="scenes-section">
                <h3 className="font-display section-heading">Các cảnh chính</h3>
                <div className="scenes-list">
                  {selectedPerformance.scenes.map((scene, idx) => (
                    <div key={idx} className="scene-item">
                      <span className="scene-time">{scene.time}</span>
                      <p className="scene-desc">{scene.name}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="cta-row">
                <motion.button
                  type="button"
                  className="btn-gold"
                  onClick={() => setShowInteractiveScene(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="material-icons-round">flare</span>
                  Khám Phá Cảnh Tương Tác
                </motion.button>
                <motion.button
                  type="button"
                  className="btn-outline-red"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="material-icons-round">local_activity</span>
                  Đặt vé xem trực tiếp
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default TuongPerformance

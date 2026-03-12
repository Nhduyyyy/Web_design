import { useState, useMemo, useEffect, useRef } from 'react'
import { Link } from "react-router-dom";
import { motion } from 'framer-motion'
import InteractiveScene from './InteractiveScene'
import Schedule from './Schedule'
import Events from './Events'
import LivestreamList from './Livestream/LivestreamList'
import { useShows } from '../hooks/useShows'
import './TuongPerformance.css'

// Schedule uses shared `src/data/scheduleData.js` for the canonical event list

const TABS = [
  { id: 'watch', label: 'Vở diễn' },
  { id: 'schedule', label: 'Lịch diễn' },
  { id: 'livestream', label: 'Live Stream' },
  { id: 'events', label: 'Sự Kiện' }
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
  const [selectedPerformance, setSelectedPerformance] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0) // centiseconds
  const [progressPercent, setProgressPercent] = useState(0)
  const [showInteractiveScene, setShowInteractiveScene] = useState(false)

  // Tổng thời lượng vở (duration là phút; centiseconds = phút * 60 * 100)
  const totalMinutes = useMemo(() => {
    const d = selectedPerformance?.duration
    if (typeof d !== 'number') return 0
    return d > 0 ? d : 0
  }, [selectedPerformance?.duration])
  const totalCentisec = totalMinutes * 60 * 100

  // Search UI (watch tab)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const intervalRef = useRef(null)
  const PAGE_SIZE = 5
  const [page, setPage] = useState(1)

  // debounce search input (250ms)
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 250)
    return () => clearTimeout(id)
  }, [searchQuery])

  const { shows, loading: showsLoading, error: showsError } = useShows(
    useMemo(
      () => ({
        search: debouncedQuery || undefined,
      }),
      [debouncedQuery],
    ),
  )

  // Filter shows by debounced query (client-side: title/description/tags/characters)
  const filteredPerformances = useMemo(() => {
    const q = (debouncedQuery || '').toLowerCase()
    if (!q) return shows
    return (shows || []).filter((s) => {
      if (s.title?.toLowerCase().includes(q)) return true
      if (s.description?.toLowerCase().includes(q)) return true
      if (s.synopsis?.toLowerCase().includes(q)) return true
      if ((s.tags || []).some((t) => String(t).toLowerCase().includes(q))) return true
      if ((s.characters || []).some((c) => String(c).toLowerCase().includes(q))) return true
      return false
    })
  }, [shows, debouncedQuery])

  // Pagination (sidebar list)
  const totalPages = useMemo(() => {
    const total = filteredPerformances.length
    return Math.max(1, Math.ceil(total / PAGE_SIZE))
  }, [filteredPerformances.length, PAGE_SIZE])

  const currentPage = Math.min(Math.max(1, page), totalPages)

  const paginatedPerformances = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredPerformances.slice(start, start + PAGE_SIZE)
  }, [filteredPerformances, currentPage, PAGE_SIZE])

  // Reset to first page when search changes (or data changes materially)
  useEffect(() => {
    setPage(1)
  }, [debouncedQuery])

  // Deselect selected performance if it is filtered out
  useEffect(() => {
    const exists = selectedPerformance
      ? filteredPerformances.find((p) => p.id === selectedPerformance.id)
      : null
    if (!exists) {
      setSelectedPerformance(filteredPerformances[0] ?? null)
    }
  }, [filteredPerformances, selectedPerformance])

  // Keep page in range when list size changes
  useEffect(() => {
    if (page !== currentPage) setPage(currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, totalPages])

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

  const selectedTag = selectedPerformance?.tags?.[0] || ''
  const selectedHeroImage =
    selectedPerformance?.cover_image_url ||
    selectedPerformance?.thumbnail_url ||
    '/backgrounds/bec029d1937648da5a7c3ac4205a7af3.jpg'

  return (
    <div className="tuong-performance luxury-streaming">
      <header className="tp-header">
        <nav className="tp-header-nav" aria-label="Chọn mục">
          {TABS.map((tab) => 
            tab.path ? (
              <Link key={tab.id} to={tab.path} className="tp-nav-link">
                <span className="tp-tab-label">{tab.label}</span>
              </Link>
            ) : (
            <button
              key={tab.id}
              type="button"
              className={`tp-nav-link ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tp-tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>
      </header>

      {activeTab === 'watch' && (
        <motion.main
          className="tp-main"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="tp-sidebar">
            <div className="tp-sidebar-head">
              <h2 className="tp-sidebar-title">Danh Sách Vở Tuồng</h2>
              <span className="tp-sidebar-count">{filteredPerformances.length} Tác phẩm</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '10px 0 6px',
              }}
            >
              <span style={{ opacity: 0.8, fontSize: 12 }}>
                Trang {currentPage}/{totalPages}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="tp-control-icon"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  aria-label="Trang trước"
                  title="Trang trước"
                  style={{ opacity: currentPage <= 1 ? 0.4 : 1 }}
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button
                  type="button"
                  className="tp-control-icon"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  aria-label="Trang sau"
                  title="Trang sau"
                  style={{ opacity: currentPage >= totalPages ? 0.4 : 1 }}
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
            <div className="tp-play-list custom-scrollbar">
              {showsLoading && (
                <div className="tp-play-card">
                  <div className="tp-play-card-inner">
                    <div className="tp-play-card-body">
                      <p className="tp-play-card-desc">Đang tải danh sách vở diễn...</p>
                    </div>
                  </div>
                </div>
              )}
              {!showsLoading && showsError && (
                <div className="tp-play-card">
                  <div className="tp-play-card-inner">
                    <div className="tp-play-card-body">
                      <p className="tp-play-card-desc">{showsError}</p>
                    </div>
                  </div>
                </div>
              )}
              {paginatedPerformances.map((performance) => {
                const isSelected = selectedPerformance?.id === performance.id
                const tag = performance?.tags?.[0] || 'Tuồng'
                const durationText =
                  typeof performance?.duration === 'number' ? `${performance.duration} phút` : '—'
                const thumb =
                  performance?.thumbnail_url ||
                  performance?.cover_image_url ||
                  '/backgrounds/bec029d1937648da5a7c3ac4205a7af3.jpg'
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
                          src={thumb}
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
                          <span className="tp-tag tp-tag-primary">
                            {tag}
                          </span>
                          <span className="tp-duration">
                            <span className="material-symbols-outlined">schedule</span>
                            {durationText}
                          </span>
                        </div>
                        <h3 className="tp-play-card-title">{performance.title}</h3>
                        <p className="tp-play-card-desc">{performance.description || performance.synopsis || '—'}</p>
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
                src={selectedHeroImage}
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
                      {!!selectedTag && (
                        <span>
                          <span className="material-symbols-outlined tp-meta-icon">sell</span>
                          {selectedTag}
                        </span>
                      )}
                      {Array.isArray(selectedPerformance.characters) && selectedPerformance.characters.length > 0 && (
                        <span>
                          <span className="material-symbols-outlined tp-meta-icon">person</span>
                          {selectedPerformance.characters.length} nhân vật
                        </span>
                      )}
                      {typeof selectedPerformance.duration === 'number' && (
                        <span>
                          <span className="material-symbols-outlined tp-meta-icon">schedule</span>
                          {selectedPerformance.duration} phút
                        </span>
                      )}
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
                      {selectedPerformance.synopsis || selectedPerformance.description || '—'}
                    </p>
                  </section>
                  <section className="tp-detail-section">
                    <h3 className="tp-section-heading">
                      <span className="material-symbols-outlined tp-accent">auto_awesome</span>
                      Mô tả ngắn
                    </h3>
                    <p className="tp-section-text">{selectedPerformance.description || '—'}</p>
                  </section>
                </div>
                <section className="tp-scenes-section">
                  <h3 className="tp-section-heading">Nhân vật</h3>
                  <div className="tp-scenes-list">
                    {(selectedPerformance.characters || []).length > 0 ? (
                      selectedPerformance.characters.map((name, idx) => (
                        <div key={`${name}-${idx}`} className="tp-scene-item">
                          <span className="tp-scene-time">#{idx + 1}</span>
                          <p className="tp-scene-desc">{name}</p>
                        </div>
                      ))
                    ) : (
                      <div className="tp-scene-item">
                        <span className="tp-scene-time">—</span>
                        <p className="tp-scene-desc">Chưa có thông tin nhân vật.</p>
                      </div>
                    )}
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
        </motion.main>
      )}

      {activeTab === 'schedule' && (
        <motion.div
          className="tp-other-tab"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <Schedule />
        </motion.div>
      )}
      {activeTab === 'livestream' && (
        <motion.main
          className="tp-main tp-main--single"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <LivestreamList embedded />
        </motion.main>
      )}
      {activeTab === 'events' && (
        <div className="tp-other-tab">
          <Events />
        </div>
      )}

      <div className="tp-footer-line" aria-hidden="true" />
    </div>
  )
}

export default TuongPerformance

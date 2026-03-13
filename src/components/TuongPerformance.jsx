import { useState, useMemo, useEffect, useRef } from 'react'
import { Link } from "react-router-dom";
import { motion } from 'framer-motion'
import InteractiveScene from './InteractiveScene'
import Schedule from './Schedule'
import Events from './Events'
import LivestreamList from './Livestream/LivestreamList'
import ChatPanel from './Livestream/ChatPanel'
import ViewerCount from './Livestream/ViewerCount'
import { useShows } from '../hooks/useShows'
import { useViewer } from '../hooks/useViewer'
import { getLivestreamById, subscribeLivestreamUpdates } from '../services/livestreamService'
import './TuongPerformance.css'
import './LiveStream.css'

// Schedule uses shared `src/data/scheduleData.js` for the canonical event list

const TABS = [
  { id: 'watch', label: 'Vở diễn' },
  { id: 'schedule', label: 'Lịch diễn' },
  { id: 'livestream', label: 'Live Stream' },
  { id: 'events', label: 'Sự Kiện' }
]

function normalizeEmbedUrl(rawUrl) {
  const url = (rawUrl || '').trim()
  if (!url) return null

  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')

    // YouTube: convert watch/short links to /embed/{id}
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be') {
      let id = ''

      if (host === 'youtu.be') {
        id = u.pathname.split('/').filter(Boolean)[0] || ''
      } else if (u.pathname === '/watch') {
        id = u.searchParams.get('v') || ''
      } else if (u.pathname.startsWith('/embed/')) {
        id = u.pathname.split('/').filter(Boolean)[1] || ''
      } else if (u.pathname.startsWith('/shorts/')) {
        id = u.pathname.split('/').filter(Boolean)[1] || ''
      }

      if (!id) return url
      return `https://www.youtube.com/embed/${id}`
    }

    return url
  } catch {
    return url
  }
}

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
function TuongPerformance({ setActiveSection, initialWatchStreamId = null }) {
  const [activeTab, setActiveTab] = useState('watch')
  const [watchStreamId, setWatchStreamId] = useState(initialWatchStreamId)
  const [selectedPerformance, setSelectedPerformance] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0) // centiseconds
  const [progressPercent, setProgressPercent] = useState(0)
  const [showInteractiveScene, setShowInteractiveScene] = useState(false)
  const [isTrailerPlaying, setIsTrailerPlaying] = useState(false)

  // Tổng thời lượng vở (duration là phút; centiseconds = phút * 60 * 100)
  const totalMinutes = useMemo(() => {
    const d = selectedPerformance?.duration
    if (typeof d !== 'number') return 0
    return d > 0 ? d : 0
  }, [selectedPerformance?.duration])
  const totalCentisec = totalMinutes * 60 * 100
  const trailerUrl = useMemo(
    () => normalizeEmbedUrl(selectedPerformance?.trailer_url),
    [selectedPerformance?.trailer_url],
  )

  const trailerAutoplayUrl = useMemo(() => {
    if (!trailerUrl) return null
    // Trailer URLs are typically embed URLs (e.g. YouTube). Add autoplay/mute safely.
    const sep = trailerUrl.includes('?') ? '&' : '?'
    return `${trailerUrl}${sep}autoplay=1&mute=1`
  }, [trailerUrl])

  // Search UI (watch tab)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const intervalRef = useRef(null)
  const PAGE_SIZE = 5
  const [page, setPage] = useState(1)

  // Livestream watch: viewer hook (phải gọi unconditionally)
  const { remoteStream } = useViewer(watchStreamId)
  const watchVideoRef = useRef(null)
  const [watchStreamData, setWatchStreamData] = useState(null)
  const [watchStreamLoading, setWatchStreamLoading] = useState(false)
  const [watchStreamError, setWatchStreamError] = useState(null)

  // Mở tab livestream và xem stream khi có initialWatchStreamId (vd. từ /livestreams/:id)
  useEffect(() => {
    if (initialWatchStreamId) {
      setActiveTab('livestream')
      setWatchStreamId(initialWatchStreamId)
    }
  }, [initialWatchStreamId])

  // Load stream data khi đang xem (watchStreamId)
  useEffect(() => {
    if (!watchStreamId) {
      setWatchStreamData(null)
      setWatchStreamError(null)
      return
    }
    let cancelled = false
    const load = async () => {
      setWatchStreamLoading(true)
      setWatchStreamError(null)
      try {
        const data = await getLivestreamById(watchStreamId)
        if (!cancelled) setWatchStreamData(data)
      } catch (err) {
        if (!cancelled) setWatchStreamError('Không tìm thấy livestream hoặc đã kết thúc.')
      } finally {
        if (!cancelled) setWatchStreamLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [watchStreamId])

  // Realtime cập nhật stream (viewers, status...)
  useEffect(() => {
    if (!watchStreamId) return
    const channel = subscribeLivestreamUpdates(watchStreamId, (payload) => {
      if (payload?.new) setWatchStreamData((prev) => ({ ...(prev || {}), ...payload.new }))
    })
    return () => { if (channel) channel.unsubscribe?.() }
  }, [watchStreamId])

  // Gắn remoteStream vào video element
  useEffect(() => {
    if (watchVideoRef.current && remoteStream) watchVideoRef.current.srcObject = remoteStream
  }, [remoteStream])

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
    if (trailerUrl) {
      setIsTrailerPlaying(true)
      setIsPlaying(true)
      return
    }
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
    if (trailerUrl) {
      setIsTrailerPlaying(false)
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  // Reset playback state when switching shows (prevents trailer continuing on next card)
  useEffect(() => {
    setIsTrailerPlaying(false)
    setIsPlaying(false)
    setCurrentTime(0)
    setProgressPercent(0)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [selectedPerformance?.id])

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
              {trailerUrl && isTrailerPlaying ? (
                <iframe
                  className="tp-video-bg tp-video-media"
                  src={trailerAutoplayUrl || trailerUrl}
                  title={`${selectedPerformance?.title || 'Trailer'} trailer`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <img className="tp-video-bg" src={selectedHeroImage} alt="" />
              )}

              {!(trailerUrl && isTrailerPlaying) && (
                <div className="tp-video-overlay">
                  <button
                    type="button"
                    className="tp-video-play-btn"
                    onClick={isPlaying ? handlePause : handlePlay}
                    aria-label={isPlaying ? 'Tạm dừng' : trailerUrl ? 'Phát trailer' : 'Phát'}
                  >
                    <span className="material-symbols-outlined">play_arrow</span>
                  </button>
                  <p className="tp-video-prompt">{trailerUrl ? 'Nhấn Play để xem trailer' : 'Nhấn Play để xem'}</p>
                </div>
              )}
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
                  <motion.button
                    type="button"
                    className="tp-btn-red"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab('schedule')}
                  >
                    <span className="material-symbols-outlined">local_activity</span>
                    Đặt vé xem trực tiếp
                  </motion.button>
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
          {watchStreamId ? (
            <>
              {watchStreamLoading && (
                <p className="text-center text-white/70 mt-10 text-sm">Đang tải livestream...</p>
              )}
              {watchStreamError && (
                <div className="stream-error mt-10">{watchStreamError}</div>
              )}
              {!watchStreamLoading && !watchStreamError && watchStreamData && (
                <>
                  <button
                    type="button"
                    onClick={() => { setWatchStreamId(null); setWatchStreamData(null) }}
                    className="mb-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm"
                  >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    Quay lại danh sách
                  </button>
                  <div className="grid lg:grid-cols-[2fr,1fr] gap-6 items-start">
                    <div className="space-y-4">
                      <div className="bg-black/70 border border-white/10 rounded-2xl overflow-hidden">
                        <div className="bg-black aspect-video relative">
                          <video
                            ref={watchVideoRef}
                            autoPlay
                            playsInline
                            controls
                            className="w-full h-full object-contain bg-black"
                          />
                          {!remoteStream && (
                            <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm">
                              Đang chờ tín hiệu từ nhà hát...
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="bg-black/60 border border-white/10 rounded-2xl p-4 md:p-5">
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0">
                              <h1 className="text-base md:text-lg font-semibold text-white leading-snug truncate">
                                {watchStreamData.title}
                              </h1>
                              <p className="text-xs text-white/60 mt-1 line-clamp-2">
                                {watchStreamData.description || 'Buổi diễn trực tiếp nghệ thuật Tuồng Việt Nam.'}
                              </p>
                            </div>
                            <div className="flex items-end gap-2 shrink-0">
                              {watchStreamData.status === 'live' && (
                                <motion.div
                                  initial={{ scale: 0.9, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 text-[10px] font-semibold uppercase tracking-wide"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                  Live
                                </motion.div>
                              )}
                              <ViewerCount current={watchStreamData.current_viewers || 0} />
                            </div>
                          </div>
                          <div className="h-px bg-white/10" />
                          <div className="grid sm:grid-cols-3 gap-2 text-sm text-white/80">
                            {watchStreamData.start_time && (
                              <p className="sm:col-span-1">
                                <span className="text-white/50 mr-1">Bắt đầu:</span>
                                {new Date(watchStreamData.start_time).toLocaleString('vi-VN')}
                              </p>
                            )}
                            {watchStreamData.end_time && (
                              <p className="sm:col-span-1">
                                <span className="text-white/50 mr-1">Kết thúc dự kiến:</span>
                                {new Date(watchStreamData.end_time).toLocaleString('vi-VN')}
                              </p>
                            )}
                            {watchStreamData.price > 0 && (
                              <p className="sm:col-span-1">
                                <span className="text-white/50 mr-1">Giá vé:</span>
                                {watchStreamData.price.toLocaleString('vi-VN')}₫
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <ChatPanel
                      streamId={watchStreamId}
                      chatEnabled={watchStreamData.chat_enabled ?? true}
                      theaterOwnerId={watchStreamData.theater?.owner_id ?? null}
                      theaterName={watchStreamData.theater?.name ?? ''}
                    />
                  </div>
                </>
              )}
            </>
          ) : (
            <LivestreamList embedded onWatch={(stream) => setWatchStreamId(stream.id)} />
          )}
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

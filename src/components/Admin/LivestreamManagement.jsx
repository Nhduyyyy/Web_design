import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { getLivestreams } from '../../services/livestreamService'
import LivestreamDetailModal from './LivestreamDetailModal'
import './OrganizationManagement.css'

export default function LivestreamManagement() {
  const [livestreams, setLivestreams] = useState([])
  const [commentCounts, setCommentCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedLivestream, setSelectedLivestream] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [stats, setStats] = useState(null)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    loadData()
  }, [filter])

  const loadData = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      // 1) Danh sách từ bảng 'livestreams' qua service (không lọc status để lấy hết, sau đó lọc client-side)
      let allList = []
      try {
        allList = await getLivestreams({}) || []
      } catch (serviceErr) {
        // Fallback: query trực tiếp bảng livestreams (không join)
        const { data: directData, error: directError } = await supabase
          .from('livestreams')
          .select('*')
          .order('created_at', { ascending: false })
        if (directError) throw directError
        allList = directData || []
      }

      const filtered =
        filter === 'all'
          ? allList
          : allList.filter((row) => row.status === filter)
      const sorted = [...filtered].sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
      )
      setLivestreams(sorted)

      // 2) Thống kê từ chính danh sách đã lấy (allList)
      const byStatus = (allList || []).reduce((acc, row) => {
        const s = row.status || 'unknown'
        acc[s] = (acc[s] || 0) + 1
        return acc
      }, {})

      // 3) Tổng comment từ 'livestream_comments'
      const { count: totalComments } = await supabase
        .from('livestream_comments')
        .select('*', { count: 'exact', head: true })

      const { data: commentRows } = await supabase
        .from('livestream_comments')
        .select('livestream_id')
      const byLivestream = (commentRows || []).reduce((acc, row) => {
        acc[row.livestream_id] = (acc[row.livestream_id] || 0) + 1
        return acc
      }, {})
      setCommentCounts(byLivestream)

      setStats({
        total: allList.length,
        byStatus: byStatus,
        totalComments: totalComments ?? 0
      })
    } catch (err) {
      console.error('Error loading livestreams:', err)
      setLoadError(err?.message || 'Không tải được danh sách livestream.')
      setLivestreams([])
      setStats((prev) => prev || { total: 0, byStatus: {}, totalComments: 0 })
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (livestream) => {
    setSelectedLivestream(livestream)
    setShowModal(true)
  }

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: { label: 'Sắp phát', class: 'submitted' },
      live: { label: 'Đang phát', class: 'approved' },
      ended: { label: 'Đã kết thúc', class: 'default' },
      cancelled: { label: 'Đã hủy', class: 'rejected' }
    }
    const badge = badges[status] || { label: status || '-', class: 'default' }
    return <span className={`status-badge ${badge.class}`}>{badge.label}</span>
  }

  if (loading && !stats) {
    return <div className="loading-container">Đang tải...</div>
  }

  return (
    <div className="organization-management livestream-management">
      <div className="management-header">
        <h1>Quản lý Livestream</h1>
        <p>Xem và quản lý các buổi phát trực tiếp theo rạp và lịch diễn</p>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Tổng livestream</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <div className="stat-value">{stats.byStatus?.upcoming || 0}</div>
              <div className="stat-label">Sắp phát</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔴</div>
            <div className="stat-info">
              <div className="stat-value">{stats.byStatus?.live || 0}</div>
              <div className="stat-label">Đang phát</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✔</div>
            <div className="stat-info">
              <div className="stat-value">{stats.byStatus?.ended || 0}</div>
              <div className="stat-label">Đã kết thúc</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💬</div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalComments ?? 0}</div>
              <div className="stat-label">Tổng comment</div>
            </div>
          </div>
        </div>
      )}

      <div className="filters">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
          Tất cả
        </button>
        <button className={filter === 'upcoming' ? 'active' : ''} onClick={() => setFilter('upcoming')}>
          Sắp phát
        </button>
        <button className={filter === 'live' ? 'active' : ''} onClick={() => setFilter('live')}>
          Đang phát
        </button>
        <button className={filter === 'ended' ? 'active' : ''} onClick={() => setFilter('ended')}>
          Đã kết thúc
        </button>
        <button className={filter === 'cancelled' ? 'active' : ''} onClick={() => setFilter('cancelled')}>
          Đã hủy
        </button>
      </div>

      {loadError && (
        <div className="management-error-banner">
          <p>Lỗi: {loadError}</p>
        </div>
      )}

      <div className="organizations-table">
        {livestreams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📺</div>
            <p>Không có livestream nào</p>
            {stats?.total === 0 && (stats?.totalComments ?? 0) > 0 && (
              <p className="empty-state-hint">
                Gợi ý: Nếu bảng <code>livestreams</code> có dữ liệu, kiểm tra RLS (Row Level Security) trên Supabase cho phép role admin được SELECT.
              </p>
            )}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Livestream</th>
                <th>Nhà hát</th>
                <th>Lịch</th>
                <th>Trạng thái</th>
                <th>Số comment</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {livestreams.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="org-name">
                      <strong>{row.title || '-'}</strong>
                    </div>
                  </td>
                  <td>{row.theater?.name ?? row.theater_id ?? '-'}</td>
                  <td>{row.schedule?.title ?? row.schedule_id ?? '-'}</td>
                  <td>{getStatusBadge(row.status)}</td>
                  <td>{commentCounts[row.id] ?? 0}</td>
                  <td>
                    {row.created_at
                      ? new Date(row.created_at).toLocaleDateString('vi-VN')
                      : '-'}
                  </td>
                  <td>
                    <button className="btn-view" onClick={() => handleViewDetails(row)}>
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && selectedLivestream && (
        <LivestreamDetailModal
          livestream={selectedLivestream}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

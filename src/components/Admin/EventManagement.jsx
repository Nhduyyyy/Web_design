import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import EventDetailModal from './EventDetailModal'
import './OrganizationManagement.css'

export default function EventManagement() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadData()
  }, [filter])

  const loadData = async () => {
    setLoading(true)
    try {
      const selectQuery = `
        *,
        theater:theaters(id, name),
        venue:venues(id, name)
      `
      let query = supabase
        .from('events')
        .select(selectQuery, { count: 'exact' })
      if (filter !== 'all') {
        query = query.eq('status', filter)
      }
      const { data, error } = await query.order('event_date', { ascending: false })
      if (error) throw error
      setEvents(data || [])

      const { count } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
      const { data: allData } = await supabase.from('events').select('status')
      const byStatus = (allData || []).reduce((acc, row) => {
        const s = row.status || 'draft'
        acc[s] = (acc[s] || 0) + 1
        return acc
      }, {})
      setStats({
        total: count ?? 0,
        byStatus: byStatus
      })
    } catch (err) {
      console.error('Error loading events:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (event) => {
    setSelectedEvent(event)
    setShowModal(true)
  }

  const getStatusBadge = (status) => {
    const badges = {
      draft: { label: 'Nháp', class: 'draft' },
      scheduled: { label: 'Đã lên lịch', class: 'under-review' },
      published: { label: 'Đã công bố', class: 'approved' },
      completed: { label: 'Đã kết thúc', class: 'default' },
      cancelled: { label: 'Đã hủy', class: 'rejected' }
    }
    const badge = badges[status] || { label: status || '-', class: 'default' }
    return <span className={`status-badge ${badge.class}`}>{badge.label}</span>
  }

  const getTypeLabel = (type) => {
    const labels = {
      workshop: 'Workshop',
      tour: 'Tour',
      meet_artist: 'Gặp gỡ nghệ sĩ'
    }
    return labels[type] || type || '-'
  }

  if (loading && !stats) {
    return <div className="loading-container">Đang tải...</div>
  }

  return (
    <div className="organization-management event-management">
      <div className="management-header">
        <h1>Quản lý Sự kiện</h1>
        <p>Xem và quản lý các sự kiện, workshop, tour từ nhà hát và đơn vị tổ chức</p>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Tổng sự kiện</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <div className="stat-value">{stats.byStatus?.draft || 0}</div>
              <div className="stat-label">Nháp</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <div className="stat-value">
                {(stats.byStatus?.scheduled || 0) + (stats.byStatus?.published || 0)}
              </div>
              <div className="stat-label">Đã lên lịch</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✔</div>
            <div className="stat-info">
              <div className="stat-value">{stats.byStatus?.completed || 0}</div>
              <div className="stat-label">Đã kết thúc</div>
            </div>
          </div>
        </div>
      )}

      <div className="filters">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
          Tất cả
        </button>
        <button className={filter === 'draft' ? 'active' : ''} onClick={() => setFilter('draft')}>
          Nháp
        </button>
        <button className={filter === 'scheduled' ? 'active' : ''} onClick={() => setFilter('scheduled')}>
          Đã lên lịch
        </button>
        <button className={filter === 'published' ? 'active' : ''} onClick={() => setFilter('published')}>
          Đã công bố
        </button>
        <button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>
          Đã kết thúc
        </button>
        <button className={filter === 'cancelled' ? 'active' : ''} onClick={() => setFilter('cancelled')}>
          Đã hủy
        </button>
      </div>

      <div className="organizations-table">
        {events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <p>Không có sự kiện nào</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Sự kiện</th>
                <th>Loại hình</th>
                <th>Nhà hát / Rạp</th>
                <th>Trạng thái</th>
                <th>Ngày diễn ra</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {events.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="org-name">
                      <strong>{row.title || '-'}</strong>
                      {row.venue?.name && <small>Rạp: {row.venue.name}</small>}
                    </div>
                  </td>
                  <td>{getTypeLabel(row.type)}</td>
                  <td>{row.theater?.name ?? row.theater_id ?? '-'}</td>
                  <td>{getStatusBadge(row.status)}</td>
                  <td>
                    {row.event_date
                      ? new Date(row.event_date).toLocaleDateString('vi-VN')
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

      {showModal && selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

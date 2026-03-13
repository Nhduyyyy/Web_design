import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import ScheduleDetailModal from './ScheduleDetailModal'
import './OrganizationManagement.css'

export default function ScheduleManagement() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadData()
  }, [filter])

  const loadData = async () => {
    setLoading(true)
    try {
      let query = supabase.from('schedules').select('*', { count: 'exact' })
      if (filter !== 'all') {
        query = query.eq('status', filter)
      }
      const { data, error } = await query.order('start_datetime', { ascending: false })
      if (error) throw error
      setSchedules(data || [])

      const { count } = await supabase.from('schedules').select('*', { count: 'exact', head: true })
      const { data: allData } = await supabase.from('schedules').select('status')
      const byStatus = (allData || []).reduce((acc, row) => {
        acc[row.status] = (acc[row.status] || 0) + 1
        return acc
      }, {})
      setStats({
        total: count ?? 0,
        byStatus: byStatus
      })
    } catch (err) {
      console.error('Error loading schedules:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (schedule) => {
    setSelectedSchedule(schedule)
    setShowModal(true)
  }

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: { label: 'Đã lên lịch', class: 'under-review' },
      ongoing: { label: 'Đang diễn ra', class: 'approved' },
      completed: { label: 'Đã kết thúc', class: 'default' },
      cancelled: { label: 'Đã hủy', class: 'rejected' }
    }
    const badge = badges[status] || { label: status || '-', class: 'default' }
    return <span className={`status-badge ${badge.class}`}>{badge.label}</span>
  }

  if (loading && !stats) {
    return <div className="loading-container">Đang tải...</div>
  }

  return (
    <div className="organization-management schedule-management">
      <div className="management-header">
        <h1>Quản lý Lịch diễn</h1>
        <p>Xem và quản lý các lịch diễn, suất chiếu theo rạp và thời gian</p>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Tổng lịch</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <div className="stat-value">{stats.byStatus?.scheduled || 0}</div>
              <div className="stat-label">Đã lên lịch</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <div className="stat-value">{stats.byStatus?.ongoing || 0}</div>
              <div className="stat-label">Đang diễn ra</div>
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
        <button className={filter === 'scheduled' ? 'active' : ''} onClick={() => setFilter('scheduled')}>
          Đã lên lịch
        </button>
        <button className={filter === 'ongoing' ? 'active' : ''} onClick={() => setFilter('ongoing')}>
          Đang diễn ra
        </button>
        <button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>
          Đã kết thúc
        </button>
        <button className={filter === 'cancelled' ? 'active' : ''} onClick={() => setFilter('cancelled')}>
          Đã hủy
        </button>
      </div>

      <div className="organizations-table">
        {schedules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>Không có lịch nào</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Rạp</th>
                <th>Bắt đầu</th>
                <th>Kết thúc</th>
                <th>Trạng thái</th>
                <th>Đặt vé</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="org-name">
                      <strong>{row.title || '-'}</strong>
                    </div>
                  </td>
                  <td>{row.theater_id || '-'}</td>
                  <td>
                    {row.start_datetime
                      ? new Date(row.start_datetime).toLocaleString('vi-VN')
                      : '-'}
                  </td>
                  <td>
                    {row.end_datetime
                      ? new Date(row.end_datetime).toLocaleString('vi-VN')
                      : '-'}
                  </td>
                  <td>{getStatusBadge(row.status)}</td>
                  <td>{row.enable_booking ? 'Có' : 'Không'}</td>
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

      {showModal && selectedSchedule && (
        <ScheduleDetailModal
          schedule={selectedSchedule}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import TheaterDetailModal from './TheaterDetailModal'
import './OrganizationManagement.css'

export default function TheaterManagement() {
  const [theaters, setTheaters] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedTheater, setSelectedTheater] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadData()
  }, [filter])

  const loadData = async () => {
    setLoading(true)
    try {
      let query = supabase.from('theaters').select('*', { count: 'exact' })
      if (filter !== 'all') {
        query = query.eq('status', filter)
      }
      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      setTheaters(data || [])

      const { count } = await supabase.from('theaters').select('*', { count: 'exact', head: true })
      const { data: allData } = await supabase.from('theaters').select('status')
      const byStatus = (allData || []).reduce((acc, row) => {
        acc[row.status] = (acc[row.status] || 0) + 1
        return acc
      }, {})
      setStats({
        total: count ?? 0,
        byStatus: byStatus
      })
    } catch (err) {
      console.error('Error loading theaters:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (theater) => {
    setSelectedTheater(theater)
    setShowModal(true)
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'Chờ duyệt', class: 'submitted' },
      approved: { label: 'Đã duyệt', class: 'approved' },
      rejected: { label: 'Từ chối', class: 'rejected' }
    }
    const badge = badges[status] || { label: status || '-', class: 'default' }
    return <span className={`status-badge ${badge.class}`}>{badge.label}</span>
  }

  if (loading && !stats) {
    return <div className="loading-container">Đang tải...</div>
  }

  return (
    <div className="organization-management theater-management">
      <div className="management-header">
        <h1>Quản lý Nhà hát</h1>
        <p>Xem và quản lý danh sách nhà hát, rạp trên hệ thống</p>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Tổng nhà hát</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <div className="stat-value">{stats.byStatus?.pending || 0}</div>
              <div className="stat-label">Chờ duyệt</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <div className="stat-value">{stats.byStatus?.approved || 0}</div>
              <div className="stat-label">Đã duyệt</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">❌</div>
            <div className="stat-info">
              <div className="stat-value">{stats.byStatus?.rejected || 0}</div>
              <div className="stat-label">Từ chối</div>
            </div>
          </div>
        </div>
      )}

      <div className="filters">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
          Tất cả
        </button>
        <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>
          Chờ duyệt
        </button>
        <button className={filter === 'approved' ? 'active' : ''} onClick={() => setFilter('approved')}>
          Đã duyệt
        </button>
        <button className={filter === 'rejected' ? 'active' : ''} onClick={() => setFilter('rejected')}>
          Từ chối
        </button>
      </div>

      <div className="organizations-table">
        {theaters.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>Không có nhà hát nào</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nhà hát</th>
                <th>Địa chỉ</th>
                <th>Liên hệ</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {theaters.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="org-name">
                      <strong>{row.name || '-'}</strong>
                    </div>
                  </td>
                  <td>{row.address || '-'}</td>
                  <td>
                    <div className="contact-info">
                      <div>{row.email || '-'}</div>
                      <small>{row.phone || '-'}</small>
                    </div>
                  </td>
                  <td>{getStatusBadge(row.status)}</td>
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

      {showModal && selectedTheater && (
        <TheaterDetailModal
          theater={selectedTheater}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import UserDetailModal from './UserDetailModal'
import './OrganizationManagement.css'
import './UserManagement.css'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadData()
  }, [filter])

  const loadData = async () => {
    setLoading(true)
    try {
      let query = supabase.from('profiles').select('*', { count: 'exact' })
      if (filter !== 'all') {
        query = query.eq('role', filter)
      }
      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      setUsers(data || [])

      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
      const { data: allData } = await supabase.from('profiles').select('role')
      const byRole = (allData || []).reduce((acc, row) => {
        const r = row.role || 'user'
        acc[r] = (acc[r] || 0) + 1
        return acc
      }, {})
      setStats({
        total: count ?? 0,
        byRole: byRole
      })
    } catch (err) {
      console.error('Error loading users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (user) => {
    setSelectedUser(user)
    setShowModal(true)
  }

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Quản trị viên',
      user: 'Người dùng',
      theater: 'Nhà hát'
    }
    return labels[role] || role || '-'
  }

  const getRoleBadgeClass = (role) => {
    const classes = {
      admin: 'under-review',
      user: 'approved',
      theater: 'submitted'
    }
    return classes[role] || 'default'
  }

  if (loading && !stats) {
    return <div className="loading-container">Đang tải...</div>
  }

  return (
    <div className="organization-management user-management">
      <div className="management-header">
        <h1>Quản lý Người dùng</h1>
        <p>Xem và quản lý tài khoản người dùng, vai trò trên hệ thống</p>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Tổng người dùng</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👤</div>
            <div className="stat-info">
              <div className="stat-value">{stats.byRole?.admin || 0}</div>
              <div className="stat-label">Quản trị viên</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <div className="stat-value">{stats.byRole?.user || 0}</div>
              <div className="stat-label">Người dùng</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎭</div>
            <div className="stat-info">
              <div className="stat-value">{stats.byRole?.theater || 0}</div>
              <div className="stat-label">Chủ nhà hát</div>
            </div>
          </div>
        </div>
      )}

      <div className="filters">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
          Tất cả
        </button>
        <button className={filter === 'admin' ? 'active' : ''} onClick={() => setFilter('admin')}>
          Quản trị viên
        </button>
        <button className={filter === 'user' ? 'active' : ''} onClick={() => setFilter('user')}>
          Người dùng
        </button>
        <button className={filter === 'theater' ? 'active' : ''} onClick={() => setFilter('theater')}>
          Chủ nhà hát
        </button>
      </div>

      <div className="organizations-table">
        {users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>Không có người dùng nào</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Điện thoại</th>
                <th>Vai trò</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="org-name">
                      <strong>{row.full_name || '-'}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="contact-info">
                      <div>{row.email || '-'}</div>
                    </div>
                  </td>
                  <td>{row.phone || '-'}</td>
                  <td>
                    <span className={`status-badge ${getRoleBadgeClass(row.role)}`}>
                      {getRoleLabel(row.role)}
                    </span>
                  </td>
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

      {showModal && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

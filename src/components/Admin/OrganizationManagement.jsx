import { useState, useEffect } from 'react'
import {
  getAllOrganizations,
  approveOrganization,
  rejectOrganization,
  requestMoreInfo,
  suspendOrganization,
  getOrganizationStats
} from '../../services/organizationService'
import OrganizationDetailModal from './OrganizationDetailModal'
import './OrganizationManagement.css'

export default function OrganizationManagement() {
  const [organizations, setOrganizations] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedOrg, setSelectedOrg] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [filter])

  const loadData = async () => {
    setLoading(true)
    try {
      const [orgs, statistics] = await Promise.all([
        filter === 'all' 
          ? getAllOrganizations()
          : getAllOrganizations({ status: filter }),
        getOrganizationStats()
      ])
      setOrganizations(orgs)
      setStats(statistics)
    } catch (err) {
      console.error('Error loading organizations:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (org) => {
    setSelectedOrg(org)
    setShowModal(true)
  }

  const handleApprove = async (orgId, note) => {
    try {
      await approveOrganization(orgId, note)
      await loadData()
      setShowModal(false)
    } catch (err) {
      console.error('Error approving:', err)
      alert('Lỗi: ' + err.message)
    }
  }

  const handleReject = async (orgId, reason) => {
    try {
      await rejectOrganization(orgId, reason)
      await loadData()
      setShowModal(false)
    } catch (err) {
      console.error('Error rejecting:', err)
      alert('Lỗi: ' + err.message)
    }
  }

  const handleRequestMoreInfo = async (orgId, message) => {
    try {
      await requestMoreInfo(orgId, message)
      await loadData()
      setShowModal(false)
    } catch (err) {
      console.error('Error requesting info:', err)
      alert('Lỗi: ' + err.message)
    }
  }

  const handleSuspend = async (orgId, reason) => {
    if (!confirm('Bạn có chắc muốn tạm ngưng tổ chức này?')) return
    
    try {
      await suspendOrganization(orgId, reason)
      await loadData()
      setShowModal(false)
    } catch (err) {
      console.error('Error suspending:', err)
      alert('Lỗi: ' + err.message)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      draft: { label: 'Nháp', class: 'draft' },
      submitted: { label: 'Chờ duyệt', class: 'submitted' },
      under_review: { label: 'Đang xem xét', class: 'under-review' },
      need_more_info: { label: 'Cần bổ sung', class: 'need-more-info' },
      approved: { label: 'Đã duyệt', class: 'approved' },
      rejected: { label: 'Từ chối', class: 'rejected' },
      suspended: { label: 'Tạm ngưng', class: 'suspended' }
    }
    const badge = badges[status] || { label: status, class: 'default' }
    return <span className={`status-badge ${badge.class}`}>{badge.label}</span>
  }

  const getTypeLabel = (type) => {
    const labels = {
      individual: '👤 Cá nhân',
      enterprise: '🏢 Doanh nghiệp',
      theater: '🎭 Nhà hát'
    }
    return labels[type] || type
  }

  if (loading) {
    return <div className="loading-container">Đang tải...</div>
  }

  return (
    <div className="organization-management">
      <div className="management-header">
        <h1>Quản lý Đăng ký Nhà hát</h1>
        <p>Xem xét và phê duyệt các đơn đăng ký từ nhà hát và đơn vị tổ chức</p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Tổng đơn</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <div className="stat-value">{stats.byStatus?.submitted || 0}</div>
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

      {/* Filters */}
      <div className="filters">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          Tất cả
        </button>
        <button
          className={filter === 'submitted' ? 'active' : ''}
          onClick={() => setFilter('submitted')}
        >
          Chờ duyệt
        </button>
        <button
          className={filter === 'under_review' ? 'active' : ''}
          onClick={() => setFilter('under_review')}
        >
          Đang xem xét
        </button>
        <button
          className={filter === 'need_more_info' ? 'active' : ''}
          onClick={() => setFilter('need_more_info')}
        >
          Cần bổ sung
        </button>
        <button
          className={filter === 'approved' ? 'active' : ''}
          onClick={() => setFilter('approved')}
        >
          Đã duyệt
        </button>
        <button
          className={filter === 'rejected' ? 'active' : ''}
          onClick={() => setFilter('rejected')}
        >
          Từ chối
        </button>
      </div>

      {/* Organizations Table */}
      <div className="organizations-table">
        {organizations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>Không có đơn đăng ký nào</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tổ chức</th>
                <th>Loại hình</th>
                <th>Người đại diện</th>
                <th>Liên hệ</th>
                <th>Trạng thái</th>
                <th>Ngày nộp</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map(org => (
                <tr key={org.id}>
                  <td>
                    <div className="org-name">
                      <strong>{org.legal_name}</strong>
                      {org.tax_code && (
                        <small>MST: {org.tax_code}</small>
                      )}
                    </div>
                  </td>
                  <td>{getTypeLabel(org.type)}</td>
                  <td>
                    <div className="owner-info">
                      <div>{org.owner?.full_name || org.owner?.email}</div>
                      {org.legal_representative_name && (
                        <small>{org.legal_representative_name}</small>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="contact-info">
                      <div>{org.email}</div>
                      <small>{org.phone}</small>
                    </div>
                  </td>
                  <td>{getStatusBadge(org.status)}</td>
                  <td>
                    {org.submitted_at 
                      ? new Date(org.submitted_at).toLocaleDateString('vi-VN')
                      : '-'
                    }
                  </td>
                  <td>
                    <button
                      className="btn-view"
                      onClick={() => handleViewDetails(org)}
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedOrg && (
        <OrganizationDetailModal
          organization={selectedOrg}
          onClose={() => setShowModal(false)}
          onApprove={handleApprove}
          onReject={handleReject}
          onRequestMoreInfo={handleRequestMoreInfo}
          onSuspend={handleSuspend}
        />
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { uploadDocument, getDocumentsByOrganization, deleteDocument } from '../../../services/organizationService'
import '../Documents.css'

export default function DocumentsStep({ organizationId, formData, updateFormData }) {
  const [documents, setDocuments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const isIndividual = formData.type === 'individual'

  useEffect(() => {
    if (organizationId) {
      loadDocuments()
    }
  }, [organizationId])

  const loadDocuments = async () => {
    try {
      const docs = await getDocumentsByOrganization(organizationId)
      setDocuments(docs)
      updateFormData({ documents: docs })
    } catch (err) {
      console.error('Error loading documents:', err)
    }
  }

  const handleFileUpload = async (type, file) => {
    if (!file) return

    // Validate file
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setError('File quá lớn. Vui lòng chọn file nhỏ hơn 10MB')
      return
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      setError('Chỉ chấp nhận file PDF, JPG, PNG')
      return
    }

    setError(null)
    setUploading(true)

    try {
      await uploadDocument(organizationId, file, type)
      await loadDocuments()
    } catch (err) {
      console.error('Error uploading:', err)
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (docId) => {
    if (!confirm('Bạn có chắc muốn xóa tài liệu này?')) return

    try {
      await deleteDocument(docId)
      await loadDocuments()
    } catch (err) {
      console.error('Error deleting:', err)
      setError(err.message)
    }
  }

  const getDocumentByType = (type) => {
    return documents.find(doc => doc.type === type)
  }

  const renderDocumentUpload = (type, label, required = false) => {
    const doc = getDocumentByType(type)

    return (
      <div className="document-upload-item">
        <div className="document-label">
          {label} {required && <span className="required">*</span>}
        </div>
        
        {doc ? (
          <div className="document-uploaded">
            <div className="document-info">
              <span className="document-icon">📄</span>
              <div>
                <div className="document-name">{doc.file_name}</div>
                <div className="document-meta">
                  {(doc.file_size / 1024).toFixed(0)} KB
                  {doc.status === 'approved' && (
                    <span className="status-badge approved">✓ Đã duyệt</span>
                  )}
                  {doc.status === 'rejected' && (
                    <span className="status-badge rejected">✗ Từ chối</span>
                  )}
                  {doc.status === 'pending' && (
                    <span className="status-badge pending">⏳ Chờ duyệt</span>
                  )}
                </div>
                {doc.rejection_reason && (
                  <div className="rejection-reason">
                    Lý do: {doc.rejection_reason}
                  </div>
                )}
              </div>
            </div>
            <div className="document-actions">
              <a
                href={doc.signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-link"
              >
                Xem
              </a>
              <button
                type="button"
                onClick={() => handleDelete(doc.id)}
                className="btn-link danger"
              >
                Xóa
              </button>
            </div>
          </div>
        ) : (
          <div className="document-upload-area">
            <input
              type="file"
              id={`upload-${type}`}
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileUpload(type, e.target.files[0])}
              disabled={uploading}
            />
            <label htmlFor={`upload-${type}`} className="upload-label">
              <span className="upload-icon">📤</span>
              <span>Chọn file hoặc kéo thả vào đây</span>
              <small>PDF, JPG, PNG (tối đa 10MB)</small>
            </label>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="form-step">
      <h2>Tải lên tài liệu</h2>
      <p className="step-description">
        Upload các giấy tờ cần thiết để xác minh tổ chức
      </p>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {uploading && (
        <div className="uploading-message">
          <span className="spinner">⏳</span>
          Đang tải lên...
        </div>
      )}

      <div className="documents-list">
        {/* CCCD - Required for all */}
        {renderDocumentUpload('id_card_front', 'CCCD/CMND mặt trước', true)}
        {renderDocumentUpload('id_card_back', 'CCCD/CMND mặt sau', true)}

        {/* Business documents - Only for enterprise/theater */}
        {!isIndividual && (
          <>
            {renderDocumentUpload('business_license', 'Giấy phép kinh doanh', true)}
            {renderDocumentUpload('tax_certificate', 'Giấy chứng nhận thuế')}
          </>
        )}

        {/* Bank statement - Optional */}
        {renderDocumentUpload('bank_statement', 'Sao kê ngân hàng (tùy chọn)')}

        {/* Authorization - Optional */}
        {renderDocumentUpload('authorization', 'Hợp đồng ủy quyền (nếu có)')}

        {/* Other documents */}
        {renderDocumentUpload('other', 'Tài liệu khác')}
      </div>

      <div className="info-box">
        <div className="info-icon">💡</div>
        <div>
          <strong>Lưu ý:</strong>
          <ul>
            <li>Tất cả tài liệu phải rõ ràng, đầy đủ thông tin</li>
            <li>CCCD/CMND phải còn hiệu lực</li>
            <li>Giấy phép kinh doanh phải đúng với tên doanh nghiệp đã khai báo</li>
            <li>Tài liệu sẽ được admin xem xét trong vòng 1-3 ngày làm việc</li>
          </ul>
        </div>
      </div>

      <div className="warning-box" style={{ marginTop: '16px' }}>
        <div className="warning-icon">🧪</div>
        <div>
          <strong>Test Mode:</strong>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#999' }}>
            Bạn có thể click nút "Skip (Test Mode)" bên dưới để bỏ qua bước upload tài liệu và test các chức năng khác của hệ thống.
          </p>
        </div>
      </div>
    </div>
  )
}

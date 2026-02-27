import { useState } from 'react'
import { resendConfirmationEmail } from '../../services/authService'
import './Auth.css'

function ResendConfirmation({ email }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleResend = async () => {
    if (!email) {
      setError('Vui lòng nhập email')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      await resendConfirmationEmail(email)
      setMessage('✅ Email xác nhận đã được gửi lại. Vui lòng kiểm tra hộp thư.')
    } catch (err) {
      console.error('Resend error:', err)
      setError(err.message || 'Không thể gửi lại email. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      marginTop: '16px',
      padding: '16px',
      background: '#fff3cd',
      borderRadius: '12px',
      border: '1px solid #ffc107'
    }}>
      <p style={{
        fontSize: '14px',
        color: '#856404',
        marginBottom: '12px'
      }}>
        Chưa nhận được email xác nhận?
      </p>

      {message && (
        <div style={{
          padding: '12px',
          background: '#d4edda',
          borderRadius: '8px',
          marginBottom: '12px',
          color: '#155724',
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{
          padding: '12px',
          background: '#f8d7da',
          borderRadius: '8px',
          marginBottom: '12px',
          color: '#721c24',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      <button
        onClick={handleResend}
        disabled={loading}
        style={{
          padding: '10px 20px',
          background: loading ? '#ccc' : '#ffc107',
          color: loading ? '#666' : '#000',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease'
        }}
      >
        {loading ? 'Đang gửi...' : 'Gửi lại email xác nhận'}
      </button>
    </div>
  )
}

export default ResendConfirmation

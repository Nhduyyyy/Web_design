import { useState } from 'react'
import TheaterHeader from './TheaterHeader'
import { useTheaterProfile } from '../../hooks/useTheaterProfile'
import TheaterProfileHeader from './profile/TheaterProfileHeader'
import TheaterProfileTabs from './profile/TheaterProfileTabs'
import TheaterInfoSection from './profile/TheaterInfoSection'
import TheaterLegalSection from './profile/TheaterLegalSection'
import TheaterSystemSection from './profile/TheaterSystemSection'
import TheaterProfileEditModal from './profile/TheaterProfileEditModal'
import { useNavigate } from 'react-router-dom'

const TheaterProfilePage = () => {
  const { theater, loading, saving, error, handleUpdate, handleImageUpload } = useTheaterProfile()
  const [activeTab, setActiveTab] = useState('info')
  const [showEditModal, setShowEditModal] = useState(false)
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
        <TheaterHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-slate-400">Đang tải hồ sơ nhà hát...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
        <TheaterHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-surface-dark border border-red-500/40 rounded-xl px-8 py-6 text-center">
            <p className="text-red-400 font-semibold mb-2">Không thể tải hồ sơ nhà hát</p>
            <p className="text-slate-400 text-sm mb-4">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-primary text-background-dark text-sm font-semibold hover:brightness-110 transition-all"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!theater) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
        <TheaterHeader />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-surface-dark border border-border-gold rounded-xl p-8 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-600 mb-4 block">
              theater_comedy
            </span>
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Chưa có hồ sơ nhà hát</h2>
            <p className="text-slate-400 text-sm mb-6">
              Có vẻ bạn chưa có nhà hát nào được tạo. Hãy hoàn tất đăng ký tổ chức để bắt đầu
              quản lý nhà hát của mình.
            </p>
            <button
              type="button"
              onClick={() => navigate('/organization/register')}
              className="px-6 py-3 gold-gradient text-background-dark font-bold rounded-lg hover:brightness-110 transition-all"
            >
              Đăng ký Nhà hát
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleSaveProfile = async (updates) => {
    const result = await handleUpdate(updates)
    if (result.success) {
      setShowEditModal(false)
    } else if (result.error) {
      // Simple fallback, project already uses alert() in some places
      // eslint-disable-next-line no-alert
      alert(`Không thể lưu hồ sơ: ${result.error}`)
    }
  }

  const handleUploadImage = async (file, type) => {
    const result = await handleImageUpload(file, type)
    if (!result.success && result.error) {
      // eslint-disable-next-line no-alert
      alert(`Không thể tải ảnh: ${result.error}`)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
      <TheaterHeader theater={theater} />
      <main className="flex-1 px-4 md:px-6 py-6 max-w-5xl mx-auto w-full space-y-4">
        <TheaterProfileHeader theater={theater} onEdit={() => setShowEditModal(true)} />
        <TheaterProfileTabs activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'info' && <TheaterInfoSection theater={theater} />}
        {activeTab === 'legal' && <TheaterLegalSection theater={theater} />}
        {activeTab === 'system' && <TheaterSystemSection theater={theater} />}
      </main>

      <TheaterProfileEditModal
        open={showEditModal}
        theater={theater}
        saving={saving}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveProfile}
      />
    </div>
  )
}

export default TheaterProfilePage


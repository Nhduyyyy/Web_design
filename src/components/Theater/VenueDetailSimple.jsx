import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getVenueById } from '../../services/theaterService'
import './VenueDetail.css'

const VenueDetailSimple = () => {
  const { hallId } = useParams()
  const navigate = useNavigate()
  const [venue, setVenue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadVenueData()
  }, [hallId])

  const loadVenueData = async () => {
    try {
      setLoading(true)
      const venueData = await getVenueById(hallId)
      setVenue(venueData)
    } catch (error) {
      console.error('Error loading venue:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'maintenance': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'inactive': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-400">Đang tải thông tin địa điểm...</p>
        </div>
      </div>
    )
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Không tìm thấy địa điểm'}</p>
          <button 
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:brightness-110"
          >
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-dark">
      {/* Header */}
      <div className="bg-surface-dark border-b border-border-gold">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-primary mb-4 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Quay lại
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-100 mb-2">{venue.name}</h1>
              <div className="flex items-center gap-4 text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  <span>{venue.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">groups</span>
                  <span>{venue.capacity} ghế</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(venue.status)}`}>
                  {venue.status === 'active' && 'Hoạt động'}
                  {venue.status === 'maintenance' && 'Bảo trì'}
                  {venue.status === 'inactive' && 'Không hoạt động'}
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate(`/theater`)}
              className="px-4 py-2 bg-accent-red/10 border border-accent-red/30 text-accent-red hover:bg-accent-red hover:text-white rounded-lg transition-all"
            >
              Chỉnh sửa
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Thông tin địa điểm */}
          <div className="bg-surface-dark rounded-xl border border-border-gold p-6">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">info</span>
              Thông tin địa điểm
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Tên:</span>
                <span className="text-slate-100 font-semibold">{venue.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Địa chỉ:</span>
                <span className="text-slate-100 font-semibold">{venue.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Thành phố:</span>
                <span className="text-slate-100 font-semibold">{venue.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sức chứa:</span>
                <span className="text-slate-100 font-semibold">{venue.capacity} ghế</span>
              </div>
              {venue.total_rows && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Số hàng ghế:</span>
                  <span className="text-slate-100 font-semibold">{venue.total_rows}</span>
                </div>
              )}
              {venue.seats_per_row && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Ghế mỗi hàng:</span>
                  <span className="text-slate-100 font-semibold">{venue.seats_per_row}</span>
                </div>
              )}
            </div>

            {venue.address && venue.city && (
              <button
                onClick={() => {
                  const address = `${venue.address}, ${venue.city}, Vietnam`
                  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
                  window.open(url, '_blank')
                }}
                className="mt-4 w-full py-2 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">map</span>
                Xem trên Google Maps
              </button>
            )}
          </div>

          {/* Mô tả */}
          {venue.description && (
            <div className="bg-surface-dark rounded-xl border border-border-gold p-6">
              <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">description</span>
                Mô tả
              </h3>
              <p className="text-slate-300 leading-relaxed">{venue.description}</p>
            </div>
          )}

          {/* Tiện ích */}
          {venue.facilities && venue.facilities.length > 0 && (
            <div className="bg-surface-dark rounded-xl border border-border-gold p-6">
              <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">star</span>
                Tiện ích
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {venue.facilities.map((facility, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-400"
                  >
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <span className="text-sm capitalize">{facility.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hình ảnh */}
          {venue.images && venue.images.length > 0 && (
            <div className="bg-surface-dark rounded-xl border border-border-gold p-6">
              <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">photo_library</span>
                Hình ảnh
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {venue.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${venue.name} ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Coming Soon */}
        <div className="mt-8 bg-surface-dark rounded-xl border border-border-gold p-8 text-center">
          <span className="material-symbols-outlined text-6xl text-slate-600 mb-4 block">construction</span>
          <h3 className="text-xl font-bold text-slate-100 mb-2">Tính năng đang phát triển</h3>
          <p className="text-slate-400 mb-4">
            Sơ đồ ghế, lịch biểu diễn và thống kê sẽ có sẵn sau khi chạy migrations
          </p>
          <div className="flex gap-4 justify-center">
            <div className="px-4 py-2 bg-background-dark border border-border-gold rounded-lg">
              <span className="text-slate-500">🎭 Sơ đồ ghế</span>
            </div>
            <div className="px-4 py-2 bg-background-dark border border-border-gold rounded-lg">
              <span className="text-slate-500">📅 Lịch biểu diễn</span>
            </div>
            <div className="px-4 py-2 bg-background-dark border border-border-gold rounded-lg">
              <span className="text-slate-500">📊 Thống kê</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VenueDetailSimple

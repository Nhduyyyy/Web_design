import { useState, useEffect } from 'react'
import { createVenue, updateVenue } from '../../services/theaterService'

const VenueModal = ({ theater, venue, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    capacity: '',
    description: '',
    total_rows: '',
    seats_per_row: '',
    facilities: [],
    status: 'active'
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const facilityOptions = [
    'parking',
    'wheelchair_access',
    'air_conditioning',
    'wifi',
    'restaurant',
    'bar',
    'vip_lounge',
    'backstage_tour'
  ]

  useEffect(() => {
    if (venue) {
      setFormData({
        name: venue.name || '',
        address: venue.address || '',
        city: venue.city || '',
        capacity: venue.capacity || '',
        description: venue.description || '',
        total_rows: venue.total_rows || '',
        seats_per_row: venue.seats_per_row || '',
        facilities: venue.facilities || [],
        status: venue.status || 'active'
      })
    }
  }, [venue])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFacilityToggle = (facility) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }))
  }

  const openInGoogleMaps = () => {
    const address = `${formData.address}, ${formData.city}, Vietnam`
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    window.open(url, '_blank')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      setSaving(true)

      const venueData = {
        ...formData,
        theater_id: theater.id,
        capacity: parseInt(formData.capacity) || 0,
        total_rows: parseInt(formData.total_rows) || 0,
        seats_per_row: parseInt(formData.seats_per_row) || 0
      }

      if (venue) {
        await updateVenue(venue.id, venueData)
      } else {
        await createVenue(venueData)
      }

      onSave()
    } catch (err) {
      console.error('Error saving venue:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-dark border border-border-gold rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface-dark border-b border-border-gold px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">add_location</span>
            {venue ? 'Chỉnh sửa Địa điểm' : 'Thêm Địa điểm mới'}
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">Thông tin cơ bản</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tên địa điểm *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-background-dark border border-border-gold rounded-lg px-4 py-2 text-slate-100 focus:ring-primary focus:border-primary"
                placeholder="VD: Sân khấu chính"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Sức chứa *
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full bg-background-dark border border-border-gold rounded-lg px-4 py-2 text-slate-100 focus:ring-primary focus:border-primary"
                  placeholder="VD: 500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Thành phố *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full bg-background-dark border border-border-gold rounded-lg px-4 py-2 text-slate-100 focus:ring-primary focus:border-primary"
                  placeholder="VD: Hà Nội"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Địa chỉ *
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full bg-background-dark border border-border-gold rounded-lg px-4 py-2 text-slate-100 focus:ring-primary focus:border-primary"
                  placeholder="VD: 52 Nguyễn Du, Hai Bà Trưng"
                />
                {formData.address && formData.city && (
                  <button
                    type="button"
                    onClick={openInGoogleMaps}
                    className="text-sm text-primary hover:text-gold-light transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-base">map</span>
                    Xem trên Google Maps
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Mô tả
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full bg-background-dark border border-border-gold rounded-lg px-4 py-2 text-slate-100 focus:ring-primary focus:border-primary"
                placeholder="Mô tả về địa điểm..."
              />
            </div>
          </div>

          {/* Cấu hình ghế ngồi */}
          <div className="space-y-4 pt-4 border-t border-border-gold">
            <h3 className="text-lg font-semibold text-slate-100">Cấu hình ghế ngồi</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tổng số hàng
                </label>
                <input
                  type="number"
                  name="total_rows"
                  value={formData.total_rows}
                  onChange={handleChange}
                  min="1"
                  className="w-full bg-background-dark border border-border-gold rounded-lg px-4 py-2 text-slate-100 focus:ring-primary focus:border-primary"
                  placeholder="VD: 20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Số ghế mỗi hàng
                </label>
                <input
                  type="number"
                  name="seats_per_row"
                  value={formData.seats_per_row}
                  onChange={handleChange}
                  min="1"
                  className="w-full bg-background-dark border border-border-gold rounded-lg px-4 py-2 text-slate-100 focus:ring-primary focus:border-primary"
                  placeholder="VD: 25"
                />
              </div>
            </div>
          </div>

          {/* Tiện ích */}
          <div className="space-y-4 pt-4 border-t border-border-gold">
            <h3 className="text-lg font-semibold text-slate-100">Tiện ích</h3>
            
            <div className="grid grid-cols-2 gap-3">
              {facilityOptions.map((facility) => (
                <label 
                  key={facility}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.facilities.includes(facility)}
                    onChange={() => handleFacilityToggle(facility)}
                    className="rounded border-border-gold text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-slate-300 capitalize">
                    {facility.replace('_', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Trạng thái */}
          <div className="space-y-4 pt-4 border-t border-border-gold">
            <h3 className="text-lg font-semibold text-slate-100">Trạng thái</h3>
            
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full bg-background-dark border border-border-gold rounded-lg px-4 py-2 text-slate-100 focus:ring-primary focus:border-primary"
            >
              <option value="active">Hoạt động</option>
              <option value="maintenance">Bảo trì</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-background-dark border border-border-gold text-slate-200 font-semibold rounded-lg hover:bg-border-gold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 gold-gradient text-background-dark font-bold rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : (venue ? 'Cập nhật' : 'Tạo mới')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VenueModal

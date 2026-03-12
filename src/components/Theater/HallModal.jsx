import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const HallModal = ({ isOpen, onClose, onSave, hall, floors, theaterId, venueId }) => {
  const [formData, setFormData] = useState({
    floor_id: '',
    name: '',
    description: '',
    capacity: '',
    total_rows: '',
    seats_per_row: '',
    stage_width: '',
    stage_depth: '',
    stage_height: '',
    has_sound_system: false,
    has_lighting_system: false,
    has_projection: false,
    has_orchestra_pit: false,
    has_backstage: false,
    has_dressing_room: false,
    status: 'active'
  })

  useEffect(() => {
    if (hall) {
      setFormData({
        floor_id: hall.floor_id || '',
        name: hall.name || '',
        description: hall.description || '',
        capacity: hall.capacity || '',
        total_rows: hall.total_rows || '',
        seats_per_row: hall.seats_per_row || '',
        stage_width: hall.stage_width || '',
        stage_depth: hall.stage_depth || '',
        stage_height: hall.stage_height || '',
        has_sound_system: hall.has_sound_system || false,
        has_lighting_system: hall.has_lighting_system || false,
        has_projection: hall.has_projection || false,
        has_orchestra_pit: hall.has_orchestra_pit || false,
        has_backstage: hall.has_backstage || false,
        has_dressing_room: hall.has_dressing_room || false,
        status: hall.status || 'active'
      })
    } else {
      setFormData({
        floor_id: floors[0]?.id || '',
        name: '',
        description: '',
        capacity: '',
        total_rows: '',
        seats_per_row: '',
        stage_width: '',
        stage_depth: '',
        stage_height: '',
        has_sound_system: false,
        has_lighting_system: false,
        has_projection: false,
        has_orchestra_pit: false,
        has_backstage: false,
        has_dressing_room: false,
        status: 'active'
      })
    }
  }, [hall, floors, isOpen])

  // Auto-calculate capacity when rows or seats per row changes
  useEffect(() => {
    const rows = parseInt(formData.total_rows) || 0
    const seatsPerRow = parseInt(formData.seats_per_row) || 0
    const calculatedCapacity = rows * seatsPerRow
    
    if (calculatedCapacity > 0 && calculatedCapacity !== parseInt(formData.capacity)) {
      setFormData(prev => ({ ...prev, capacity: calculatedCapacity.toString() }))
    }
  }, [formData.total_rows, formData.seats_per_row])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const dataToSave = {
      ...formData,
      theater_id: theaterId,
      venue_id: venueId,
      capacity: parseInt(formData.capacity) || 0,
      total_rows: parseInt(formData.total_rows) || 0,
      seats_per_row: parseInt(formData.seats_per_row) || 0,
      stage_width: formData.stage_width ? parseFloat(formData.stage_width) : null,
      stage_depth: formData.stage_depth ? parseFloat(formData.stage_depth) : null,
      stage_height: formData.stage_height ? parseFloat(formData.stage_height) : null
    }

    await onSave(dataToSave, hall?.id)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-surface-dark border border-border-gold rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-primary">
              {hall ? 'Chỉnh sửa Khán Phòng' : 'Thêm Khán Phòng Mới'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 mb-2 font-medium">
                  Tầng <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.floor_id}
                  onChange={(e) => setFormData({ ...formData, floor_id: e.target.value })}
                  className="w-full px-4 py-2 bg-background-dark border border-slate-600 rounded-lg text-slate-100 focus:border-primary focus:outline-none"
                >
                  <option value="">Chọn tầng</option>
                  {floors.map(floor => (
                    <option key={floor.id} value={floor.id}>
                      {floor.name || `Tầng ${floor.floor_number}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-2 font-medium">
                  Trạng Thái
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 bg-background-dark border border-slate-600 rounded-lg text-slate-100 focus:border-primary focus:outline-none"
                >
                  <option value="active">Hoạt động</option>
                  <option value="maintenance">Bảo trì</option>
                  <option value="inactive">Không hoạt động</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-2 font-medium">
                Tên Khán Phòng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-background-dark border border-slate-600 rounded-lg text-slate-100 focus:border-primary focus:outline-none"
                placeholder="VD: Khán Phòng Lớn, Phòng VIP"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-2 font-medium">
                Mô Tả
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="2"
                className="w-full px-4 py-2 bg-background-dark border border-slate-600 rounded-lg text-slate-100 focus:border-primary focus:outline-none"
                placeholder="Mô tả về khán phòng..."
              />
            </div>

            {/* Seating Info */}
            <div>
              <h3 className="text-lg font-bold text-slate-200 mb-3">Thông Tin Ghế Ngồi</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 mb-2 font-medium">
                    Số Hàng Ghế <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.total_rows}
                    onChange={(e) => setFormData({ ...formData, total_rows: e.target.value })}
                    className="w-full px-4 py-2 bg-background-dark border border-slate-600 rounded-lg text-slate-100 focus:border-primary focus:outline-none"
                    placeholder="20"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-2 font-medium">
                    Ghế Mỗi Hàng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.seats_per_row}
                    onChange={(e) => setFormData({ ...formData, seats_per_row: e.target.value })}
                    className="w-full px-4 py-2 bg-background-dark border border-slate-600 rounded-lg text-slate-100 focus:border-primary focus:outline-none"
                    placeholder="25"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-2 font-medium">
                    Sức Chứa (Tự động)
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={formData.capacity}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 cursor-not-allowed"
                    placeholder="0"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    = Số hàng × Ghế mỗi hàng
                  </p>
                </div>
              </div>
            </div>

            {/* Stage Dimensions */}
            <div>
              <h3 className="text-lg font-bold text-slate-200 mb-3">Kích Thước Sân Khấu (m)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 mb-2 font-medium">Chiều Rộng</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.stage_width}
                    onChange={(e) => setFormData({ ...formData, stage_width: e.target.value })}
                    className="w-full px-4 py-2 bg-background-dark border border-slate-600 rounded-lg text-slate-100 focus:border-primary focus:outline-none"
                    placeholder="12.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-2 font-medium">Chiều Sâu</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.stage_depth}
                    onChange={(e) => setFormData({ ...formData, stage_depth: e.target.value })}
                    className="w-full px-4 py-2 bg-background-dark border border-slate-600 rounded-lg text-slate-100 focus:border-primary focus:outline-none"
                    placeholder="8.0"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-2 font-medium">Chiều Cao</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.stage_height}
                    onChange={(e) => setFormData({ ...formData, stage_height: e.target.value })}
                    className="w-full px-4 py-2 bg-background-dark border border-slate-600 rounded-lg text-slate-100 focus:border-primary focus:outline-none"
                    placeholder="1.2"
                  />
                </div>
              </div>
            </div>

            {/* Facilities */}
            <div>
              <h3 className="text-lg font-bold text-slate-200 mb-3">Trang Thiết Bị & Tiện Nghi</h3>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_sound_system}
                    onChange={(e) => setFormData({ ...formData, has_sound_system: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-600 bg-background-dark text-primary focus:ring-primary"
                  />
                  <span className="text-slate-300">Hệ thống âm thanh</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_lighting_system}
                    onChange={(e) => setFormData({ ...formData, has_lighting_system: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-600 bg-background-dark text-primary focus:ring-primary"
                  />
                  <span className="text-slate-300">Hệ thống ánh sáng</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_projection}
                    onChange={(e) => setFormData({ ...formData, has_projection: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-600 bg-background-dark text-primary focus:ring-primary"
                  />
                  <span className="text-slate-300">Máy chiếu</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_orchestra_pit}
                    onChange={(e) => setFormData({ ...formData, has_orchestra_pit: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-600 bg-background-dark text-primary focus:ring-primary"
                  />
                  <span className="text-slate-300">Hố nhạc</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_backstage}
                    onChange={(e) => setFormData({ ...formData, has_backstage: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-600 bg-background-dark text-primary focus:ring-primary"
                  />
                  <span className="text-slate-300">Hậu trường</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_dressing_room}
                    onChange={(e) => setFormData({ ...formData, has_dressing_room: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-600 bg-background-dark text-primary focus:ring-primary"
                  />
                  <span className="text-slate-300">Phòng thay đồ</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-700">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-primary text-black rounded-lg hover:brightness-110 transition-all font-bold shadow-[0_0_15px_rgba(255,215,0,0.3)]"
              >
                {hall ? 'Cập Nhật' : 'Thêm Khán Phòng'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default HallModal

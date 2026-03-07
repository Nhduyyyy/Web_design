import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const FloorModal = ({ isOpen, onClose, onSave, floor, theaterId, venueId }) => {
  const [formData, setFormData] = useState({
    floor_number: '',
    name: '',
    floor_type: 'main',
    description: '',
    has_elevator: false,
    has_restroom: false,
    has_bar: false
  })

  useEffect(() => {
    if (floor) {
      setFormData({
        floor_number: floor.floor_number || '',
        name: floor.name || '',
        floor_type: floor.floor_type || 'main',
        description: floor.description || '',
        has_elevator: floor.has_elevator || false,
        has_restroom: floor.has_restroom || false,
        has_bar: floor.has_bar || false
      })
    } else {
      setFormData({
        floor_number: '',
        name: '',
        floor_type: 'main',
        description: '',
        has_elevator: false,
        has_restroom: false,
        has_bar: false
      })
    }
  }, [floor, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const dataToSave = {
      ...formData,
      theater_id: theaterId,
      venue_id: venueId,
      floor_number: parseInt(formData.floor_number)
    }

    await onSave(dataToSave, floor?.id)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-surface-dark border border-border-gold rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-primary">
              {floor ? 'Chỉnh sửa Tầng' : 'Thêm Tầng Mới'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 mb-2 font-medium">
                  Số Tầng <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="-2"
                  max="20"
                  value={formData.floor_number}
                  onChange={(e) => setFormData({ ...formData, floor_number: e.target.value })}
                  className="w-full px-4 py-2 bg-background-dark border border-slate-600 rounded-lg text-slate-100 focus:border-primary focus:outline-none"
                  placeholder="VD: 1, 2, -1 (hầm)"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-2 font-medium">
                  Loại Tầng
                </label>
                <select
                  value={formData.floor_type}
                  onChange={(e) => setFormData({ ...formData, floor_type: e.target.value })}
                  className="w-full px-4 py-2 bg-background-dark border border-slate-600 rounded-lg text-slate-100 focus:border-primary focus:outline-none"
                >
                  <option value="main">Tầng chính</option>
                  <option value="balcony">Ban công</option>
                  <option value="technical">Tầng kỹ thuật</option>
                  <option value="vip">Tầng VIP</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-2 font-medium">
                Tên Tầng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-background-dark border border-slate-600 rounded-lg text-slate-100 focus:border-primary focus:outline-none"
                placeholder="VD: Tầng 1 (Trệt), Tầng 2 (Ban Công)"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-2 font-medium">
                Mô Tả
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
                className="w-full px-4 py-2 bg-background-dark border border-slate-600 rounded-lg text-slate-100 focus:border-primary focus:outline-none"
                placeholder="Mô tả về tầng này..."
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-3 font-medium">Tiện Nghi</label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_elevator}
                    onChange={(e) => setFormData({ ...formData, has_elevator: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-600 bg-background-dark text-primary focus:ring-primary"
                  />
                  <span className="text-slate-300">Có thang máy</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_restroom}
                    onChange={(e) => setFormData({ ...formData, has_restroom: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-600 bg-background-dark text-primary focus:ring-primary"
                  />
                  <span className="text-slate-300">Có nhà vệ sinh</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_bar}
                    onChange={(e) => setFormData({ ...formData, has_bar: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-600 bg-background-dark text-primary focus:ring-primary"
                  />
                  <span className="text-slate-300">Có quầy bar</span>
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
                {floor ? 'Cập Nhật' : 'Thêm Tầng'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default FloorModal

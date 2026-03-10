import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, RefreshCw, Clock, Users, Eye, Edit2, Trash2, X } from 'lucide-react'
import { useShows } from '../../hooks/useShows'
import TheaterHeader from './TheaterHeader'

const ShowCard = ({ show, onEdit, onDelete, onView }) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl overflow-hidden shadow-md border border-amber-100"
    >
      <div className="relative h-48 bg-amber-50">
        {show.thumbnail_url ? (
          <img
            src={show.thumbnail_url}
            alt={show.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-amber-200 text-4xl">
            🎭
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{show.title}</h3>

        {show.description && (
          <p className="text-sm text-gray-500 line-clamp-2">{show.description}</p>
        )}

        <div className="flex flex-wrap gap-2 text-xs text-gray-400">
          {show.duration && (
            <span className="flex items-center gap-1">
              <Clock size={12} /> {show.duration} phút
            </span>
          )}
          {show.characters && show.characters.length > 0 && (
            <span className="flex items-center gap-1">
              <Users size={12} /> {show.characters.length} nhân vật
            </span>
          )}
        </div>

        {show.tags && show.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {show.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => onView(show)}
            className="flex-1 flex items-center justify-center gap-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg py-1.5"
          >
            <Eye size={14} /> Xem
          </button>
          <button
            onClick={() => onEdit(show)}
            className="flex-1 flex items-center justify-center gap-1 text-sm text-amber-600 hover:bg-amber-50 rounded-lg py-1.5"
          >
            <Edit2 size={14} /> Sửa
          </button>
          <button
            onClick={() => onDelete(show)}
            className="flex-1 flex items-center justify-center gap-1 text-sm text-red-500 hover:bg-red-50 rounded-lg py-1.5"
          >
            <Trash2 size={14} /> Xóa
          </button>
        </div>
      </div>
    </motion.div>
  )
}

const ShowForm = ({ initialData, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    synopsis: initialData?.synopsis || '',
    duration: initialData?.duration || undefined,
    thumbnail_url: initialData?.thumbnail_url || '',
    cover_image_url: initialData?.cover_image_url || '',
    trailer_url: initialData?.trailer_url || '',
    tags: initialData?.tags || [],
    characters: initialData?.characters || [],
  })

  const [tagInput, setTagInput] = useState('')
  const [charInput, setCharInput] = useState('')
  const [errors, setErrors] = useState({})

  const validate = () => {
    const newErrors = {}
    if (!form.title.trim()) newErrors.title = 'Tên vở diễn không được để trống'
    if (form.duration && form.duration <= 0) {
      newErrors.duration = 'Thời lượng phải lớn hơn 0'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    await onSubmit(form)
  }

  const addTag = () => {
    const val = tagInput.trim()
    if (val && !(form.tags || []).includes(val)) {
      setForm((f) => ({ ...f, tags: [...(f.tags || []), val] }))
    }
    setTagInput('')
  }

  const removeTag = (tag) => {
    setForm((f) => ({ ...f, tags: (f.tags || []).filter((t) => t !== tag) }))
  }

  const addCharacter = () => {
    const val = charInput.trim()
    if (val && !(form.characters || []).includes(val)) {
      setForm((f) => ({ ...f, characters: [...(f.characters || []), val] }))
    }
    setCharInput('')
  }

  const removeCharacter = (char) => {
    setForm((f) => ({ ...f, characters: (f.characters || []).filter((c) => c !== char) }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tên vở diễn <span className="text-red-500">*</span>
        </label>
        <input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none"
          placeholder="VD: Trưng Nữ Vương"
        />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả ngắn</label>
        <textarea
          value={form.description || ''}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={2}
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none resize-none"
          placeholder="Mô tả hiển thị ở card vở diễn..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tóm tắt nội dung</label>
        <textarea
          value={form.synopsis || ''}
          onChange={(e) => setForm((f) => ({ ...f, synopsis: e.target.value }))}
          rows={4}
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none resize-none"
          placeholder="Tóm tắt toàn bộ nội dung vở diễn..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Thời lượng (phút)</label>
        <input
          type="number"
          min={1}
          value={form.duration || ''}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              duration: e.target.value ? Number(e.target.value) : undefined,
            }))
          }
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none"
          placeholder="VD: 120"
        />
        {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration}</p>}
      </div>

      {['thumbnail_url', 'cover_image_url', 'trailer_url'].map((field) => (
        <div key={field}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field === 'thumbnail_url'
              ? 'URL Thumbnail'
              : field === 'cover_image_url'
              ? 'URL Ảnh Bìa'
              : 'URL Trailer'}
          </label>
          <input
            value={form[field] || ''}
            onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none"
            placeholder="https://..."
          />
        </div>
      ))}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
        <div className="flex gap-2 mb-2">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTag()
              }
            }}
            className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none"
            placeholder="Nhập tag rồi Enter..."
          />
          <button
            type="button"
            onClick={addTag}
            className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200"
          >
            + Thêm
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {(form.tags || []).map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-red-500"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nhân vật</label>
        <div className="flex gap-2 mb-2">
          <input
            value={charInput}
            onChange={(e) => setCharInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCharacter()
              }
            }}
            className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none"
            placeholder="Tên nhân vật rồi Enter..."
          />
          <button
            type="button"
            onClick={addCharacter}
            className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200"
          >
            + Thêm
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {(form.characters || []).map((char) => (
            <span
              key={char}
              className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
            >
              {char}
              <button
                type="button"
                onClick={() => removeCharacter(char)}
                className="hover:text-red-500"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
        >
          {loading ? 'Đang lưu...' : initialData ? 'Cập nhật' : 'Tạo mới'}
        </button>
      </div>
    </form>
  )
}

const ShowDetailModal = ({ show, onClose }) => {
  if (!show) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-surface-dark max-w-3xl w-full rounded-2xl border border-border-gold overflow-hidden shadow-2xl"
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
        >
          <div className="relative h-52 bg-black">
            {show.cover_image_url ? (
              <img
                src={show.cover_image_url}
                alt={show.title}
                className="w-full h-full object-cover opacity-80"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl text-primary/40">
                🎭
              </div>
            )}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-slate-100 hover:bg-black/80"
            >
              <X size={18} />
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <h2 className="text-2xl font-bold text-slate-50">{show.title}</h2>
              {show.duration && (
                <p className="mt-1 text-sm text-slate-300 flex items-center gap-2">
                  <Clock size={14} /> {show.duration} phút
                </p>
              )}
            </div>
          </div>

          <div className="p-6 space-y-6 bg-background-dark text-slate-100">
            {show.trailer_url && (
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Trailer</h3>
                <div className="aspect-video rounded-xl overflow-hidden border border-border-gold bg-black">
                  <iframe
                    src={show.trailer_url}
                    title={show.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {show.synopsis && (
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Tóm tắt nội dung</h3>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                  {show.synopsis}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {show.characters && show.characters.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Nhân vật</h3>
                  <div className="flex flex-wrap gap-2">
                    {show.characters.map((char) => (
                      <span
                        key={char}
                        className="px-2 py-1 rounded-full bg-blue-100/10 text-blue-200 text-xs border border-blue-500/40"
                      >
                        {char}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {show.tags && show.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {show.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 rounded-full bg-amber-100/10 text-amber-200 text-xs border border-amber-500/40"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {show.description && (
              <div className="pt-2 border-t border-slate-700/60">
                <h3 className="text-sm font-semibold text-slate-300 mb-1">Mô tả ngắn</h3>
                <p className="text-xs text-slate-400">{show.description}</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

const TheaterShows = () => {
  const [search, setSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [minDuration, setMinDuration] = useState('')
  const [maxDuration, setMaxDuration] = useState('')
  const [selectedShow, setSelectedShow] = useState(null)
  const [showFormOpen, setShowFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [detailShow, setDetailShow] = useState(null)

  const { shows, loading, error, createShow, updateShow, deleteShow } = useShows(
    useMemo(
      () => ({
        search,
        tags: selectedTags,
        minDuration: minDuration ? Number(minDuration) : undefined,
        maxDuration: maxDuration ? Number(maxDuration) : undefined,
      }),
      [search, selectedTags, minDuration, maxDuration],
    ),
  )

  const allTags = useMemo(() => {
    const set = new Set()
    shows.forEach((s) => (s.tags || []).forEach((t) => set.add(t)))
    return Array.from(set)
  }, [shows])

  const toggleTagFilter = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedTags([])
    setMinDuration('')
    setMaxDuration('')
  }

  const handleSubmit = async (data) => {
    setFormLoading(true)
    try {
      if (selectedShow) {
        await updateShow(selectedShow.id, data)
      } else {
        await createShow(data)
      }
      setShowFormOpen(false)
      setSelectedShow(null)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteShow(deleteTarget.id)
    setDeleteTarget(null)
  }

  const handleView = (show) => {
    setDetailShow(show)
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <TheaterHeader />

      <main className="p-6 max-w-6xl mx-auto">
        <div className="bg-surface-dark rounded-2xl border border-border-gold p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-50">🎭 Quản Lý Vở Diễn</h1>
              <p className="text-sm text-slate-400 mt-1">{shows.length} vở diễn</p>
            </div>
            <button
              onClick={() => {
                setSelectedShow(null)
                setShowFormOpen(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-background-dark rounded-xl hover:brightness-110"
            >
              <Plus size={18} /> Tạo vở diễn
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative col-span-1 md:col-span-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm theo tên vở diễn..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background-dark border border-border-gold/40 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs text-slate-400 font-medium">Thời lượng (phút)</span>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    value={minDuration}
                    onChange={(e) => setMinDuration(e.target.value)}
                    placeholder="Từ"
                    className="w-full rounded-xl bg-background-dark border border-border-gold/40 text-slate-100 px-3 py-2 text-sm placeholder:text-slate-500 focus:ring-2 focus:ring-primary outline-none"
                  />
                  <input
                    type="number"
                    min={0}
                    value={maxDuration}
                    onChange={(e) => setMaxDuration(e.target.value)}
                    placeholder="Đến"
                    className="w-full rounded-xl bg-background-dark border border-border-gold/40 text-slate-100 px-3 py-2 text-sm placeholder:text-slate-500 focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs text-slate-400 font-medium flex justify-between">
                  <span>Tags</span>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs text-slate-400 hover:text-primary flex items-center gap-1"
                  >
                    <RefreshCw size={12} /> Xóa lọc
                  </button>
                </span>
                <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto pr-1">
                  {allTags.length === 0 && (
                    <span className="text-xs text-slate-500 italic">
                      Chưa có tag nào. Thêm tag trong form vở diễn.
                    </span>
                  )}
                  {allTags.map((tag) => {
                    const active = selectedTags.includes(tag)
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTagFilter(tag)}
                        className={`px-2 py-1 rounded-full text-xs border transition-colors ${
                          active
                            ? 'bg-amber-500 text-black border-amber-400'
                            : 'bg-background-dark text-amber-200 border-amber-500/40 hover:bg-amber-500/20'
                        }`}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {loading && (
            <div className="flex justify-center py-20 text-primary items-center gap-2">
              <RefreshCw className="animate-spin" size={18} /> <span>Đang tải...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-10 text-red-400">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {shows.map((show) => (
                <ShowCard
                  key={show.id}
                  show={show}
                  onEdit={(s) => {
                    setSelectedShow(s)
                    setShowFormOpen(true)
                  }}
                  onDelete={(s) => setDeleteTarget(s)}
                  onView={handleView}
                />
              ))}
              {shows.length === 0 && (
                <div className="col-span-full text-center py-20 text-slate-500">
                  Chưa có vở diễn nào. Hãy tạo vở diễn đầu tiên!
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {showFormOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-black rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-5">
              {selectedShow ? 'Chỉnh sửa vở diễn' : 'Tạo vở diễn mới'}
            </h2>
            <ShowForm
              initialData={selectedShow || undefined}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowFormOpen(false)
                setSelectedShow(null)
              }}
              loading={formLoading}
            />
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <p className="text-lg font-semibold mb-2">Xóa vở diễn?</p>
            <p className="text-gray-500 text-sm mb-6">
              Bạn có chắc muốn xóa "<strong>{deleteTarget.title}</strong>"? Hành động này
              không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      <ShowDetailModal show={detailShow} onClose={() => setDetailShow(null)} />
    </div>
  )
}

export default TheaterShows


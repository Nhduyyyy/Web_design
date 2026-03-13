import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadTheaterLogo, uploadTheaterCover, updateTheater } from '../../services/theaterService'

const TheaterProfile = ({ theater, onUpdate }) => {
  const navigate = useNavigate()
  const [uploading, setUploading] = useState(false)
  // Cache-buster: sau khi upload thành công, ép trình duyệt tải lại ảnh (URL path có thể giống nhau khi upsert)
  const [logoCacheBuster, setLogoCacheBuster] = useState(null)
  const [coverCacheBuster, setCoverCacheBuster] = useState(null)

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-primary/10 text-primary border-primary/30'
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
      case 'rejected':
        return 'bg-red-500/10 text-red-500 border-red-500/30'
      case 'suspended':
        return 'bg-slate-500/10 text-slate-500 border-slate-500/30'
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/30'
    }
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log('[TheaterProfile] Logo upload bắt đầu:', { theaterId: theater.id, fileName: file.name, size: file.size })
    try {
      setUploading(true)
      const logoUrl = await uploadTheaterLogo(theater.id, file)
      console.log('[TheaterProfile] Logo upload thành công:', logoUrl)
      setLogoCacheBuster(Date.now())
      onUpdate({ ...theater, logo_url: logoUrl })
    } catch (error) {
      console.error('[TheaterProfile] Logo upload thất bại:', error?.message || error)
      alert('Failed to upload logo')
    } finally {
      setUploading(false)
    }
  }

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log('[TheaterProfile] Cover upload bắt đầu:', { theaterId: theater.id, fileName: file.name, size: file.size })
    try {
      setUploading(true)
      const coverUrl = await uploadTheaterCover(theater.id, file)
      console.log('[TheaterProfile] Cover upload thành công:', coverUrl)
      setCoverCacheBuster(Date.now())
      onUpdate({ ...theater, cover_image_url: coverUrl })
    } catch (error) {
      console.error('[TheaterProfile] Cover upload thất bại:', error?.message || error)
      alert('Failed to upload cover image')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-surface-dark rounded-xl border border-border-gold overflow-hidden red-accent-glow">
      {/* Cover: hiển thị khi theater.cover_image_url có giá trị; cache-buster để ảnh mới upload hiện ngay */}
      <div 
        className="h-32 bg-accent-red/20 relative group cursor-pointer"
        style={{
          backgroundImage: theater.cover_image_url
            ? `url(${theater.cover_image_url}${coverCacheBuster ? `?t=${coverCacheBuster}` : ''})`
            : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleCoverUpload}
          className="hidden"
          id="cover-upload"
          disabled={uploading}
        />
        <label 
          htmlFor="cover-upload"
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
        >
          <span className="material-symbols-outlined text-white">
            {uploading ? 'hourglass_empty' : 'photo_camera'}
          </span>
        </label>
      </div>

      <div className="px-6 pb-6 relative">
        {/* Logo: hiển thị khi theater.logo_url có giá trị; cache-buster để ảnh mới upload hiện ngay */}
        <div className="absolute top-[-105px] left-6 h-24 w-24 rounded-xl border-4 border-surface-dark bg-background-dark overflow-hidden group">
          {theater.logo_url ? (
            <img 
              alt="Theater Logo" 
              className="h-full w-full object-cover" 
              src={`${theater.logo_url}${logoCacheBuster ? `?t=${logoCacheBuster}` : ''}`}
            />
          ) : (
            <div className="h-full w-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
              {theater.name?.[0]?.toUpperCase() || 'T'}
            </div>
          )}
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleLogoUpload}
            className="hidden"
            id="logo-upload"
            disabled={uploading}
          />
          <label 
            htmlFor="logo-upload"
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-xs text-white">
              {uploading ? 'hourglass_empty' : 'edit'}
            </span>
          </label>
        </div>

        <div className="mt-14 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-100">{theater.name}</h1>
              <p className="text-slate-400 text-sm">{theater.description || 'Traditional Tuồng Art Center'}</p>
            </div>
            <span className={`px-3 py-1 border rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(theater.status)}`}>
              {theater.status}
            </span>
          </div>

          <div className="pt-4 border-t border-border-gold space-y-3">
            <div className="flex items-center gap-3 text-slate-300">
              <span className="material-symbols-outlined text-primary text-sm">location_on</span>
              <span className="text-sm">{theater.address}, {theater.city}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <span className="material-symbols-outlined text-primary text-sm">mail</span>
              <span className="text-sm">{theater.email}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <span className="material-symbols-outlined text-primary text-sm">call</span>
              <span className="text-sm">{theater.phone}</span>
            </div>
            {theater.website && (
              <div className="flex items-center gap-3 text-slate-300">
                <span className="material-symbols-outlined text-primary text-sm">language</span>
                <a 
                  href={theater.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm hover:text-primary transition-colors"
                >
                  {theater.website}
                </a>
              </div>
            )}
          </div>

          <button 
            onClick={() => navigate('/theater/profile')}
            className="w-full mt-4 py-2.5 gold-gradient text-background-dark font-bold rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">edit_note</span>
            Xem hồ sơ
          </button>
        </div>
      </div>
    </div>
  )
}

export default TheaterProfile

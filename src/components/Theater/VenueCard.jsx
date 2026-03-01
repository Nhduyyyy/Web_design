import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteVenue } from '../../services/theaterService'

const VenueCard = ({ venue, onEdit, onUpdate }) => {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-primary/10 text-primary border-primary/30'
      case 'maintenance':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30'
      case 'inactive':
        return 'bg-red-500/10 text-red-500 border-red-500/30'
      default:
        return 'bg-primary/10 text-primary border-primary/30'
    }
  }

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa địa điểm này?')) return

    try {
      setDeleting(true)
      await deleteVenue(venue.id)
      onUpdate()
    } catch (error) {
      console.error('Error deleting venue:', error)
      alert('Không thể xóa địa điểm')
    } finally {
      setDeleting(false)
    }
  }

  const isInactive = venue.status?.toLowerCase() === 'maintenance' || venue.status?.toLowerCase() === 'inactive'

  const handleCardClick = () => {
    navigate(`/theater/halls/${venue.id}`)
  }

  return (
    <div 
      onClick={handleCardClick}
      className={`bg-surface-dark rounded-xl border border-border-gold overflow-hidden group hover:border-primary/50 transition-all cursor-pointer ${isInactive ? 'opacity-75' : ''}`}
    >
      {/* Venue Image */}
      <div className="h-40 relative bg-gradient-to-br from-accent-red/20 to-primary/20">
        {venue.images && venue.images.length > 0 ? (
          <img 
            alt={venue.name} 
            className={`h-full w-full object-cover ${isInactive ? 'grayscale' : ''}`}
            src={venue.images[0]}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <span className="material-symbols-outlined text-6xl text-slate-600">theater_comedy</span>
          </div>
        )}
        <div className={`absolute top-4 right-4 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(venue.status || 'active')}`}>
          {venue.status?.toUpperCase() || 'ACTIVE'}
        </div>
      </div>

      {/* Venue Info */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-100">{venue.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="material-symbols-outlined text-slate-400 text-sm">groups</span>
              <span className="text-sm text-slate-400">Sức chứa: {venue.capacity} Ghế</span>
            </div>
            {venue.city && (
              <div className="flex items-center gap-2 mt-1">
                <span className="material-symbols-outlined text-slate-400 text-sm">location_on</span>
                <span className="text-sm text-slate-400">{venue.city}</span>
              </div>
            )}
            {venue.address && (
              <div className="flex items-center gap-2 mt-1">
                <span className="material-symbols-outlined text-slate-400 text-sm">place</span>
                <span className="text-xs text-slate-400">{venue.address}</span>
                <button
                  onClick={() => {
                    const address = `${venue.address}, ${venue.city}, Vietnam`
                    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
                    window.open(url, '_blank')
                  }}
                  className="text-primary hover:text-gold-light transition-colors"
                  title="Xem trên Google Maps"
                >
                  <span className="material-symbols-outlined text-sm">map</span>
                </button>
              </div>
            )}
          </div>
          
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">more_vert</span>
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-surface-dark border border-border-gold rounded-lg shadow-xl py-2 z-10">
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(venue)
                    setShowMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-background-dark hover:text-primary transition-colors"
                >
                  Chỉnh sửa
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete()
                    setShowMenu(false)
                  }}
                  disabled={deleting}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-background-dark transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Đang xóa...' : 'Xóa'}
                </button>
              </div>
            )}
          </div>
        </div>

        {venue.description && (
          <p className="text-sm text-slate-400 mb-4 line-clamp-2">{venue.description}</p>
        )}

        {/* Facilities */}
        {venue.facilities && venue.facilities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {venue.facilities.slice(0, 3).map((facility, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-background-dark border border-border-gold/50 text-slate-400 text-xs rounded"
              >
                {facility}
              </span>
            ))}
            {venue.facilities.length > 3 && (
              <span className="px-2 py-1 bg-background-dark border border-border-gold/50 text-slate-400 text-xs rounded">
                +{venue.facilities.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button 
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/theater/halls/${venue.id}`)
            }}
            className="flex-1 py-2 bg-background-dark border border-border-gold text-slate-200 text-sm font-semibold rounded-lg hover:bg-border-gold transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">visibility</span>
            Xem chi tiết
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation()
              onEdit(venue)
            }}
            className="px-4 py-2 bg-accent-red/10 border border-accent-red/30 text-accent-red hover:bg-accent-red hover:text-white text-sm font-semibold rounded-lg transition-all"
          >
            Sửa
          </button>
        </div>
      </div>
    </div>
  )
}

export default VenueCard

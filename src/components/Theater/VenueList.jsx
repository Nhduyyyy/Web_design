import { useState } from 'react'
import VenueCard from './VenueCard'
import VenueModal from './VenueModal'

const VenueList = ({ theater, venues, onUpdate }) => {
  const [showModal, setShowModal] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState(null)

  const handleAddVenue = () => {
    setSelectedVenue(null)
    setShowModal(true)
  }

  const handleEditVenue = (venue) => {
    setSelectedVenue(venue)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedVenue(null)
  }

  const handleSaveVenue = () => {
    handleCloseModal()
    onUpdate()
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Danh sách Địa điểm</h2>
          <p className="text-slate-400">Quản lý các không gian biểu diễn của nhà hát</p>
        </div>
        <button 
          onClick={handleAddVenue}
          className="px-6 py-2.5 gold-gradient text-background-dark font-bold rounded-lg hover:brightness-110 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add_location</span>
          Thêm Địa điểm
        </button>
      </div>

      {/* Venue Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {venues.map((venue) => (
          <VenueCard 
            key={venue.id} 
            venue={venue}
            onEdit={handleEditVenue}
            onUpdate={onUpdate}
          />
        ))}

        {/* Add New Venue Placeholder */}
        <div 
          onClick={handleAddVenue}
          className="bg-background-dark border-2 border-dashed border-border-gold rounded-xl flex flex-col items-center justify-center p-8 group cursor-pointer hover:border-primary/50 transition-all hover:bg-surface-dark min-h-[280px]"
        >
          <div className="h-16 w-16 rounded-full bg-border-gold flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-4xl">add</span>
          </div>
          <p className="text-slate-100 font-bold">Thêm Địa điểm</p>
          <p className="text-slate-500 text-sm text-center mt-2 max-w-[200px]">
            Mở rộng nhà hát bằng cách thêm sân khấu biểu diễn
          </p>
        </div>
      </div>

      {/* Venue Modal */}
      {showModal && (
        <VenueModal
          theater={theater}
          venue={selectedVenue}
          onClose={handleCloseModal}
          onSave={handleSaveVenue}
        />
      )}
    </>
  )
}

export default VenueList

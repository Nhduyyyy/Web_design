import { useState, useEffect } from 'react'
import { getSchedulesByTheater } from '../../services/scheduleService'
import { getEventsByTheater } from '../../services/eventService'
import { getLivestreams } from '../../services/livestreamService'

const TheaterStats = ({ theater, venueCount }) => {
  const [stats, setStats] = useState({
    venues: venueCount,
    capacity: 0,
    schedules: 0,
    events: 0,
    livestreams: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [theater])

  const loadStats = async () => {
    try {
      setLoading(true)
      
      // Get schedules count
      const schedules = await getSchedulesByTheater(theater.id)
      
      // Get events count
      const events = await getEventsByTheater(theater.id)
      
      // Get livestreams count
      const livestreams = await getLivestreams({ theaterId: theater.id })

      setStats({
        venues: venueCount,
        capacity: theater.capacity || 0,
        schedules: schedules?.length || 0,
        events: events?.length || 0,
        livestreams: livestreams?.length || 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

  return (
    <div className="bg-surface-dark rounded-xl border border-border-gold p-6">
      <h3 className="text-slate-100 font-semibold mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">analytics</span>
        Thống kê nhanh
      </h3>
      
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-background-dark rounded-lg border border-border-gold/50 hover:border-primary/50 transition-colors">
            <p className="text-slate-500 text-xs mb-1 uppercase font-bold">Địa điểm</p>
            <p className="text-2xl font-bold text-primary">{stats.venues.toString().padStart(2, '0')}</p>
          </div>
          
          <div className="p-3 bg-background-dark rounded-lg border border-border-gold/50 hover:border-primary/50 transition-colors">
            <p className="text-slate-500 text-xs mb-1 uppercase font-bold">Sức chứa</p>
            <p className="text-2xl font-bold text-primary">{formatNumber(stats.capacity)}</p>
          </div>
          
          <div className="p-3 bg-background-dark rounded-lg border border-border-gold/50 hover:border-primary/50 transition-colors">
            <p className="text-slate-500 text-xs mb-1 uppercase font-bold">Lịch diễn</p>
            <p className="text-2xl font-bold text-primary">{stats.schedules.toString().padStart(2, '0')}</p>
          </div>
          
          <div className="p-3 bg-background-dark rounded-lg border border-border-gold/50 hover:border-primary/50 transition-colors">
            <p className="text-slate-500 text-xs mb-1 uppercase font-bold">Sự kiện</p>
            <p className="text-2xl font-bold text-primary">{stats.events.toString().padStart(2, '0')}</p>
          </div>
          
          <div className="p-3 bg-background-dark rounded-lg border border-border-gold/50 hover:border-primary/50 transition-colors col-span-2">
            <p className="text-slate-500 text-xs mb-1 uppercase font-bold">Phát trực tiếp</p>
            <p className="text-2xl font-bold text-primary">{stats.livestreams.toString().padStart(2, '0')}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default TheaterStats

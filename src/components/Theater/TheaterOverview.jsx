import { useState, useEffect } from 'react'
import { getFloorsByTheater } from '../../services/hallService'
import { getTodayPerformances } from '../../services/playService'

const TheaterOverview = ({ theater }) => {
  const [floors, setFloors] = useState([])
  const [todayPerformances, setTodayPerformances] = useState([])
  const [stats, setStats] = useState({
    totalFloors: 0,
    totalHalls: 0,
    totalCapacity: 0,
    todayShows: 0
  })

  useEffect(() => {
    if (theater) {
      loadTheaterData()
    }
  }, [theater])

  const loadTheaterData = async () => {
    try {
      // Load floors
      const floorsData = await getFloorsByTheater(theater.id)
      setFloors(floorsData)

      // Load today's performances
      const performancesData = await getTodayPerformances(theater.id)
      setTodayPerformances(performancesData)

      // Calculate stats
      const totalHalls = floorsData.reduce((sum, floor) => sum + (floor.total_halls || 0), 0)
      const totalCapacity = floorsData.reduce((sum, floor) => sum + (floor.total_seats || 0), 0)

      setStats({
        totalFloors: floorsData.length,
        totalHalls,
        totalCapacity,
        todayShows: performancesData.length
      })
    } catch (error) {
      console.error('Error loading theater data:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Theater Info Card */}
      <div className="bg-surface-dark rounded-xl border border-border-gold p-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">theater_comedy</span>
          Thông tin Nhà hát
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Tên nhà hát:</span>
              <span className="text-slate-100 font-semibold">{theater.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Địa chỉ:</span>
              <span className="text-slate-100 font-semibold">{theater.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Thành phố:</span>
              <span className="text-slate-100 font-semibold">{theater.city}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Số tầng:</span>
              <span className="text-slate-100 font-semibold">{stats.totalFloors}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Số khán phòng:</span>
              <span className="text-slate-100 font-semibold">{stats.totalHalls}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Sức chứa tổng:</span>
              <span className="text-slate-100 font-semibold">{stats.totalCapacity} ghế</span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Performances */}
      <div className="bg-surface-dark rounded-xl border border-border-gold p-6">
        <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">today</span>
          Lịch biểu diễn hôm nay
          <span className="ml-auto text-sm font-normal text-slate-400">
            {stats.todayShows} buổi diễn
          </span>
        </h3>

        {todayPerformances.length > 0 ? (
          <div className="space-y-3">
            {todayPerformances.map(perf => (
              <div key={perf.id} className="bg-background-dark rounded-lg p-4 border border-border-gold/50 hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-slate-100">{perf.play?.title}</h4>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        {perf.start_time}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">location_on</span>
                        {perf.hall?.name}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-400">Đã bán</div>
                    <div className="text-2xl font-bold text-primary">
                      {perf.sold_seats}/{perf.total_seats}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <span className="material-symbols-outlined text-6xl mb-2 block">event_busy</span>
            Không có buổi diễn nào hôm nay
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-dark rounded-xl border border-border-gold p-4 text-center">
          <div className="text-3xl font-bold text-primary mb-1">{stats.totalFloors}</div>
          <div className="text-sm text-slate-400">Tầng</div>
        </div>
        <div className="bg-surface-dark rounded-xl border border-border-gold p-4 text-center">
          <div className="text-3xl font-bold text-primary mb-1">{stats.totalHalls}</div>
          <div className="text-sm text-slate-400">Khán phòng</div>
        </div>
        <div className="bg-surface-dark rounded-xl border border-border-gold p-4 text-center">
          <div className="text-3xl font-bold text-primary mb-1">{stats.totalCapacity}</div>
          <div className="text-sm text-slate-400">Tổng ghế</div>
        </div>
        <div className="bg-surface-dark rounded-xl border border-border-gold p-4 text-center">
          <div className="text-3xl font-bold text-primary mb-1">{stats.todayShows}</div>
          <div className="text-sm text-slate-400">Buổi diễn hôm nay</div>
        </div>
      </div>
    </div>
  )
}

export default TheaterOverview

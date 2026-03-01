import { useState } from 'react'
import './PerformanceCalendar.css'

const PerformanceCalendar = ({ performances, hallId, onAddPerformance }) => {
  const [currentWeek, setCurrentWeek] = useState(0)

  // Get week dates
  const getWeekDates = (weekOffset = 0) => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + weekOffset * 7)
    
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const weekDates = getWeekDates(currentWeek)

  // Group performances by date
  const performancesByDate = performances.reduce((acc, perf) => {
    const date = perf.performance_date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(perf)
    return acc
  }, {})

  const formatDate = (date) => {
    return date.toISOString().split('T')[0]
  }

  const getDayName = (date) => {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
    return days[date.getDay()]
  }

  const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/20 text-blue-400'
      case 'ongoing': return 'bg-green-500/20 text-green-400'
      case 'completed': return 'bg-gray-500/20 text-gray-400'
      case 'cancelled': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <div className="performance-calendar">
      {/* Header */}
      <div className="calendar-header">
        <h2 className="text-2xl font-bold text-slate-100">Lịch biểu diễn</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentWeek(currentWeek - 1)}
            className="p-2 hover:bg-border-gold rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-slate-400">chevron_left</span>
          </button>
          <button
            onClick={() => setCurrentWeek(0)}
            className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
          >
            Tuần này
          </button>
          <button
            onClick={() => setCurrentWeek(currentWeek + 1)}
            className="p-2 hover:bg-border-gold rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {weekDates.map((date, index) => {
          const dateStr = formatDate(date)
          const dayPerformances = performancesByDate[dateStr] || []
          
          return (
            <div
              key={index}
              className={`calendar-day ${isToday(date) ? 'calendar-day-today' : ''}`}
            >
              {/* Day Header */}
              <div className="day-header">
                <div className="day-name">{getDayName(date)}</div>
                <div className="day-number">{date.getDate()}</div>
                <div className="day-month">Tháng {date.getMonth() + 1}</div>
              </div>

              {/* Performances */}
              <div className="day-performances">
                {dayPerformances.length > 0 ? (
                  dayPerformances.map(perf => (
                    <div key={perf.id} className="performance-item">
                      <div className="performance-time">
                        {perf.start_time}
                      </div>
                      <div className="performance-title">
                        {perf.play?.title}
                      </div>
                      <div className={`performance-status ${getStatusColor(perf.status)}`}>
                        {perf.status === 'scheduled' && 'Đã lên lịch'}
                        {perf.status === 'ongoing' && 'Đang diễn'}
                        {perf.status === 'completed' && 'Hoàn thành'}
                        {perf.status === 'cancelled' && 'Đã hủy'}
                      </div>
                      <div className="performance-seats">
                        <span className="material-symbols-outlined text-xs">event_seat</span>
                        {perf.sold_seats}/{perf.total_seats}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-performances">
                    <span className="material-symbols-outlined text-slate-600">event_busy</span>
                    <span className="text-slate-600 text-sm">Không có buổi diễn</span>
                  </div>
                )}

                {/* Add Performance Button */}
                {onAddPerformance && (
                  <button
                    onClick={() => onAddPerformance(dateStr)}
                    className="add-performance-btn"
                  >
                    <span className="material-symbols-outlined">add</span>
                    Thêm buổi diễn
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="calendar-summary">
        <div className="summary-item">
          <span className="summary-label">Tổng buổi diễn tuần này:</span>
          <span className="summary-value">{performances.length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Đã bán:</span>
          <span className="summary-value text-green-400">
            {performances.reduce((sum, p) => sum + p.sold_seats, 0)} vé
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Doanh thu dự kiến:</span>
          <span className="summary-value text-primary">
            {performances.reduce((sum, p) => sum + p.total_revenue, 0).toLocaleString('vi-VN')} đ
          </span>
        </div>
      </div>
    </div>
  )
}

export default PerformanceCalendar

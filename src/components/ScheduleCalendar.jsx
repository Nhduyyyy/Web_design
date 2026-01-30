import { groupByDate } from '../utils/dateUtils'
import { deriveEventStatus } from '../utils/scheduleValidator'
import './Schedule.css'

export default function ScheduleCalendar({ events = [], onSelect = () => {} }) {
  const grouped = groupByDate(events)
  if (!grouped.length) return <div className="schedule-empty">Không có sự kiện để hiển thị trên lịch.</div>

  return (
    <div className="schedule-calendar">
      {grouped.map(([date, items]) => (
        <section key={date} className="calendar-day">
          <h4 className="calendar-date">{date}</h4>
          <ul>
            {items.map(ev => (
              <li key={ev.id} className={`calendar-item ${ev.status}`} onClick={() => onSelect(ev)}>
                <div className="ci-time">{new Date(ev.startDatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                <div className="ci-info">
                  <div className="ci-title">{ev.title}</div>
                  <div className="ci-venue">{ev.venue?.name} — {ev.venue?.city}</div>
                </div>
                <div className="ci-badge">{ev.status === 'canceled' ? 'Hủy' : deriveEventStatus(ev)}</div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

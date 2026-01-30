import { motion } from 'framer-motion'
import './Schedule.css'
import { formatDateTimeISO } from '../utils/dateUtils'
import { deriveEventStatus } from '../utils/scheduleValidator'

export default function ScheduleList({ events = [], onSelect = () => {}, onBook = () => {} }) {
  if (!events || events.length === 0) {
    return <div className="schedule-empty">Không có lịch trong khoảng đã chọn.</div>
  }

  return (
    <div className="schedule-list">
      {events.map(ev => (
        <motion.article key={ev.id} className={`event-card ${ev.status || ''}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
          <div className="event-meta">
            <div className="event-time">{formatDateTimeISO(ev.startDatetime)}</div>
            <div className="event-venue">{ev.venue?.name} — {ev.venue?.city}</div>
          </div>
          <div className="event-main">
            <h3 className="event-title">{ev.title}</h3>
            <p className="event-desc">{ev.description}</p>
            <div className="event-actions">
              {ev.status !== 'canceled' && (
                <button className="btn" onClick={() => onBook(ev)}>
                  Mua vé
                </button>
              )}
              {ev.ticketUrl && (
                <a className="btn ghost" href={ev.ticketUrl} target="_blank" rel="noreferrer">
                  Link ngoài
                </a>
              )}
              {!ev.ticketUrl && ev.status !== 'canceled' && (
                <button className="btn ghost" onClick={() => onSelect(ev)}>Chi tiết</button>
              )}
              {ev.status === 'canceled' ? (
                <span className={`status canceled`}>Hủy</span>
              ) : (
                <span className={`status computed-${deriveEventStatus(ev)}`}>{deriveEventStatus(ev)}</span>
              )}
            </div>
          </div>
        </motion.article>
      ))}
    </div>
  )
}

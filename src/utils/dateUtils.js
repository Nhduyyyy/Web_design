// Small date helpers used by Schedule MVP
export function parseISO(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

export function isInRange(event, from, to) {
  const s = parseISO(event.startDatetime)
  const e = parseISO(event.endDatetime) || s
  if (!s) return false
  if (from && s < from) return false
  if (to && s > to) return false
  return true
}

export function formatDateTimeISO(dateStr) {
  const d = parseISO(dateStr)
  if (!d) return ''
  return d.toLocaleString()
}

/** Time as HH:mm:ss (e.g. 19:00:00) */
export function formatTimeHHMMSS(dateStr) {
  const d = parseISO(dateStr)
  if (!d) return ''
  const h = d.getHours()
  const m = d.getMinutes()
  const s = d.getSeconds()
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

/** Date as d/M/yyyy (e.g. 12/3/2026) */
export function formatDateShort(dateStr) {
  const d = parseISO(dateStr)
  if (!d) return ''
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

/** Date for sidebar e.g. 12/03/2026 */
export function formatDateSidebar(dateStr) {
  const d = parseISO(dateStr)
  if (!d) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

export function groupByDate(events) {
  const map = new Map()
  events.forEach(ev => {
    const d = parseISO(ev.startDatetime)
    if (!d) return
    const key = d.toISOString().slice(0, 10)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(ev)
  })
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
}

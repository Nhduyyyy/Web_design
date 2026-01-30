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

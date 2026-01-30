/**
 * Lightweight runtime validator + business logic for schedule events.
 * - No external deps (keeps bundle small)
 * - Exports: validateEvent(s), deriveEventStatus, filter helpers
 */

const ALLOWED_STATUSES = ['scheduled', 'canceled', 'postponed', 'draft']

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0
}

function isISODateTime(s) {
  if (!isNonEmptyString(s)) return false
  // basic ISO check (YYYY-MM-DDThh:mm...) and valid Date
  const isoLike = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
  if (!isoLike.test(s)) return false
  const t = Date.parse(s)
  return !Number.isNaN(t)
}

export function validateEvent(ev) {
  const errors = []
  if (!ev || typeof ev !== 'object') {
    errors.push('event-not-object')
    return { valid: false, errors }
  }

  if (!isNonEmptyString(ev.id)) errors.push('missing-id')
  if (!isNonEmptyString(ev.title)) errors.push('missing-title')
  if (!isISODateTime(ev.startDatetime)) errors.push('invalid-startDatetime')
  if (ev.endDatetime && !isISODateTime(ev.endDatetime)) errors.push('invalid-endDatetime')
  if (ev.startDatetime && ev.endDatetime) {
    const s = Date.parse(ev.startDatetime)
    const e = Date.parse(ev.endDatetime)
    if (!Number.isNaN(s) && !Number.isNaN(e) && e < s) errors.push('end-before-start')
  }

  if (!ev.timezone || typeof ev.timezone !== 'string') errors.push('missing-timezone')

  if (!ev.venue || typeof ev.venue !== 'object') {
    errors.push('missing-venue')
  } else {
    if (!isNonEmptyString(ev.venue.id)) errors.push('venue-missing-id')
    if (!isNonEmptyString(ev.venue.name)) errors.push('venue-missing-name')
    if (!isNonEmptyString(ev.venue.city)) errors.push('venue-missing-city')
  }

  if (ev.status && !ALLOWED_STATUSES.includes(ev.status)) errors.push('invalid-status')

  return { valid: errors.length === 0, errors }
}

export function validateEvents(list = []) {
  const valid = []
  const invalid = []
  list.forEach((ev) => {
    const r = validateEvent(ev)
    if (r.valid) valid.push(ev)
    else invalid.push({ event: ev, errors: r.errors })
  })
  return { valid, invalid }
}

// Business logic: derive a user-friendly status from datetimes + declared status
export function deriveEventStatus(ev, now = new Date()) {
  if (!ev) return 'unknown'
  if (ev.status === 'canceled') return 'canceled'
  const s = ev.startDatetime ? Date.parse(ev.startDatetime) : NaN
  const e = ev.endDatetime ? Date.parse(ev.endDatetime) : NaN
  const t = now.getTime()
  if (!Number.isNaN(s) && !Number.isNaN(e) && t >= s && t <= e) return 'ongoing'
  if (!Number.isNaN(s) && t < s) {
    const msUntil = s - t
    const days = msUntil / (1000 * 60 * 60 * 24)
    if (days <= 2) return 'soon' // business rule: "soon" = within 48 hours
    return 'upcoming'
  }
  if (!Number.isNaN(e) && t > e) return 'past'
  return ev.status || 'upcoming'
}

// Filter helpers (server-friendly behavior)
export function filterByCity(ev, city) {
  if (!city) return true
  return ev.venue?.city?.toLowerCase() === String(city).toLowerCase()
}

export function filterByDateRange(ev, fromDate, toDate) {
  // fromDate/toDate are Date objects or null. Inclusive range.
  if (!fromDate && !toDate) return true
  const s = ev.startDatetime ? Date.parse(ev.startDatetime) : NaN
  if (Number.isNaN(s)) return false
  if (fromDate && s < fromDate.getTime()) return false
  if (toDate && s > toDate.getTime()) return false
  return true
}

export function matchesQuery(ev, q) {
  if (!q) return true
  const qq = q.toLowerCase()
  const hay = `${ev.title || ''} ${ev.description || ''} ${ev.venue?.name || ''} ${(ev.tags || []).join(' ')}`.toLowerCase()
  return hay.includes(qq)
}

export function isEventVisible(ev, { city, fromDate, toDate, q } = {}) {
  if (!filterByCity(ev, city)) return false
  if (!filterByDateRange(ev, fromDate, toDate)) return false
  if (!matchesQuery(ev, q)) return false
  return true
}

export const BUSINESS = {
  ALLOWED_STATUSES,
  deriveEventStatus
}

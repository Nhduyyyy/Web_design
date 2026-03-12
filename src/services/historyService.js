import { supabase } from '../lib/supabase'

// ============================================================
// HISTORY SERVICE
// Logs and retrieves theater activity history (history_theater)
// ============================================================

/**
 * Log an activity to history_theater.
 * Silent – never throws; a logging failure must not break the main operation.
 *
 * @param {string} theaterId  - UUID of the theater
 * @param {string} title      - Human-readable description, e.g. "Thêm địa điểm «Sân khấu Nhỏ»"
 * @param {string} entityType - 'venue'|'theater'|'logo'|'cover'|'schedule'|'play'|'performance'|'event'|'livestream'
 * @param {string} actionType - 'add'|'edit'|'delete'
 */
export const logActivity = async (theaterId, title, entityType, actionType) => {
  if (!theaterId) return

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    await supabase.from('history_theater').insert({
      theater_id: theaterId,
      title,
      action_type: actionType,
      entity_type: entityType,
      update_time: new Date().toISOString(),
      update_by: user?.id ?? null,
    })
  } catch (err) {
    console.warn('[historyService] Failed to log activity:', err?.message ?? err)
  }
}

/**
 * Fetch the most recent activities for a theater.
 *
 * @param {string} theaterId
 * @param {number} limit - default 20
 * @returns {Promise<Array>}
 */
export const getTheaterHistory = async (theaterId, limit = 20) => {
  if (!theaterId) return []

  const { data, error } = await supabase
    .from('history_theater')
    .select('*')
    .eq('theater_id', theaterId)
    .order('update_time', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

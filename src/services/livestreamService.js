import { supabase } from '../lib/supabase'

// ============================================
// LIVESTREAM SERVICE
// ============================================

/**
 * Create livestream
 */
export const createLivestream = async (livestreamData) => {
  const { data, error } = await supabase
    .from('livestreams')
    .insert(livestreamData)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get all livestreams
 */
export const getLivestreams = async (filters = {}) => {
  let query = supabase
    .from('livestreams')
    .select(`
      *,
      theater:theaters(*),
      schedule:schedules(
        *,
        venue:venues(*)
      )
    `)
    .order('start_time', { ascending: true })

  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.theaterId) {
    query = query.eq('theater_id', filters.theaterId)
  }

  if (filters.accessType) {
    query = query.eq('access_type', filters.accessType)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

/**
 * Get live streams (currently live)
 */
export const getLiveStreams = async () => {
  return getLivestreams({ status: 'live' })
}

/**
 * Get upcoming streams
 */
export const getUpcomingStreams = async () => {
  return getLivestreams({ status: 'upcoming' })
}

/**
 * Get livestream by ID
 */
export const getLivestreamById = async (livestreamId) => {
  const { data, error } = await supabase
    .from('livestreams')
    .select(`
      *,
      theater:theaters(*),
      schedule:schedules(
        *,
        venue:venues(*)
      )
    `)
    .eq('id', livestreamId)
    .single()

  if (error) throw error
  return data
}

/**
 * Update livestream
 */
export const updateLivestream = async (livestreamId, updates) => {
  const { data, error } = await supabase
    .from('livestreams')
    .update(updates)
    .eq('id', livestreamId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Start livestream
 */
export const startLivestream = async (livestreamId) => {
  return updateLivestream(livestreamId, {
    status: 'live',
    start_time: new Date().toISOString()
  })
}

/**
 * End livestream
 */
export const endLivestream = async (livestreamId) => {
  return updateLivestream(livestreamId, {
    status: 'ended',
    end_time: new Date().toISOString()
  })
}

/**
 * Update viewer count
 */
export const updateViewerCount = async (livestreamId, currentViewers) => {
  const livestream = await getLivestreamById(livestreamId)
  const peakViewers = Math.max(livestream.peak_viewers || 0, currentViewers)

  return updateLivestream(livestreamId, {
    current_viewers: currentViewers,
    peak_viewers: peakViewers
  })
}

/**
 * Increment viewer count when a viewer joins
 */
export const incrementLivestreamViewers = async (livestreamId) => {
  const { data: stream, error } = await supabase
    .from('livestreams')
    .select('current_viewers, peak_viewers, total_views')
    .eq('id', livestreamId)
    .single()

  if (error) throw error

  const current = stream?.current_viewers || 0
  const total = stream?.total_views || 0
  const peak = stream?.peak_viewers || 0
  const newCurrent = current + 1

  return updateLivestream(livestreamId, {
    current_viewers: newCurrent,
    total_views: total + 1,
    peak_viewers: Math.max(newCurrent, peak)
  })
}

/**
 * Decrement viewer count when a viewer leaves
 */
export const decrementLivestreamViewers = async (livestreamId) => {
  const { data: stream, error } = await supabase
    .from('livestreams')
    .select('current_viewers')
    .eq('id', livestreamId)
    .single()

  if (error) throw error

  const current = stream?.current_viewers || 0
  const newCurrent = Math.max(current - 1, 0)

  return updateLivestream(livestreamId, {
    current_viewers: newCurrent
  })
}

/**
 * Subscribe to livestream viewer updates (real-time)
 */
export const subscribeLivestreamUpdates = (livestreamId, callback) => {
  return supabase
    .channel(`livestream:${livestreamId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'livestreams',
        filter: `id=eq.${livestreamId}`
      },
      callback
    )
    .subscribe()
}

// ============================================
// LIVESTREAM COMMENTS
// ============================================

/**
 * Get comments for a livestream (with profile for viewer name)
 */
export const getLivestreamComments = async (livestreamId) => {
  const { data, error } = await supabase
    .from('livestream_comments')
    .select(`
      id, livestream_id, user_id, message, created_at,
      profile:profiles(full_name, email)
    `)
    .eq('livestream_id', livestreamId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Add comment to livestream
 */
export const addLivestreamComment = async (livestreamId, message, userId = null) => {
  const { data, error } = await supabase
    .from('livestream_comments')
    .insert({
      livestream_id: livestreamId,
      user_id: userId,
      message: message.trim()
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Subscribe to new comments (real-time)
 * Requires: ALTER PUBLICATION supabase_realtime ADD TABLE livestream_comments;
 */
export const subscribeLivestreamComments = (livestreamId, onInsert) => {
  const channel = supabase
    .channel(`comments:${livestreamId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'livestream_comments',
        filter: `livestream_id=eq.${livestreamId}`
      },
      (payload) => {
        onInsert(payload.new)
      }
    )
  channel.subscribe()
  return channel
}

// ============================================
// LIVESTREAM CRUD
// ============================================

/**
 * Delete livestream
 */
export const deleteLivestream = async (livestreamId) => {
  const { error } = await supabase
    .from('livestreams')
    .delete()
    .eq('id', livestreamId)

  if (error) throw error
}

// ============================================
// REPLAY SERVICE
// ============================================

/**
 * Create replay
 */
export const createReplay = async (replayData) => {
  const { data, error } = await supabase
    .from('replays')
    .insert(replayData)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get all replays
 */
export const getReplays = async (filters = {}) => {
  let query = supabase
    .from('replays')
    .select(`
      *,
      theater:theaters(*),
      schedule:schedules(
        *,
        show:shows(*)
      )
    `)
    .order('original_date', { ascending: false })

  // Apply filters
  if (filters.theaterId) {
    query = query.eq('theater_id', filters.theaterId)
  }

  if (filters.accessType) {
    query = query.eq('access_type', filters.accessType)
  }

  if (filters.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

/**
 * Get free replays
 */
export const getFreeReplays = async () => {
  return getReplays({ accessType: 'free' })
}

/**
 * Get replay by ID
 */
export const getReplayById = async (replayId) => {
  const { data, error } = await supabase
    .from('replays')
    .select(`
      *,
      theater:theaters(*),
      schedule:schedules(
        *,
        show:shows(*)
      )
    `)
    .eq('id', replayId)
    .single()

  if (error) throw error
  return data
}

/**
 * Update replay
 */
export const updateReplay = async (replayId, updates) => {
  const { data, error } = await supabase
    .from('replays')
    .update(updates)
    .eq('id', replayId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Increment replay views
 */
export const incrementReplayViews = async (replayId) => {
  const replay = await getReplayById(replayId)

  return updateReplay(replayId, {
    total_views: (replay.total_views || 0) + 1
  })
}

/**
 * Delete replay
 */
export const deleteReplay = async (replayId) => {
  const { error } = await supabase
    .from('replays')
    .delete()
    .eq('id', replayId)

  if (error) throw error
}

/**
 * Create replay from livestream
 */
export const createReplayFromLivestream = async (livestreamId, videoUrl) => {
  const livestream = await getLivestreamById(livestreamId)

  return createReplay({
    theater_id: livestream.theater_id,
    livestream_id: livestreamId,
    schedule_id: livestream.schedule_id,
    title: livestream.title,
    description: livestream.description,
    thumbnail_url: livestream.thumbnail_url,
    video_url: videoUrl,
    duration: Math.floor((new Date(livestream.end_time) - new Date(livestream.start_time)) / 1000),
    access_type: livestream.access_type,
    price: livestream.price,
    original_date: livestream.start_time,
    partner_name: livestream.partner_name
  })
}

/**
 * Upload livestream thumbnail
 */
export const uploadLivestreamThumbnail = async (livestreamId, file) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${livestreamId}.${fileExt}`
  const filePath = `livestreams/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('livestream-thumbnails')
    .upload(filePath, file, { upsert: true })

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('livestream-thumbnails')
    .getPublicUrl(filePath)

  await updateLivestream(livestreamId, { thumbnail_url: publicUrl })

  return publicUrl
}

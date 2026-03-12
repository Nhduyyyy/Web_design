import { supabase } from '../lib/supabase'
import { logActivity } from './historyService'

// Lấy danh sách sự kiện của theater (dùng cho trang quản lý của nhà hát)
export const getTheaterEvents = async (theaterId, filters = {}) => {
  let query = supabase
    .from('events')
    .select(
      `
      *,
      venues (id, name, address, city)
    `
    )
    .eq('theater_id', theaterId)
    .order('event_date', { ascending: false })

  if (filters.type) query = query.eq('type', filters.type)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.search) query = query.ilike('title', `%${filters.search}%`)
  if (filters.dateFrom) query = query.gte('event_date', filters.dateFrom)
  if (filters.dateTo) query = query.lte('event_date', filters.dateTo)

  const { data, error } = await query
  if (error) throw error
  return data || []
}

// Tạo sự kiện mới cho theater hiện tại
export const createEvent = async (theaterId, eventData) => {
  const { data, error } = await supabase
    .from('events')
    .insert([
      {
        ...eventData,
        theater_id: theaterId,
        current_participants: 0,
        status: eventData.status || 'draft',
      },
    ])
    .select()
    .single()

  if (error) throw error
  await logActivity(theaterId, `Thêm sự kiện mới «${data.title}»`, 'event', 'add')
  return data
}

// Cập nhật sự kiện (chỉ cho phép theo theater_id)
export const updateEvent = async (eventId, theaterId, eventData) => {
  const { data, error } = await supabase
    .from('events')
    .update({
      ...eventData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    .eq('theater_id', theaterId)
    .select()
    .single()

  if (error) throw error
  await logActivity(theaterId, `Cập nhật sự kiện «${data.title}»`, 'event', 'edit')
  return data
}

// Xóa sự kiện
export const deleteEvent = async (eventId, theaterId, eventTitle = null) => {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
    .eq('theater_id', theaterId)

  if (error) throw error
  await logActivity(
    theaterId,
    `Xoá sự kiện${eventTitle ? ` «${eventTitle}»` : ''}`,
    'event',
    'delete'
  )
}

// Cập nhật trạng thái sự kiện
export const updateEventStatus = async (eventId, theaterId, status) => {
  return updateEvent(eventId, theaterId, { status })
}


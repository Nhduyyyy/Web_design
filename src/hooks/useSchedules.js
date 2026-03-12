import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logActivity } from '../services/historyService'

/**
 * Hook quản lý CRUD lịch diễn cho một theater cụ thể
 * - Tự động load danh sách theo theaterId
 * - Hỗ trợ filter theo status, venue, khoảng thời gian
 */
export function useSchedules(theaterId) {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSchedules = useCallback(
    async (filters = {}) => {
      if (!theaterId) return

      setLoading(true)
      setError(null)

      let query = supabase
        .from('schedules')
        .select('*, venues(id, name)')
        .eq('theater_id', theaterId)
        .order('start_datetime', { ascending: true })

      if (filters.status) query = query.eq('status', filters.status)
      if (filters.venue_id) query = query.eq('venue_id', filters.venue_id)
      if (filters.from) query = query.gte('start_datetime', filters.from)
      if (filters.to) query = query.lte('start_datetime', filters.to)

      const { data, error } = await query

      if (error) {
        console.error('Error fetching schedules:', error)
        setError(error.message)
        setSchedules([])
      } else {
        setSchedules(data || [])
      }

      setLoading(false)
    },
    [theaterId],
  )

  const createSchedule = async (payload) => {
    const { data, error } = await supabase
      .from('schedules')
      .insert({ ...payload, theater_id: theaterId })
      .select()
      .single()

    if (error) {
      console.error('Error creating schedule:', error)
      return { data: null, error }
    }

    setSchedules((prev) => [...prev, data])
    await logActivity(
      theaterId,
      `Thêm lịch diễn mới «${data.title || 'Không tên'}»`,
      'schedule',
      'add'
    )
    return { data, error: null }
  }

  const updateSchedule = async (id, payload) => {
    const { data, error } = await supabase
      .from('schedules')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating schedule:', error)
      return { data: null, error }
    }

    setSchedules((prev) => prev.map((s) => (s.id === id ? data : s)))
    await logActivity(
      theaterId,
      `Cập nhật lịch diễn «${data.title || 'Không tên'}»`,
      'schedule',
      'edit'
    )
    return { data, error: null }
  }

  const deleteSchedule = async (id) => {
    const deletingSchedule = schedules.find((s) => s.id === id)
    const { error } = await supabase.from('schedules').delete().eq('id', id)

    if (error) {
      console.error('Error deleting schedule:', error)
      return { error }
    }

    setSchedules((prev) => prev.filter((s) => s.id !== id))
    await logActivity(
      theaterId,
      `Xoá lịch diễn${deletingSchedule?.title ? ` «${deletingSchedule.title}»` : ''}`,
      'schedule',
      'delete'
    )
    return { error: null }
  }

  useEffect(() => {
    if (theaterId) {
      fetchSchedules()
    }
  }, [theaterId, fetchSchedules])

  return {
    schedules,
    loading,
    error,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  }
}


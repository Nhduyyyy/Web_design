import { useState, useEffect, useCallback } from 'react'
import * as service from '../services/theaterEventsService'

/**
 * Hook quản lý state & CRUD sự kiện cho một theater cụ thể.
 * Truyền vào theaterId (có thể null trước khi load xong theater).
 */
export const useTheaterEvents = (theaterId) => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: '',
    dateFrom: '',
    dateTo: '',
  })

  const fetchEvents = useCallback(async () => {
    if (!theaterId) return
    setLoading(true)
    setError(null)
    try {
      const data = await service.getTheaterEvents(theaterId, filters)
      setEvents(data)
    } catch (err) {
      console.error('Error fetching theater events:', err)
      setError(err.message || 'Không thể tải danh sách sự kiện')
    } finally {
      setLoading(false)
    }
  }, [theaterId, filters])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const createEvent = async (formData) => {
    if (!theaterId) {
      throw new Error('Thiếu theaterId để tạo sự kiện')
    }
    const newEvent = await service.createEvent(theaterId, formData)
    setEvents((prev) => [newEvent, ...prev])
    return newEvent
  }

  const updateEvent = async (id, formData) => {
    if (!theaterId) {
      throw new Error('Thiếu theaterId để cập nhật sự kiện')
    }
    const updated = await service.updateEvent(id, theaterId, formData)
    setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)))
    return updated
  }

  const deleteEvent = async (id) => {
    if (!theaterId) {
      throw new Error('Thiếu theaterId để xóa sự kiện')
    }
    await service.deleteEvent(id, theaterId)
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  const updateStatus = async (id, status) => {
    if (!theaterId) {
      throw new Error('Thiếu theaterId để cập nhật trạng thái sự kiện')
    }
    const updated = await service.updateEventStatus(id, theaterId, status)
    setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)))
    return updated
  }

  return {
    events,
    loading,
    error,
    filters,
    setFilters,
    createEvent,
    updateEvent,
    deleteEvent,
    updateStatus,
    refetch: fetchEvents,
  }
}


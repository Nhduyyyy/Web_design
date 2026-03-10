import { useState, useEffect, useCallback } from 'react'
import * as showsService from '../services/showsService'

export const useShows = (filters) => {
  const [shows, setShows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchShows = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await showsService.getShows(filters)
      setShows(data)
    } catch (err) {
      console.error('Failed to load shows', err)
      setError(err.message || 'Không thể tải danh sách vở diễn')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchShows()
  }, [fetchShows])

  const createShow = async (payload) => {
    const newShow = await showsService.createShow(payload)
    setShows((prev) => [newShow, ...prev])
    return newShow
  }

  const updateShow = async (id, payload) => {
    const updated = await showsService.updateShow(id, payload)
    setShows((prev) => prev.map((s) => (s.id === id ? updated : s)))
    return updated
  }

  const deleteShow = async (id) => {
    await showsService.deleteShow(id)
    setShows((prev) => prev.filter((s) => s.id !== id))
  }

  return {
    shows,
    loading,
    error,
    refetch: fetchShows,
    createShow,
    updateShow,
    deleteShow,
  }
}


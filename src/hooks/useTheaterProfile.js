import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getTheaterByOwner, updateTheater } from '../services/theaterService'
import { uploadTheaterImage } from '../services/storageService'

export const useTheaterProfile = () => {
  const { user } = useAuth()
  const [theater, setTheater] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const fetchTheater = useCallback(async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      setError(null)
      const data = await getTheaterByOwner(user.id)
      setTheater(data)
    } catch (err) {
      setError(err.message)
      setTheater(null)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const handleUpdate = async (updates) => {
    if (!theater?.id) return { success: false, error: 'Missing theater id' }
    try {
      setSaving(true)
      const updated = await updateTheater(theater.id, updates)
      setTheater(updated)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (file, type) => {
    if (!theater?.id) return { success: false, error: 'Missing theater id' }
    try {
      const url = await uploadTheaterImage(file, theater.id, type)
      const field = type === 'logo' ? 'logo_url' : 'cover_image_url'
      await handleUpdate({ [field]: url })
      return { success: true, url }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  useEffect(() => {
    fetchTheater()
  }, [fetchTheater])

  return {
    theater,
    loading,
    saving,
    error,
    handleUpdate,
    handleImageUpload,
    refetch: fetchTheater,
  }
}


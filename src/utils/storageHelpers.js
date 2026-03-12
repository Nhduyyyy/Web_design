import { supabase } from '../lib/supabase'

const MAX_FILE_SIZE_MB = 50
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export const validateImageFile = (file) => {
  if (!file) return 'Vui lòng chọn một file ảnh.'

  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Chỉ hỗ trợ định dạng JPG, PNG hoặc WebP.'
  }

  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `Ảnh không được vượt quá ${MAX_FILE_SIZE_MB}MB.`
  }

  return null
}

/**
 * Upload ảnh cho asset của nhà hát (logo / venues / events).
 * Trả về public URL của file đã upload.
 */
export const uploadTheaterAsset = async (theaterId, file, type, subId) => {
  const ext = file.name.split('.').pop()
  const safeTheaterId = theaterId || 'unknown-theater'
  const safeType = type || 'events'

  const subPath = subId
    ? `${subId}/${Date.now()}.${ext}`
    : `${Date.now()}.${ext}`

  const storagePath = `${safeTheaterId}/${safeType}/${subPath}`

  const { error } = await supabase.storage
    .from('theater-assets')
    .upload(storagePath, file, { upsert: true })

  if (error) {
    console.error('Upload theater asset thất bại:', error.message)
    throw error
  }

  const { data } = supabase.storage
    .from('theater-assets')
    .getPublicUrl(storagePath)

  return data?.publicUrl || null
}


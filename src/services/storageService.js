import { supabase } from '../lib/supabase'

/**
 * Upload ảnh cho theater (logo hoặc cover)
 * type: 'logo' | 'cover'
 */
export const uploadTheaterImage = async (file, theaterId, type) => {
  const ext = file.name.split('.').pop()
  const path = `theaters/${theaterId}/${type}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('theater-assets')
    .upload(path, file, { upsert: true })

  if (uploadError) throw uploadError

  const { data } = supabase.storage
    .from('theater-assets')
    .getPublicUrl(path)

  return data?.publicUrl
}


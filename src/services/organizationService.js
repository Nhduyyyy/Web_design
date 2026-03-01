import { supabase } from '../lib/supabase'

// ============================================
// ORGANIZATION SERVICE
// ============================================

/**
 * Create new organization (draft)
 */
export const createOrganization = async (orgData) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('organizations')
    .insert({
      ...orgData,
      owner_id: user.id,
      status: 'draft'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get organization by ID
 */
export const getOrganizationById = async (orgId) => {
  const { data, error } = await supabase
    .from('organizations')
    .select(`
      *,
      owner:profiles!organizations_owner_id_fkey(id, email, full_name),
      verified_by_user:profiles!organizations_verified_by_fkey(id, full_name)
    `)
    .eq('id', orgId)
    .single()

  if (error) throw error
  return data
}

/**
 * Get organizations by owner
 */
export const getOrganizationsByOwner = async (ownerId) => {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get current user's organizations
 */
export const getMyOrganizations = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  return getOrganizationsByOwner(user.id)
}

/**
 * Update organization
 */
export const updateOrganization = async (orgId, updates) => {
  const { data, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', orgId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Submit organization for review
 */
export const submitOrganizationForReview = async (orgId) => {
  const { data, error } = await supabase
    .rpc('submit_organization_for_review', { org_id: orgId })

  if (error) throw error
  return data
}

/**
 * Get all organizations (admin only)
 */
export const getAllOrganizations = async (filters = {}) => {
  let query = supabase
    .from('organizations')
    .select(`
      *,
      owner:profiles!organizations_owner_id_fkey(id, email, full_name, phone)
    `)
    .order('created_at', { ascending: false })

  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.type) {
    query = query.eq('type', filters.type)
  }
  if (filters.city) {
    query = query.eq('city', filters.city)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

/**
 * Get pending organizations (admin only)
 */
export const getPendingOrganizations = async () => {
  return getAllOrganizations({ status: 'submitted' })
}

/**
 * Approve organization (admin only)
 */
export const approveOrganization = async (orgId, adminNote = null) => {
  const { data, error } = await supabase
    .rpc('approve_organization', {
      org_id: orgId,
      admin_note: adminNote
    })

  if (error) throw error
  return data
}

/**
 * Reject organization (admin only)
 */
export const rejectOrganization = async (orgId, reason) => {
  const { data, error } = await supabase
    .rpc('reject_organization', {
      org_id: orgId,
      reason: reason
    })

  if (error) throw error
  return data
}

/**
 * Request more info (admin only)
 */
export const requestMoreInfo = async (orgId, message) => {
  const { data, error } = await supabase
    .from('organizations')
    .update({
      status: 'need_more_info',
      admin_notes: message
    })
    .eq('id', orgId)
    .select()
    .single()

  if (error) throw error

  // Create review record
  const { data: { user } } = await supabase.auth.getUser()
  await supabase
    .from('organization_reviews')
    .insert({
      organization_id: orgId,
      reviewer_id: user.id,
      new_status: 'need_more_info',
      comment: message
    })

  return data
}

/**
 * Suspend organization (admin only)
 */
export const suspendOrganization = async (orgId, reason) => {
  const { data, error } = await supabase
    .from('organizations')
    .update({
      status: 'suspended',
      admin_notes: reason,
      can_livestream: false,
      can_sell_tickets: false
    })
    .eq('id', orgId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// DOCUMENT SERVICE
// ============================================

/**
 * Upload document
 */
export const uploadDocument = async (orgId, file, documentType) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Upload file to storage
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${documentType}.${fileExt}`
  const filePath = `${user.id}/${orgId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('organization-documents')
    .upload(filePath, file)

  if (uploadError) throw uploadError

  // Get public URL (for admin viewing)
  const { data: { publicUrl } } = supabase.storage
    .from('organization-documents')
    .getPublicUrl(filePath)

  // Create document record
  const { data, error } = await supabase
    .from('organization_documents')
    .insert({
      organization_id: orgId,
      type: documentType,
      file_url: filePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      status: 'pending'
    })
    .select()
    .single()

  if (error) throw error
  return { ...data, publicUrl }
}

/**
 * Get documents by organization
 */
export const getDocumentsByOrganization = async (orgId) => {
  const { data, error } = await supabase
    .from('organization_documents')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Get signed URLs for each document
  const documentsWithUrls = await Promise.all(
    data.map(async (doc) => {
      const { data: { signedUrl } } = await supabase.storage
        .from('organization-documents')
        .createSignedUrl(doc.file_url, 3600) // 1 hour

      return { ...doc, signedUrl }
    })
  )

  return documentsWithUrls
}

/**
 * Delete document
 */
export const deleteDocument = async (documentId) => {
  // Get document info first
  const { data: doc, error: fetchError } = await supabase
    .from('organization_documents')
    .select('file_url')
    .eq('id', documentId)
    .single()

  if (fetchError) throw fetchError

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('organization-documents')
    .remove([doc.file_url])

  if (storageError) throw storageError

  // Delete record
  const { error } = await supabase
    .from('organization_documents')
    .delete()
    .eq('id', documentId)

  if (error) throw error
}

/**
 * Approve document (admin only)
 */
export const approveDocument = async (documentId) => {
  const { data, error } = await supabase
    .from('organization_documents')
    .update({
      status: 'approved',
      verified_at: new Date().toISOString()
    })
    .eq('id', documentId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Reject document (admin only)
 */
export const rejectDocument = async (documentId, reason) => {
  const { data, error } = await supabase
    .from('organization_documents')
    .update({
      status: 'rejected',
      rejection_reason: reason
    })
    .eq('id', documentId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// MEMBER SERVICE
// ============================================

/**
 * Get members by organization
 */
export const getMembersByOrganization = async (orgId) => {
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      *,
      user:profiles(id, email, full_name, avatar_url)
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Add member to organization
 */
export const addMember = async (orgId, userId, role, permissions = {}) => {
  const { data, error } = await supabase
    .from('organization_members')
    .insert({
      organization_id: orgId,
      user_id: userId,
      role: role,
      ...permissions,
      joined_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update member permissions
 */
export const updateMemberPermissions = async (memberId, permissions) => {
  const { data, error } = await supabase
    .from('organization_members')
    .update(permissions)
    .eq('id', memberId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Remove member
 */
export const removeMember = async (memberId) => {
  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('id', memberId)

  if (error) throw error
}

// ============================================
// REVIEW SERVICE
// ============================================

/**
 * Get reviews by organization
 */
export const getReviewsByOrganization = async (orgId) => {
  const { data, error } = await supabase
    .from('organization_reviews')
    .select(`
      *,
      reviewer:profiles(id, full_name, email)
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Create review (admin only)
 */
export const createReview = async (orgId, reviewData) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('organization_reviews')
    .insert({
      organization_id: orgId,
      reviewer_id: user.id,
      ...reviewData
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// STATISTICS
// ============================================

/**
 * Get organization statistics (admin only)
 */
export const getOrganizationStats = async () => {
  const { data, error } = await supabase
    .from('organizations')
    .select('status, type')

  if (error) throw error

  const stats = {
    total: data.length,
    byStatus: {},
    byType: {}
  }

  data.forEach(org => {
    stats.byStatus[org.status] = (stats.byStatus[org.status] || 0) + 1
    stats.byType[org.type] = (stats.byType[org.type] || 0) + 1
  })

  return stats
}


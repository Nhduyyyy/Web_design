import { supabase } from '../lib/supabase'

/**
 * Shop Service
 * Handles all shop-related operations
 */

// =============================================
// SHOP ITEMS
// =============================================

/**
 * Get all active shop items
 * @param {string} categorySlug - Optional category filter
 * @returns {Promise<{data: Array, error: Error}>}
 */
export const getShopItems = async (categorySlug = null) => {
  try {
    // Load tất cả items một lần với category join
    const { data, error } = await supabase
      .from('shop_items')
      .select(`
        *,
        category:shop_categories(*)
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) throw error

    // Filter ở client-side nếu cần
    let filteredData = data
    if (categorySlug && categorySlug !== 'all' && data) {
      filteredData = data.filter(item => 
        item.category && item.category.slug === categorySlug
      )
    }

    return { data: filteredData, error: null }
  } catch (error) {
    console.error('Error fetching shop items:', error)
    return { data: null, error }
  }
}

/**
 * Get a single shop item by ID
 * @param {string} itemId - Item UUID
 * @returns {Promise<{data: Object, error: Error}>}
 */
export const getShopItem = async (itemId) => {
  try {
    const { data, error } = await supabase
      .from('shop_items')
      .select(`
        *,
        category:shop_categories(*)
      `)
      .eq('id', itemId)
      .eq('is_active', true)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching shop item:', error)
    return { data: null, error }
  }
}

// =============================================
// SHOP CATEGORIES
// =============================================

/**
 * Get all active shop categories
 * @returns {Promise<{data: Array, error: Error}>}
 */
export const getShopCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('shop_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching shop categories:', error)
    return { data: null, error }
  }
}

// =============================================
// PURCHASE
// =============================================

/**
 * Purchase an item from the shop
 * @param {string} userId - User UUID
 * @param {string} itemId - Item UUID
 * @param {number} quantity - Quantity to purchase
 * @returns {Promise<{data: Object, error: Error}>}
 */
export const purchaseItem = async (userId, itemId, quantity = 1) => {
  try {
    const { data, error } = await supabase.rpc('purchase_shop_item', {
      p_user_id: userId,
      p_item_id: itemId,
      p_quantity: quantity
    })

    if (error) throw error

    // Check if the function returned an error
    if (data && !data.success) {
      return {
        data: null,
        error: new Error(data.error || 'Purchase failed')
      }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error purchasing item:', error)
    return { data: null, error }
  }
}

// =============================================
// USER INVENTORY
// =============================================

/**
 * Get user's inventory
 * @param {string} userId - User UUID
 * @returns {Promise<{data: Array, error: Error}>}
 */
export const getUserInventory = async (userId) => {
  try {
    const { data, error } = await supabase.rpc('get_user_inventory', {
      p_user_id: userId
    })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching user inventory:', error)
    return { data: null, error }
  }
}

/**
 * Check if user owns an item
 * @param {string} userId - User UUID
 * @param {string} itemId - Item UUID
 * @returns {Promise<{owned: boolean, quantity: number, error: Error}>}
 */
export const checkItemOwnership = async (userId, itemId) => {
  try {
    const { data, error } = await supabase
      .from('user_inventory')
      .select('quantity')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }

    return {
      owned: !!data,
      quantity: data?.quantity || 0,
      error: null
    }
  } catch (error) {
    console.error('Error checking item ownership:', error)
    return { owned: false, quantity: 0, error }
  }
}

/**
 * Equip/unequip an item
 * @param {string} userId - User UUID
 * @param {string} itemId - Item UUID
 * @param {boolean} equipped - True to equip, false to unequip
 * @returns {Promise<{data: Object, error: Error}>}
 */
export const toggleItemEquipped = async (userId, itemId, equipped) => {
  try {
    // First, unequip all items of the same type if equipping
    if (equipped) {
      const { data: item } = await getShopItem(itemId)
      if (item) {
        await supabase
          .from('user_inventory')
          .update({ is_equipped: false })
          .eq('user_id', userId)
          .in('item_id', supabase
            .from('shop_items')
            .select('id')
            .eq('item_type', item.item_type)
          )
      }
    }

    // Then update the target item
    const { data, error } = await supabase
      .from('user_inventory')
      .update({ is_equipped: equipped })
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error toggling item equipped:', error)
    return { data: null, error }
  }
}

// =============================================
// TRANSACTIONS
// =============================================

/**
 * Get user's transaction history
 * @param {string} userId - User UUID
 * @param {number} limit - Number of transactions to fetch
 * @returns {Promise<{data: Array, error: Error}>}
 */
export const getTransactionHistory = async (userId, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('shop_transactions')
      .select(`
        *,
        item:shop_items(name, image_url, item_type)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching transaction history:', error)
    return { data: null, error }
  }
}

/**
 * Get transaction statistics for user
 * @param {string} userId - User UUID
 * @returns {Promise<{data: Object, error: Error}>}
 */
export const getTransactionStats = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('shop_transactions')
      .select('price_paid, quantity, created_at')
      .eq('user_id', userId)
      .eq('status', 'completed')

    if (error) throw error

    const stats = {
      total_transactions: data.length,
      total_spent: data.reduce((sum, t) => sum + t.price_paid, 0),
      total_items: data.reduce((sum, t) => sum + t.quantity, 0),
      last_purchase: data.length > 0 ? data[0].created_at : null
    }

    return { data: stats, error: null }
  } catch (error) {
    console.error('Error fetching transaction stats:', error)
    return { data: null, error }
  }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Check if user can afford an item
 * @param {string} userId - User UUID
 * @param {number} price - Item price
 * @returns {Promise<{canAfford: boolean, currentCoins: number, error: Error}>}
 */
export const checkAffordability = async (userId, price) => {
  try {
    const { data, error } = await supabase
      .from('player_stats')
      .select('total_coins')
      .eq('user_id', userId)
      .single()

    if (error) throw error

    return {
      canAfford: data.total_coins >= price,
      currentCoins: data.total_coins,
      error: null
    }
  } catch (error) {
    console.error('Error checking affordability:', error)
    return { canAfford: false, currentCoins: 0, error }
  }
}

export default {
  getShopItems,
  getShopItem,
  getShopCategories,
  purchaseItem,
  getUserInventory,
  checkItemOwnership,
  toggleItemEquipped,
  getTransactionHistory,
  getTransactionStats,
  checkAffordability
}

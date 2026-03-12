import { supabase } from '../lib/supabase'

/**
 * QUEST SERVICE
 * Xử lý tất cả logic liên quan đến quests, daily login, milestones
 */

// =====================================================
// DAILY LOGIN STREAKS
// =====================================================

/**
 * Cập nhật daily login streak khi user đăng nhập
 */
export const updateDailyLoginStreak = async (userId) => {
  try {
    const { data, error } = await supabase.rpc('update_daily_login_streak', {
      p_user_id: userId
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error updating daily login streak:', error)
    return { data: null, error }
  }
}

/**
 * Lấy thông tin daily login streak của user
 */
export const getDailyLoginStreak = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('daily_login_streaks')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
    return { data, error: null }
  } catch (error) {
    console.error('Error getting daily login streak:', error)
    return { data: null, error }
  }
}

/**
 * Lấy cấu hình phần thưởng 7 ngày
 */
export const getDailyRewardConfig = async () => {
  try {
    const { data, error } = await supabase
      .from('daily_reward_config')
      .select('*')
      .order('day_number', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error getting daily reward config:', error)
    return { data: null, error }
  }
}

/**
 * Claim phần thưởng đăng nhập hàng ngày
 */
export const claimDailyLoginReward = async (userId, dayNumber) => {
  try {
    const { data, error } = await supabase.rpc('claim_daily_login_reward', {
      p_user_id: userId,
      p_day_number: dayNumber
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error claiming daily login reward:', error)
    return { data: null, error }
  }
}

// =====================================================
// DAILY QUESTS
// =====================================================

/**
 * Khởi tạo daily quests cho user
 */
export const initializeDailyQuests = async (userId) => {
  try {
    const { data, error } = await supabase.rpc('initialize_daily_quests', {
      p_user_id: userId
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error initializing daily quests:', error)
    return { data: null, error }
  }
}

/**
 * Lấy danh sách daily quests của user
 */
export const getDailyQuests = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('player_quests')
      .select(`
        *,
        quest_template:quest_templates(*)
      `)
      .eq('user_id', userId)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error getting daily quests:', error)
    return { data: null, error }
  }
}

/**
 * Cập nhật tiến độ quest
 */
export const updateQuestProgress = async (userId, questKey, progressIncrement = 1) => {
  try {
    const { data, error } = await supabase.rpc('update_quest_progress', {
      p_user_id: userId,
      p_quest_key: questKey,
      p_progress_increment: progressIncrement
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error updating quest progress:', error)
    return { data: null, error }
  }
}

/**
 * Claim phần thưởng quest
 */
export const claimQuestReward = async (userId, questId) => {
  try {
    const { data, error } = await supabase.rpc('claim_quest_reward', {
      p_user_id: userId,
      p_quest_id: questId
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error claiming quest reward:', error)
    return { data: null, error }
  }
}

// =====================================================
// MILESTONES
// =====================================================

/**
 * Lấy danh sách milestones của user
 */
export const getPlayerMilestones = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('player_milestones')
      .select(`
        *,
        milestone_template:milestone_templates(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error getting player milestones:', error)
    return { data: null, error }
  }
}

/**
 * Khởi tạo milestones cho user (nếu chưa có)
 */
export const initializePlayerMilestones = async (userId) => {
  try {
    // Lấy tất cả milestone templates
    const { data: templates, error: templatesError } = await supabase
      .from('milestone_templates')
      .select('*')
      .eq('is_active', true)

    if (templatesError) throw templatesError

    // Tạo player milestones cho từng template
    const milestones = templates.map(template => ({
      user_id: userId,
      milestone_template_id: template.id,
      target_value: template.target_value,
      current_progress: 0
    }))

    const { data, error } = await supabase
      .from('player_milestones')
      .upsert(milestones, { 
        onConflict: 'user_id,milestone_template_id',
        ignoreDuplicates: true 
      })
      .select()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error initializing player milestones:', error)
    return { data: null, error }
  }
}

/**
 * Cập nhật tiến độ milestone
 */
export const updateMilestoneProgress = async (userId, milestoneKey, newProgress) => {
  try {
    // Lấy milestone template
    const { data: template, error: templateError } = await supabase
      .from('milestone_templates')
      .select('id, target_value')
      .eq('milestone_key', milestoneKey)
      .single()

    if (templateError) throw templateError

    // Cập nhật player milestone
    const { data, error } = await supabase
      .from('player_milestones')
      .update({
        current_progress: newProgress,
        is_completed: newProgress >= template.target_value,
        completed_at: newProgress >= template.target_value ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('milestone_template_id', template.id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error updating milestone progress:', error)
    return { data: null, error }
  }
}

/**
 * Claim phần thưởng milestone
 */
export const claimMilestoneReward = async (userId, milestoneId) => {
  try {
    // Lấy milestone info
    const { data: milestone, error: milestoneError } = await supabase
      .from('player_milestones')
      .select(`
        *,
        milestone_template:milestone_templates(*)
      `)
      .eq('id', milestoneId)
      .eq('user_id', userId)
      .single()

    if (milestoneError) throw milestoneError

    if (!milestone.is_completed) {
      throw new Error('Milestone chưa hoàn thành')
    }

    if (milestone.is_claimed) {
      throw new Error('Đã nhận thưởng rồi')
    }

    // Cộng coin
    const { error: coinError } = await supabase
      .from('player_game_stats')
      .update({
        total_coins: supabase.raw(`total_coins + ${milestone.milestone_template.reward_amount}`),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (coinError) throw coinError

    // Đánh dấu đã claim
    const { data, error } = await supabase
      .from('player_milestones')
      .update({
        is_claimed: true,
        claimed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', milestoneId)
      .select()
      .single()

    if (error) throw error

    // Lưu vào lịch sử
    await supabase
      .from('quest_rewards_history')
      .insert({
        user_id: userId,
        reward_type: 'milestone',
        reward_source_id: milestoneId,
        reward_item_type: milestone.milestone_template.reward_type,
        reward_amount: milestone.milestone_template.reward_amount
      })

    return { 
      data: {
        success: true,
        reward_type: milestone.milestone_template.reward_type,
        reward_amount: milestone.milestone_template.reward_amount
      }, 
      error: null 
    }
  } catch (error) {
    console.error('Error claiming milestone reward:', error)
    return { data: null, error }
  }
}

// =====================================================
// QUEST REWARDS HISTORY
// =====================================================

/**
 * Lấy lịch sử nhận thưởng
 */
export const getQuestRewardsHistory = async (userId, limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('quest_rewards_history')
      .select('*')
      .eq('user_id', userId)
      .order('claimed_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error getting quest rewards history:', error)
    return { data: null, error }
  }
}

/**
 * Lấy tổng coin từ quests
 */
export const getTotalCoinsFromQuests = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('quest_rewards_history')
      .select('reward_amount')
      .eq('user_id', userId)
      .eq('reward_item_type', 'coin')

    if (error) throw error

    const total = data.reduce((sum, record) => sum + (record.reward_amount || 0), 0)
    return { data: total, error: null }
  } catch (error) {
    console.error('Error getting total coins from quests:', error)
    return { data: 0, error }
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Khởi tạo toàn bộ quest system cho user mới
 */
export const initializeQuestSystem = async (userId) => {
  try {
    // 1. Update daily login streak
    await updateDailyLoginStreak(userId)

    // 2. Initialize daily quests
    await initializeDailyQuests(userId)

    // 3. Initialize milestones
    await initializePlayerMilestones(userId)

    return { success: true, error: null }
  } catch (error) {
    console.error('Error initializing quest system:', error)
    return { success: false, error }
  }
}

/**
 * Lấy tất cả dữ liệu quest cho UI
 */
export const getAllQuestData = async (userId) => {
  try {
    const [streakResult, questsResult, milestonesResult, rewardConfigResult] = await Promise.all([
      getDailyLoginStreak(userId),
      getDailyQuests(userId),
      getPlayerMilestones(userId),
      getDailyRewardConfig()
    ])

    return {
      streak: streakResult.data,
      quests: questsResult.data || [],
      milestones: milestonesResult.data || [],
      rewardConfig: rewardConfigResult.data || [],
      error: null
    }
  } catch (error) {
    console.error('Error getting all quest data:', error)
    return {
      streak: null,
      quests: [],
      milestones: [],
      rewardConfig: [],
      error
    }
  }
}

import { supabase } from '../lib/supabase'

/**
 * Game Service - Xử lý tất cả logic liên quan đến game Whack-a-Mask
 */

// =====================================================
// 1. LẤY THÔNG TIN PLAYER STATS
// =====================================================
export const getPlayerStats = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('player_game_stats')
      .select(`
        *,
        current_rank:game_ranks(*)
      `)
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error getting player stats:', error)
    return { data: null, error }
  }
}

// =====================================================
// 2. LƯU KẾT QUẢ GAME
// =====================================================
export const saveGameResult = async ({
  userId,
  score,
  coinsEarned,
  masksHit,
  totalRounds = 16,
  gameDurationSeconds = null
}) => {
  try {
    console.log('💾 Saving game result:', { userId, score, coinsEarned, masksHit })

    // 1. Lấy hoặc tạo player stats
    let { data: playerStats, error: statsError } = await supabase
      .from('player_game_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (statsError && statsError.code === 'PGRST116') {
      // Chưa có stats, tạo mới
      const { data: newStats, error: insertError } = await supabase
        .from('player_game_stats')
        .insert([{
          user_id: userId,
          total_coins: 0,
          total_games_played: 0,
          total_masks_hit: 0,
          highest_score: 0,
          average_score: 0
        }])
        .select()
        .single()

      if (insertError) throw insertError
      playerStats = newStats
    } else if (statsError) {
      throw statsError
    }

    // 2. Tính toán stats mới
    const newTotalCoins = (playerStats.total_coins || 0) + coinsEarned
    const newTotalGames = (playerStats.total_games_played || 0) + 1
    const newTotalMasksHit = (playerStats.total_masks_hit || 0) + masksHit
    const newHighestScore = Math.max(playerStats.highest_score || 0, score)
    const newAverageScore = ((playerStats.average_score || 0) * (playerStats.total_games_played || 0) + score) / newTotalGames

    // 3. Tìm rank phù hợp
    const { data: ranks, error: ranksError } = await supabase
      .from('game_ranks')
      .select('*')
      .lte('min_coins', newTotalCoins)
      .order('rank_level', { ascending: false })
      .limit(1)

    if (ranksError) throw ranksError

    const newRankId = ranks?.[0]?.id || null

    // 4. Cập nhật player stats
    const { data: updatedStats, error: updateError } = await supabase
      .from('player_game_stats')
      .update({
        total_coins: newTotalCoins,
        total_games_played: newTotalGames,
        total_masks_hit: newTotalMasksHit,
        highest_score: newHighestScore,
        average_score: newAverageScore,
        current_rank_id: newRankId,
        last_played_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select(`
        *,
        current_rank:game_ranks(rank_name)
      `)
      .single()

    if (updateError) throw updateError

    // 5. Lưu vào game history
    const accuracy = ((masksHit / totalRounds) * 100).toFixed(2)
    
    const { error: historyError } = await supabase
      .from('game_history')
      .insert([{
        user_id: userId,
        score: score,
        coins_earned: coinsEarned,
        masks_hit: masksHit,
        total_rounds: totalRounds,
        accuracy_percentage: accuracy,
        game_duration_seconds: gameDurationSeconds,
        rank_at_time: updatedStats.current_rank?.rank_name
      }])

    if (historyError) throw historyError

    // 6. Trả về kết quả
    const result = {
      success: true,
      total_coins: updatedStats.total_coins,
      current_rank: updatedStats.current_rank?.rank_name,
      highest_score: updatedStats.highest_score,
      total_games_played: updatedStats.total_games_played,
      average_score: updatedStats.average_score
    }

    console.log('✅ Game result saved:', result)

    return { data: result, error: null }
  } catch (error) {
    console.error('❌ Error saving game result:', error)
    return { data: null, error }
  }
}

// =====================================================
// 3. LẤY LỊCH SỬ CHƠI GAME
// =====================================================
export const getGameHistory = async (userId, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('game_history')
      .select('*')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error getting game history:', error)
    return { data: null, error }
  }
}

// =====================================================
// 4. LẤY BẢNG XẾP HẠNG
// =====================================================
export const getLeaderboard = async (limit = 10) => {
  try {
    console.log('🎯 Getting leaderboard with limit:', limit)
    
    // Thử query trực tiếp từ view trước
    const { data, error } = await supabase
      .from('leaderboard_view')
      .select('*')
      .limit(limit)

    console.log('📊 Leaderboard view response:', { data, error })

    if (error) {
      console.error('❌ View query error:', error)
      
      // Nếu view không work, thử query trực tiếp từ bảng
      console.log('🔄 Trying direct query from player_game_stats...')
      
      const { data: statsData, error: statsError } = await supabase
        .from('player_game_stats')
        .select(`
          user_id,
          total_coins,
          highest_score,
          total_games_played,
          average_score,
          last_played_at,
          current_rank:game_ranks(
            rank_name,
            rank_color,
            rank_icon
          ),
          user:profiles!player_game_stats_user_id_fkey(
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .gt('total_games_played', 0)
        .order('total_coins', { ascending: false })
        .order('highest_score', { ascending: false })
        .limit(limit)

      console.log('📊 Direct query response:', { statsData, statsError })

      if (statsError) throw statsError

      // Format lại data để match với view format
      const formattedData = statsData?.map((stat, index) => ({
        rank: index + 1,
        user_id: stat.user_id,
        full_name: stat.user?.full_name,
        email: stat.user?.email,
        avatar_url: stat.user?.avatar_url,
        total_coins: stat.total_coins,
        highest_score: stat.highest_score,
        total_games_played: stat.total_games_played,
        average_score: stat.average_score,
        rank_name: stat.current_rank?.rank_name,
        rank_color: stat.current_rank?.rank_color,
        rank_icon: stat.current_rank?.rank_icon,
        last_played_at: stat.last_played_at
      }))

      return { data: formattedData, error: null }
    }

    return { data, error: null }
  } catch (error) {
    console.error('❌ Error getting leaderboard:', error)
    return { data: null, error }
  }
}

// =====================================================
// 5. LẤY VỊ TRÍ XẾP HẠNG CỦA USER
// =====================================================
export const getUserRank = async (userId) => {
  try {
    console.log('🎯 Getting user rank for:', userId)
    
    // Query tất cả players và tính rank
    const { data: allPlayers, error } = await supabase
      .from('player_game_stats')
      .select('user_id, total_coins, highest_score')
      .gt('total_games_played', 0)
      .order('total_coins', { ascending: false })
      .order('highest_score', { ascending: false })

    if (error) throw error

    // Tìm vị trí của user
    const userIndex = allPlayers?.findIndex(p => p.user_id === userId)
    const userRank = userIndex >= 0 ? userIndex + 1 : 0
    const totalPlayers = allPlayers?.length || 0
    const percentile = totalPlayers > 0 ? ((userRank / totalPlayers) * 100).toFixed(2) : 0

    const result = {
      user_rank: userRank,
      total_players: totalPlayers,
      percentile: percentile
    }

    console.log('📊 User rank result:', result)

    return { data: result, error: null }
  } catch (error) {
    console.error('❌ Error getting user rank:', error)
    return { data: null, error }
  }
}

// =====================================================
// 6. LẤY TẤT CẢ RANKS
// =====================================================
export const getAllRanks = async () => {
  try {
    const { data, error } = await supabase
      .from('game_ranks')
      .select('*')
      .order('rank_level', { ascending: true })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error getting ranks:', error)
    return { data: null, error }
  }
}

// =====================================================
// 7. KHỞI TẠO PLAYER STATS (nếu chưa có)
// =====================================================
export const initializePlayerStats = async (userId) => {
  try {
    // Kiểm tra xem đã có stats chưa
    const { data: existing } = await supabase
      .from('player_game_stats')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existing) {
      return { data: existing, error: null }
    }

    // Tạo mới nếu chưa có
    const { data, error } = await supabase
      .from('player_game_stats')
      .insert([{ user_id: userId }])
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error initializing player stats:', error)
    return { data: null, error }
  }
}

// =====================================================
// 8. LẤY THỐNG KÊ TỔNG QUAN
// =====================================================
export const getGameStatistics = async (userId) => {
  try {
    // Lấy player stats
    const { data: stats, error: statsError } = await getPlayerStats(userId)
    if (statsError) throw statsError

    // Lấy rank của user
    const { data: rankInfo, error: rankError } = await getUserRank(userId)
    if (rankError) throw rankError

    // Lấy lịch sử gần đây
    const { data: history, error: historyError } = await getGameHistory(userId, 5)
    if (historyError) throw historyError

    return {
      data: {
        stats,
        rankInfo,
        recentGames: history
      },
      error: null
    }
  } catch (error) {
    console.error('Error getting game statistics:', error)
    return { data: null, error }
  }
}

// =====================================================
// 9. REALTIME SUBSCRIPTION cho leaderboard
// =====================================================
export const subscribeToLeaderboard = (callback) => {
  const channel = supabase
    .channel('leaderboard-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'player_game_stats'
      },
      (payload) => {
        console.log('Leaderboard updated:', payload)
        callback(payload)
      }
    )
    .subscribe()

  return channel
}

// Hủy subscription
export const unsubscribeFromLeaderboard = (channel) => {
  if (channel) {
    supabase.removeChannel(channel)
  }
}

/**
 * Vũ Đại Loạn Thế - Service layer
 * Load master data, create/update matches and match_players.
 */
import { supabase } from '../lib/supabase'

const TABLES = {
  tribes: 'vu_dai_loan_the_tribes',
  classes: 'vu_dai_loan_the_classes',
  champions: 'vu_dai_loan_the_champions',
  matches: 'vu_dai_loan_the_matches',
  matchPlayers: 'vu_dai_loan_the_match_players'
}

// ========== Master data (read) ==========

export const getTribes = async () => {
  try {
    const { data, error } = await supabase
      .from(TABLES.tribes)
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) throw error
    return { data: data || [], error: null }
  } catch (err) {
    console.warn('vuDaiLoanThe getTribes:', err?.message)
    return { data: null, error: err }
  }
}

export const getClasses = async () => {
  try {
    const { data, error } = await supabase
      .from(TABLES.classes)
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) throw error
    return { data: data || [], error: null }
  } catch (err) {
    console.warn('vuDaiLoanThe getClasses:', err?.message)
    return { data: null, error: err }
  }
}

export const getChampions = async () => {
  try {
    const { data, error } = await supabase
      .from(TABLES.champions)
      .select(`
        *,
        tribe:vu_dai_loan_the_tribes(id, key, name, color_hex, mechanic_description),
        class:vu_dai_loan_the_classes(id, key, name, role)
      `)
      .order('sort_order', { ascending: true })
    if (error) throw error
    return { data: data || [], error: null }
  } catch (err) {
    console.warn('vuDaiLoanThe getChampions:', err?.message)
    return { data: null, error: err }
  }
}

// ========== Match lifecycle ==========

export const createMatch = async (userId, options = {}) => {
  try {
    const settings = {
      max_rounds: options.maxRounds ?? 30,
      trong_chau_fill_per_round: options.trongChauFillPerRound ?? 15
    }
    const { data: match, error: matchError } = await supabase
      .from(TABLES.matches)
      .insert([{ status: 'lobby', settings }])
      .select()
      .single()
    if (matchError) throw matchError

    const initialHp = 100
    const initialGold = options.initialGold ?? 0
    const players = [
      { match_id: match.id, user_id: userId, is_bot: false, hp: initialHp, gold: initialGold, level: 1, board_state: [], bench_state: [] }
    ]
    for (let i = 0; i < 7; i++) {
      players.push({
        match_id: match.id,
        user_id: null,
        is_bot: true,
        hp: initialHp,
        gold: initialGold,
        level: 1,
        board_state: [],
        bench_state: []
      })
    }

    const { data: insertedPlayers, error: playersError } = await supabase
      .from(TABLES.matchPlayers)
      .insert(players)
      .select()
    if (playersError) throw playersError

    const { error: statusError } = await supabase
      .from(TABLES.matches)
      .update({ status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', match.id)
    if (statusError) console.warn('Match status update:', statusError)

    return {
      data: {
        match: { ...match, status: 'in_progress' },
        players: insertedPlayers || []
      },
      error: null
    }
  } catch (err) {
    console.error('vuDaiLoanThe createMatch:', err)
    return { data: null, error: err }
  }
}

export const getMatchWithPlayers = async (matchId) => {
  try {
    const { data: match, error: matchError } = await supabase
      .from(TABLES.matches)
      .select('*')
      .eq('id', matchId)
      .single()
    if (matchError) throw matchError

    const { data: players, error: playersError } = await supabase
      .from(TABLES.matchPlayers)
      .select('*')
      .eq('match_id', matchId)
      .order('id', { ascending: true })
    if (playersError) throw playersError

    return { data: { match, players: players || [] }, error: null }
  } catch (err) {
    console.error('vuDaiLoanThe getMatchWithPlayers:', err)
    return { data: null, error: err }
  }
}

export const updateMatchPlayer = async (matchId, playerId, payload) => {
  try {
    const update = {
      ...payload,
      updated_at: new Date().toISOString()
    }
    const { data, error } = await supabase
      .from(TABLES.matchPlayers)
      .update(update)
      .eq('id', playerId)
      .eq('match_id', matchId)
      .select()
      .single()
    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('vuDaiLoanThe updateMatchPlayer:', err)
    return { data: null, error: err }
  }
}

export const finishMatch = async (matchId, winnerUserId, placements) => {
  try {
    const { error: matchError } = await supabase
      .from(TABLES.matches)
      .update({
        status: 'finished',
        winner_user_id: winnerUserId,
        updated_at: new Date().toISOString()
      })
      .eq('id', matchId)
    if (matchError) throw matchError

    if (placements && placements.length) {
      for (const { playerId, placement } of placements) {
        await supabase
          .from(TABLES.matchPlayers)
          .update({ placement, updated_at: new Date().toISOString() })
          .eq('id', playerId)
          .eq('match_id', matchId)
      }
    }
    return { data: { success: true }, error: null }
  } catch (err) {
    console.error('vuDaiLoanThe finishMatch:', err)
    return { data: null, error: err }
  }
}

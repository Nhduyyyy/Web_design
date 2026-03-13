/**
 * Vũ Đại Loạn Thế - Augment triggers cho tribe_special
 * checkAugmentTriggers: xử lý sau combat, trả state cần lưu
 * getAugmentCombatModifiers: modifiers áp trước/sau combat
 */

/**
 * Kiểm tra trigger sau combat (vd. Báo Thù Tam Nữ - đếm số chết)
 * @param {Object} combatResult - { winner, deathOrder, boardA, boardB }
 * @param {Array} playerAugments
 * @returns {Object} state cần lưu (vd. tamNuRevengeStacks)
 */
export function checkAugmentTriggers(combatResult, playerAugments) {
  if (!playerAugments?.length || !combatResult) return {}
  const state = {}
  const hasTamNu = playerAugments.some((a) => a.effect?.type === 'tam_nu_revenge')
  if (hasTamNu && combatResult.deathOrder) {
    const allyDeaths = combatResult.deathOrder.filter((d) => d.side === 'A').length
    state.tamNuRevengeStacks = allyDeaths
  }
  return state
}

/**
 * Trả modifiers combat cho tribe_special (dùng khi cần logic phức tạp)
 * @param {Array} playerAugments
 * @param {Array} boardState
 * @param {Object} combatContext - { deathCountA?, deathCountB? }
 */
export function getAugmentCombatModifiers(playerAugments, boardState, combatContext = {}) {
  if (!playerAugments?.length) return {}
  const mods = {}
  for (const aug of playerAugments) {
    const eff = aug.effect
    if (!eff) continue
    if (eff.type === 'tram_trinh_execute') {
      mods.tramTrinhExecute = { lowHpThreshold: eff.lowHpThreshold ?? 0.5, damagePercent: eff.damagePercent ?? 0.2 }
    }
  }
  return mods
}

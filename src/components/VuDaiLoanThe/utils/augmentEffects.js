/**
 * Áp dụng hiệu ứng lõi (augment) lên combat units
 */

/** Trả về danh sách lõi đang kích hoạt cho 1 unit (dùng cho ChampionDetailModal) */
export function getActiveAugmentsForUnit(unit, boardState, championsMap, playerAugments) {
  if (!unit || !playerAugments?.length) return []
  const result = []
  const c = championsMap?.[unit.champion_key]
  const cost = c?.cost ?? 1
  const tribeKey = c?.tribe_key
  const col = typeof unit.col === 'number' ? unit.col : 2
  const row = typeof unit.row === 'number' ? unit.row : 2
  const isOnBoard = (boardState || []).some((u) => u === unit || (u.champion_key === unit.champion_key && typeof u.col === 'number' && typeof u.row === 'number'))
  const virtualBoard = isOnBoard ? (boardState || []) : [...(boardState || []), { ...unit, col, row }]

  for (const aug of playerAugments) {
    const eff = aug.effect
    if (!eff) continue

    if (eff.type === 'mask_diversity' && eff.condition?.maskCount === 4) {
      const masks = new Set()
      for (const u of virtualBoard || []) {
        const m = u.mask_color || 'red'
        if (['red', 'black', 'white', 'blue'].includes(m)) masks.add(m)
      }
      if (masks.size >= 4)
        result.push({ augment: aug, effectText: '+15% sát thương, +15 Giáp, +15 Kháng phép' })
    }

    if (eff.type === 'buff_highest_cost' && eff.stats) {
      let maxCost = 0
      for (const u of virtualBoard || []) {
        const uc = championsMap?.[u.champion_key]?.cost ?? 1
        if (uc > maxCost) maxCost = uc
      }
      if (cost === maxCost)
        result.push({ augment: aug, effectText: '+25% sát thương, +50 HP' })
    }

    if (eff.type === 'buff_low_cost' && eff.maxCost != null && cost <= eff.maxCost)
      result.push({ augment: aug, effectText: '+20% sát thương, +30 HP' })

    if (eff.type === 'three_rows' && eff.stats) {
      const rows = new Set()
      for (const u of virtualBoard || []) {
        const r = typeof u.row === 'number' ? u.row : 0
        rows.add(r)
      }
      if (rows.size >= 3)
        result.push({ augment: aug, effectText: '+10 Giáp, +10 Kháng phép' })
    }

    if (eff.type === 'buff_backline' && row >= 2)
      result.push({ augment: aug, effectText: '+15% sát thương (hàng sau)' })

    if (eff.type === 'tam_nu_revenge' && tribeKey === 'tam_nu_do_vuong')
      result.push({ augment: aug, effectText: '+10% sát thương' })

    if (eff.type === 'son_hau_buff' && tribeKey === 'son_hau')
      result.push({ augment: aug, effectText: '+10% sát thương, +10 Giáp, +10 Kháng phép' })

    if (eff.type === 'tram_trinh_execute' && tribeKey === 'tram_trinh_an')
      result.push({ augment: aug, effectText: '+20% sát thương' })

    if (eff.type === 'phàn_couple' && tribeKey === 'tiet_dinh_san_phàn_le_hue') {
      const tribePositions = (virtualBoard || [])
        .filter((u) => championsMap?.[u.champion_key]?.tribe_key === tribeKey)
        .map((u) => ({ col: typeof u.col === 'number' ? u.col : 0, row: typeof u.row === 'number' ? u.row : 0 }))
      const hasAdjacent = [[col - 1, row], [col + 1, row], [col, row - 1], [col, row + 1]].some(
        ([ac, ar]) => tribePositions.some((t) => t.col === ac && t.row === ar)
      )
      if (hasAdjacent)
        result.push({ augment: aug, effectText: '+15% sát thương, +15 Giáp (cặp đôi cạnh nhau)' })
    }

    if (eff.type === 'tho_chau_shield' && tribeKey === 'luu_kim_dinh_giai_gia_tho_chau') {
      const maxHp = unit.max_hp ?? unit.current_hp ?? 1
      const hp = unit.current_hp ?? maxHp
      const threshold = eff.hpThreshold ?? 0.3
      const hpPercent = maxHp > 0 ? hp / maxHp : 1
      if (hpPercent <= threshold)
        result.push({ augment: aug, effectText: `+${eff.shieldAmount ?? 150} Khiên (HP < 30%)` })
      else
        result.push({ augment: aug, effectText: `+${eff.shieldAmount ?? 150} Khiên khi HP < 30%`, pending: true, pendingReason: `HP ${Math.round(hpPercent * 100)}% – kích hoạt khi máu xuống dưới 30% trong combat` })
    }
  }
  return result
}

export function applyAugmentBuffsToUnits(units, boardState, championsMap, playerAugments) {
  if (!units?.length || !playerAugments?.length) return units

  const augments = playerAugments
  let result = units.map((u) => ({ ...u }))

  for (const aug of augments) {
    const eff = aug.effect
    if (!eff) continue

    if (eff.type === 'mask_diversity' && eff.condition?.maskCount === 4) {
      const masks = new Set()
      for (const u of boardState || []) {
        const m = u.mask_color || 'red'
        if (['red', 'black', 'white', 'blue'].includes(m)) masks.add(m)
      }
      if (masks.size >= 4 && eff.stats) {
        const { damagePercent = 0, armor = 0, magicResist = 0 } = eff.stats
        result = result.map((u) => ({
          ...u,
          attack: Math.floor((u.attack ?? 0) * (1 + damagePercent)),
          armor: (u.armor ?? 0) + armor,
          magic_resist: (u.magic_resist ?? 0) + magicResist
        }))
      }
    }

    if (eff.type === 'buff_highest_cost' && eff.stats) {
      let maxCost = 0
      for (const u of result) {
        const c = championsMap?.[u.champion_key]?.cost ?? 1
        if (c > maxCost) maxCost = c
      }
      const { damagePercent = 0, hpFlat = 0 } = eff.stats
      result = result.map((u) => {
        const c = championsMap?.[u.champion_key]?.cost ?? 1
        if (c !== maxCost) return u
        return {
          ...u,
          attack: Math.floor((u.attack ?? 0) * (1 + damagePercent)),
          current_hp: (u.current_hp ?? u.max_hp ?? 0) + hpFlat,
          max_hp: (u.max_hp ?? u.current_hp ?? 0) + hpFlat
        }
      })
    }

    if (eff.type === 'buff_low_cost' && eff.maxCost != null && eff.stats) {
      const { damagePercent = 0, hpFlat = 0 } = eff.stats
      result = result.map((u) => {
        const c = championsMap?.[u.champion_key]?.cost ?? 1
        if (c > eff.maxCost) return u
        return {
          ...u,
          attack: Math.floor((u.attack ?? 0) * (1 + damagePercent)),
          current_hp: (u.current_hp ?? u.max_hp ?? 0) + hpFlat,
          max_hp: (u.max_hp ?? u.current_hp ?? 0) + hpFlat
        }
      })
    }

    if (eff.type === 'three_rows' && eff.stats) {
      const rows = new Set()
      for (const u of boardState || []) {
        const r = typeof u.row === 'number' ? u.row : 0
        rows.add(r)
      }
      if (rows.size >= 3) {
        const { armor = 0, magicResist = 0 } = eff.stats
        result = result.map((u) => ({
          ...u,
          armor: (u.armor ?? 0) + armor,
          magic_resist: (u.magic_resist ?? 0) + magicResist
        }))
      }
    }

    if (eff.type === 'buff_backline' && eff.stats) {
      const { damagePercent = 0 } = eff.stats
      result = result.map((u) => {
        const row = typeof u.row === 'number' ? u.row : 0
        if (row < 2) return u
        return {
          ...u,
          attack: Math.floor((u.attack ?? 0) * (1 + damagePercent))
        }
      })
    }

    if (eff.type === 'tam_nu_revenge') {
      const tribeKey = 'tam_nu_do_vuong'
      const damagePerDeath = eff.damagePerDeath ?? 0.1
      result = result.map((u) => {
        const c = championsMap?.[u.champion_key]
        if (c?.tribe_key !== tribeKey) return u
        return {
          ...u,
          attack: Math.floor((u.attack ?? 0) * (1 + damagePerDeath))
        }
      })
    }

    if (eff.type === 'son_hau_buff' && eff.stats) {
      const tribeKey = 'son_hau'
      const { armor = 0, magicResist = 0, damagePercent = 0 } = eff.stats
      result = result.map((u) => {
        const c = championsMap?.[u.champion_key]
        if (c?.tribe_key !== tribeKey) return u
        return {
          ...u,
          attack: Math.floor((u.attack ?? 0) * (1 + damagePercent)),
          armor: (u.armor ?? 0) + armor,
          magic_resist: (u.magic_resist ?? 0) + magicResist
        }
      })
    }

    if (eff.type === 'tram_trinh_execute' && eff.damagePercent) {
      const tribeKey = 'tram_trinh_an'
      result = result.map((u) => {
        const c = championsMap?.[u.champion_key]
        if (c?.tribe_key !== tribeKey) return u
        return {
          ...u,
          attack: Math.floor((u.attack ?? 0) * (1 + eff.damagePercent)),
          _tramTrinhExecute: true
        }
      })
    }

    if (eff.type === 'phàn_couple' && eff.stats) {
      const tribeKey = 'tiet_dinh_san_phàn_le_hue'
      const { damagePercent = 0, armor = 0 } = eff.stats
      const tribePositions = result
        .filter((u) => championsMap?.[u.champion_key]?.tribe_key === tribeKey)
        .map((u) => ({ col: typeof u.col === 'number' ? u.col : 0, row: typeof u.row === 'number' ? u.row : 0 }))
      const hasAdjacentTribe = (col, row) => {
        const adj = [
          [col - 1, row],
          [col + 1, row],
          [col, row - 1],
          [col, row + 1]
        ]
        return adj.some(([ac, ar]) => tribePositions.some((t) => t.col === ac && t.row === ar))
      }
      result = result.map((u) => {
        const c = championsMap?.[u.champion_key]
        if (c?.tribe_key !== tribeKey) return u
        const col = typeof u.col === 'number' ? u.col : 0
        const row = typeof u.row === 'number' ? u.row : 0
        if (!hasAdjacentTribe(col, row)) return u
        return {
          ...u,
          attack: Math.floor((u.attack ?? 0) * (1 + damagePercent)),
          armor: (u.armor ?? 0) + armor
        }
      })
    }

    if (eff.type === 'tho_chau_shield') {
      const tribeKey = 'luu_kim_dinh_giai_gia_tho_chau'
      const hpThreshold = eff.hpThreshold ?? 0.3
      const shieldAmount = eff.shieldAmount ?? 150
      result = result.map((u) => {
        const c = championsMap?.[u.champion_key]
        if (c?.tribe_key !== tribeKey) return u
        const maxHp = u.max_hp ?? u.current_hp ?? 1
        const hp = u.current_hp ?? maxHp
        if (hp / maxHp > hpThreshold) return u
        return {
          ...u,
          shield: (u.shield ?? 0) + shieldAmount
        }
      })
    }
  }

  return result
}

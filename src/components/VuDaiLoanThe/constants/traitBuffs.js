/**
 * Vũ Đại Loạn Thế - Trait buffs (Tộc & Hệ) theo ngưỡng 2/4/6 tướng trên sân.
 * Áp dụng trước combat: cộng flat stat, nhân (1 + damagePercent) cho attack.
 * Keys sync với tribes.js và classes.js.
 */

/** tribe_key → { 2: { armor?, magicResist?, damagePercent? }, 4: {...}, 6: {...} } */
export const TRIBE_BUFFS = {
  son_hau: {
    2: { armor: 10, magicResist: 10 },
    4: { armor: 25, magicResist: 25 },
    6: { armor: 50, magicResist: 50 }
  },
  tam_nu_do_vuong: {
    2: { damagePercent: 0.15 },
    4: { damagePercent: 0.35 },
    6: { damagePercent: 0.7 }
  },
  tram_trinh_an: {
    2: { damagePercent: 0.1 },
    4: { damagePercent: 0.25 },
    6: { damagePercent: 0.5 }
  },
  tiet_dinh_san_phàn_le_hue: {
    2: { armor: 5, magicResist: 5, damagePercent: 0.05 },
    4: { armor: 15, magicResist: 15, damagePercent: 0.15 },
    6: { armor: 30, magicResist: 30, damagePercent: 0.35 }
  },
  luu_kim_dinh_giai_gia_tho_chau: {
    2: { armor: 15, magicResist: 10 },
    4: { armor: 35, magicResist: 25 },
    6: { armor: 60, magicResist: 45 }
  }
}

/** class_key → { 2: {...}, 4: {...}, 6: {...} } */
export const CLASS_BUFFS = {
  vo_tuong: {
    2: { armor: 15, magicResist: 10 },
    4: { armor: 35, magicResist: 25 },
    6: { armor: 60, magicResist: 40 }
  },
  dao_vo: {
    2: { damagePercent: 0.1 },
    4: { damagePercent: 0.25 },
    6: { damagePercent: 0.5 }
  },
  van_quan: {
    2: { armor: 5, magicResist: 10 },
    4: { armor: 15, magicResist: 25 },
    6: { armor: 25, magicResist: 45 }
  },
  trung_than: {
    2: { magicResist: 10 },
    4: { magicResist: 25 },
    6: { magicResist: 45 }
  },
  ninh_than: {
    2: { damagePercent: 0.05 },
    4: { damagePercent: 0.15 },
    6: { damagePercent: 0.35 }
  },
  hoang_toc: {
    2: { damagePercent: 0.1, armor: 5 },
    4: { damagePercent: 0.25, armor: 15 },
    6: { damagePercent: 0.5, armor: 30 }
  },
  sat_thu: {
    2: { damagePercent: 0.15 },
    4: { damagePercent: 0.35 },
    6: { damagePercent: 0.65 }
  },
  phan_tac: {
    2: { damagePercent: 0.05 },
    4: { damagePercent: 0.2 },
    6: { damagePercent: 0.4 }
  }
}

const THRESHOLDS = [6, 4, 2]

function tierForCount(count) {
  for (const t of THRESHOLDS) {
    if (count >= t) return t
  }
  return 0
}

/**
 * Đếm số tướng theo tribe_key và class_key trên board.
 * @param {Array} boardState - [{ champion_key, ... }]
 * @param {Object} championsMap - key → { tribe_key, class_key, ... }
 * @returns { { tribeCount: Record<string, number>, classCount: Record<string, number> } }
 */
export function countTraitsOnBoard(boardState, championsMap) {
  const tribeCount = {}
  const classCount = {}
  for (const u of boardState || []) {
    const c = u?.champion_key ? championsMap?.[u.champion_key] : null
    if (!c) continue
    const tk = c.tribe_key ?? c.tribe?.key
    const ck = c.class_key ?? c.class?.key
    if (tk) tribeCount[tk] = (tribeCount[tk] || 0) + 1
    if (ck) classCount[ck] = (classCount[ck] || 0) + 1
  }
  return { tribeCount, classCount }
}

/**
 * Gộp buff từ tất cả trait đạt ngưỡng 2/4/6 thành một object.
 * @param {Record<string, number>} tribeCount
 * @param {Record<string, number>} classCount
 * @returns { { damagePercent: number, armor: number, magicResist: number } }
 */
export function mergeTraitBuffs(tribeCount, classCount) {
  const out = { damagePercent: 0, armor: 0, magicResist: 0 }
  for (const [key, count] of Object.entries(tribeCount || {})) {
    const tier = tierForCount(count)
    const buff = tier && TRIBE_BUFFS[key]?.[tier]
    if (buff) {
      if (buff.damagePercent) out.damagePercent += buff.damagePercent
      if (buff.armor) out.armor += buff.armor
      if (buff.magicResist) out.magicResist += buff.magicResist
    }
  }
  for (const [key, count] of Object.entries(classCount || {})) {
    const tier = tierForCount(count)
    const buff = tier && CLASS_BUFFS[key]?.[tier]
    if (buff) {
      if (buff.damagePercent) out.damagePercent += buff.damagePercent
      if (buff.armor) out.armor += buff.armor
      if (buff.magicResist) out.magicResist += buff.magicResist
    }
  }
  return out
}

/**
 * Tính buff cho cả board (từ boardState + championsMap), trả về object gộp.
 */
export function getTraitBuffsForBoard(boardState, championsMap) {
  const { tribeCount, classCount } = countTraitsOnBoard(boardState, championsMap)
  return mergeTraitBuffs(tribeCount, classCount)
}

/**
 * Áp buff trait lên unit (attack *= 1+damagePercent, armor +=, magic_resist +=).
 * @param {Object} unit - unit từ unitStatsFromChampion
 * @param {Object} teamBuffs - từ getTraitBuffsForBoard
 * @returns {Object} unit đã cộng/flat và nhân damagePercent vào attack
 */
export function applyTraitBuffsToUnit(unit, teamBuffs) {
  if (!unit || !teamBuffs) return unit
  const damagePercent = teamBuffs.damagePercent ?? 0
  const armor = teamBuffs.armor ?? 0
  const magicResist = teamBuffs.magicResist ?? 0
  return {
    ...unit,
    attack: Math.floor((unit.attack ?? 0) * (1 + damagePercent)),
    armor: (unit.armor ?? 0) + armor,
    magic_resist: (unit.magic_resist ?? 0) + magicResist
  }
}

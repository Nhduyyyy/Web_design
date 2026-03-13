/**
 * Vũ Đại Loạn Thế - Áp dụng hành động AI cho opponent
 * Mua từ shop → ghép 3→1 → đặt lên bàn
 */
const XP_GOLD_COST = 4
const MAX_LEVEL = 10
const XP_REQUIRED_BY_LEVEL = { 1: 2, 2: 2, 3: 6, 4: 10, 5: 20, 6: 36, 7: 56, 8: 80, 9: 84 }

/** Ghép 3 cùng loại cùng sao trên bench + board thành 1 lên sao (ưu tiên bench). */
function combineBenchAndBoard(bench, board) {
  let b = (bench || []).filter((u) => u && u.champion_key)
  let brd = (board || []).filter((u) => u && u.champion_key)
  for (;;) {
    const keyCount = {}
    b.forEach((u) => {
      if (!u || u.champion_key == null) return
      const k = `${u.champion_key}|${u.star ?? 1}`
      keyCount[k] = (keyCount[k] || 0) + 1
    })
    brd.forEach((u) => {
      if (!u || u.champion_key == null) return
      const k = `${u.champion_key}|${u.star ?? 1}`
      keyCount[k] = (keyCount[k] || 0) + 1
    })
    const keyWith3 = Object.keys(keyCount).find((k) => keyCount[k] >= 3)
    if (!keyWith3) break
    const star = parseInt(keyWith3.split('|')[1], 10)
    const champion_key = keyWith3.split('|')[0]
    const benchIndices = b
      .map((u, i) => i)
      .filter((i) => b[i].champion_key === champion_key && (b[i].star ?? 1) === star)
      .slice(0, 3)
    const nFromBench = benchIndices.length
    const nFromBoard = 3 - nFromBench
    const boardIndices = brd
      .map((u, i) => ({ u, i }))
      .filter(({ u }) => u.champion_key === champion_key && (u.star ?? 1) === star)
      .map(({ i }) => i)
      .slice(0, nFromBoard)
    if (benchIndices.length + boardIndices.length < 3) break
    const benchSources = benchIndices.map((i) => b[i]).filter(Boolean)
    const boardSources = boardIndices.map((i) => brd[i]).filter(Boolean)
    const firstSource = benchSources[0] || boardSources[0]
    const mask = firstSource?.mask_color ?? 'red'
    const items = []
    benchSources.forEach((u) => {
      if (u?.items && Array.isArray(u.items)) items.push(...u.items)
    })
    boardSources.forEach((u) => {
      if (u?.items && Array.isArray(u.items)) items.push(...u.items)
    })
    b = b.filter((_, i) => !benchIndices.includes(i))
    brd = brd.filter((_, i) => !boardIndices.includes(i))
    b.push({
      champion_key,
      star: Math.min(3, star + 1),
      mask_color: mask,
      items: items.slice(0, 3)
    })
  }
  return { bench: b, board: brd }
}

/** Cộng XP và lên level khi đủ. */
function applyXpGain(player, xpGain) {
  if (!player || xpGain <= 0) return player
  let xp = (player.xp ?? 0) + xpGain
  let level = player.level ?? 1
  while (level < MAX_LEVEL) {
    const required = XP_REQUIRED_BY_LEVEL[level] ?? 84
    if (xp < required) break
    xp -= required
    level += 1
  }
  return { ...player, xp, level }
}

/**
 * Tìm index của unit khớp (champion_key, star) trong pool, trả về index hoặc -1
 */
function findMatchingUnitIndex(pool, champion_key, star) {
  return pool.findIndex(
    (u) => u && u.champion_key === champion_key && (u.star ?? 1) === star
  )
}

/**
 * Áp dụng hành động AI lên opponent
 * @param {Object} opponent - { gold, level, xp, bench_state, board_state, ... }
 * @param {Object} actions - { purchases: number[], level_up: boolean, placements: Array }
 * @param {Array} shop - 5 ô shop, mỗi ô { champion_key, cost, mask_color } hoặc null
 * @param {Object} championsMap - key → champion
 * @returns {Object} opponent đã cập nhật
 */
export function applyOpponentActions(opponent, actions, shop, championsMap) {
  let gold = opponent.gold ?? 0
  let bench = [...(opponent.bench_state || [])]
  let board = []
  const { purchases = [], level_up = false, placements = [], item_placements = [] } = actions
  let opponentItems = [...(opponent.items || [])]

  // 1. Mua từ shop
  const shopArr = Array.isArray(shop) ? shop : []
  for (const idx of purchases) {
    if (idx < 0 || idx >= 5) continue
    const slot = shopArr[idx]
    if (!slot || !slot.champion_key) continue
    const cost = slot.cost ?? championsMap?.[slot.champion_key]?.cost ?? 1
    if (gold < cost) continue
    gold -= cost
    bench.push({
      champion_key: slot.champion_key,
      star: 1,
      mask_color: slot.mask_color ?? championsMap?.[slot.champion_key]?.default_mask_color ?? 'red',
      items: []
    })
  }

  // 2. Mua level (4 vàng = 4 XP)
  let didLevelUp = false
  if (level_up && gold >= XP_GOLD_COST) {
    gold -= XP_GOLD_COST
    didLevelUp = true
  }

  // 3. Ghép 3→1
  const { bench: combinedBench, board: combinedBoard } = combineBenchAndBoard(bench, opponent.board_state || [])

  // 4. Đặt lên bàn theo placements
  const pool = [...combinedBench, ...combinedBoard]
  const usedIndices = new Set()
  const level = opponent.level ?? 1
  const maxPlacements = Math.min(placements.length, level)

  for (let i = 0; i < maxPlacements; i++) {
    const p = placements[i]
    if (!p || !p.champion_key) continue
    const idx = findMatchingUnitIndex(
      pool,
      p.champion_key,
      p.star ?? 1
    )
    if (idx < 0 || usedIndices.has(idx)) continue
    usedIndices.add(idx)
    const unit = pool[idx]
    board.push({
      champion_key: unit.champion_key,
      star: unit.star ?? 1,
      mask_color: p.mask_color ?? unit.mask_color ?? 'red',
      col: Math.max(0, Math.min(3, p.col ?? 0)),
      row: Math.max(0, Math.min(3, p.row ?? 0)),
      items: unit.items || []
    })
  }

  // Bench còn lại = pool trừ những unit đã đặt
  let remainingBench = pool
    .map((u, i) => (usedIndices.has(i) ? null : u))
    .filter(Boolean)

  // 5. Gắn item từ kho lên tướng
  const allUnits = [...board, ...remainingBench]
  for (const ip of item_placements) {
    if (!ip?.item_id || !ip?.champion_key) continue
    const itemIdx = opponentItems.indexOf(ip.item_id)
    if (itemIdx < 0) continue
    const unit = allUnits.find(
      (u) =>
        u &&
        u.champion_key === ip.champion_key &&
        (u.star ?? 1) === (ip.star ?? 1) &&
        (u.items?.length ?? 0) < 3
    )
    if (!unit) continue
    if (!unit.items) unit.items = []
    unit.items.push(ip.item_id)
    opponentItems.splice(itemIdx, 1)
  }

  const updated = {
    ...opponent,
    gold,
    items: opponentItems,
    bench_state: remainingBench,
    board_state: board
  }

  if (didLevelUp) {
    return applyXpGain(updated, 4)
  }
  return updated
}

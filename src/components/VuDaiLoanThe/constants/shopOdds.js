/** Tỷ lệ % xuất hiện tướng theo cost (1–5 vàng) tại mỗi level. Mỗi dòng: [1v, 2v, 3v, 4v, 5v]. Bám sát TFT chuẩn. */
export const SHOP_ODDS_BY_LEVEL = {
  1: [100, 0, 0, 0, 0],
  2: [100, 0, 0, 0, 0],
  3: [75, 25, 0, 0, 0],
  4: [55, 30, 15, 0, 0],
  5: [45, 33, 20, 2, 0],
  6: [30, 40, 25, 5, 0],
  7: [19, 30, 35, 15, 1],
  8: [18, 25, 32, 22, 3],
  9: [10, 20, 25, 35, 10],
  10: [5, 10, 20, 40, 25]
}

export function getShopOddsForLevel(level, maxLevel = 10) {
  const l = Math.max(1, Math.min(maxLevel, Number(level) || 1))
  return SHOP_ODDS_BY_LEVEL[l] ?? SHOP_ODDS_BY_LEVEL[1]
}

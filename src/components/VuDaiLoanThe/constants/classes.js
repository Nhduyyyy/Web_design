/**
 * Vũ Đại Loạn Thế - Classes (Hệ / Vai diễn) - static fallback
 * Sync with supabase seed: vu_dai_loan_the_classes
 */
export const CLASSES = [
  { key: 'vo_tuong', name: 'Võ Tướng', role: 'Tank/Bruiser', sort_order: 1 },
  { key: 'dao_vo', name: 'Đào Võ', role: 'DPS', sort_order: 2 },
  { key: 'van_quan', name: 'Văn Quan', role: 'Buff', sort_order: 3 },
  { key: 'trung_than', name: 'Trung Thần', role: 'Hồi máu', sort_order: 4 },
  { key: 'ninh_than', name: 'Nịnh Thần', role: 'Debuff', sort_order: 5 },
  { key: 'hoang_toc', name: 'Hoàng Tộc', role: 'Late game scaling', sort_order: 6 },
  { key: 'sat_thu', name: 'Sát Thủ', role: 'Assassin', sort_order: 7 },
  { key: 'phan_tac', name: 'Phản Tặc', role: 'Debuff', sort_order: 8 }
]

export const getClassByKey = (key) => CLASSES.find((c) => c.key === key)
export const getClassMap = () => Object.fromEntries(CLASSES.map((c) => [c.key, c]))

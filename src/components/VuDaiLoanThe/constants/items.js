/**
 * Hệ thống Item – Vũ Đại Loạn Thế
 * Item được chia thành:
 * - ITEM_COMPONENTS (tier 1 – mảnh đồ)
 * - COMPLETED_ITEMS (tier 2 – đồ ghép)
 *
 * Mỗi item có:
 * - id: string
 * - name: string
 * - tier: 1 | 2
 * - stats: { hp_flat, attack_flat, attack_percent, armor_flat, magic_resist_flat, crit_chance, crit_damage }
 * - from: [compA, compB] đối với completed item
 */

export const ITEM_COMPONENTS = [
  {
    id: 'comp_kiem_son_hau',
    key: 'comp_kiem_son_hau',
    name: 'Kiếm Sơn Hậu',
    tier: 1,
    stats: {
      hp_flat: 0,
      attack_flat: 10,
      attack_percent: 0,
      armor_flat: 0,
      magic_resist_flat: 0,
      crit_chance: 0,
      crit_damage: 0
    },
    tags: ['offense']
  },
  {
    id: 'comp_co_tam_nu',
    key: 'comp_co_tam_nu',
    name: 'Cờ Tam Nữ Đồ Vương',
    tier: 1,
    stats: {
      hp_flat: 0,
      attack_flat: 0,
      attack_percent: 0.1,
      armor_flat: 0,
      magic_resist_flat: 0,
      crit_chance: 0,
      crit_damage: 0
    },
    tags: ['offense']
  },
  {
    id: 'comp_kiem_tram_trinh_an',
    key: 'comp_kiem_tram_trinh_an',
    name: 'Bảo Kiếm Trảm Trịnh Ân',
    tier: 1,
    stats: {
      hp_flat: 0,
      attack_flat: 0,
      attack_percent: 0,
      armor_flat: 0,
      magic_resist_flat: 0,
      crit_chance: 0.15,
      crit_damage: 0
    },
    tags: ['offense']
  },
  {
    id: 'comp_khien_tiet_dinh_san',
    key: 'comp_khien_tiet_dinh_san',
    name: 'Khiên Tiết Đinh San',
    tier: 1,
    stats: {
      hp_flat: 0,
      attack_flat: 0,
      attack_percent: 0,
      armor_flat: 20,
      magic_resist_flat: 0,
      crit_chance: 0,
      crit_damage: 0
    },
    tags: ['defense']
  },
  {
    id: 'comp_bao_giap_luu_kim_dinh',
    key: 'comp_bao_giap_luu_kim_dinh',
    name: 'Bào Giáp Lưu Kim Đính',
    tier: 1,
    stats: {
      hp_flat: 0,
      attack_flat: 0,
      attack_percent: 0,
      armor_flat: 0,
      magic_resist_flat: 20,
      crit_chance: 0,
      crit_damage: 0
    },
    tags: ['defense']
  },
  {
    id: 'comp_ho_phu_trung_than',
    key: 'comp_ho_phu_trung_than',
    name: 'Hộ Phù Trung Thần',
    tier: 1,
    stats: {
      hp_flat: 150,
      attack_flat: 0,
      attack_percent: 0,
      armor_flat: 0,
      magic_resist_flat: 0,
      crit_chance: 0,
      crit_damage: 0
    },
    tags: ['defense']
  },
  {
    id: 'comp_mat_na_hi_truong',
    key: 'comp_mat_na_hi_truong',
    name: 'Mặt Nạ Hí Trường',
    tier: 1,
    stats: {
      hp_flat: 0,
      attack_flat: 0,
      attack_percent: 0,
      armor_flat: 0,
      magic_resist_flat: 0,
      crit_chance: 0,
      crit_damage: 0.2
    },
    tags: ['offense']
  },
  {
    id: 'comp_trong_lenh_vu_dai',
    key: 'comp_trong_lenh_vu_dai',
    name: 'Trống Lệnh Vũ Đài',
    tier: 1,
    stats: {
      hp_flat: 75,
      attack_flat: 0,
      attack_percent: 0.05,
      armor_flat: 0,
      magic_resist_flat: 0,
      crit_chance: 0,
      crit_damage: 0
    },
    tags: ['utility']
  },
  {
    id: 'tool_nam_cham_vu_dai',
    key: 'tool_nam_cham_vu_dai',
    name: 'Nam Châm Vũ Đài',
    tier: 1,
    stats: {
      hp_flat: 0,
      attack_flat: 0,
      attack_percent: 0,
      armor_flat: 0,
      magic_resist_flat: 0,
      crit_chance: 0,
      crit_damage: 0
    },
    tags: ['utility', 'tool'],
    description: 'Dùng để tháo toàn bộ vật phẩm khỏi một tướng, trả lại vào kho.'
  }
]

export const COMPLETED_ITEMS = [
  // Nhóm sát thương
  {
    id: 'item_kiem_ba_vuong_son_hau',
    name: 'Kiếm Bá Vương Sơn Hậu',
    tier: 2,
    from: ['comp_kiem_son_hau', 'comp_co_tam_nu'],
    stats: {
      hp_flat: 0,
      attack_flat: 20,
      attack_percent: 0.2,
      armor_flat: 0,
      magic_resist_flat: 0,
      crit_chance: 0,
      crit_damage: 0
    },
    tags: ['offense']
  },
  {
    id: 'item_tram_dao_phan_le_hue',
    name: 'Trảm Đao Phàn Lê Huê',
    tier: 2,
    from: ['comp_kiem_son_hau', 'comp_kiem_tram_trinh_an'],
    stats: {
      hp_flat: 0,
      attack_flat: 15,
      attack_percent: 0,
      armor_flat: 0,
      magic_resist_flat: 0,
      crit_chance: 0.2,
      crit_damage: 0.2
    },
    tags: ['offense']
  },
  {
    id: 'item_song_dao_tam_nu',
    name: 'Song Đao Tam Nữ',
    tier: 2,
    from: ['comp_co_tam_nu', 'comp_mat_na_hi_truong'],
    stats: {
      hp_flat: 0,
      attack_flat: 0,
      attack_percent: 0.25,
      armor_flat: 0,
      magic_resist_flat: 0,
      crit_chance: 0,
      crit_damage: 0.3
    },
    tags: ['offense']
  },
  // Anti-tank
  {
    id: 'item_loi_dao_tram_trinh',
    name: 'Lôi Đao Trảm Trịnh',
    tier: 2,
    from: ['comp_kiem_tram_trinh_an', 'comp_co_tam_nu'],
    stats: {
      hp_flat: 0,
      attack_flat: 0,
      attack_percent: 0.15,
      armor_flat: 0,
      magic_resist_flat: 0,
      crit_chance: 0.15,
      crit_damage: 0
    },
    tags: ['offense']
  },
  {
    id: 'item_kim_thuong_pha_giap',
    name: 'Kim Thương Phá Giáp',
    tier: 2,
    from: ['comp_kiem_son_hau', 'comp_khien_tiet_dinh_san'],
    stats: {
      hp_flat: 0,
      attack_flat: 10,
      attack_percent: 0.1,
      armor_flat: 0,
      magic_resist_flat: 0,
      crit_chance: 0,
      crit_damage: 0
    },
    tags: ['offense']
  },
  // Tank
  {
    id: 'item_giap_son_hau',
    name: 'Giáp Sơn Hậu Trị Quốc',
    tier: 2,
    from: ['comp_khien_tiet_dinh_san', 'comp_bao_giap_luu_kim_dinh'],
    stats: {
      hp_flat: 0,
      attack_flat: 0,
      attack_percent: 0,
      armor_flat: 40,
      magic_resist_flat: 40,
      crit_chance: 0,
      crit_damage: 0
    },
    tags: ['defense']
  },
  {
    id: 'item_thuan_lien_thanh_tho_chau',
    name: 'Thuẫn Liên Thành Thọ Châu',
    tier: 2,
    from: ['comp_khien_tiet_dinh_san', 'comp_ho_phu_trung_than'],
    stats: {
      hp_flat: 250,
      attack_flat: 0,
      attack_percent: 0,
      armor_flat: 25,
      magic_resist_flat: 0,
      crit_chance: 0,
      crit_damage: 0
    },
    tags: ['defense']
  },
  {
    id: 'item_ho_giap_trung_than',
    name: 'Hộ Giáp Trung Thần',
    tier: 2,
    from: ['comp_bao_giap_luu_kim_dinh', 'comp_ho_phu_trung_than'],
    stats: {
      hp_flat: 200,
      attack_flat: 0,
      attack_percent: 0,
      armor_flat: 0,
      magic_resist_flat: 30,
      crit_chance: 0,
      crit_damage: 0
    },
    tags: ['defense']
  },
  // Hybrid
  {
    id: 'item_chien_bao_uyen_uong',
    name: 'Chiến Bào Uyên Ương',
    tier: 2,
    from: ['comp_trong_lenh_vu_dai', 'comp_bao_giap_luu_kim_dinh'],
    stats: {
      hp_flat: 150,
      attack_flat: 0,
      attack_percent: 0.1,
      armor_flat: 0,
      magic_resist_flat: 15,
      crit_chance: 0,
      crit_damage: 0
    },
    tags: ['hybrid']
  },
  {
    id: 'item_linh_bai_vu_dai',
    name: 'Lịnh Bài Vũ Đài',
    tier: 2,
    from: ['comp_trong_lenh_vu_dai', 'comp_ho_phu_trung_than'],
    stats: {
      hp_flat: 150,
      attack_flat: 0,
      attack_percent: 0.05,
      armor_flat: 15,
      magic_resist_flat: 0,
      crit_chance: 0,
      crit_damage: 0
    },
    tags: ['hybrid']
  },
  // Crit / carry late
  {
    id: 'item_vuong_mien_tam_nu',
    name: 'Vương Miện Tam Nữ',
    tier: 2,
    from: ['comp_mat_na_hi_truong', 'comp_kiem_tram_trinh_an'],
    stats: {
      hp_flat: 0,
      attack_flat: 0,
      attack_percent: 0,
      armor_flat: 0,
      magic_resist_flat: 0,
      crit_chance: 0.25,
      crit_damage: 0.35
    },
    tags: ['offense']
  },
  {
    id: 'item_mat_na_vu_dai',
    name: 'Mặt Nạ Vũ Đài Lộng Lẫy',
    tier: 2,
    from: ['comp_mat_na_hi_truong', 'comp_trong_lenh_vu_dai'],
    stats: {
      hp_flat: 0,
      attack_flat: 0,
      attack_percent: 0.1,
      armor_flat: 0,
      magic_resist_flat: 0,
      crit_chance: 0.15,
      crit_damage: 0.15
    },
    tags: ['offense']
  },
  // Utility
  {
    id: 'item_hao_quang_hoang_toc',
    name: 'Hào Quang Hoàng Tộc',
    tier: 2,
    from: ['comp_co_tam_nu', 'comp_trong_lenh_vu_dai'],
    stats: {
      hp_flat: 100,
      attack_flat: 0,
      attack_percent: 0.1,
      armor_flat: 0,
      magic_resist_flat: 0,
      crit_chance: 0,
      crit_damage: 0
    },
    tags: ['utility']
  },
  {
    id: 'item_phu_chu_van_quan',
    name: 'Phù Chú Văn Quan',
    tier: 2,
    from: ['comp_bao_giap_luu_kim_dinh', 'comp_mat_na_hi_truong'],
    stats: {
      hp_flat: 0,
      attack_flat: 0,
      attack_percent: 0,
      armor_flat: 0,
      magic_resist_flat: 25,
      crit_chance: 0.1,
      crit_damage: 0
    },
    tags: ['utility']
  },
  {
    id: 'item_le_phuc_dien_xuong',
    name: 'Lễ Phục Diễn Xướng',
    tier: 2,
    from: ['comp_trong_lenh_vu_dai', 'comp_khien_tiet_dinh_san'],
    stats: {
      hp_flat: 0,
      attack_flat: 0,
      attack_percent: 0.05,
      armor_flat: 20,
      magic_resist_flat: 0,
      crit_chance: 0,
      crit_damage: 0
    },
    tags: ['utility']
  },
  // Core Kiếm Sơn Hậu ghép với mọi mảnh còn lại
  {
    id: 'item_kiem_song_bao',
    name: 'Kiếm Song Bào',
    tier: 2,
    from: ['comp_kiem_son_hau', 'comp_bao_giap_luu_kim_dinh'],
    stats: {
      hp_flat: 0,
      attack_flat: 15,
      attack_percent: 0.1,
      armor_flat: 0,
      magic_resist_flat: 15,
      crit_chance: 0,
      crit_damage: 0
    },
    tags: ['hybrid', 'offense']
  },
  {
    id: 'item_kiem_ho_giap',
    name: 'Kiếm Hộ Giáp Trung Trinh',
    tier: 2,
    from: ['comp_kiem_son_hau', 'comp_ho_phu_trung_than'],
    stats: {
      hp_flat: 200,
      attack_flat: 10,
      attack_percent: 0.05,
      armor_flat: 0,
      magic_resist_flat: 0,
      crit_chance: 0,
      crit_damage: 0
    },
    tags: ['hybrid', 'offense']
  },
  {
    id: 'item_kiem_mat_na',
    name: 'Kiếm Mặt Nạ Vũ Đài',
    tier: 2,
    from: ['comp_kiem_son_hau', 'comp_mat_na_hi_truong'],
    stats: {
      hp_flat: 0,
      attack_flat: 10,
      attack_percent: 0.1,
      armor_flat: 0,
      magic_resist_flat: 0,
      crit_chance: 0.15,
      crit_damage: 0.15
    },
    tags: ['offense']
  },
  {
    id: 'item_kiem_trong_lenh',
    name: 'Kiếm Trống Lệnh Vũ Đài',
    tier: 2,
    from: ['comp_kiem_son_hau', 'comp_trong_lenh_vu_dai'],
    stats: {
      hp_flat: 100,
      attack_flat: 10,
      attack_percent: 0.1,
      armor_flat: 0,
      magic_resist_flat: 0,
      crit_chance: 0,
      crit_damage: 0
    },
    tags: ['offense', 'utility']
  },
  // Core Mặt Nạ Hí Trường ghép với mọi mảnh còn lại
  {
    id: 'item_mat_na_khien_thep',
    name: 'Mặt Nạ Khiên Thép',
    tier: 2,
    from: ['comp_mat_na_hi_truong', 'comp_khien_tiet_dinh_san'],
    stats: {
      hp_flat: 0,
      attack_flat: 0,
      attack_percent: 0.05,
      armor_flat: 25,
      magic_resist_flat: 0,
      crit_chance: 0.15,
      crit_damage: 0.15
    },
    tags: ['hybrid', 'offense', 'defense']
  },
  {
    id: 'item_mat_na_ho_phu',
    name: 'Mặt Nạ Hộ Phù Trung Trinh',
    tier: 2,
    from: ['comp_mat_na_hi_truong', 'comp_ho_phu_trung_than'],
    stats: {
      hp_flat: 250,
      attack_flat: 0,
      attack_percent: 0.05,
      armor_flat: 0,
      magic_resist_flat: 0,
      crit_chance: 0.15,
      crit_damage: 0.15
    },
    tags: ['hybrid', 'offense']
  },
  // Core Khiên Tiết Đinh San ghép với các mảnh còn thiếu
  {
    id: 'item_khien_co_tam_nu',
    name: 'Khiên Cờ Tam Nữ',
    tier: 2,
    from: ['comp_khien_tiet_dinh_san', 'comp_co_tam_nu'],
    stats: {
      hp_flat: 0,
      attack_flat: 0,
      attack_percent: 0.15,
      armor_flat: 25,
      magic_resist_flat: 0,
      crit_chance: 0,
      crit_damage: 0
    },
    tags: ['hybrid']
  },
  {
    id: 'item_khien_tram_trinh',
    name: 'Khiên Trảm Trịnh',
    tier: 2,
    from: ['comp_khien_tiet_dinh_san', 'comp_kiem_tram_trinh_an'],
    stats: {
      hp_flat: 0,
      attack_flat: 0,
      attack_percent: 0.05,
      armor_flat: 25,
      magic_resist_flat: 0,
      crit_chance: 0.15,
      crit_damage: 0
    },
    tags: ['hybrid', 'offense']
  },
  // Core Cờ Tam Nữ ghép với mọi mảnh còn lại
  {
    id: 'item_co_bao_giap',
    name: 'Cờ Bào Giáp Hoàng Thành',
    tier: 2,
    from: ['comp_co_tam_nu', 'comp_bao_giap_luu_kim_dinh'],
    stats: {
      hp_flat: 0,
      attack_flat: 0,
      attack_percent: 0.15,
      armor_flat: 0,
      magic_resist_flat: 25,
      crit_chance: 0,
      crit_damage: 0
    },
    tags: ['hybrid']
  },
  {
    id: 'item_co_ho_phu',
    name: 'Cờ Hộ Phù Đại Trận',
    tier: 2,
    from: ['comp_co_tam_nu', 'comp_ho_phu_trung_than'],
    stats: {
      hp_flat: 250,
      attack_flat: 0,
      attack_percent: 0.1,
      armor_flat: 0,
      magic_resist_flat: 0,
      crit_chance: 0,
      crit_damage: 0
    },
    tags: ['hybrid', 'offense']
  },
  {
    id: 'item_ho_phu_tram_trinh',
    name: 'Hộ Phù Trảm Trịnh',
    tier: 2,
    from: ['comp_ho_phu_trung_than', 'comp_kiem_tram_trinh_an'],
    stats: {
      hp_flat: 200,
      attack_flat: 0,
      attack_percent: 0.05,
      armor_flat: 0,
      magic_resist_flat: 0,
      crit_chance: 0.15,
      crit_damage: 0
    },
    tags: ['hybrid', 'offense']
  },
  {
    id: 'item_bao_giap_tram_trinh',
    name: 'Bào Giáp Trảm Trịnh',
    tier: 2,
    from: ['comp_bao_giap_luu_kim_dinh', 'comp_kiem_tram_trinh_an'],
    stats: {
      hp_flat: 0,
      attack_flat: 0,
      attack_percent: 0.1,
      armor_flat: 0,
      magic_resist_flat: 30,
      crit_chance: 0.15,
      crit_damage: 0
    },
    tags: ['hybrid', 'offense']
  },
  {
    id: 'item_tram_trinh_trong_lenh',
    name: 'Trảm Trịnh Trống Lệnh',
    tier: 2,
    from: ['comp_kiem_tram_trinh_an', 'comp_trong_lenh_vu_dai'],
    stats: {
      hp_flat: 75,
      attack_flat: 0,
      attack_percent: 0.15,
      armor_flat: 0,
      magic_resist_flat: 0,
      crit_chance: 0.15,
      crit_damage: 0.15
    },
    tags: ['offense']
  }
]

export function getItemById(id) {
  return ITEM_COMPONENTS.find((i) => i.id === id || i.key === id) || COMPLETED_ITEMS.find((i) => i.id === id)
}

export function getRandomItemComponent(rng = Math.random) {
  const pool = ITEM_COMPONENTS.filter((i) => !(i.tags || []).includes('tool'))
  if (!pool.length) return null
  return pool[Math.floor(rng() * pool.length)]
}

export function getRandomItemComponentId(rng = Math.random) {
  const it = getRandomItemComponent(rng)
  return it?.id ?? null
}

export function getCompletedFromComponents(compA, compB) {
  if (!compA || !compB) return null
  const keys = [compA, compB]
  return (
    COMPLETED_ITEMS.find((it) => {
      if (!Array.isArray(it.from) || it.from.length !== 2) return false
      return keys.includes(it.from[0]) && keys.includes(it.from[1])
    }) || null
  )
}

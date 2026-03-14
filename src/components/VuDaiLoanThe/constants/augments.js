/**
 * Vũ Đại Loạn Thế - Lõi (Augment) - Nghệ thuật tuồng & cơ chế đặc biệt
 * Mỗi lõi có: id, name, tier, category, effect, flavorDescription
 */

/** Lõi Nghệ Thuật Tuồng – Khám phá văn hóa qua gameplay */
export const AUGMENTS_TUONG_ART = [
  {
    id: 'loi_hoa_trang_tu_sac',
    name: 'Hóa Trang Tứ Sắc',
    tier: 'gold',
    category: 'combat',
    flavorDescription: 'Tuồng cổ dùng hóa trang để phân biệt vai: đỏ dũng mãnh, đen trung nghĩa, trắng nham hiểm, xanh tài trí.',
    effect: {
      type: 'mask_diversity',
      condition: { maskCount: 4 },
      stats: { damagePercent: 0.15, armor: 15, magicResist: 15 }
    },
    effectDescription: 'Khi đội hình có đủ 4 màu mặt nạ khác nhau (Đỏ, Đen, Trắng, Xanh) trên bàn cờ, toàn đội nhận: +15% sát thương, +15 Giáp, +15 Kháng phép.'
  },
  {
    id: 'loi_trong_chieng_vu_dai',
    name: 'Trống Chiêng Vũ Đài',
    tier: 'silver',
    category: 'econ',
    flavorDescription: 'Trống chiêng đệm từng lớp diễn, báo hiệu cao trào – thắng trận như một màn diễn thành công.',
    effect: {
      type: 'gold_on_win',
      goldBonus: 3
    },
    effectDescription: 'Mỗi khi thắng một trận combat (PvP), bạn nhận thêm 3 vàng ngay sau trận đó.'
  },
  {
    id: 'loi_vai_chinh_san_khau',
    name: 'Vai Chính Sân Khấu',
    tier: 'gold',
    category: 'combat',
    flavorDescription: 'Vai chính là linh hồn vở diễn – kép chính được chiếu sáng giữa sân khấu.',
    effect: {
      type: 'buff_highest_cost',
      stats: { damagePercent: 0.25, hpFlat: 50 }
    },
    effectDescription: 'Tướng có cost cao nhất trên bàn cờ (ví dụ: nếu bạn có tướng 5 vàng thì tướng đó được buff) nhận: +25% sát thương, +50 HP.'
  },
  {
    id: 'loi_lop_dien_lien_hoan',
    name: 'Lớp Diễn Liên Hoàn',
    tier: 'gold',
    category: 'econ',
    flavorDescription: 'Tuồng có nhiều lớp diễn – mỗi lớp kết thúc mở ra lớp mới, câu chuyện càng thêm hấp dẫn.',
    effect: {
      type: 'win_streak_gold',
      roundsPerTrigger: 3,
      goldBonus: 8
    },
    effectDescription: 'Mỗi khi thắng 3 trận combat liên tiếp: nhận thêm 8 vàng. Ví dụ: thắng trận 1, 2, 3 → +8 vàng; thắng trận 4, 5, 6 → +8 vàng nữa.'
  },
  {
    id: 'loi_phu_dien_tai_hoa',
    name: 'Phụ Diễn Tài Hóa',
    tier: 'silver',
    category: 'combat',
    flavorDescription: 'Phụ diễn tuy không đứng giữa sân khấu nhưng góp phần làm nên vở tuồng hay.',
    effect: {
      type: 'buff_low_cost',
      maxCost: 2,
      stats: { damagePercent: 0.2, hpFlat: 30 }
    },
    effectDescription: 'Tất cả tướng cost 1 vàng hoặc 2 vàng trên bàn cờ nhận: +20% sát thương, +30 HP.'
  },
  {
    id: 'loi_san_khau_tam_cap',
    name: 'Sân Khấu Tam Cấp',
    tier: 'silver',
    category: 'combat',
    flavorDescription: 'Sân khấu tuồng có tam cấp – tầng cao cho vua quan, tầng thấp cho binh lính.',
    effect: {
      type: 'three_rows',
      stats: { armor: 10, magicResist: 10 }
    },
    effectDescription: 'Khi có tướng đứng ở 3 hàng khác nhau trên bàn cờ (ví dụ: hàng 1, hàng 2, hàng 3), toàn đội nhận: +10 Giáp, +10 Kháng phép.'
  },
  {
    id: 'loi_khan_gia_vo_tay',
    name: 'Khán Giả Vỗ Tay',
    tier: 'gold',
    category: 'econ',
    flavorDescription: 'Khán giả vỗ tay, reo hò khi màn diễn hay – đó là niềm vui của nghệ sĩ tuồng.',
    effect: {
      type: 'gold_on_win',
      goldBonus: 5
    },
    effectDescription: 'Mỗi khi thắng một trận combat (PvP), bạn nhận thêm 5 vàng ngay sau trận đó.'
  },
  {
    id: 'loi_dieu_bo_uyyen_chuyen',
    name: 'Điệu Bộ Uyển Chuyển',
    tier: 'silver',
    category: 'combat',
    flavorDescription: 'Mỗi cử chỉ trong tuồng đều có ý nghĩa – điệu bộ uyển chuyển kể câu chuyện không cần lời.',
    effect: {
      type: 'buff_backline',
      stats: { damagePercent: 0.15 }
    },
    effectDescription: 'Tướng đứng ở hàng sau (hàng xa địch nhất, thường là hàng 1 hoặc 2 trên bàn cờ của bạn) nhận: +15% sát thương.'
  }
]

/** Lõi Đặc Biệt theo 5 Vở Tuồng – tribe_special với grantChampions */
export const AUGMENTS_TRIBE_SPECIAL = [
  {
    id: 'loi_bao_thu_tam_nu',
    name: 'Báo Thù Tam Nữ',
    tier: 'gold',
    category: 'tribe_special',
    flavorDescription: 'Tam Nữ Đồ Vương – khi đồng minh chết, tăng sát thương cho tướng còn sống.',
    effect: {
      type: 'tam_nu_revenge',
      damagePerDeath: 0.1
    },
    effectDescription: 'Trong mỗi trận combat: mỗi khi một đồng minh chết, tất cả tướng còn sống nhận +10% sát thương (cộng dồn, không giới hạn). Ví dụ: 2 đồng minh chết → +20% sát thương cho tướng còn sống. Nhận thêm tướng Lệ Hoa.',
    grantChampions: ['lệ_hoa']
  },
  {
    id: 'loi_cong_ly_tram_trinh',
    name: 'Công Lý Trảm Trịnh',
    tier: 'gold',
    category: 'tribe_special',
    flavorDescription: 'Trảm Trịnh Ân – tăng sát thương lên địch thấp máu.',
    effect: {
      type: 'tram_trinh_execute',
      lowHpThreshold: 0.5,
      damagePercent: 0.2
    },
    effectDescription: 'Tướng của bạn gây thêm +20% sát thương lên địch có máu dưới 50%. Nhận thêm tướng Trịnh Ân.',
    grantChampions: ['trịnh_ân']
  },
  {
    id: 'loi_trung_quan_bat_khuat',
    name: 'Trung Quân Bất Khuất',
    tier: 'gold',
    category: 'tribe_special',
    flavorDescription: 'Sơn Hậu – buff thêm cho tộc Sơn Hậu.',
    effect: {
      type: 'son_hau_buff',
      stats: { armor: 10, magicResist: 10, damagePercent: 0.1 }
    },
    effectDescription: 'Tất cả tướng tộc Sơn Hậu (Khương Linh Tá, Tạ Ôn Đình, Đổng Kim Lân, Triệu Khánh Sanh, Phò Mã Sơn Hậu, Trung Thần Hồn) nhận: +10 Giáp, +10 Kháng phép, +10% sát thương. Nhận thêm tướng Khương Linh Tá.',
    grantChampions: ['khương_linh_tá']
  },
  {
    id: 'loi_tinh_tiet_phan',
    name: 'Tình Tiết Phàn',
    tier: 'gold',
    category: 'tribe_special',
    flavorDescription: 'Tiết Đinh San Cầu Phàn Lê Huê – cặp đôi đứng cạnh nhau nhận buff.',
    effect: {
      type: 'phàn_couple',
      stats: { damagePercent: 0.15, armor: 15 }
    },
    effectDescription: 'Tướng tộc Tiết Đinh San (Tiết Đinh San, Phàn Lê Huê, Nữ Tướng Phàn, Chiến Binh Tây Lương, Lưỡng Kiếm Song Hành, Uyên Ương Chiến Thần) đứng cạnh ít nhất 1 đồng minh cùng tộc trên bàn cờ nhận: +15% sát thương, +15 Giáp. Nhận thêm tướng Phàn Lê Huê.',
    grantChampions: ['phàn_lê_huê']
  },
  {
    id: 'loi_giai_cuu_tho_chau',
    name: 'Giải Cứu Thọ Châu',
    tier: 'gold',
    category: 'tribe_special',
    flavorDescription: 'Vở Lưu Kim Đính Giải Giá Thọ Châu – giải cứu đồng đội khi nguy nan.',
    effect: {
      type: 'tho_chau_shield',
      hpThreshold: 0.3,
      shieldAmount: 150
    },
    effectDescription: 'Tướng tộc Lưu Kim Đính (Thọ Châu Tướng, Lưu Kim Đính, Cấm Quân, Hộ Giá Trung Thần, Thành Chủ Thọ Châu, Kim Đính Đại Tướng) khi xuống dưới 30% máu trong combat sẽ nhận 150 Khiên. Khiên hấp thụ sát thương trước khi trừ HP, giúp tướng sống sót lâu hơn. Nhận thêm tướng Thọ Châu Tướng.',
    grantChampions: ['thọ_châu_tướng']
  }
]

/** Tất cả lõi (tuồng art + tribe_special) */
export const ALL_AUGMENTS = [...AUGMENTS_TUONG_ART, ...AUGMENTS_TRIBE_SPECIAL]

/** Roll 3 lõi ngẫu nhiên cho player chọn.
 * options.tier: 'silver' | 'gold' | 'mixed' | undefined
 *   - silver: chỉ lõi bạc
 *   - gold: chỉ lõi vàng
 *   - mixed/undefined: lẫn lộn
 */
export function rollAugmentOptions(options = {}, rng = Math.random) {
  const { tier } = options
  let pool = [...ALL_AUGMENTS]
  if (tier === 'silver') pool = pool.filter((a) => a.tier === 'silver')
  else if (tier === 'gold') pool = pool.filter((a) => a.tier === 'gold')
  const result = []
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = Math.floor(rng() * pool.length)
    result.push(pool.splice(idx, 1)[0])
  }
  return result
}

/** Lấy augment theo id */
export function getAugmentById(id) {
  return ALL_AUGMENTS.find((a) => a.id === id) || null
}

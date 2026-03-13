/**
 * Vũ Đại Loạn Thế - Mapping champion key → ảnh đại diện
 * Ảnh nằm trong public/vu-dai-loan-the-champions/ (theo từng tộc)
 */
const BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL
    ? import.meta.env.BASE_URL.replace(/\/$/, '')
    : '') + '/vu-dai-loan-the-champions'

export const BY_TRIBE = {
  son_hau: 'TỘC1_Sơn Hậu',
  tam_nu_do_vuong: 'TỘC2_Tam Nữ Đồ Vương',
  tram_trinh_an: 'TỘC3_Trảm Trịnh Ân',
  tiet_dinh_san_phàn_le_hue: 'TỘC4_Tiết Đinh San Cầu Phàn Lê Huê',
  luu_kim_dinh_giai_gia_tho_chau: 'TỘC5_Lưu Kim Đính Giải Giá Thọ Châu'
}

/** champion_key → tên file ảnh (trong thư mục tộc tương ứng) */
export const CHAMPION_IMAGE_FILES = {
  // TỘC1_Sơn Hậu
  khương_linh_tá: 'Khương_Linh_Tá _(1 vàng).png',
  tạ_ôn_đình: 'Tạ_Ôn_Đình_(2 vàng).png',
  đổng_kim_lân: 'Đổng_Kim_Lân_(3 vàng).png',
  triệu_khánh_sanh: 'Triệu_Khánh_Sanh_(3 vàng).png',
  phò_mã_sơn_hậu: 'Phò_Mã_Sơn_Hậu_(4 vàng).png',
  trung_thần_hồn: 'Trung_Thần_Hồn_(5 vàng – đặc biệt).png',
  // TỘC2_Tam Nữ Đồ Vương
  lệ_hoa: 'Lệ_Hoa_(1 vàng).png',
  hồng_liên: 'Hồng_Liên_(2 vàng).png',
  thanh_nguyệt: 'Thanh_Nguyệt_(2 vàng).png',
  bạch_lan: 'Bạch_Lan_(3 vàng).png',
  hắc_mai: 'Hắc_Mai_(4 vàng).png',
  tam_nữ_thống_soái: 'Tam_Nữ_Thống_Soái_(5 vàng).png',
  // TỘC3_Trảm Trịnh Ân
  trịnh_ân: 'Trịnh_Ân_(1 vàng).png',
  bao_công_việt: 'Bao_Công_Việt_(2 vàng).png',
  lý_tướng: 'Lý_Tướng_(2 vàng).png',
  hình_quan: 'Hình_Quan_(3 vàng).png',
  pháp_trảm: 'Pháp_Trảm_(4 vàng).png',
  thiên_lý_kiếm: 'Thiên_Lý_Kiếm_(5 vàng).png',
  // TỘC4_Tiết Đinh San Cầu Phàn Lê Huê
  nữ_tướng_phàn: 'Nữ_Tướng_Phàn_(1 vàng).png',
  tiết_đinh_san: 'Tiết_Đinh_San_(2 vàng).png',
  chiến_binh_tây_lương: 'Chiến_Binh_Tây_Lương_(2 vàng).png',
  phàn_lê_huê: 'Phàn_Lê_Huê_(3 vàng).png',
  lưỡng_kiếm_song_hành: 'Lưỡng_Kiếm_Song_Hành_(4 vàng).png',
  uyên_ương_chiến_thần: 'Uyên_Ương_Chiến_Thần_(5 vàng).png',
  // TỘC5_Lưu Kim Đính Giải Giá Thọ Châu
  thọ_châu_tướng: 'Thọ_Châu_Tướng_(1 vàng).png',
  cấm_quân: 'Cấm_Quân_(2 vàng).png',
  hộ_giá_trung_thần: 'Hộ_Giá_Trung_Thần_(2 vàng).png',
  lưu_kim_đính: 'Lưu_Kim_Đính_(3 vàng).png',
  thành_chủ_thọ_châu: 'Thành_Chủ_Thọ_Châu_(4 vàng).png',
  kim_đính_đại_tướng: 'Kim_Đính_Đại_Tướng_(5 vàng).png'
}

/** champion_key → tên file slug (ASCII, dùng cho URL ổn định) */
export const CHAMPION_IMAGE_SLUGS = {
  khương_linh_tá: 'khuong_linh_ta',
  tạ_ôn_đình: 'ta_on_dinh',
  đổng_kim_lân: 'dong_kim_lan',
  triệu_khánh_sanh: 'trieu_khanh_sanh',
  phò_mã_sơn_hậu: 'pho_ma_son_hau',
  trung_thần_hồn: 'trung_than_hon',
  lệ_hoa: 'le_hoa',
  hồng_liên: 'hong_lien',
  thanh_nguyệt: 'thanh_nguyet',
  bạch_lan: 'bach_lan',
  hắc_mai: 'hac_mai',
  tam_nữ_thống_soái: 'tam_nu_thong_soai',
  trịnh_ân: 'trinh_an',
  bao_công_việt: 'bao_cong_viet',
  lý_tướng: 'ly_tuong',
  hình_quan: 'hinh_quan',
  pháp_trảm: 'phap_tram',
  thiên_lý_kiếm: 'thien_ly_kiem',
  nữ_tướng_phàn: 'nu_tuong_phan',
  tiết_đinh_san: 'tiet_dinh_san',
  chiến_binh_tây_lương: 'chien_binh_tay_luong',
  phàn_lê_huê: 'phan_le_hue',
  lưỡng_kiếm_song_hành: 'luong_kiem_song_hanh',
  uyên_ương_chiến_thần: 'uyen_uong_chien_than',
  thọ_châu_tướng: 'tho_chau_tuong',
  cấm_quân: 'cam_quan',
  hộ_giá_trung_thần: 'ho_gia_trung_than',
  lưu_kim_đính: 'luu_kim_dinh',
  thành_chủ_thọ_châu: 'thanh_chu_tho_chau',
  kim_đính_đại_tướng: 'kim_dinh_dai_tuong'
}

/** champion_key → tên thư mục tộc (để build path) */
export const CHAMPION_TRIBE_FOLDER = {
  khương_linh_tá: 'son_hau', tạ_ôn_đình: 'son_hau', đổng_kim_lân: 'son_hau',
  triệu_khánh_sanh: 'son_hau', phò_mã_sơn_hậu: 'son_hau', trung_thần_hồn: 'son_hau',
  lệ_hoa: 'tam_nu_do_vuong', hồng_liên: 'tam_nu_do_vuong', thanh_nguyệt: 'tam_nu_do_vuong',
  bạch_lan: 'tam_nu_do_vuong', hắc_mai: 'tam_nu_do_vuong', tam_nữ_thống_soái: 'tam_nu_do_vuong',
  trịnh_ân: 'tram_trinh_an', bao_công_việt: 'tram_trinh_an', lý_tướng: 'tram_trinh_an',
  hình_quan: 'tram_trinh_an', pháp_trảm: 'tram_trinh_an', thiên_lý_kiếm: 'tram_trinh_an',
  nữ_tướng_phàn: 'tiet_dinh_san_phàn_le_hue', tiết_đinh_san: 'tiet_dinh_san_phàn_le_hue',
  chiến_binh_tây_lương: 'tiet_dinh_san_phàn_le_hue', phàn_lê_huê: 'tiet_dinh_san_phàn_le_hue',
  lưỡng_kiếm_song_hành: 'tiet_dinh_san_phàn_le_hue', uyên_ương_chiến_thần: 'tiet_dinh_san_phàn_le_hue',
  thọ_châu_tướng: 'luu_kim_dinh_giai_gia_tho_chau', cấm_quân: 'luu_kim_dinh_giai_gia_tho_chau',
  hộ_giá_trung_thần: 'luu_kim_dinh_giai_gia_tho_chau', lưu_kim_đính: 'luu_kim_dinh_giai_gia_tho_chau',
  thành_chủ_thọ_châu: 'luu_kim_dinh_giai_gia_tho_chau', kim_đính_đại_tướng: 'luu_kim_dinh_giai_gia_tho_chau'
}

/**
 * Trả về URL ảnh đại diện cho tướng (dùng trong img src).
 * Ưu tiên thư mục flat/ (tên file ASCII) để tránh lỗi Unicode; nếu không có thì dùng path theo tộc + NFD.
 * @param {string} championKey - key của tướng (vd: 'khương_linh_tá')
 * @param {string} [tribeKey] - key tộc từ DB (nếu có); không truyền thì lấy từ map nội bộ
 * @returns {string|null} URL hoặc null nếu không có ảnh
 */
export function getChampionImageUrl (championKey, tribeKey = null) {
  const slug = CHAMPION_IMAGE_SLUGS[championKey]
  if (slug) return `${BASE}/flat/${slug}.png`
  const file = CHAMPION_IMAGE_FILES[championKey]
  if (!file) return null
  const key = tribeKey || CHAMPION_TRIBE_FOLDER[championKey]
  const dir = key ? BY_TRIBE[key] : null
  if (!dir) return null
  const dirNorm = dir.normalize('NFD')
  const fileNorm = file.normalize('NFD')
  return `${BASE}/${encodeURIComponent(dirNorm)}/${encodeURIComponent(fileNorm)}`
}

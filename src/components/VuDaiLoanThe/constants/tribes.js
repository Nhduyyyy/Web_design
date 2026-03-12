/**
 * Vũ Đại Loạn Thế - Tribes (Vở tuồng) - static fallback
 * Sync with supabase seed: vu_dai_loan_the_tribes
 */
export const TRIBES = [
  { key: 'son_hau', name: 'Sơn Hậu', theme: 'Trung quân – Chính nghĩa', mechanic_description: 'Khi kích hoạt → tạo khiên & hồi máu theo % máu đã mất', color_hex: '#2E7D32', sort_order: 1 },
  { key: 'tam_nu_do_vuong', name: 'Tam Nữ Đồ Vương', theme: 'Báo thù – Nữ tướng', mechanic_description: 'Khi đồng minh chết → tăng sát thương', color_hex: '#C62828', sort_order: 2 },
  { key: 'tram_trinh_an', name: 'Trảm Trịnh Ân', theme: 'Xử gian thần', mechanic_description: 'Tăng sát thương chuẩn lên kẻ địch thấp máu', color_hex: '#1565C0', sort_order: 3 },
  { key: 'tiet_dinh_san_phàn_le_hue', name: 'Tiết Đinh San Cầu Phàn Lê Huê', theme: 'Tình – Chiến', mechanic_description: 'Cặp đôi đứng cạnh nhau → tăng chỉ số', color_hex: '#6A1B9A', sort_order: 4 },
  { key: 'luu_kim_dinh_giai_gia_tho_chau', name: 'Lưu Kim Đính Giải Giá Thọ Châu', theme: 'Giải cứu – Phòng thủ', mechanic_description: 'Khi máu thấp → tạo khiên lớn', color_hex: '#EF6C00', sort_order: 5 }
]

export const getTribeByKey = (key) => TRIBES.find((t) => t.key === key)
export const getTribeMap = () => Object.fromEntries(TRIBES.map((t) => [t.key, t]))

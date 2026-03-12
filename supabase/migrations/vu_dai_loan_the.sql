-- Vũ Đại Loạn Thế - Schema and seed
-- Run this after database_system.sql (profiles, auth.users exist)

-- Enums
CREATE TYPE vu_dai_loan_the_mask_color AS ENUM ('red', 'black', 'white', 'blue');
CREATE TYPE vu_dai_loan_the_match_status AS ENUM ('lobby', 'in_progress', 'finished');

-- Tribes (Vở tuồng)
CREATE TABLE public.vu_dai_loan_the_tribes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  theme text,
  mechanic_description text,
  color_hex text NOT NULL DEFAULT '#8B4513',
  music_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT vu_dai_loan_the_tribes_pkey PRIMARY KEY (id)
);

-- Classes (Hệ / Vai diễn)
CREATE TABLE public.vu_dai_loan_the_classes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  role text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT vu_dai_loan_the_classes_pkey PRIMARY KEY (id)
);

-- Champions (30 tướng)
CREATE TABLE public.vu_dai_loan_the_champions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  tribe_id uuid NOT NULL REFERENCES public.vu_dai_loan_the_tribes(id) ON DELETE RESTRICT,
  class_id uuid NOT NULL REFERENCES public.vu_dai_loan_the_classes(id) ON DELETE RESTRICT,
  cost integer NOT NULL CHECK (cost >= 1 AND cost <= 5),
  skill_name text,
  skill_description text,
  base_hp numeric NOT NULL DEFAULT 100,
  base_attack numeric NOT NULL DEFAULT 10,
  base_armor numeric NOT NULL DEFAULT 5,
  base_magic_resist numeric NOT NULL DEFAULT 5,
  default_mask_color vu_dai_loan_the_mask_color NOT NULL DEFAULT 'red',
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT vu_dai_loan_the_champions_pkey PRIMARY KEY (id)
);

-- Matches
CREATE TABLE public.vu_dai_loan_the_matches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  status vu_dai_loan_the_match_status NOT NULL DEFAULT 'lobby',
  winner_user_id uuid REFERENCES auth.users(id),
  settings jsonb DEFAULT '{"max_rounds": 30, "trong_chau_fill_per_round": 15}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT vu_dai_loan_the_matches_pkey PRIMARY KEY (id)
);

-- Match players (8 per match: 1 human + 7 bots for MVP)
-- FK on match_id is created by REFERENCES inline below (do not add duplicate CONSTRAINT)
CREATE TABLE public.vu_dai_loan_the_match_players (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.vu_dai_loan_the_matches(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  is_bot boolean NOT NULL DEFAULT false,
  placement integer,
  hp integer NOT NULL DEFAULT 100,
  gold integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  board_state jsonb DEFAULT '[]'::jsonb,
  bench_state jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT vu_dai_loan_the_match_players_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_vu_dai_loan_the_match_players_match_id ON public.vu_dai_loan_the_match_players(match_id);
CREATE INDEX idx_vu_dai_loan_the_match_players_user_id ON public.vu_dai_loan_the_match_players(user_id);
CREATE INDEX idx_vu_dai_loan_the_champions_tribe_id ON public.vu_dai_loan_the_champions(tribe_id);
CREATE INDEX idx_vu_dai_loan_the_champions_class_id ON public.vu_dai_loan_the_champions(class_id);

-- RLS
ALTER TABLE public.vu_dai_loan_the_tribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vu_dai_loan_the_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vu_dai_loan_the_champions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vu_dai_loan_the_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vu_dai_loan_the_match_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read tribes" ON public.vu_dai_loan_the_tribes FOR SELECT USING (true);
CREATE POLICY "Allow read classes" ON public.vu_dai_loan_the_classes FOR SELECT USING (true);
CREATE POLICY "Allow read champions" ON public.vu_dai_loan_the_champions FOR SELECT USING (true);

CREATE POLICY "Users can read own matches" ON public.vu_dai_loan_the_matches FOR SELECT
  USING (
    id IN (SELECT match_id FROM public.vu_dai_loan_the_match_players WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can insert matches" ON public.vu_dai_loan_the_matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own matches" ON public.vu_dai_loan_the_matches FOR UPDATE
  USING (
    id IN (SELECT match_id FROM public.vu_dai_loan_the_match_players WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can read own match_players" ON public.vu_dai_loan_the_match_players FOR SELECT
  USING (
    match_id IN (SELECT id FROM public.vu_dai_loan_the_matches)
    AND (user_id = auth.uid() OR is_bot = true)
  );
CREATE POLICY "Users can insert match_players" ON public.vu_dai_loan_the_match_players FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update match_players for own match" ON public.vu_dai_loan_the_match_players FOR UPDATE
  USING (
    match_id IN (SELECT match_id FROM public.vu_dai_loan_the_match_players WHERE user_id = auth.uid())
  );

-- ========== SEED: Tribes (5) ==========
INSERT INTO public.vu_dai_loan_the_tribes (key, name, theme, mechanic_description, color_hex, sort_order) VALUES
  ('son_hau', 'Sơn Hậu', 'Trung quân – Chính nghĩa', 'Khi kích hoạt → tạo khiên & hồi máu theo % máu đã mất', '#2E7D32', 1),
  ('tam_nu_do_vuong', 'Tam Nữ Đồ Vương', 'Báo thù – Nữ tướng', 'Khi đồng minh chết → tăng sát thương', '#C62828', 2),
  ('tram_trinh_an', 'Trảm Trịnh Ân', 'Xử gian thần', 'Tăng sát thương chuẩn lên kẻ địch thấp máu', '#1565C0', 3),
  ('tiet_dinh_san_phàn_le_hue', 'Tiết Đinh San Cầu Phàn Lê Huê', 'Tình – Chiến', 'Cặp đôi đứng cạnh nhau → tăng chỉ số', '#6A1B9A', 4),
  ('luu_kim_dinh_giai_gia_tho_chau', 'Lưu Kim Đính Giải Giá Thọ Châu', 'Giải cứu – Phòng thủ', 'Khi máu thấp → tạo khiên lớn', '#EF6C00', 5);

-- ========== SEED: Classes (8) ==========
INSERT INTO public.vu_dai_loan_the_classes (key, name, role, sort_order) VALUES
  ('vo_tuong', 'Võ Tướng', 'Tank/Bruiser', 1),
  ('dao_vo', 'Đào Võ', 'DPS', 2),
  ('van_quan', 'Văn Quan', 'Buff', 3),
  ('trung_than', 'Trung Thần', 'Hồi máu', 4),
  ('ninh_than', 'Nịnh Thần', 'Debuff', 5),
  ('hoang_toc', 'Hoàng Tộc', 'Late game scaling', 6),
  ('sat_thu', 'Sát Thủ', 'Assassin', 7),
  ('phan_tac', 'Phản Tặc', 'Debuff', 8);

-- ========== SEED: Champions (30) - references by tribe/class key, use subqueries ==========
-- Sơn Hậu (6)
INSERT INTO public.vu_dai_loan_the_champions (key, name, tribe_id, class_id, cost, skill_name, skill_description, base_hp, base_attack, base_armor, base_magic_resist, default_mask_color, sort_order)
SELECT 'khương_linh_tá', 'Khương Linh Tá', t.id, c.id, 1, 'Khiêu chiến', 'Ép 1 mục tiêu đánh mình', 650, 45, 35, 20, 'black', 1
FROM vu_dai_loan_the_tribes t, vu_dai_loan_the_classes c WHERE t.key = 'son_hau' AND c.key = 'vo_tuong';
INSERT INTO public.vu_dai_loan_the_champions (key, name, tribe_id, class_id, cost, skill_name, skill_description, base_hp, base_attack, base_armor, base_magic_resist, default_mask_color, sort_order)
SELECT 'tạ_ôn_đình', 'Tạ Ôn Đình', t.id, c.id, 2, 'Hồi máu', 'Hồi máu đồng minh thấp máu nhất', 500, 40, 25, 25, 'white', 2
FROM vu_dai_loan_the_tribes t, vu_dai_loan_the_classes c WHERE t.key = 'son_hau' AND c.key = 'trung_than';
INSERT INTO public.vu_dai_loan_the_champions (key, name, tribe_id, class_id, cost, skill_name, skill_description, base_hp, base_attack, base_armor, base_magic_resist, default_mask_color, sort_order)
SELECT 'đổng_kim_lân', 'Đổng Kim Lân', t.id, c.id, 3, 'Quét thương', 'Quét thương vòng tròn', 700, 55, 30, 20, 'red', 3
FROM vu_dai_loan_the_tribes t, vu_dai_loan_the_classes c WHERE t.key = 'son_hau' AND c.key = 'vo_tuong';
INSERT INTO public.vu_dai_loan_the_champions (key, name, tribe_id, class_id, cost, skill_name, skill_description, base_hp, base_attack, base_armor, base_magic_resist, default_mask_color, sort_order)
SELECT 'triệu_khánh_sanh', 'Triệu Khánh Sanh', t.id, c.id, 3, 'Tăng giáp', 'Tăng giáp + kháng phép toàn đội', 550, 50, 30, 35, 'white', 4
FROM vu_dai_loan_the_tribes t, vu_dai_loan_the_classes c WHERE t.key = 'son_hau' AND c.key = 'van_quan';
INSERT INTO public.vu_dai_loan_the_champions (key, name, tribe_id, class_id, cost, skill_name, skill_description, base_hp, base_attack, base_armor, base_magic_resist, default_mask_color, sort_order)
SELECT 'phò_mã_sơn_hậu', 'Phò Mã Sơn Hậu', t.id, c.id, 4, 'Đâm xuyên giáp', 'Đâm xuyên giáp', 600, 80, 25, 20, 'red', 5
FROM vu_dai_loan_the_tribes t, vu_dai_loan_the_classes c WHERE t.key = 'son_hau' AND c.key = 'hoang_toc';
INSERT INTO public.vu_dai_loan_the_champions (key, name, tribe_id, class_id, cost, skill_name, skill_description, base_hp, base_attack, base_armor, base_magic_resist, default_mask_color, sort_order)
SELECT 'trung_thần_hồn', 'Trung Thần Hồn', t.id, c.id, 5, 'Hồi sinh', 'Hồi sinh 1 tướng đã chết mỗi round', 650, 70, 30, 30, 'white', 6
FROM vu_dai_loan_the_tribes t, vu_dai_loan_the_classes c WHERE t.key = 'son_hau' AND c.key = 'trung_than';

-- Tam Nữ Đồ Vương (6)
INSERT INTO public.vu_dai_loan_the_champions (key, name, tribe_id, class_id, cost, skill_name, skill_description, base_hp, base_attack, base_armor, base_magic_resist, default_mask_color, sort_order)
SELECT 'lệ_hoa', 'Lệ Hoa', t.id, c.id, 1, 'DPS', 'Sát thương cao', 450, 55, 20, 20, 'red', 7
FROM vu_dai_loan_the_tribes t, vu_dai_loan_the_classes c WHERE t.key = 'tam_nu_do_vuong' AND c.key = 'dao_vo';
INSERT INTO public.vu_dai_loan_the_champions (key, name, tribe_id, class_id, cost, skill_name, skill_description, base_hp, base_attack, base_armor, base_magic_resist, default_mask_color, sort_order)
SELECT 'hồng_liên', 'Hồng Liên', t.id, c.id, 2, 'Nhảy sau lưng', 'Nhảy sau lưng địch', 400, 60, 15, 15, 'blue', 8
FROM vu_dai_loan_the_tribes t, vu_dai_loan_the_classes c WHERE t.key = 'tam_nu_do_vuong' AND c.key = 'sat_thu';
INSERT INTO public.vu_dai_loan_the_champions (key, name, tribe_id, class_id, cost, skill_name, skill_description, base_hp, base_attack, base_armor, base_magic_resist, default_mask_color, sort_order)
SELECT 'thanh_nguyệt', 'Thanh Nguyệt', t.id, c.id, 2, 'Tốc đánh', 'Tốc đánh cao', 420, 58, 18, 18, 'red', 9
FROM vu_dai_loan_the_tribes t, vu_dai_loan_the_classes c WHERE t.key = 'tam_nu_do_vuong' AND c.key = 'dao_vo';
INSERT INTO public.vu_dai_loan_the_champions (key, name, tribe_id, class_id, cost, skill_name, skill_description, base_hp, base_attack, base_armor, base_magic_resist, default_mask_color, sort_order)
SELECT 'bạch_lan', 'Bạch Lan', t.id, c.id, 3, 'Giảm giáp', 'Debuff giảm giáp', 480, 52, 22, 25, 'white', 10
FROM vu_dai_loan_the_tribes t, vu_dai_loan_the_classes c WHERE t.key = 'tam_nu_do_vuong' AND c.key = 'phan_tac';
INSERT INTO public.vu_dai_loan_the_champions (key, name, tribe_id, class_id, cost, skill_name, skill_description, base_hp, base_attack, base_armor, base_magic_resist, default_mask_color, sort_order)
SELECT 'hắc_mai', 'Hắc Mai', t.id, c.id, 4, 'Chí mạng', 'Carry chí mạng', 500, 85, 20, 20, 'blue', 11
FROM vu_dai_loan_the_tribes t, vu_dai_loan_the_classes c WHERE t.key = 'tam_nu_do_vuong' AND c.key = 'sat_thu';
INSERT INTO public.vu_dai_loan_the_champions (key, name, tribe_id, class_id, cost, skill_name, skill_description, base_hp, base_attack, base_armor, base_magic_resist, default_mask_color, sort_order)
SELECT 'tam_nữ_thống_soái', 'Tam Nữ Thống Soái', t.id, c.id, 5, 'Hyper Carry', 'Khi còn 1 mình → tăng 200% tốc đánh', 600, 90, 25, 25, 'red', 12
FROM vu_dai_loan_the_tribes t, vu_dai_loan_the_classes c WHERE t.key = 'tam_nu_do_vuong' AND c.key = 'hoang_toc';

-- Trảm Trịnh Ân (6)
INSERT INTO public.vu_dai_loan_the_champions (key, name, tribe_id, class_id, cost, skill_name, skill_description, base_hp, base_attack, base_armor, base_magic_resist, default_mask_color, sort_order)
SELECT 'trịnh_ân', 'Trịnh Ân', t.id, c.id, 1, 'Debuff', 'Gây debuff', 400, 48, 18, 22, 'white', 13
FROM vu_dai_loan_the_tribes t, vu_dai_loan_the_classes c WHERE t.key = 'tram_trinh_an' AND c.key = 'ninh_than';
INSERT INTO public.vu_dai_loan_the_champions (key, name, tribe_id, class_id, cost, skill_name, skill_description, base_hp, base_attack, base_armor, base_magic_resist, default_mask_color, sort_order)
SELECT 'bao_công_việt', 'Bao Công Việt', t.id, c.id, 2, 'Choáng', 'Khống chế Choáng', 550, 45, 28, 25, 'white', 14
FROM vu_dai_loan_the_tribes t, vu_dai_loan_the_classes c WHERE t.key = 'tram_trinh_an' AND c.key = 'van_quan';
INSERT INTO public.vu_dai_loan_the_champions (key, name, tribe_id, class_id, cost, skill_name, skill_description, base_hp, base_attack, base_armor, base_magic_resist, default_mask_color, sort_order)
SELECT 'lý_tướng', 'Lý Tướng', t.id, c.id, 2, 'Tank', 'Chịu đòn', 700, 40, 40, 25, 'black', 15
FROM vu_dai_loan_the_tribes t, vu_dai_loan_the_classes c WHERE t.key = 'tram_trinh_an' AND c.key = 'vo_tuong';
INSERT INTO public.vu_dai_loan_the_champions (key, name, tribe_id, class_id, cost, skill_name, skill_description, base_hp, base_attack, base_armor, base_magic_resist, default_mask_color, sort_order)
SELECT 'hình_quan', 'Hình Quan', t.id, c.id, 3, 'Trừ tà', 'Gây sát thương chuẩn', 520, 65, 25, 25, 'red', 16
FROM vu_dai_loan_the_tribes t, vu_dai_loan_the_classes c WHERE t.key = 'tram_trinh_an' AND c.key = 'trung_than';
INSERT INTO public.vu_dai_loan_the_champions (key, name, tribe_id, class_id, cost, skill_name, skill_description, base_hp, base_attack, base_armor, base_magic_resist, default_mask_color, sort_order)
SELECT 'pháp_trảm', 'Pháp Trảm', t.id, c.id, 4, 'Chém diện rộng', 'Sát thương diện rộng', 650, 75, 30, 20, 'red', 17
FROM vu_dai_loan_the_tribes t, vu_dai_loan_the_classes c WHERE t.key = 'tram_trinh_an' AND c.key = 'vo_tuong';
INSERT INTO public.vu_dai_loan_the_champions (key, name, tribe_id, class_id, cost, skill_name, skill_description, base_hp, base_attack, base_armor, base_magic_resist, default_mask_color, sort_order)
SELECT 'thiên_lý_kiếm', 'Thiên Lý Kiếm', t.id, c.id, 5, 'Carry chuẩn', 'Đòn đánh gây thêm sát thương chuẩn theo % máu', 600, 95, 28, 28, 'red', 18
FROM vu_dai_loan_the_tribes t, vu_dai_loan_the_classes c WHERE t.key = 'tram_trinh_an' AND c.key = 'hoang_toc';

-- Tiết Đinh San Cầu Phàn Lê Huê (6)
INSERT INTO public.vu_dai_loan_the_champions (key, name, tribe_id, class_id, cost, skill_name, skill_description, base_hp, base_attack, base_armor, base_magic_resist, default_mask_color, sort_order)
SELECT 'tiết_đinh_san', 'Tiết Đinh San', t.id, c.id, 2, 'Đấu sĩ', 'Chiến đấu cận chiến', 620, 55, 32, 20, 'red', 19
FROM vu_dai_loan_the_tribes t, vu_dai_loan_the_classes c WHERE t.key = 'tiet_dinh_san_phàn_le_hue' AND c.key = 'vo_tuong';
INSERT INTO public.vu_dai_loan_the_champions (key, name, tribe_id, class_id, cost, skill_name, skill_description, base_hp, base_attack, base_armor, base_magic_resist, default_mask_color, sort_order)
SELECT 'phàn_lê_huê', 'Phàn Lê Huê', t.id, c.id, 3, 'DPS phép', 'Sát thương phép', 480, 70, 20, 30, 'red', 20
FROM vu_dai_loan_the_tribes t, vu_dai_loan_the_classes c WHERE t.key = 'tiet_dinh_san_phàn_le_hue' AND c.key = 'dao_vo';
INSERT INTO public.vu_dai_loan_the_champions (key, name, tribe_id, class_id, cost, skill_name, skill_description, base_hp, base_attack, base_armor, base_magic_resist, default_mask_color, sort_order)
SELECT 'nữ_tướng_phàn', 'Nữ Tướng Phàn', t.id, c.id, 1, 'Đào Võ', 'DPS', 430, 50, 18, 18, 'red', 21
FROM vu_dai_loan_the_tribes t, vu_dai_loan_the_classes c WHERE t.key = 'tiet_dinh_san_phàn_le_hue' AND c.key = 'dao_vo';
INSERT INTO public.vu_dai_loan_the_champions (key, name, tribe_id, class_id, cost, skill_name, skill_description, base_hp, base_attack, base_armor, base_magic_resist, default_mask_color, sort_order)
SELECT 'chiến_binh_tây_lương', 'Chiến Binh Tây Lương', t.id, c.id, 2, 'Võ Tướng', 'Tank', 650, 48, 35, 22, 'black', 22
FROM vu_dai_loan_the_tribes t, vu_dai_loan_the_classes c WHERE t.key = 'tiet_dinh_san_phàn_le_hue' AND c.key = 'vo_tuong';
INSERT INTO public.vu_dai_loan_the_champions (key, name, tribe_id, class_id, cost, skill_name, skill_description, base_hp, base_attack, base_armor, base_magic_resist, default_mask_color, sort_order)
SELECT 'lưỡng_kiếm_song_hành', 'Lưỡng Kiếm Song Hành', t.id, c.id, 4, 'Đánh hai mục tiêu', 'Đánh hai mục tiêu', 550, 78, 25, 25, 'blue', 23
FROM vu_dai_loan_the_tribes t, vu_dai_loan_the_classes c WHERE t.key = 'tiet_dinh_san_phàn_le_hue' AND c.key = 'sat_thu';
INSERT INTO public.vu_dai_loan_the_champions (key, name, tribe_id, class_id, cost, skill_name, skill_description, base_hp, base_attack, base_armor, base_magic_resist, default_mask_color, sort_order)
SELECT 'uyên_ương_chiến_thần', 'Uyên Ương Chiến Thần', t.id, c.id, 5, 'Liên kết', 'Liên kết 2 tướng → chia sẻ sát thương', 650, 72, 30, 30, 'white', 24
FROM vu_dai_loan_the_tribes t, vu_dai_loan_the_classes c WHERE t.key = 'tiet_dinh_san_phàn_le_hue' AND c.key = 'hoang_toc';

-- Lưu Kim Đính Giải Giá Thọ Châu (6)
INSERT INTO public.vu_dai_loan_the_champions (key, name, tribe_id, class_id, cost, skill_name, skill_description, base_hp, base_attack, base_armor, base_magic_resist, default_mask_color, sort_order)
SELECT 'lưu_kim_đính', 'Lưu Kim Đính', t.id, c.id, 3, 'DPS chính', 'Sát thương chính', 520, 68, 24, 26, 'red', 25
FROM vu_dai_loan_the_tribes t, vu_dai_loan_the_classes c WHERE t.key = 'luu_kim_dinh_giai_gia_tho_chau' AND c.key = 'dao_vo';
INSERT INTO public.vu_dai_loan_the_champions (key, name, tribe_id, class_id, cost, skill_name, skill_description, base_hp, base_attack, base_armor, base_magic_resist, default_mask_color, sort_order)
SELECT 'thọ_châu_tướng', 'Thọ Châu Tướng', t.id, c.id, 1, 'Tank', 'Chịu đòn', 680, 42, 38, 22, 'black', 26
FROM vu_dai_loan_the_tribes t, vu_dai_loan_the_classes c WHERE t.key = 'luu_kim_dinh_giai_gia_tho_chau' AND c.key = 'vo_tuong';
INSERT INTO public.vu_dai_loan_the_champions (key, name, tribe_id, class_id, cost, skill_name, skill_description, base_hp, base_attack, base_armor, base_magic_resist, default_mask_color, sort_order)
SELECT 'cấm_quân', 'Cấm Quân', t.id, c.id, 2, 'Chống chịu', 'Tank Hoàng Tộc', 660, 45, 36, 24, 'black', 27
FROM vu_dai_loan_the_tribes t, vu_dai_loan_the_classes c WHERE t.key = 'luu_kim_dinh_giai_gia_tho_chau' AND c.key = 'hoang_toc';
INSERT INTO public.vu_dai_loan_the_champions (key, name, tribe_id, class_id, cost, skill_name, skill_description, base_hp, base_attack, base_armor, base_magic_resist, default_mask_color, sort_order)
SELECT 'hộ_giá_trung_thần', 'Hộ Giá Trung Thần', t.id, c.id, 2, 'Buff khiên', 'Tạo khiên đồng minh', 500, 44, 28, 28, 'white', 28
FROM vu_dai_loan_the_tribes t, vu_dai_loan_the_classes c WHERE t.key = 'luu_kim_dinh_giai_gia_tho_chau' AND c.key = 'trung_than';
INSERT INTO public.vu_dai_loan_the_champions (key, name, tribe_id, class_id, cost, skill_name, skill_description, base_hp, base_attack, base_armor, base_magic_resist, default_mask_color, sort_order)
SELECT 'thành_chủ_thọ_châu', 'Thành Chủ Thọ Châu', t.id, c.id, 4, 'Buff diện rộng', 'Buff toàn đội', 560, 60, 28, 30, 'white', 29
FROM vu_dai_loan_the_tribes t, vu_dai_loan_the_classes c WHERE t.key = 'luu_kim_dinh_giai_gia_tho_chau' AND c.key = 'van_quan';
INSERT INTO public.vu_dai_loan_the_champions (key, name, tribe_id, class_id, cost, skill_name, skill_description, base_hp, base_attack, base_armor, base_magic_resist, default_mask_color, sort_order)
SELECT 'kim_đính_đại_tướng', 'Kim Đính Đại Tướng', t.id, c.id, 5, 'Miễn nhiễm', 'Khi còn dưới 30% HP → miễn nhiễm 3 giây', 750, 70, 35, 30, 'black', 30
FROM vu_dai_loan_the_tribes t, vu_dai_loan_the_classes c WHERE t.key = 'luu_kim_dinh_giai_gia_tho_chau' AND c.key = 'hoang_toc';

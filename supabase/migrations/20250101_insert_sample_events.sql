-- Insert 5 sample events into the events table
-- This script automatically gets theater_id and venue_id from your database
-- If theaters or venues table is empty, you need to create them first
-- See docs/HUONG_DAN_INSERT_EVENTS.md for detailed instructions

-- Check if we have theaters and venues
DO $$
DECLARE
  v_theater_id uuid;
  v_venue_id uuid;
  v_theater_count integer;
  v_venue_count integer;
BEGIN
  -- Check if theaters exist
  SELECT COUNT(*) INTO v_theater_count FROM theaters;
  IF v_theater_count = 0 THEN
    RAISE EXCEPTION 'No theaters found. Please create at least one theater first.';
  END IF;
  
  -- Check if venues exist
  SELECT COUNT(*) INTO v_venue_count FROM venues;
  IF v_venue_count = 0 THEN
    RAISE WARNING 'No venues found. Events will be created with venue_id = NULL.';
  END IF;
  
  -- Get first theater_id
  SELECT id INTO v_theater_id FROM theaters LIMIT 1;
  
  -- Get first venue_id (if exists)
  SELECT id INTO v_venue_id FROM venues LIMIT 1;
  
  RAISE NOTICE 'Using theater_id: %', v_theater_id;
  IF v_venue_id IS NOT NULL THEN
    RAISE NOTICE 'Using venue_id: %', v_venue_id;
  ELSE
    RAISE NOTICE 'No venue_id (will be NULL)';
  END IF;
END $$;

-- Event 1: Workshop Vẽ Mặt Nạ Tuồng
INSERT INTO public.events (
  theater_id,
  venue_id,
  type,
  title,
  description,
  thumbnail_url,
  event_date,
  duration,
  max_participants,
  current_participants,
  price,
  instructor,
  requirements,
  includes,
  tags,
  status
) VALUES (
  (SELECT id FROM theaters LIMIT 1),
  (SELECT id FROM venues LIMIT 1),
  'workshop',
  'Workshop Vẽ Mặt Nạ Tuồng',
  'Học cách vẽ mặt nạ Tuồng truyền thống với nghệ sĩ chuyên nghiệp. Bạn sẽ được hướng dẫn từng bước để tạo ra chiếc mặt nạ của riêng mình.',
  '/characters/nv đào.png',
  '2026-03-20 10:00:00+07',
  180,
  20,
  12,
  500000,
  'Nghệ sĩ Nguyễn Văn A',
  ARRAY['Không yêu cầu kinh nghiệm', 'Vật liệu đã được chuẩn bị sẵn'],
  ARRAY['Mặt nạ trắng', 'Màu vẽ chuyên dụng', 'Tài liệu hướng dẫn', 'Chứng nhận tham gia'],
  ARRAY['vẽ mặt nạ', 'thủ công', 'nghệ thuật'],
  'scheduled'
);

-- Event 2: Workshop Hóa Trang Cơ Bản Tuồng
INSERT INTO public.events (
  theater_id,
  venue_id,
  type,
  title,
  description,
  thumbnail_url,
  event_date,
  duration,
  max_participants,
  current_participants,
  price,
  instructor,
  requirements,
  includes,
  tags,
  status
) VALUES (
  (SELECT id FROM theaters LIMIT 1),
  (SELECT id FROM venues LIMIT 1),
  'workshop',
  'Workshop Hóa Trang Cơ Bản Tuồng',
  'Khám phá nghệ thuật hóa trang Tuồng. Học các kỹ thuật cơ bản để tạo ra các nhân vật Tuồng cổ điển.',
  '/characters/nv kép.png',
  '2026-03-22 14:00:00+07',
  120,
  15,
  8,
  400000,
  'Nghệ sĩ Trần Thị B',
  ARRAY['Không yêu cầu kinh nghiệm', 'Mang theo gương nhỏ'],
  ARRAY['Bộ dụng cụ hóa trang', 'Màu sơn chuyên dụng', 'Tài liệu', 'Chứng nhận'],
  ARRAY['hóa trang', 'makeup', 'nghệ thuật'],
  'scheduled'
);

-- Event 3: Tour Backstage - Khám Phá Hậu Trường
INSERT INTO public.events (
  theater_id,
  venue_id,
  type,
  title,
  description,
  thumbnail_url,
  event_date,
  duration,
  max_participants,
  current_participants,
  price,
  guide,
  requirements,
  includes,
  tags,
  status
) VALUES (
  (SELECT id FROM theaters LIMIT 1),
  (SELECT id FROM venues LIMIT 1),
  'tour',
  'Tour Backstage - Khám Phá Hậu Trường',
  'Tham quan hậu trường nhà hát, xem cách chuẩn bị cho một buổi diễn Tuồng. Gặp gỡ đội ngũ kỹ thuật và nghệ sĩ.',
  '/characters/nv lão.png',
  '2026-03-18 09:00:00+07',
  90,
  25,
  18,
  300000,
  'Nghệ sĩ Lê Văn C',
  ARRAY['Đi giày đế bằng', 'Không chụp ảnh trong khu vực cấm'],
  ARRAY['Hướng dẫn viên chuyên nghiệp', 'Tham quan phòng trang phục', 'Gặp gỡ nghệ sĩ', 'Quà lưu niệm'],
  ARRAY['backstage', 'thăm quan', 'hậu trường'],
  'scheduled'
);

-- Event 4: Tour Backstage - Đà Nẵng
INSERT INTO public.events (
  theater_id,
  venue_id,
  type,
  title,
  description,
  thumbnail_url,
  event_date,
  duration,
  max_participants,
  current_participants,
  price,
  guide,
  requirements,
  includes,
  tags,
  status
) VALUES (
  (SELECT id FROM theaters LIMIT 1),
  (SELECT id FROM venues LIMIT 1),
  'tour',
  'Tour Backstage - Đà Nẵng',
  'Khám phá hậu trường tại Đà Nẵng, tìm hiểu về quy trình sản xuất và chuẩn bị cho các vở diễn.',
  '/characters/nv mụ.png',
  '2026-03-25 10:00:00+07',
  90,
  30,
  15,
  250000,
  'Nghệ sĩ Phạm Thị D',
  ARRAY['Đi giày đế bằng'],
  ARRAY['Hướng dẫn viên', 'Tham quan studio', 'Quà lưu niệm'],
  ARRAY['backstage', 'thăm quan', 'đà nẵng'],
  'scheduled'
);

-- Event 5: Gặp Gỡ Nghệ Sĩ - Buổi Trò Chuyện Đặc Biệt
INSERT INTO public.events (
  theater_id,
  venue_id,
  type,
  title,
  description,
  thumbnail_url,
  event_date,
  duration,
  max_participants,
  current_participants,
  price,
  artists,
  requirements,
  includes,
  tags,
  status
) VALUES (
  (SELECT id FROM theaters LIMIT 1),
  (SELECT id FROM venues LIMIT 1),
  'meet_artist',
  'Gặp Gỡ Nghệ Sĩ - Buổi Trò Chuyện Đặc Biệt',
  'Gặp gỡ và trò chuyện với các nghệ sĩ Tuồng nổi tiếng. Tìm hiểu về cuộc sống và sự nghiệp của họ.',
  '/characters/nv nịnh.png',
  '2026-03-21 19:00:00+07',
  120,
  50,
  35,
  200000,
  ARRAY['Nghệ sĩ Nguyễn Văn A', 'Nghệ sĩ Trần Thị B', 'Nghệ sĩ Lê Văn C'],
  ARRAY['Đăng ký trước', 'Không quá 2 câu hỏi/người'],
  ARRAY['Buổi trò chuyện', 'Chụp ảnh với nghệ sĩ', 'Ký tặng', 'Đồ uống nhẹ'],
  ARRAY['gặp gỡ', 'trò chuyện', 'nghệ sĩ'],
  'scheduled'
);

-- Verify the inserts
SELECT 
  id,
  type,
  title,
  max_participants,
  current_participants,
  (max_participants - current_participants) as available_slots,
  price,
  event_date,
  status
FROM public.events
ORDER BY event_date;

-- Create sample theater and venue if they don't exist
-- Run this BEFORE running 20250101_insert_sample_events.sql

-- Create a sample theater (if none exists)
INSERT INTO public.theaters (
  owner_id,
  name,
  description,
  address,
  city,
  phone,
  email,
  status
)
SELECT 
  (SELECT id FROM profiles LIMIT 1), -- Use first profile as owner
  'Nhà hát Tuồng Truyền Thống',
  'Nhà hát chuyên về nghệ thuật Tuồng cổ truyền',
  '123 Đường Văn Hóa',
  'Hà Nội',
  '+84901234567',
  'theater@example.com',
  'approved'
WHERE NOT EXISTS (
  SELECT 1 FROM theaters LIMIT 1
)
RETURNING id, name;

-- Create a sample venue (if none exists)
INSERT INTO public.venues (
  theater_id,
  name,
  address,
  city,
  capacity,
  description
)
SELECT 
  (SELECT id FROM theaters LIMIT 1), -- Use first theater
  'Sân khấu chính',
  '123 Đường Văn Hóa',
  'Hà Nội',
  100,
  'Sân khấu chính của nhà hát với sức chứa 100 chỗ ngồi'
WHERE NOT EXISTS (
  SELECT 1 FROM venues LIMIT 1
)
RETURNING id, name;

-- Verify
SELECT 
  'Theaters' as table_name,
  COUNT(*) as count
FROM theaters
UNION ALL
SELECT 
  'Venues' as table_name,
  COUNT(*) as count
FROM venues;

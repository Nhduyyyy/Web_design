# Hướng Dẫn Insert Events vào Supabase

## 📋 Tổng Quan

Hướng dẫn này giúp bạn insert 5 sample events vào bảng `events` trong Supabase. 

**QUAN TRỌNG**: Bạn phải có ít nhất 1 theater trong database trước khi insert events.

---

## 🚀 Cách Nhanh Nhất (Khuyến nghị)

### Bước 1: Tạo Theater và Venue

1. Mở **Supabase Dashboard** → **SQL Editor**
2. Copy toàn bộ nội dung file: `supabase/migrations/20250101_create_sample_theater_venue.sql`
3. Paste và chạy trong SQL Editor
4. Script sẽ tự động tạo theater và venue nếu chưa có

### Bước 2: Insert 5 Events

1. Vẫn trong **SQL Editor**
2. Copy toàn bộ nội dung file: `supabase/migrations/20250101_insert_sample_events.sql`
3. Paste và chạy
4. Script sẽ:
   - ✅ Kiểm tra xem có theater/venue chưa
   - ✅ Tự động lấy `theater_id` và `venue_id`
   - ✅ Insert 5 events
   - ✅ Hiển thị kết quả verify

### Bước 3: Verify

Sau khi chạy, bạn sẽ thấy bảng kết quả với:
- `max_participants`: Số chỗ tối đa (20, 15, 25, 30, 50)
- `current_participants`: Số người đã đăng ký (12, 8, 18, 15, 35)
- `available_slots`: Số chỗ còn trống (8, 7, 7, 15, 15)

---

## 📝 Chi Tiết Các Events

### Event 1: Workshop Vẽ Mặt Nạ Tuồng
- **Type**: `workshop`
- **Max**: 20 người
- **Current**: 12 người
- **Available**: 8 chỗ
- **Price**: 500,000 VND
- **Date**: 2026-03-20 10:00

### Event 2: Workshop Hóa Trang Cơ Bản Tuồng
- **Type**: `workshop`
- **Max**: 15 người
- **Current**: 8 người
- **Available**: 7 chỗ
- **Price**: 400,000 VND
- **Date**: 2026-03-22 14:00

### Event 3: Tour Backstage - Khám Phá Hậu Trường
- **Type**: `tour`
- **Max**: 25 người
- **Current**: 18 người
- **Available**: 7 chỗ
- **Price**: 300,000 VND
- **Date**: 2026-03-18 09:00

### Event 4: Tour Backstage - Đà Nẵng
- **Type**: `tour`
- **Max**: 30 người
- **Current**: 15 người
- **Available**: 15 chỗ
- **Price**: 250,000 VND
- **Date**: 2026-03-25 10:00

### Event 5: Gặp Gỡ Nghệ Sĩ - Buổi Trò Chuyện Đặc Biệt
- **Type**: `meet_artist`
- **Max**: 50 người
- **Current**: 35 người
- **Available**: 15 chỗ
- **Price**: 200,000 VND
- **Date**: 2026-03-21 19:00

---

## 🔧 Tạo Theater/Venue Thủ Công (Nếu cần)

Nếu script tự động không hoạt động, bạn có thể tạo thủ công:

### Tạo Theater:
```sql
INSERT INTO public.theaters (
  owner_id,
  name,
  description,
  address,
  city,
  phone,
  email,
  status
) VALUES (
  (SELECT id FROM profiles LIMIT 1), -- Sử dụng profile đầu tiên
  'Nhà hát Tuồng Truyền Thống',
  'Nhà hát chuyên về nghệ thuật Tuồng cổ truyền',
  '123 Đường Văn Hóa',
  'Hà Nội',
  '+84901234567',
  'theater@example.com',
  'approved'
) RETURNING id, name;
```

### Tạo Venue:
```sql
INSERT INTO public.venues (
  theater_id,
  name,
  address,
  city,
  capacity,
  description
) VALUES (
  (SELECT id FROM theaters LIMIT 1), -- Sử dụng theater vừa tạo
  'Sân khấu chính',
  '123 Đường Văn Hóa',
  'Hà Nội',
  100,
  'Sân khấu chính của nhà hát'
) RETURNING id, name;
```

---

## ✅ Verify Sau Khi Insert

Chạy query này để kiểm tra:

```sql
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
```

**Kết quả mong đợi**:
- Tất cả events có `available_slots > 0`
- `max_participants` và `current_participants` có giá trị hợp lệ
- `status = 'scheduled'`

---

## ⚠️ Lưu Ý Quan Trọng

### 1. Event Types (Enum)
Phải là một trong các giá trị:
- `'workshop'`
- `'tour'`
- `'meet_artist'` (không phải `'meet-artist'`)

### 2. Status (Enum)
Phải là một trong các giá trị:
- `'scheduled'`
- `'ongoing'`
- `'completed'`
- `'cancelled'`

### 3. Arrays Syntax
Các field như `requirements`, `includes`, `tags`, `artists` phải dùng:
```sql
ARRAY['item1', 'item2', 'item3']
```

### 4. Foreign Keys
- `theater_id` **BẮT BUỘC** phải tồn tại trong bảng `theaters`
- `venue_id` có thể `NULL` hoặc phải tồn tại trong bảng `venues`

### 5. Required Fields
Các field bắt buộc:
- `theater_id` (uuid, NOT NULL)
- `type` (event_type, NOT NULL)
- `title` (text, NOT NULL)
- `event_date` (timestamp, NOT NULL)
- `max_participants` (integer, NOT NULL)
- `price` (integer, NOT NULL)

---

## 🐛 Troubleshooting

### Lỗi: "No theaters found"
**Nguyên nhân**: Bảng `theaters` trống  
**Giải pháp**: Chạy `20250101_create_sample_theater_venue.sql` trước

### Lỗi: "violates foreign key constraint"
**Nguyên nhân**: `theater_id` hoặc `venue_id` không tồn tại  
**Giải pháp**: 
- Kiểm tra xem có theater/venue trong database không
- Tạo theater/venue trước khi insert events

### Lỗi: "invalid input value for enum event_type"
**Nguyên nhân**: Giá trị `type` không đúng  
**Giải pháp**: 
- Dùng `'workshop'`, `'tour'`, hoặc `'meet_artist'`
- Không dùng `'meet-artist'` (có dấu gạch ngang)

### Events vẫn hiển thị "0 chỗ trống" sau khi insert
**Nguyên nhân**: 
- `max_participants = 0` hoặc `current_participants = max_participants`
- Frontend không đọc đúng field names

**Giải pháp**:
1. Kiểm tra data trong Supabase:
   ```sql
   SELECT id, title, max_participants, current_participants 
   FROM events;
   ```
2. Nếu data đúng, kiểm tra frontend có đọc đúng field không
3. Xem console logs trong browser để debug

---

## 📁 Files Đã Tạo

1. **`supabase/migrations/20250101_create_sample_theater_venue.sql`**
   - Tạo theater và venue mẫu

2. **`supabase/migrations/20250101_insert_sample_events.sql`**
   - Insert 5 events mẫu

3. **`docs/HUONG_DAN_INSERT_EVENTS.md`**
   - Hướng dẫn chi tiết (file này)

---

## 🎯 Next Steps

Sau khi insert thành công:

1. ✅ Refresh trang web
2. ✅ Kiểm tra events hiển thị đúng số chỗ trống
3. ✅ Test booking flow với dữ liệu thật
4. ✅ Nếu cần, thêm nhiều events hơn bằng cách copy/paste và sửa các giá trị

---

**Ngày tạo**: 2025-01-01  
**Phiên bản**: 1.0

# Fix Seat Type Enum Issue

## Vấn đề
Code đang sử dụng các loại ghế: `standard`, `vip`, `couple`, `wheelchair`, `aisle`, `stage`
Nhưng database enum `seat_type` không có đầy đủ các giá trị này.

## Giải pháp tạm thời (Đã áp dụng)
Trong `hallService.js`, đã thêm function `mapSeatType()` để map các giá trị không hợp lệ:
- `couple` → `vip` (tạm thời)
- `aisle` → `standard`
- `stage` → `standard`

## Giải pháp vĩnh viễn

### Bước 1: Kiểm tra enum hiện tại
Chạy trong Supabase SQL Editor:
```sql
SELECT enum_range(NULL::seat_type);
```

### Bước 2: Thêm các giá trị còn thiếu
Chạy trong Supabase SQL Editor:
```sql
-- Thêm 'couple' nếu chưa có
ALTER TYPE seat_type ADD VALUE IF NOT EXISTS 'couple';

-- Thêm 'aisle' nếu chưa có
ALTER TYPE seat_type ADD VALUE IF NOT EXISTS 'aisle';

-- Thêm 'stage' nếu chưa có
ALTER TYPE seat_type ADD VALUE IF NOT EXISTS 'stage';
```

### Bước 3: Xóa mapping tạm thời
Sau khi đã thêm enum vào database, xóa hoặc comment function `mapSeatType()` trong `hallService.js` và đổi lại:
```javascript
seat_type: seat.type,  // Không cần map nữa
```

## Lưu ý
- PostgreSQL enum không thể xóa giá trị sau khi đã thêm
- Nếu cần xóa giá trị enum, phải tạo lại enum hoàn toàn
- Đảm bảo không có dữ liệu đang sử dụng giá trị cũ trước khi thay đổi enum

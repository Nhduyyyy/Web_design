# Hướng Dẫn Tạo Storage Bucket cho Avatar

## Vấn đề
Khi upload avatar, có thể gặp lỗi "Bucket not found" hoặc "Permission denied". Điều này xảy ra khi bucket `avatars` chưa được tạo trong Supabase Storage.

## Giải pháp

### Bước 1: Tạo Storage Bucket

1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **Storage** (menu bên trái)
4. Click **New bucket**
5. Điền thông tin:
   - **Name**: `avatars`
   - **Public bucket**: ✅ Bật (để có thể lấy public URL)
   - **File size limit**: 5 MB (hoặc tùy chọn)
   - **Allowed MIME types**: `image/*` (hoặc để trống cho tất cả)
6. Click **Create bucket**

### Bước 2: Cấu hình Storage Policies (RLS)

Sau khi tạo bucket, cần set up policies để user có thể upload và đọc file:

1. Vào **Storage** → **Policies** (tab Policies)
2. Chọn bucket `avatars`
3. Click **New Policy**

#### Policy 1: Cho phép user upload avatar của chính họ

```sql
-- Policy name: Users can upload their own avatar
-- Operation: INSERT

(
  bucket_id = 'avatars'::text
) AND (
  (storage.foldername(name))[1] = auth.uid()::text
  OR 
  (storage.foldername(name))[1] LIKE auth.uid()::text || '-%'
)
```

Hoặc đơn giản hơn, cho phép authenticated users upload:

```sql
-- Policy name: Authenticated users can upload avatars
-- Operation: INSERT

auth.role() = 'authenticated'
```

#### Policy 2: Cho phép mọi người đọc avatar (public)

```sql
-- Policy name: Public read access
-- Operation: SELECT

true
```

### Bước 3: Kiểm tra

Sau khi tạo bucket và policies:

1. Thử upload avatar từ Profile page
2. Kiểm tra console log để xem có lỗi không
3. Nếu thành công, avatar sẽ hiển thị trong profile

## Troubleshooting

### Lỗi "Bucket not found"
- ✅ Đảm bảo bucket name là `avatars` (chính xác, không có khoảng trắng)
- ✅ Kiểm tra bạn đang ở đúng project

### Lỗi "Permission denied"
- ✅ Kiểm tra Storage Policies đã được tạo chưa
- ✅ Đảm bảo user đã đăng nhập (authenticated)
- ✅ Kiểm tra policy conditions có đúng không

### Avatar không hiển thị sau khi upload
- ✅ Kiểm tra bucket có public không
- ✅ Kiểm tra URL trong database có đúng không
- ✅ Kiểm tra CORS settings nếu cần

## Alternative: Sử dụng folder structure

Nếu muốn tổ chức file theo user ID, có thể thay đổi file path trong `authService.js`:

```javascript
const filePath = `${userId}/${fileName}` // Thay vì chỉ fileName
```

Nhưng cần đảm bảo policy cho phép access theo folder structure.

# Hướng dẫn Fix Lỗi Authentication

## Lỗi hiện tại

### 1. "Infinite recursion detected in policy for relation 'profiles'"

**Nguyên nhân**: RLS policy có vòng lặp vô hạn khi kiểm tra role admin.

**Giải pháp**: Chạy file `supabase/fix_rls_policies.sql` trong Supabase SQL Editor.

### 2. "Failed to load resource: the server responded with a status of 500"

**Nguyên nhân**: Lỗi RLS policy gây ra lỗi server.

**Giải pháp**: Fix RLS policies như trên.

## Các bước fix chi tiết

### Bước 1: Xóa database cũ (nếu cần)

Nếu database đã có dữ liệu test và bị lỗi, tốt nhất là xóa và tạo lại:

1. Vào Supabase Dashboard
2. Settings → Database → Reset Database
3. Confirm reset

### Bước 2: Chạy schema mới

1. Vào SQL Editor
2. Copy toàn bộ nội dung file `supabase/schema.sql` (đã được fix)
3. Paste và Run
4. Kiểm tra không có lỗi

### Bước 3: Chạy fix RLS policies

1. Vào SQL Editor
2. Copy toàn bộ nội dung file `supabase/fix_rls_policies.sql`
3. Paste và Run
4. Kiểm tra không có lỗi

### Bước 4: Chạy profile trigger

1. Vào SQL Editor
2. Copy toàn bộ nội dung file `supabase/create_profile_trigger.sql`
3. Paste và Run
4. Kiểm tra không có lỗi

### Bước 5: Test authentication

1. Mở browser console (F12)
2. Vào trang Register
3. Điền thông tin và đăng ký
4. Kiểm tra console logs:
   - `🚀 Starting registration...`
   - `✅ Registration successful:`
5. Nếu có lỗi, xem chi tiết trong console

## Debug trong Console

### Kiểm tra Supabase connection

```javascript
// Paste vào browser console
import { supabase } from './src/lib/supabase'

// Test connection
const { data, error } = await supabase.from('profiles').select('count').limit(1)
console.log('Connection:', error ? 'Failed' : 'Success')
```

### Kiểm tra session

```javascript
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
```

### Kiểm tra profile

```javascript
const { data: { user } } = await supabase.auth.getUser()
if (user) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  console.log('Profile:', profile)
}
```

### Sử dụng debug helper

```javascript
// Import debug helper (đã có sẵn trong window)
await window.debugAuth.fullDebug()
```

## Các lỗi thường gặp và cách fix

### Lỗi 1: "User already registered"

**Nguyên nhân**: Email đã được đăng ký.

**Giải pháp**: 
- Sử dụng email khác
- Hoặc đăng nhập với email đã đăng ký
- Hoặc xóa user trong Supabase Dashboard → Authentication → Users

### Lỗi 2: "Invalid login credentials"

**Nguyên nhân**: Email hoặc mật khẩu không đúng.

**Giải pháp**: 
- Kiểm tra lại email và mật khẩu
- Đảm bảo đã đăng ký trước đó
- Kiểm tra trong Supabase Dashboard → Authentication → Users

### Lỗi 3: "Email not confirmed"

**Nguyên nhân**: Supabase yêu cầu xác nhận email.

**Giải pháp**: 
- Vào Supabase Dashboard → Authentication → Settings
- Tắt "Enable email confirmations"
- Hoặc kiểm tra email để xác nhận

### Lỗi 4: "Network error"

**Nguyên nhân**: Không kết nối được Supabase.

**Giải pháp**: 
- Kiểm tra internet
- Kiểm tra `.env` có đúng SUPABASE_URL và ANON_KEY
- Kiểm tra Supabase project có đang hoạt động

### Lỗi 5: "Row Level Security policy violation"

**Nguyên nhân**: RLS policies chặn query.

**Giải pháp**: 
- Chạy lại `supabase/fix_rls_policies.sql`
- Kiểm tra policies trong Supabase Dashboard → Database → Policies

### Lỗi 6: "Profile not found"

**Nguyên nhân**: Profile chưa được tạo sau khi đăng ký.

**Giải pháp**: 
- Chạy `supabase/create_profile_trigger.sql` để tạo trigger
- Hoặc tạo profile manually:

```sql
INSERT INTO profiles (id, email, full_name, phone, role)
VALUES (
  'user-id-here',
  'email@example.com',
  'Full Name',
  '0123456789',
  'user'
);
```

## Kiểm tra RLS Policies

### Xem policies hiện tại

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Xóa tất cả policies của một table

```sql
-- Ví dụ: xóa policies của profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
```

### Tạo lại policies đơn giản

```sql
-- Cho phép user xem và sửa profile của mình
CREATE POLICY "Enable read access for own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Enable update for own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Enable insert for own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);
```

## Test từng bước

### Test 1: Supabase connection

```bash
# Trong browser console
const { data, error } = await supabase.from('profiles').select('count')
console.log(error ? 'Failed' : 'Success')
```

**Expected**: "Success"

### Test 2: Sign up

```bash
# Trong browser console hoặc Register form
# Điền thông tin và submit
# Kiểm tra console logs
```

**Expected**: 
- `🚀 Starting registration...`
- `✅ Registration successful:`
- Redirect to `/app`

### Test 3: Check profile created

```bash
# Trong browser console
const { data: { user } } = await supabase.auth.getUser()
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single()
console.log('Profile:', profile)
```

**Expected**: Profile object với role, email, full_name, etc.

### Test 4: Sign out và Sign in

```bash
# Click "Đăng xuất"
# Vào /login
# Điền email + password
# Submit
```

**Expected**: 
- `🚀 Starting login...`
- `✅ Login successful:`
- Redirect to `/app`

### Test 5: Protected route

```bash
# Đăng xuất
# Truy cập trực tiếp /app
```

**Expected**: Auto redirect to `/login`

## Nếu vẫn còn lỗi

### 1. Check Supabase logs

Vào Supabase Dashboard → Logs → Database để xem lỗi chi tiết.

### 2. Enable debug mode

Thêm vào `.env`:
```env
VITE_DEBUG=true
```

### 3. Check browser console

Mở F12 → Console để xem tất cả logs và errors.

### 4. Reset database

Nếu database bị lỗi nặng:
1. Supabase Dashboard → Settings → Database → Reset Database
2. Chạy lại schema.sql
3. Chạy lại fix_rls_policies.sql
4. Chạy lại create_profile_trigger.sql

### 5. Liên hệ support

Nếu vẫn không fix được, cung cấp:
- Screenshot lỗi
- Console logs
- Supabase logs
- Steps to reproduce

## Checklist

- [ ] Đã chạy schema.sql
- [ ] Đã chạy fix_rls_policies.sql
- [ ] Đã chạy create_profile_trigger.sql
- [ ] Đã kiểm tra .env có đúng credentials
- [ ] Đã tắt email confirmation trong Supabase
- [ ] Đã test connection trong console
- [ ] Đã test sign up
- [ ] Đã test sign in
- [ ] Đã test protected route
- [ ] Không còn lỗi trong console

## Kết luận

Sau khi hoàn thành tất cả các bước trên, hệ thống authentication sẽ hoạt động bình thường:
- ✅ Đăng ký user mới
- ✅ Đăng nhập
- ✅ Đăng xuất
- ✅ Protected routes
- ✅ Auto-redirect
- ✅ Profile tự động tạo
- ✅ User đầu tiên là admin

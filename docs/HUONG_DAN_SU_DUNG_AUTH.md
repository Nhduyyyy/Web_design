# Hướng dẫn sử dụng Authentication

## Tổng quan

Hệ thống authentication đã được tích hợp hoàn chỉnh với các tính năng:
- ✅ Đăng ký tài khoản (User / Theater)
- ✅ Đăng nhập
- ✅ Đăng xuất
- ✅ Protected routes
- ✅ Auto-redirect khi chưa đăng nhập
- ✅ Hiển thị trạng thái đăng nhập trên Landing Page

## Cách sử dụng

### 1. Chạy ứng dụng

```bash
npm install
npm run dev
```

### 2. Truy cập Landing Page

Mở trình duyệt và truy cập: `http://localhost:5173`

### 3. Đăng ký tài khoản

#### Từ Landing Page:
- Click nút "Đăng Nhập" ở header (khi hover chuột lên trên)
- Hoặc click "ĐĂNG NHẬP" ở Hero section
- Click "Đăng ký ngay" ở trang Login

#### Điền thông tin:
- **Họ và tên**: Tên đầy đủ của bạn
- **Email**: Email hợp lệ
- **Số điện thoại**: 10 chữ số
- **Mật khẩu**: Tối thiểu 6 ký tự
- **Xác nhận mật khẩu**: Phải khớp với mật khẩu
- **Loại tài khoản**:
  - **Người dùng**: Xem và đặt vé
  - **Nhà hát**: Đăng ký địa điểm, tạo lịch diễn

#### User đầu tiên:
- User đầu tiên đăng ký sẽ tự động có role **Admin**
- Admin có quyền quản trị toàn hệ thống

### 4. Đăng nhập

#### Từ Landing Page:
- Click nút "Đăng Nhập" ở header
- Hoặc click "ĐĂNG NHẬP" ở Hero section

#### Điền thông tin:
- Email
- Mật khẩu

#### Sau khi đăng nhập thành công:
- Tự động redirect về `/app`
- Nút "Đăng Nhập" trên Landing Page đổi thành "Trải Nghiệm"
- Hiển thị nút "Đăng xuất" trong app

### 5. Trải nghiệm App

Sau khi đăng nhập, bạn có thể:
- Chụp ảnh với mặt nạ AR
- Xem lịch diễn
- Đặt vé
- Đăng ký events
- Xem livestream

### 6. Đăng xuất

- Click nút "Đăng xuất" ở góc phải header trong app
- Tự động redirect về Landing Page
- Nút "Trải Nghiệm" đổi lại thành "Đăng Nhập"

## Luồng hoạt động

### Landing Page (Chưa đăng nhập)
```
Landing Page
  ├─ Header: "Đăng Nhập" button
  ├─ Hero: "ĐĂNG NHẬP" button
  └─ Click → Redirect to /login
```

### Landing Page (Đã đăng nhập)
```
Landing Page
  ├─ Header: "Trải Nghiệm" button
  ├─ Hero: "KHÁM PHÁ NGAY" button
  └─ Click → Redirect to /app
```

### Login Flow
```
/login
  ├─ Điền email + password
  ├─ Click "Đăng Nhập"
  ├─ Success → Redirect to /app
  └─ Error → Hiển thị thông báo lỗi
```

### Register Flow
```
/register
  ├─ Điền thông tin đầy đủ
  ├─ Chọn role (User / Theater)
  ├─ Click "Đăng Ký"
  ├─ Success → Redirect to /app
  └─ Error → Hiển thị thông báo lỗi
```

### Protected Route
```
/app (Protected)
  ├─ Chưa đăng nhập → Redirect to /login
  ├─ Đã đăng nhập → Hiển thị app
  └─ Click "Đăng xuất" → Redirect to /
```

## Roles và Permissions

### Admin (User đầu tiên)
- Phê duyệt/từ chối nhà hát
- Quản lý vở diễn, mặt nạ
- Xem toàn bộ hệ thống
- Full access

### Theater (Nhà hát)
- Đăng ký nhà hát (chờ admin duyệt)
- Tạo venues (địa điểm diễn)
- Tạo lịch diễn
- Tạo livestream
- Tạo events (workshop, tour, meet artist)
- Xem bookings và revenue

### User (Người dùng)
- Xem lịch diễn, events
- Đặt vé
- Đăng ký events
- Xem livestream
- Chụp ảnh với mặt nạ AR

## Components

### AuthContext
- Quản lý state authentication
- Cung cấp: `user`, `profile`, `loading`, `isAuthenticated`, `isAdmin`, `isTheater`, `isUser`

### Login Component
- Form đăng nhập
- Validation
- Error handling
- Redirect sau khi login

### Register Component
- Form đăng ký
- Validation (email, password, phone)
- Role selection
- Error handling
- Redirect sau khi register

### ProtectedRoute Component
- Bảo vệ routes yêu cầu authentication
- Auto-redirect to /login nếu chưa đăng nhập
- Loading state

### LogoutButton Component
- Nút đăng xuất
- Hiển thị tên user
- Redirect về Landing Page sau logout

## Styling

### Auth Pages
- Background gradient với animation
- Card design với backdrop blur
- Form validation visual feedback
- Responsive design
- Smooth transitions

### Colors
- Primary: Gold gradient (#FFD700 → #FFA500)
- Background: Dark blue gradient (#1a1a2e → #0f3460)
- Error: Red (#d32f2f)
- Success: Green

## Troubleshooting

### Issue: "Missing Supabase environment variables"
**Solution**: Kiểm tra file `.env` có đúng format:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Issue: Login/Register không hoạt động
**Solution**: 
1. Kiểm tra Supabase project đã setup schema chưa
2. Kiểm tra console log để xem error
3. Kiểm tra network tab để xem API calls

### Issue: Redirect loop
**Solution**: Clear browser cache và cookies

### Issue: "User already registered"
**Solution**: Sử dụng email khác hoặc đăng nhập với email đã đăng ký

## Testing

### Test User Registration
1. Vào `/register`
2. Điền thông tin hợp lệ
3. Click "Đăng Ký"
4. Kiểm tra redirect to `/app`
5. Kiểm tra Supabase Dashboard → Authentication → Users

### Test Login
1. Vào `/login`
2. Điền email + password đã đăng ký
3. Click "Đăng Nhập"
4. Kiểm tra redirect to `/app`

### Test Protected Route
1. Logout (nếu đang login)
2. Truy cập trực tiếp `/app`
3. Kiểm tra redirect to `/login`

### Test Landing Page Button
1. Logout
2. Vào `/`
3. Kiểm tra nút hiển thị "Đăng Nhập"
4. Login
5. Vào `/`
6. Kiểm tra nút hiển thị "Trải Nghiệm"

## Next Steps

1. ✅ Setup authentication
2. ✅ Create Login/Register pages
3. ✅ Update Landing Page buttons
4. ✅ Add Protected Routes
5. 🔲 Add password reset
6. 🔲 Add email verification
7. 🔲 Add social login (Google, Facebook)
8. 🔲 Add profile page
9. 🔲 Add role-based dashboards

## Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [React Router Docs](https://reactrouter.com/)
- [Context API Docs](https://react.dev/reference/react/useContext)

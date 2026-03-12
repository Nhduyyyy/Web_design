# Hướng Dẫn Phát Triển Tính Năng Quản Lý Thông Tin Nhà Hát

> **Đường dẫn:** `/theater/profile`  
> **Phiên bản:** 1.0  
> **Mục tiêu:** Cho phép chủ nhà hát xem và chỉnh sửa toàn bộ thông tin hồ sơ của nhà hát mình đang quản lý.

---

## 1. Tổng Quan Tính Năng

Trang `/theater/profile` là nơi người dùng có vai trò `theater` hoặc `admin` có thể:

- Xem toàn bộ thông tin hồ sơ nhà hát (tên, địa chỉ, liên hệ, logo, ảnh bìa, v.v.)
- Chỉnh sửa các trường thông tin được phép cập nhật
- Xem trạng thái hoạt động, thông tin pháp lý (giấy phép kinh doanh, mã số thuế)
- Xem metadata hệ thống (ngày tạo, ngày duyệt, người duyệt)

---

## 2. Cấu Trúc Bảng `theaters`

| Trường | Kiểu dữ liệu | Nullable | Ghi chú |
|---|---|---|---|
| `id` | uuid | ❌ | Khóa chính, tự sinh |
| `owner_id` | uuid | ❌ | FK → users.id |
| `name` | text | ❌ | Tên nhà hát |
| `address` | text | ❌ | Địa chỉ chi tiết |
| `city` | text | ❌ | Thành phố |
| `description` | text | ✅ | Mô tả giới thiệu |
| `phone` | text | ✅ | Số điện thoại |
| `email` | text | ✅ | Email liên hệ |
| `website` | text | ✅ | Website chính thức |
| `logo_url` | text | ✅ | URL logo nhà hát |
| `cover_image_url` | text | ✅ | URL ảnh bìa |
| `capacity` | int4 | ✅ | Tổng sức chứa |
| `status` | theater_status | ✅ | Trạng thái hoạt động |
| `business_license` | text | ✅ | Số giấy phép kinh doanh |
| `tax_code` | text | ✅ | Mã số thuế |
| `created_at` | timestamptz | ✅ | Ngày tạo hồ sơ |
| `updated_at` | timestamptz | ✅ | Lần cập nhật cuối |
| `approved_at` | timestamptz | ✅ | Ngày được duyệt |
| `approved_by` | uuid | ✅ | Admin đã duyệt |

### Nhóm trường theo chức năng hiển thị

| Nhóm | Các trường |
|---|---|
| **Thông tin cơ bản** | `name`, `description`, `city`, `address` |
| **Liên hệ** | `phone`, `email`, `website` |
| **Hình ảnh** | `logo_url`, `cover_image_url` |
| **Thông số** | `capacity`, `status` |
| **Pháp lý** | `business_license`, `tax_code` |
| **Hệ thống (chỉ đọc)** | `created_at`, `updated_at`, `approved_at`, `approved_by` |

---

## 3. Kiến Trúc Component

```
/theater/profile
└── TheaterProfile.jsx                 ← Component trang chính (entry point)
    ├── TheaterProfileHeader.jsx       ← Ảnh bìa + logo + tên + trạng thái
    ├── TheaterProfileTabs.jsx         ← Điều hướng giữa các tab
    │   ├── Tab: Thông Tin Chung       → TheaterInfoSection.jsx
    │   ├── Tab: Hình Ảnh & Media      → TheaterMediaSection.jsx
    │   ├── Tab: Pháp Lý               → TheaterLegalSection.jsx
    │   └── Tab: Hệ Thống              → TheaterSystemSection.jsx
    └── TheaterProfileEditModal.jsx    ← Modal chỉnh sửa thông tin
```

### Phân chia trách nhiệm

| Component | Trách nhiệm |
|---|---|
| `TheaterProfile.jsx` | Fetch dữ liệu, điều phối state, xử lý submit |
| `TheaterProfileHeader.jsx` | Hiển thị cover/logo, badge trạng thái, nút "Chỉnh sửa" |
| `TheaterInfoSection.jsx` | Hiển thị nhóm thông tin cơ bản & liên hệ |
| `TheaterMediaSection.jsx` | Upload/preview logo và ảnh bìa |
| `TheaterLegalSection.jsx` | Hiển thị giấy phép, mã số thuế (có thể chỉnh sửa) |
| `TheaterSystemSection.jsx` | Thông tin chỉ đọc: ngày tạo, duyệt, người duyệt |
| `TheaterProfileEditModal.jsx` | Form chỉnh sửa tất cả trường được phép |

---

## 4. Luồng Dữ Liệu (Data Flow)

### 4.1 Fetch dữ liệu nhà hát

```
TheaterProfile.jsx mount
    → useAuth() lấy user hiện tại
    → theaterService.getTheaterByOwner(user.id)
    → Supabase: SELECT * FROM theaters WHERE owner_id = user.id
    → Set state: theater, loading, error
```

### 4.2 Cập nhật thông tin

```
User nhấn "Lưu" trong EditModal
    → Validate form (name, address, city bắt buộc)
    → theaterService.updateTheater(theater.id, payload)
    → Supabase: UPDATE theaters SET ... WHERE id = theater.id
    → Cập nhật local state
    → Toast thông báo thành công/thất bại
```

### 4.3 Upload hình ảnh

```
User chọn file ảnh
    → Validate: định dạng (jpg/png/webp), kích thước (max 5MB)
    → storageService.uploadTheaterImage(file, theater.id, type)
    → Supabase Storage: upload → lấy public URL
    → theaterService.updateTheater(theater.id, { logo_url / cover_image_url })
    → Cập nhật hiển thị ngay lập tức (optimistic update)
```

---

## 5. Service Layer

### File: `src/services/theaterService.js`

Bổ sung các hàm sau (hoặc tạo mới nếu chưa có):

```javascript
// Lấy theater theo owner
export const getTheaterByOwner = async (ownerId) => {
  const { data, error } = await supabase
    .from('theaters')
    .select('*')
    .eq('owner_id', ownerId)
    .single();
  if (error) throw error;
  return data;
};

// Cập nhật thông tin theater
export const updateTheater = async (theaterId, updates) => {
  const { data, error } = await supabase
    .from('theaters')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', theaterId)
    .select()
    .single();
  if (error) throw error;
  return data;
};
```

### File: `src/services/storageService.js`

```javascript
// Upload ảnh cho theater (logo hoặc cover)
export const uploadTheaterImage = async (file, theaterId, type) => {
  // type: 'logo' | 'cover'
  const ext = file.name.split('.').pop();
  const path = `theaters/${theaterId}/${type}.${ext}`;
  
  const { error: uploadError } = await supabase.storage
    .from('theater-images')
    .upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('theater-images')
    .getPublicUrl(path);
  return publicUrl;
};
```

---

## 6. Custom Hook

### File: `src/hooks/useTheaterProfile.js`

```javascript
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getTheaterByOwner, updateTheater } from '../services/theaterService';
import { uploadTheaterImage } from '../services/storageService';

export const useTheaterProfile = () => {
  const { user } = useAuth();
  const [theater, setTheater] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchTheater = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await getTheaterByOwner(user.id);
      setTheater(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const handleUpdate = async (updates) => {
    try {
      setSaving(true);
      const updated = await updateTheater(theater.id, updates);
      setTheater(updated);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file, type) => {
    try {
      const url = await uploadTheaterImage(file, theater.id, type);
      const field = type === 'logo' ? 'logo_url' : 'cover_image_url';
      await handleUpdate({ [field]: url });
      return { success: true, url };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  useEffect(() => { fetchTheater(); }, [fetchTheater]);

  return { theater, loading, saving, error, handleUpdate, handleImageUpload, refetch: fetchTheater };
};
```

---

## 7. Giao Diện (UI/UX)

### 7.1 Layout tổng thể

```
┌─────────────────────────────────────────────────────────┐
│  [ảnh bìa - 100% width, height ~280px]                  │
│                                                         │
│  ┌──────┐  Tên Nhà Hát                    [Chỉnh sửa]  │
│  │ Logo │  Thành phố • Badge trạng thái               │
│  └──────┘                                               │
├─────────────────────────────────────────────────────────┤
│  [Thông Tin Chung] [Hình Ảnh] [Pháp Lý] [Hệ Thống]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Nội dung tab tương ứng                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Badge trạng thái `theater_status`

| Giá trị | Màu hiển thị | Nhãn |
|---|---|---|
| `active` | Xanh lá | Đang hoạt động |
| `inactive` | Xám | Ngừng hoạt động |
| `pending` | Vàng | Chờ duyệt |
| `suspended` | Đỏ | Bị đình chỉ |

### 7.3 Tab: Thông Tin Chung

Hiển thị dạng lưới 2 cột:

- **Cột trái:** Tên nhà hát, Mô tả, Địa chỉ, Thành phố
- **Cột phải:** Điện thoại, Email, Website, Sức chứa

### 7.4 Tab: Hình Ảnh & Media

- Xem trước logo (hình vuông, bo tròn)
- Xem trước ảnh bìa (tỉ lệ 16:9)
- Nút upload riêng cho từng loại
- Hiển thị trạng thái upload (loading spinner)

### 7.5 Tab: Pháp Lý

- Số giấy phép kinh doanh
- Mã số thuế
- Cho phép chỉnh sửa trực tiếp inline hoặc qua modal

### 7.6 Tab: Hệ Thống (chỉ đọc)

- Ngày tạo hồ sơ (`created_at`)
- Lần cập nhật cuối (`updated_at`)
- Ngày được duyệt (`approved_at`)
- Người duyệt (`approved_by` → hiển thị email/tên nếu join được)

---

## 8. Modal Chỉnh Sửa (`TheaterProfileEditModal`)

### Cấu trúc form

```
Section 1: Thông tin cơ bản
  - Tên nhà hát *         (text input, required)
  - Thành phố *           (text input, required)
  - Địa chỉ *             (textarea, required)
  - Mô tả                 (textarea, optional, max 500 ký tự)

Section 2: Thông tin liên hệ
  - Số điện thoại         (tel input)
  - Email liên hệ         (email input)
  - Website               (url input)

Section 3: Thông số
  - Tổng sức chứa         (number input, min 0)

Section 4: Pháp lý
  - Số GPKD               (text input)
  - Mã số thuế            (text input)
```

### Validation rules

| Trường | Quy tắc |
|---|---|
| `name` | Bắt buộc, 2–200 ký tự |
| `address` | Bắt buộc, 5–500 ký tự |
| `city` | Bắt buộc, 2–100 ký tự |
| `email` | Đúng định dạng email nếu có giá trị |
| `website` | Bắt đầu bằng `http://` hoặc `https://` nếu có giá trị |
| `capacity` | Số nguyên dương nếu có giá trị |
| `phone` | 8–15 ký tự số nếu có giá trị |

---

## 9. Phân Quyền

| Hành động | theater (owner) | admin | Ghi chú |
|---|---|---|---|
| Xem thông tin | ✅ | ✅ | Chỉ xem theater của mình |
| Sửa thông tin cơ bản | ✅ | ✅ | |
| Upload logo/cover | ✅ | ✅ | |
| Sửa thông tin pháp lý | ✅ | ✅ | |
| Thay đổi `status` | ❌ | ✅ | Chỉ admin mới đổi trạng thái |
| Xem tab Hệ thống | ✅ | ✅ | Chỉ đọc |

> **Lưu ý RLS:** Đảm bảo Supabase RLS policy cho phép `UPDATE` trên `theaters` với điều kiện `owner_id = auth.uid()` cho role `theater`.

---

## 10. Tích Hợp Vào Router

### Trong file router chính (ví dụ `App.jsx` hoặc `main.jsx`)

```jsx
<Route path="/theater" element={<TheaterRoute />}>
  {/* ... các route hiện có ... */}
  <Route path="profile" element={<TheaterProfile />} />
</Route>
```

### Trong `TheaterHeader.jsx`

Thêm tab điều hướng tới `/theater/profile`:

```jsx
{ label: 'Hồ Sơ Nhà Hát', path: '/theater/profile', icon: <BuildingIcon /> }
```

---

## 11. Cấu Trúc File Đề Xuất

```
src/
└── components/
    └── Theater/
        ├── TheaterProfile.jsx                ← Entry point trang
        ├── profile/
        │   ├── TheaterProfileHeader.jsx      ← Cover + logo + tên
        │   ├── TheaterProfileTabs.jsx        ← Thanh tab
        │   ├── TheaterInfoSection.jsx        ← Tab thông tin chung
        │   ├── TheaterMediaSection.jsx       ← Tab hình ảnh
        │   ├── TheaterLegalSection.jsx       ← Tab pháp lý
        │   ├── TheaterSystemSection.jsx      ← Tab hệ thống
        │   └── TheaterProfileEditModal.jsx   ← Modal form chỉnh sửa
└── hooks/
    └── useTheaterProfile.js                  ← Custom hook
└── services/
    ├── theaterService.js                     ← Bổ sung hàm mới
    └── storageService.js                     ← Upload ảnh
```

---

## 12. Thứ Tự Phát Triển (Gợi Ý)

| Bước | Nhiệm vụ | Ưu tiên |
|---|---|---|
| 1 | Tạo `useTheaterProfile` hook + service functions | 🔴 Cao |
| 2 | Tạo `TheaterProfile.jsx` với layout cơ bản | 🔴 Cao |
| 3 | Tạo `TheaterProfileHeader.jsx` | 🔴 Cao |
| 4 | Tạo `TheaterInfoSection.jsx` (tab xem thông tin) | 🔴 Cao |
| 5 | Tạo `TheaterProfileEditModal.jsx` với form + validation | 🔴 Cao |
| 6 | Tích hợp route `/theater/profile` vào router | 🔴 Cao |
| 7 | Tạo `TheaterMediaSection.jsx` với upload ảnh | 🟡 Trung bình |
| 8 | Tạo `TheaterLegalSection.jsx` | 🟡 Trung bình |
| 9 | Tạo `TheaterSystemSection.jsx` | 🟢 Thấp |
| 10 | Thêm toast notification và xử lý lỗi chi tiết | 🟡 Trung bình |
| 11 | Viết unit test cho hook và service | 🟢 Thấp |

---

## 13. Các Điểm Cần Lưu Ý

- **Không cho phép user thay đổi `status`**: Trường này chỉ được cập nhật bởi admin qua luồng duyệt tổ chức.
- **`owner_id` và `id` không được phép sửa** trong bất kỳ trường hợp nào từ phía theater user.
- **Optimistic update cho upload ảnh**: Hiển thị ảnh mới ngay sau khi chọn file, trước khi upload xong, để UX mượt hơn.
- **Xử lý trường hợp theater chưa tồn tại**: Nếu user chưa có theater (chờ duyệt), hiển thị màn hình thông báo trạng thái hồ sơ tổ chức thay vì trang profile.
- **Debounce hoặc modal confirm** trước khi lưu để tránh submit nhầm.
- **Kiểm tra RLS Supabase** đảm bảo chỉ `owner_id = auth.uid()` mới UPDATE được bản ghi của mình.

# 🎭 Tính Năng Quản Lý Sự Kiện – Theater Dashboard

> **Đường dẫn:** `/theater/events`  
> **Vai trò:** Theater Owner / Admin  
> **Mô tả:** Giao diện quản lý toàn bộ sự kiện (workshop, tour, gặp gỡ nghệ sĩ) cho nhà hát trên nền tảng Tuồng Việt Nam.

---

## 1. Tổng Quan Kiến Trúc

```
src/
├── pages/
│   └── theater/
│       └── EventsPage.jsx               # Trang chính /theater/events
├── components/
│   └── theater/
│       └── events/
│           ├── EventList.jsx            # Danh sách sự kiện (bảng/grid)
│           ├── EventCard.jsx            # Card hiển thị 1 sự kiện
│           ├── EventFormModal.jsx       # Modal tạo/chỉnh sửa sự kiện
│           ├── EventDetailModal.jsx     # Modal xem chi tiết
│           ├── EventDeleteConfirm.jsx   # Dialog xác nhận xóa
│           ├── EventFilters.jsx         # Thanh lọc/tìm kiếm
│           └── EventStatusBadge.jsx     # Badge hiển thị trạng thái
├── hooks/
│   └── useTheaterEvents.js              # Custom hook: CRUD + state
├── services/
│   └── theaterEventsService.js          # Gọi Supabase API
└── utils/
    └── eventHelpers.js                  # Format ngày, tính toán, validate
```

---

## 2. Cấu Trúc Bảng `events` (Supabase)

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| `id` | uuid | ✅ | Khóa chính, tự sinh |
| `theater_id` | uuid | ✅ | FK → bảng theaters |
| `venue_id` | uuid | ❌ | FK → bảng venues |
| `type` | event_type | ✅ | `'workshop'` \| `'tour'` \| `'meet_artist'` |
| `title` | text | ✅ | Tên sự kiện |
| `description` | text | ❌ | Mô tả chi tiết |
| `thumbnail_url` | text | ❌ | URL ảnh bìa |
| `event_date` | timestamptz | ✅ | Ngày/giờ diễn ra |
| `duration` | int4 | ❌ | Thời lượng (phút) |
| `max_participants` | int4 | ✅ | Số người tối đa |
| `current_participants` | int4 | ❌ | Số người đã đăng ký |
| `price` | int4 | ✅ | Giá vé (VNĐ) |
| `instructor` | text | ❌ | Tên giảng viên/hướng dẫn |
| `guide` | text | ❌ | Nội dung hướng dẫn chi tiết |
| `artists` | text[] | ❌ | Danh sách nghệ sĩ tham gia |
| `requirements` | text[] | ❌ | Yêu cầu với người tham gia |
| `includes` | text[] | ❌ | Những gì được bao gồm trong vé |
| `tags` | text[] | ❌ | Nhãn phân loại |
| `status` | event_status | ❌ | `'draft'` \| `'published'` \| `'cancelled'` \| `'completed'` |
| `created_at` | timestamptz | ✅ | Thời điểm tạo |
| `updated_at` | timestamptz | ✅ | Thời điểm cập nhật cuối |

### Enum Types (cần tạo trong Supabase)

```sql
-- Loại sự kiện
CREATE TYPE event_type AS ENUM ('workshop', 'tour', 'meet_artist');

-- Trạng thái sự kiện
CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
```

---

## 3. Luồng Chức Năng (Feature Flow)

### 3.1 Xem Danh Sách Sự Kiện

```
[Truy cập /theater/events]
        ↓
[useTheaterEvents hook chạy]
        ↓
[Fetch events từ Supabase theo theater_id]
        ↓
[Hiển thị EventList với EventCard]
        ↓
[Người dùng có thể: Lọc | Tìm kiếm | Sắp xếp]
```

### 3.2 Tạo Sự Kiện Mới

```
[Click nút "Tạo sự kiện"]
        ↓
[Mở EventFormModal (mode: CREATE)]
        ↓
[Điền form → Validate phía client]
        ↓
[Submit → theaterEventsService.createEvent()]
        ↓
[Supabase INSERT với theater_id của user hiện tại]
        ↓
[Refetch danh sách → Hiển thị toast thành công]
```

### 3.3 Chỉnh Sửa Sự Kiện

```
[Click "Chỉnh sửa" trên EventCard]
        ↓
[Mở EventFormModal (mode: EDIT, prefill data)]
        ↓
[Thay đổi → Validate]
        ↓
[Submit → theaterEventsService.updateEvent(id, data)]
        ↓
[Supabase UPDATE WHERE id = ? AND theater_id = ?]
        ↓
[Refetch → Toast thành công]
```

### 3.4 Xóa Sự Kiện

```
[Click "Xóa" → Hiện EventDeleteConfirm dialog]
        ↓
[Xác nhận → theaterEventsService.deleteEvent(id)]
        ↓
[Supabase DELETE (chỉ cho phép nếu status = 'draft' hoặc không có participants)]
        ↓
[Cập nhật danh sách → Toast]
```

### 3.5 Thay Đổi Trạng Thái (Publish/Cancel)

```
[Click "Đăng" trên event có status='draft']
        ↓
[theaterEventsService.updateStatus(id, 'published')]
        ↓
[Event xuất hiện công khai trên /events]
```

---

## 4. Implementation Guide

### 4.1 Service Layer (`theaterEventsService.js`)

```javascript
import { supabase } from '@/lib/supabase';

// Lấy danh sách sự kiện của theater
export const getTheaterEvents = async (theaterId, filters = {}) => {
  let query = supabase
    .from('events')
    .select(`
      *,
      venues (id, name, address)
    `)
    .eq('theater_id', theaterId)
    .order('event_date', { ascending: false });

  if (filters.type) query = query.eq('type', filters.type);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.search) query = query.ilike('title', `%${filters.search}%`);
  if (filters.dateFrom) query = query.gte('event_date', filters.dateFrom);
  if (filters.dateTo) query = query.lte('event_date', filters.dateTo);

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Tạo sự kiện mới
export const createEvent = async (theaterId, eventData) => {
  const { data, error } = await supabase
    .from('events')
    .insert([{
      ...eventData,
      theater_id: theaterId,
      current_participants: 0,
      status: eventData.status || 'draft',
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Cập nhật sự kiện
export const updateEvent = async (eventId, theaterId, eventData) => {
  const { data, error } = await supabase
    .from('events')
    .update({ ...eventData, updated_at: new Date().toISOString() })
    .eq('id', eventId)
    .eq('theater_id', theaterId) // Bảo mật: chỉ update event của theater mình
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Xóa sự kiện
export const deleteEvent = async (eventId, theaterId) => {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
    .eq('theater_id', theaterId);

  if (error) throw error;
};

// Cập nhật trạng thái
export const updateEventStatus = async (eventId, theaterId, status) => {
  return updateEvent(eventId, theaterId, { status });
};
```

### 4.2 Custom Hook (`useTheaterEvents.js`)

```javascript
import { useState, useEffect, useCallback } from 'react';
import * as service from '@/services/theaterEventsService';
import { useAuth } from '@/hooks/useAuth';

export const useTheaterEvents = () => {
  const { user, theaterProfile } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: '', status: '', search: '', dateFrom: '', dateTo: ''
  });

  const theaterId = theaterProfile?.theater_id;

  const fetchEvents = useCallback(async () => {
    if (!theaterId) return;
    setLoading(true);
    try {
      const data = await service.getTheaterEvents(theaterId, filters);
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [theaterId, filters]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const createEvent = async (formData) => {
    const newEvent = await service.createEvent(theaterId, formData);
    setEvents(prev => [newEvent, ...prev]);
    return newEvent;
  };

  const updateEvent = async (id, formData) => {
    const updated = await service.updateEvent(id, theaterId, formData);
    setEvents(prev => prev.map(e => e.id === id ? updated : e));
    return updated;
  };

  const deleteEvent = async (id) => {
    await service.deleteEvent(id, theaterId);
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const updateStatus = async (id, status) => {
    const updated = await service.updateEventStatus(id, theaterId, status);
    setEvents(prev => prev.map(e => e.id === id ? updated : e));
  };

  return {
    events, loading, error, filters,
    setFilters, createEvent, updateEvent, deleteEvent, updateStatus,
    refetch: fetchEvents
  };
};
```

### 4.3 Form Validation

```javascript
// utils/eventHelpers.js
export const validateEventForm = (data) => {
  const errors = {};

  if (!data.type) errors.type = 'Vui lòng chọn loại sự kiện';
  if (!data.event_date) errors.event_date = 'Ngày diễn ra là bắt buộc';
  if (!data.max_participants || data.max_participants < 1)
    errors.max_participants = 'Số người tham dự phải lớn hơn 0';
  if (data.price === undefined || data.price < 0)
    errors.price = 'Giá vé không hợp lệ';
  if (data.event_date && new Date(data.event_date) < new Date())
    errors.event_date = 'Ngày sự kiện phải là trong tương lai';

  return errors;
};

export const EVENT_TYPE_LABELS = {
  workshop: '🎨 Workshop',
  tour: '🗺️ Tour Tham Quan',
  meet_artist: '🎭 Gặp Gỡ Nghệ Sĩ',
};

export const EVENT_STATUS_CONFIG = {
  draft:     { label: 'Bản nháp',   color: 'gray'   },
  published: { label: 'Đã đăng',    color: 'green'  },
  cancelled: { label: 'Đã hủy',     color: 'red'    },
  completed: { label: 'Đã kết thúc',color: 'purple' },
};

export const formatPrice = (price) =>
  price === 0 ? 'Miễn phí' : `${price.toLocaleString('vi-VN')}đ`;

export const getParticipantProgress = (current, max) => ({
  percent: Math.round((current / max) * 100),
  isFull: current >= max,
  remaining: max - current,
});
```

---

## 5. UI Components

### 5.1 EventsPage (Trang chính)

**Bố cục:**
```
┌─────────────────────────────────────────────────────────┐
│  🎭 Quản Lý Sự Kiện          [+ Tạo Sự Kiện Mới]       │
├─────────────────────────────────────────────────────────┤
│  📊 Thống kê nhanh: Tổng | Đang đăng | Sắp diễn | Hôm nay │
├─────────────────────────────────────────────────────────┤
│  [Loại: All/Workshop/Tour/Meet] [Trạng thái] [🔍 Tìm]   │
│  [Từ ngày ─── Đến ngày]        [⊞ Grid] [☰ List]       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  EventCard  EventCard  EventCard                        │
│  EventCard  EventCard  EventCard                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 5.2 EventCard

**Thông tin hiển thị:**
- Ảnh thumbnail (fallback gradient theo loại sự kiện)
- Badge loại sự kiện (Workshop / Tour / Gặp gỡ)
- Badge trạng thái (màu sắc theo `EVENT_STATUS_CONFIG`)
- Tiêu đề, ngày giờ, địa điểm (venue)
- Thanh tiến trình số người đăng ký (`current/max`)
- Giá vé
- Các nút: **Xem** | **Sửa** | **Đăng/Hủy đăng** | **Xóa**

### 5.3 EventFormModal

**Các trường form (theo thứ tự hiển thị):**

```
Thông tin cơ bản
├── Loại sự kiện *        [Select: Workshop | Tour | Gặp gỡ]
├── Tiêu đề               [Text input]
├── Mô tả                 [Textarea]
└── Ảnh bìa               [URL input + preview]

Thời gian & Địa điểm
├── Ngày & giờ *          [DateTime picker]
├── Thời lượng (phút)     [Number input]
└── Địa điểm              [Select từ venues của theater]

Người tham gia & Giá
├── Số người tối đa *     [Number input, min=1]
├── Giá vé (VNĐ) *        [Number input, min=0, 0=miễn phí]
└── Giảng viên/Hướng dẫn  [Text input]

Nội dung chi tiết
├── Hướng dẫn chi tiết    [Textarea/Rich text]
├── Nghệ sĩ tham gia      [Tag input (text[])]
├── Yêu cầu tham gia      [Tag input (text[])]
├── Bao gồm trong vé      [Tag input (text[])]
└── Tags                   [Tag input (text[])]

Trạng thái
└── Trạng thái            [Select: Bản nháp | Đăng ngay]
```

---

## 6. Bảo Mật & Phân Quyền

### Row Level Security (Supabase RLS)

```sql
-- Theater owner chỉ xem được events của mình
CREATE POLICY "theater_owner_view_events" ON events
  FOR SELECT USING (
    theater_id IN (
      SELECT theater_id FROM theater_members
      WHERE user_id = auth.uid()
    )
  );

-- Chỉ được tạo event cho theater của mình
CREATE POLICY "theater_owner_insert_events" ON events
  FOR INSERT WITH CHECK (
    theater_id IN (
      SELECT theater_id FROM theater_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

-- Chỉ được sửa/xóa event của theater mình
CREATE POLICY "theater_owner_update_events" ON events
  FOR UPDATE USING (
    theater_id IN (
      SELECT theater_id FROM theater_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

CREATE POLICY "theater_owner_delete_events" ON events
  FOR DELETE USING (
    theater_id IN (
      SELECT theater_id FROM theater_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
    )
  );
```

### Logic bảo vệ phía client

- Không cho phép xóa event đã có `current_participants > 0`
- Không cho phép chỉnh sửa event có status `'completed'` hoặc `'cancelled'`
- Chỉ cho phép đổi status theo luồng: `draft → published`, `published → cancelled`, `published → completed`

---

## 7. Thống Kê Nhanh (Dashboard Cards)

Hiển thị 4 card ở đầu trang:

| Card | Công thức |
|------|-----------|
| 📋 Tổng sự kiện | `events.length` |
| 🟢 Đang đăng | `events.filter(e => e.status === 'published').length` |
| 📅 Sắp diễn (7 ngày) | Events có `event_date` trong 7 ngày tới và `status='published'` |
| 👥 Tổng người đăng ký | `sum(current_participants)` của tháng hiện tại |

---

## 8. Checklist Triển Khai

### Backend (Supabase)
- [ ] Tạo enum types: `event_type`, `event_status`
- [ ] Tạo/verify bảng `events` đầy đủ cột
- [ ] Bật RLS và tạo các policies
- [ ] Tạo index: `events(theater_id)`, `events(event_date)`, `events(status)`

### Frontend
- [ ] Tạo `theaterEventsService.js`
- [ ] Tạo `useTheaterEvents.js` hook
- [ ] Tạo `EventsPage.jsx` với route `/theater/events`
- [ ] Tạo `EventCard.jsx` component
- [ ] Tạo `EventFormModal.jsx` với validation đầy đủ
- [ ] Tạo `EventFilters.jsx`
- [ ] Tạo `EventStatusBadge.jsx`
- [ ] Thêm route vào router config
- [ ] Thêm link "Sự Kiện" vào Theater Sidebar navigation
- [ ] Test CRUD đầy đủ với Supabase thực

### UX
- [ ] Loading skeleton khi fetch dữ liệu
- [ ] Empty state khi chưa có sự kiện nào
- [ ] Toast notification cho mọi hành động CRUD
- [ ] Confirm dialog trước khi xóa
- [ ] Responsive layout (mobile/desktop)
- [ ] Error boundary xử lý lỗi fetch

---

## 9. Ghi Chú Tích Hợp

- **Venues:** Khi mở form tạo sự kiện, fetch danh sách venues của theater qua `venues` table để populate dropdown "Địa điểm".
- **Booking System:** Khi `current_participants` đạt `max_participants`, tự động cập nhật trạng thái hiển thị "Hết chỗ" trên trang công khai `/events`.
- **Public Events Page:** Events có `status = 'published'` sẽ được hiển thị trên trang `/events` công khai cho người dùng đặt vé.
- **Notifications:** Cân nhắc dùng Supabase Realtime để cập nhật `current_participants` theo thời gian thực khi có người đặt vé.

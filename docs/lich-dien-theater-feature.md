# 🎭 Tính Năng: Quản Lí Lịch Diễn (Theater Schedule Management)

> **Route:** `/theater/schedules`  
> **Vai trò:** Theater Owner / Admin  
> **Database:** Supabase – bảng `schedules`

---

## 1. Tổng Quan Tính Năng

Tính năng **Quản lí Lịch Diễn** cho phép chủ rạp (theater owner) tạo, xem, sửa, xoá và quản lý toàn bộ lịch biểu diễn của nhà hát mình. Giao diện hỗ trợ 2 chế độ xem: **Calendar View** (lịch tháng/tuần) và **List View** (danh sách), kết hợp bộ lọc theo trạng thái và địa điểm.

### Các chức năng chính:
- **Xem lịch diễn** theo dạng calendar hoặc danh sách
- **Tạo lịch diễn mới** với đầy đủ thông tin (tiêu đề, thời gian, địa điểm, giá vé, trạng thái...)
- **Chỉnh sửa** thông tin lịch diễn đã tồn tại
- **Xoá** lịch diễn
- **Lọc** theo trạng thái (`draft`, `published`, `cancelled`, `completed`) và theo venue
- **Bật/tắt đặt vé online** (`enable_booking`)
- **Cấu hình giá vé** (`pricing` dạng JSON)

---

## 2. Cấu Trúc Database

### Bảng `schedules`

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | `uuid` | ✅ | Primary key, tự sinh |
| `theater_id` | `uuid` | ✅ | FK → bảng `theaters` |
| `show_id` | `uuid` | ✅ | FK → bảng `shows` |
| `venue_id` | `uuid` | ✅ | FK → bảng `venues` |
| `title` | `text` | ✅ | Tên buổi diễn |
| `description` | `text` | ❌ | Mô tả chi tiết |
| `start_datetime` | `timestamptz` | ✅ | Thời điểm bắt đầu |
| `end_datetime` | `timestamptz` | ✅ | Thời điểm kết thúc |
| `timezone` | `text` | ❌ | Múi giờ (vd: `Asia/Ho_Chi_Minh`) |
| `status` | `event_status` | ❌ | Trạng thái: `draft` / `published` / `cancelled` / `completed` |
| `ticket_url` | `text` | ❌ | URL mua vé ngoài (nếu có) |
| `enable_booking` | `boolean` | ❌ | Bật/tắt đặt vé qua hệ thống |
| `pricing` | `jsonb` | ❌ | Cấu hình giá vé (xem mẫu bên dưới) |
| `created_at` | `timestamptz` | ❌ | Tự sinh |
| `updated_at` | `timestamptz` | ❌ | Tự cập nhật |

### Cấu trúc mẫu trường `pricing` (JSONB):
```json
{
  "tiers": [
    { "name": "Hạng A", "price": 200000, "currency": "VND" },
    { "name": "Hạng B", "price": 150000, "currency": "VND" },
    { "name": "Học sinh / Sinh viên", "price": 100000, "currency": "VND" }
  ]
}
```

### Enum `event_status`:
```sql
CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
```

---

## 3. Backend – Supabase

### 3.1. Row Level Security (RLS)

```sql
-- Cho phép theater owner xem lịch diễn của mình
CREATE POLICY "Theater owner can view own schedules"
  ON schedules FOR SELECT
  USING (
    theater_id IN (
      SELECT id FROM theaters WHERE owner_id = auth.uid()
    )
  );

-- Cho phép theater owner tạo lịch diễn
CREATE POLICY "Theater owner can insert schedules"
  ON schedules FOR INSERT
  WITH CHECK (
    theater_id IN (
      SELECT id FROM theaters WHERE owner_id = auth.uid()
    )
  );

-- Cho phép theater owner sửa lịch diễn của mình
CREATE POLICY "Theater owner can update own schedules"
  ON schedules FOR UPDATE
  USING (
    theater_id IN (
      SELECT id FROM theaters WHERE owner_id = auth.uid()
    )
  );

-- Cho phép theater owner xoá lịch diễn của mình
CREATE POLICY "Theater owner can delete own schedules"
  ON schedules FOR DELETE
  USING (
    theater_id IN (
      SELECT id FROM theaters WHERE owner_id = auth.uid()
    )
  );
```

### 3.2. Trigger tự cập nhật `updated_at`

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3.3. Các query Supabase thường dùng (dùng trong React)

```js
// Lấy tất cả lịch diễn của theater hiện tại
const { data, error } = await supabase
  .from('schedules')
  .select(`
    *,
    venues(id, name),
    shows(id, title)
  `)
  .eq('theater_id', theaterId)
  .order('start_datetime', { ascending: true });

// Tạo lịch diễn mới
const { data, error } = await supabase
  .from('schedules')
  .insert({
    theater_id,
    show_id,
    venue_id,
    title,
    description,
    start_datetime,
    end_datetime,
    timezone: 'Asia/Ho_Chi_Minh',
    status: 'draft',
    enable_booking: false,
    pricing
  })
  .select()
  .single();

// Cập nhật lịch diễn
const { data, error } = await supabase
  .from('schedules')
  .update({ title, status, enable_booking, pricing, updated_at: new Date() })
  .eq('id', scheduleId)
  .select()
  .single();

// Xoá lịch diễn
const { error } = await supabase
  .from('schedules')
  .delete()
  .eq('id', scheduleId);

// Lọc theo status và venue
const { data, error } = await supabase
  .from('schedules')
  .select('*, venues(id, name)')
  .eq('theater_id', theaterId)
  .eq('status', filterStatus)    // 'published' | 'draft' | ...
  .eq('venue_id', filterVenueId)
  .gte('start_datetime', startDate)
  .lte('end_datetime', endDate);
```

---

## 4. Frontend – React

### 4.1. Cấu Trúc File

```
src/
├── pages/
│   └── theater/
│       └── Schedules.jsx          # Trang chính /theater/schedules
├── components/
│   └── theater/
│       └── schedules/
│           ├── ScheduleCalendar.jsx   # Calendar view
│           ├── ScheduleList.jsx       # List view (bảng danh sách)
│           ├── ScheduleCard.jsx       # Card hiển thị 1 lịch diễn
│           ├── ScheduleFormModal.jsx  # Modal tạo / chỉnh sửa
│           ├── ScheduleFilters.jsx    # Bộ lọc (status, venue, date)
│           └── PricingEditor.jsx      # Editor cho trường pricing JSONB
├── hooks/
│   └── useSchedules.js            # Custom hook gọi Supabase
└── utils/
    └── scheduleHelpers.js         # Format date, validate, ...
```

### 4.2. Custom Hook `useSchedules.js`

```js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useSchedules(theaterId) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSchedules = useCallback(async (filters = {}) => {
    setLoading(true);
    let query = supabase
      .from('schedules')
      .select('*, venues(id, name), shows(id, title)')
      .eq('theater_id', theaterId)
      .order('start_datetime', { ascending: true });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.venue_id) query = query.eq('venue_id', filters.venue_id);
    if (filters.from) query = query.gte('start_datetime', filters.from);
    if (filters.to) query = query.lte('start_datetime', filters.to);

    const { data, error } = await query;
    if (error) setError(error.message);
    else setSchedules(data || []);
    setLoading(false);
  }, [theaterId]);

  const createSchedule = async (payload) => {
    const { data, error } = await supabase
      .from('schedules')
      .insert({ ...payload, theater_id: theaterId })
      .select().single();
    if (!error) setSchedules(prev => [...prev, data]);
    return { data, error };
  };

  const updateSchedule = async (id, payload) => {
    const { data, error } = await supabase
      .from('schedules')
      .update(payload)
      .eq('id', id)
      .select().single();
    if (!error) setSchedules(prev => prev.map(s => s.id === id ? data : s));
    return { data, error };
  };

  const deleteSchedule = async (id) => {
    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (!error) setSchedules(prev => prev.filter(s => s.id !== id));
    return { error };
  };

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  return { schedules, loading, error, fetchSchedules, createSchedule, updateSchedule, deleteSchedule };
}
```

### 4.3. Trang Chính `Schedules.jsx`

```jsx
import { useState } from 'react';
import { useSchedules } from '../../hooks/useSchedules';
import ScheduleCalendar from '../../components/theater/schedules/ScheduleCalendar';
import ScheduleList from '../../components/theater/schedules/ScheduleList';
import ScheduleFormModal from '../../components/theater/schedules/ScheduleFormModal';
import ScheduleFilters from '../../components/theater/schedules/ScheduleFilters';

export default function TheaterSchedules() {
  const theaterId = /* lấy từ auth context hoặc URL param */;
  const { schedules, loading, error, fetchSchedules, createSchedule, updateSchedule, deleteSchedule } = useSchedules(theaterId);

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [filters, setFilters] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  const handleCreate = () => {
    setEditingSchedule(null);
    setModalOpen(true);
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setModalOpen(true);
  };

  const handleSubmit = async (formData) => {
    const result = editingSchedule
      ? await updateSchedule(editingSchedule.id, formData)
      : await createSchedule(formData);
    if (!result.error) setModalOpen(false);
    return result;
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    fetchSchedules(newFilters);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🎭 Lịch Biểu Diễn</h1>
        <button onClick={handleCreate} className="btn-primary">
          + Thêm lịch diễn
        </button>
      </div>

      {/* Filters + View toggle */}
      <div className="flex gap-4 mb-4">
        <ScheduleFilters theaterId={theaterId} onChange={handleFilterChange} />
        <div className="ml-auto flex gap-2">
          <button onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'btn-active' : 'btn'}>Danh sách</button>
          <button onClick={() => setViewMode('calendar')} className={viewMode === 'calendar' ? 'btn-active' : 'btn'}>Lịch</button>
        </div>
      </div>

      {/* Content */}
      {loading && <p>Đang tải...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && viewMode === 'list' && (
        <ScheduleList schedules={schedules} onEdit={handleEdit} onDelete={deleteSchedule} />
      )}
      {!loading && viewMode === 'calendar' && (
        <ScheduleCalendar schedules={schedules} onEdit={handleEdit} />
      )}

      {/* Modal */}
      {modalOpen && (
        <ScheduleFormModal
          theaterId={theaterId}
          schedule={editingSchedule}
          onSubmit={handleSubmit}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
```

### 4.4. Form Modal `ScheduleFormModal.jsx`

```jsx
import { useState } from 'react';
import PricingEditor from './PricingEditor';

const STATUS_OPTIONS = ['draft', 'published', 'cancelled', 'completed'];

export default function ScheduleFormModal({ theaterId, schedule, onSubmit, onClose }) {
  const isEdit = !!schedule;
  const [form, setForm] = useState({
    show_id: schedule?.show_id || '',
    venue_id: schedule?.venue_id || '',
    title: schedule?.title || '',
    description: schedule?.description || '',
    start_datetime: schedule?.start_datetime?.slice(0, 16) || '',
    end_datetime: schedule?.end_datetime?.slice(0, 16) || '',
    timezone: schedule?.timezone || 'Asia/Ho_Chi_Minh',
    status: schedule?.status || 'draft',
    ticket_url: schedule?.ticket_url || '',
    enable_booking: schedule?.enable_booking ?? false,
    pricing: schedule?.pricing || { tiers: [] },
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.show_id) e.show_id = 'Vui lòng chọn vở diễn';
    if (!form.venue_id) e.venue_id = 'Vui lòng chọn địa điểm';
    if (!form.title.trim()) e.title = 'Tiêu đề không được để trống';
    if (!form.start_datetime) e.start_datetime = 'Chọn thời gian bắt đầu';
    if (!form.end_datetime) e.end_datetime = 'Chọn thời gian kết thúc';
    if (form.start_datetime && form.end_datetime && form.end_datetime <= form.start_datetime)
      e.end_datetime = 'Thời gian kết thúc phải sau bắt đầu';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    const payload = {
      ...form,
      start_datetime: new Date(form.start_datetime).toISOString(),
      end_datetime: new Date(form.end_datetime).toISOString(),
    };
    const result = await onSubmit(payload);
    if (result?.error) setErrors({ general: result.error.message });
    setSubmitting(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2>{isEdit ? 'Chỉnh sửa lịch diễn' : 'Tạo lịch diễn mới'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label>Tiêu đề *</label>
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            {errors.title && <span className="error">{errors.title}</span>}
          </div>

          {/* Show ID & Venue ID – dùng Select từ dữ liệu thực */}
          <div>
            <label>Vở diễn *</label>
            <input value={form.show_id} onChange={e => setForm({...form, show_id: e.target.value})} placeholder="UUID vở diễn" />
            {errors.show_id && <span className="error">{errors.show_id}</span>}
          </div>

          <div>
            <label>Địa điểm *</label>
            <input value={form.venue_id} onChange={e => setForm({...form, venue_id: e.target.value})} placeholder="UUID địa điểm" />
            {errors.venue_id && <span className="error">{errors.venue_id}</span>}
          </div>

          {/* Start / End datetime */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Bắt đầu *</label>
              <input type="datetime-local" value={form.start_datetime} onChange={e => setForm({...form, start_datetime: e.target.value})} />
              {errors.start_datetime && <span className="error">{errors.start_datetime}</span>}
            </div>
            <div>
              <label>Kết thúc *</label>
              <input type="datetime-local" value={form.end_datetime} onChange={e => setForm({...form, end_datetime: e.target.value})} />
              {errors.end_datetime && <span className="error">{errors.end_datetime}</span>}
            </div>
          </div>

          {/* Status */}
          <div>
            <label>Trạng thái</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label>Mô tả</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} />
          </div>

          {/* Enable booking */}
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.enable_booking} onChange={e => setForm({...form, enable_booking: e.target.checked})} id="enable_booking" />
            <label htmlFor="enable_booking">Bật đặt vé online</label>
          </div>

          {/* Ticket URL */}
          <div>
            <label>URL mua vé ngoài</label>
            <input value={form.ticket_url} onChange={e => setForm({...form, ticket_url: e.target.value})} placeholder="https://..." />
          </div>

          {/* Pricing */}
          <PricingEditor pricing={form.pricing} onChange={pricing => setForm({...form, pricing})} />

          {errors.general && <p className="text-red-500">{errors.general}</p>}

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose}>Huỷ</button>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### 4.5. Hiển Thị Danh Sách `ScheduleList.jsx`

```jsx
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const STATUS_COLORS = {
  draft: 'bg-gray-200 text-gray-700',
  published: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
};

export default function ScheduleList({ schedules, onEdit, onDelete }) {
  if (schedules.length === 0) return <p className="text-gray-500">Chưa có lịch diễn nào.</p>;

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-50 text-left">
          <th className="p-3">Tiêu đề</th>
          <th className="p-3">Địa điểm</th>
          <th className="p-3">Bắt đầu</th>
          <th className="p-3">Kết thúc</th>
          <th className="p-3">Trạng thái</th>
          <th className="p-3">Đặt vé</th>
          <th className="p-3">Hành động</th>
        </tr>
      </thead>
      <tbody>
        {schedules.map(s => (
          <tr key={s.id} className="border-t hover:bg-gray-50">
            <td className="p-3 font-medium">{s.title}</td>
            <td className="p-3 text-sm text-gray-500">{s.venues?.name || '—'}</td>
            <td className="p-3 text-sm">{format(new Date(s.start_datetime), 'dd/MM/yyyy HH:mm', { locale: vi })}</td>
            <td className="p-3 text-sm">{format(new Date(s.end_datetime), 'dd/MM/yyyy HH:mm', { locale: vi })}</td>
            <td className="p-3">
              <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[s.status] || ''}`}>
                {s.status}
              </span>
            </td>
            <td className="p-3">
              <span className={s.enable_booking ? 'text-green-600' : 'text-gray-400'}>
                {s.enable_booking ? '✅' : '—'}
              </span>
            </td>
            <td className="p-3 flex gap-2">
              <button onClick={() => onEdit(s)} className="text-blue-500 hover:underline text-sm">Sửa</button>
              <button onClick={() => { if(confirm('Xác nhận xoá?')) onDelete(s.id); }} className="text-red-500 hover:underline text-sm">Xoá</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 4.6. Bộ Lọc `ScheduleFilters.jsx`

```jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

const STATUS_OPTIONS = ['', 'draft', 'published', 'cancelled', 'completed'];

export default function ScheduleFilters({ theaterId, onChange }) {
  const [venues, setVenues] = useState([]);
  const [filters, setFilters] = useState({ status: '', venue_id: '', from: '', to: '' });

  useEffect(() => {
    supabase.from('venues').select('id, name').eq('theater_id', theaterId).then(({ data }) => setVenues(data || []));
  }, [theaterId]);

  const update = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onChange(Object.fromEntries(Object.entries(next).filter(([,v]) => v !== '')));
  };

  return (
    <div className="flex gap-3 flex-wrap items-center">
      <select value={filters.status} onChange={e => update('status', e.target.value)}>
        <option value="">Tất cả trạng thái</option>
        {STATUS_OPTIONS.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <select value={filters.venue_id} onChange={e => update('venue_id', e.target.value)}>
        <option value="">Tất cả địa điểm</option>
        {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
      </select>

      <input type="date" value={filters.from} onChange={e => update('from', e.target.value)} placeholder="Từ ngày" />
      <input type="date" value={filters.to} onChange={e => update('to', e.target.value)} placeholder="Đến ngày" />
    </div>
  );
}
```

### 4.7. PricingEditor `PricingEditor.jsx`

```jsx
export default function PricingEditor({ pricing, onChange }) {
  const tiers = pricing?.tiers || [];

  const addTier = () => onChange({ ...pricing, tiers: [...tiers, { name: '', price: 0, currency: 'VND' }] });
  const removeTier = (i) => onChange({ ...pricing, tiers: tiers.filter((_, idx) => idx !== i) });
  const updateTier = (i, field, value) => {
    const updated = tiers.map((t, idx) => idx === i ? { ...t, [field]: value } : t);
    onChange({ ...pricing, tiers: updated });
  };

  return (
    <div>
      <label className="font-medium">Cấu hình giá vé</label>
      {tiers.map((tier, i) => (
        <div key={i} className="flex gap-2 mt-2 items-center">
          <input placeholder="Loại vé" value={tier.name} onChange={e => updateTier(i, 'name', e.target.value)} className="flex-1" />
          <input type="number" placeholder="Giá" value={tier.price} onChange={e => updateTier(i, 'price', Number(e.target.value))} className="w-28" />
          <span className="text-sm text-gray-500">VND</span>
          <button type="button" onClick={() => removeTier(i)} className="text-red-400">✕</button>
        </div>
      ))}
      <button type="button" onClick={addTier} className="mt-2 text-blue-500 text-sm">+ Thêm loại vé</button>
    </div>
  );
}
```

---

## 5. Routing

Thêm route vào file router (React Router v6):

```jsx
// src/router.jsx hoặc App.jsx
import TheaterSchedules from './pages/theater/Schedules';

// Trong <Routes>:
<Route path="/theater/schedules" element={
  <ProtectedRoute roles={['theater_owner', 'admin']}>
    <TheaterSchedules />
  </ProtectedRoute>
} />
```

---

## 6. Validation Logic

| Trường | Rule |
|---|---|
| `title` | Không được để trống, tối đa 255 ký tự |
| `show_id` | Phải là UUID hợp lệ, tồn tại trong bảng `shows` |
| `venue_id` | Phải là UUID hợp lệ, thuộc `theater_id` hiện tại |
| `start_datetime` | Không được ở quá khứ khi tạo mới |
| `end_datetime` | Phải lớn hơn `start_datetime` |
| `pricing` | Mỗi tier: `name` không rỗng, `price` ≥ 0 |
| `ticket_url` | Nếu có, phải là URL hợp lệ (bắt đầu `http://` hoặc `https://`) |

---

## 7. Luồng Hoạt Động

```
Theater Owner truy cập /theater/schedules
        │
        ▼
Hệ thống load danh sách lịch diễn (fetch từ Supabase)
        │
        ├─── Xem dạng List ─────────── Xem dạng Calendar
        │
        ├─── Lọc theo status / venue / ngày
        │
        ├─── Nhấn "Thêm lịch diễn" ──► Mở ScheduleFormModal (Create)
        │         └─── Điền form → Validate → Insert Supabase → Update state
        │
        ├─── Nhấn "Sửa" trên 1 dòng ─► Mở ScheduleFormModal (Edit)
        │         └─── Chỉnh sửa → Validate → Update Supabase → Update state
        │
        └─── Nhấn "Xoá" ────────────► Confirm → Delete Supabase → Remove state
```

---

## 8. Packages Cần Cài

```bash
npm install date-fns           # Format ngày giờ tiếng Việt
npm install @supabase/supabase-js  # Đã có nếu dùng Supabase
# Calendar view (tuỳ chọn):
npm install react-big-calendar # Thư viện lịch đầy đủ tính năng
npm install moment             # Bắt buộc nếu dùng react-big-calendar
```

---

## 9. Checklist Triển Khai

- [ ] Tạo / xác nhận enum `event_status` trong Supabase
- [ ] Kích hoạt RLS và thêm các policy cho bảng `schedules`
- [ ] Thêm trigger `updated_at`
- [ ] Tạo file cấu trúc component theo mục 4.1
- [ ] Implement `useSchedules` hook
- [ ] Build `Schedules.jsx` trang chính
- [ ] Build `ScheduleFormModal.jsx` với validate đầy đủ
- [ ] Build `ScheduleList.jsx` + `ScheduleFilters.jsx`
- [ ] Build `PricingEditor.jsx`
- [ ] Thêm route `/theater/schedules` với `ProtectedRoute`
- [ ] Test CRUD end-to-end
- [ ] Test RLS (đảm bảo theater owner chỉ thấy data của mình)

---

*Tài liệu này là hướng dẫn kỹ thuật nội bộ cho dự án Nền Tảng Tương Tác Tuồng Việt Nam.*

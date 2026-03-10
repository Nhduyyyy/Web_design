# 🎭 Tính Năng Quản Lý Vở Diễn (Shows) – Hướng Dẫn Phát Triển

> **Dự án:** Nền Tảng Tương Tác Tuồng Việt Nam  
> **Đường dẫn:** `/theater/shows`  
> **Phiên bản:** 1.0.0  
> **Ngày cập nhật:** 2026

---

## 📋 Mục Lục

1. [Tổng Quan](#1-tổng-quan)
2. [Cấu Trúc Bảng Dữ Liệu](#2-cấu-trúc-bảng-dữ-liệu)
3. [Kiến Trúc Component](#3-kiến-trúc-component)
4. [Supabase – Database & API](#4-supabase--database--api)
5. [Triển Khai Từng Bước](#5-triển-khai-từng-bước)
6. [Giao Diện & UX](#6-giao-diện--ux)
7. [Validation & Error Handling](#7-validation--error-handling)
8. [Tích Hợp Với Các Module Khác](#8-tích-hợp-với-các-module-khác)
9. [Checklist Hoàn Thành](#9-checklist-hoàn-thành)

---

## 1. Tổng Quan

Tính năng **Quản lý Vở Diễn (Shows)** cho phép Theater Owner hoặc Admin quản lý danh sách vở diễn Tuồng trên nền tảng. Mỗi vở diễn là một đơn vị nội dung nghệ thuật độc lập, có thể được lên lịch biểu diễn, gán địa điểm, bán vé và hiển thị cho khán giả.

### Các hành động chính

| Hành động | Mô tả |
|-----------|-------|
| **Xem danh sách** | Hiển thị tất cả vở diễn dưới dạng card/table |
| **Tạo mới** | Form tạo vở diễn với đầy đủ thông tin |
| **Chỉnh sửa** | Cập nhật thông tin vở diễn |
| **Xóa** | Xóa vở diễn (có xác nhận) |
| **Xem chi tiết** | Trang chi tiết vở diễn với trailer, nhân vật, tóm tắt |
| **Tìm kiếm & lọc** | Lọc theo tags, thời lượng, nhân vật |

---

## 2. Cấu Trúc Bảng Dữ Liệu

### Bảng `shows` trong Supabase

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mô Tả |
|---------|-------------|----------|-------|
| `id` | `uuid` | ❌ NOT NULL | Primary key, tự động sinh UUID |
| `title` | `text` | ❌ NOT NULL | Tên vở diễn (bắt buộc) |
| `description` | `text` | ✅ NULL | Mô tả ngắn (hiển thị ở card) |
| `synopsis` | `text` | ✅ NULL | Tóm tắt nội dung chi tiết |
| `duration` | `int4` | ✅ NULL | Thời lượng biểu diễn (phút) |
| `thumbnail_url` | `text` | ✅ NULL | URL ảnh thumbnail (danh sách) |
| `cover_image_url` | `text` | ✅ NULL | URL ảnh bìa (trang chi tiết) |
| `trailer_url` | `text` | ✅ NULL | URL video trailer |
| `tags` | `text[]` | ✅ NULL | Mảng nhãn phân loại |
| `characters` | `text[]` | ✅ NULL | Mảng tên nhân vật |
| `created_at` | `timestamptz` | ✅ NULL | Thời điểm tạo (auto) |
| `updated_at` | `timestamptz` | ✅ NULL | Thời điểm cập nhật (auto) |

### Migration SQL

```sql
-- Tạo bảng shows
CREATE TABLE IF NOT EXISTS public.shows (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  description     text,
  synopsis        text,
  duration        int4,
  thumbnail_url   text,
  cover_image_url text,
  trailer_url     text,
  tags            text[],
  characters      text[],
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_shows_updated_at
  BEFORE UPDATE ON public.shows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;

-- Tất cả người dùng có thể xem
CREATE POLICY "Shows are viewable by everyone"
  ON public.shows FOR SELECT USING (true);

-- Chỉ admin/theater owner mới tạo/sửa/xóa
CREATE POLICY "Admins can manage shows"
  ON public.shows FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'theater_owner')
    )
  );
```

### TypeScript Interface

```typescript
// src/types/show.ts

export interface Show {
  id: string;
  title: string;
  description?: string | null;
  synopsis?: string | null;
  duration?: number | null;          // Thời lượng tính bằng phút
  thumbnail_url?: string | null;
  cover_image_url?: string | null;
  trailer_url?: string | null;
  tags?: string[] | null;
  characters?: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type ShowInsert = Omit<Show, 'id' | 'created_at' | 'updated_at'>;
export type ShowUpdate = Partial<ShowInsert>;

export interface ShowFilters {
  search?: string;
  tags?: string[];
  minDuration?: number;
  maxDuration?: number;
}
```

---

## 3. Kiến Trúc Component

```
src/
├── pages/
│   └── theater/
│       └── Shows.tsx                  ← Trang danh sách chính (/theater/shows)
├── components/
│   └── shows/
│       ├── ShowCard.tsx               ← Card hiển thị 1 vở diễn
│       ├── ShowList.tsx               ← Danh sách shows (grid/table)
│       ├── ShowForm.tsx               ← Form tạo/chỉnh sửa
│       ├── ShowDetail.tsx             ← Modal/trang chi tiết
│       ├── ShowFilters.tsx            ← Bộ lọc (tags, duration, search)
│       ├── ShowDeleteConfirm.tsx      ← Dialog xác nhận xóa
│       └── ShowTagInput.tsx           ← Input nhập tags & characters
├── hooks/
│   └── useShows.ts                    ← Custom hook quản lý state & API
├── services/
│   └── showsService.ts               ← Các hàm gọi Supabase
└── types/
    └── show.ts                        ← TypeScript interfaces
```

---

## 4. Supabase – Database & API

### Service Layer (`src/services/showsService.ts`)

```typescript
import { supabase } from '@/lib/supabase';
import type { Show, ShowInsert, ShowUpdate, ShowFilters } from '@/types/show';

// ── Lấy danh sách shows ───────────────────────────────────────────────────────
export async function getShows(filters?: ShowFilters): Promise<Show[]> {
  let query = supabase
    .from('shows')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.search) {
    query = query.ilike('title', `%${filters.search}%`);
  }
  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags);
  }
  if (filters?.minDuration) {
    query = query.gte('duration', filters.minDuration);
  }
  if (filters?.maxDuration) {
    query = query.lte('duration', filters.maxDuration);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// ── Lấy 1 show theo ID ────────────────────────────────────────────────────────
export async function getShowById(id: string): Promise<Show | null> {
  const { data, error } = await supabase
    .from('shows')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// ── Tạo mới show ──────────────────────────────────────────────────────────────
export async function createShow(payload: ShowInsert): Promise<Show> {
  const { data, error } = await supabase
    .from('shows')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── Cập nhật show ─────────────────────────────────────────────────────────────
export async function updateShow(id: string, payload: ShowUpdate): Promise<Show> {
  const { data, error } = await supabase
    .from('shows')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── Xóa show ──────────────────────────────────────────────────────────────────
export async function deleteShow(id: string): Promise<void> {
  const { error } = await supabase
    .from('shows')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
```

### Custom Hook (`src/hooks/useShows.ts`)

```typescript
import { useState, useEffect, useCallback } from 'react';
import * as showsService from '@/services/showsService';
import type { Show, ShowInsert, ShowUpdate, ShowFilters } from '@/types/show';

export function useShows(filters?: ShowFilters) {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await showsService.getShows(filters);
      setShows(data);
    } catch (err: any) {
      setError(err.message ?? 'Không thể tải danh sách vở diễn');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchShows(); }, [fetchShows]);

  const createShow = async (payload: ShowInsert) => {
    const newShow = await showsService.createShow(payload);
    setShows(prev => [newShow, ...prev]);
    return newShow;
  };

  const updateShow = async (id: string, payload: ShowUpdate) => {
    const updated = await showsService.updateShow(id, payload);
    setShows(prev => prev.map(s => s.id === id ? updated : s));
    return updated;
  };

  const deleteShow = async (id: string) => {
    await showsService.deleteShow(id);
    setShows(prev => prev.filter(s => s.id !== id));
  };

  return { shows, loading, error, refetch: fetchShows, createShow, updateShow, deleteShow };
}
```

---

## 5. Triển Khai Từng Bước

### Bước 1 – Tạo bảng Supabase

1. Mở **Supabase Dashboard → SQL Editor**
2. Chạy đoạn migration SQL ở [Mục 2](#migration-sql)
3. Kiểm tra bảng xuất hiện trong **Table Editor**
4. Cấu hình **Storage Bucket** (nếu upload ảnh trực tiếp):
   - Tạo bucket tên `show-assets` (public)
   - Cho phép upload file `image/*` và `video/*`

### Bước 2 – Tạo TypeScript types & service

```bash
# Tạo các file cần thiết
touch src/types/show.ts
touch src/services/showsService.ts
touch src/hooks/useShows.ts
```

Sao chép code từ [Mục 4](#4-supabase--database--api) vào từng file.

### Bước 3 – Tạo ShowCard Component

```tsx
// src/components/shows/ShowCard.tsx
import { Clock, Tag, Users, Edit2, Trash2, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Show } from '@/types/show';

interface Props {
  show: Show;
  onEdit: (show: Show) => void;
  onDelete: (show: Show) => void;
  onView: (show: Show) => void;
}

export function ShowCard({ show, onEdit, onDelete, onView }: Props) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl overflow-hidden shadow-md border border-amber-100"
    >
      {/* Thumbnail */}
      <div className="relative h-48 bg-amber-50">
        {show.thumbnail_url ? (
          <img
            src={show.thumbnail_url}
            alt={show.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-amber-200">
            🎭
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{show.title}</h3>

        {show.description && (
          <p className="text-sm text-gray-500 line-clamp-2">{show.description}</p>
        )}

        <div className="flex flex-wrap gap-2 text-xs text-gray-400">
          {show.duration && (
            <span className="flex items-center gap-1">
              <Clock size={12} /> {show.duration} phút
            </span>
          )}
          {show.characters && show.characters.length > 0 && (
            <span className="flex items-center gap-1">
              <Users size={12} /> {show.characters.length} nhân vật
            </span>
          )}
        </div>

        {/* Tags */}
        {show.tags && show.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {show.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button onClick={() => onView(show)}
            className="flex-1 flex items-center justify-center gap-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg py-1.5">
            <Eye size={14} /> Xem
          </button>
          <button onClick={() => onEdit(show)}
            className="flex-1 flex items-center justify-center gap-1 text-sm text-amber-600 hover:bg-amber-50 rounded-lg py-1.5">
            <Edit2 size={14} /> Sửa
          </button>
          <button onClick={() => onDelete(show)}
            className="flex-1 flex items-center justify-center gap-1 text-sm text-red-500 hover:bg-red-50 rounded-lg py-1.5">
            <Trash2 size={14} /> Xóa
          </button>
        </div>
      </div>
    </motion.div>
  );
}
```

### Bước 4 – Tạo ShowForm Component

```tsx
// src/components/shows/ShowForm.tsx
import { useState } from 'react';
import type { Show, ShowInsert } from '@/types/show';

interface Props {
  initialData?: Show;
  onSubmit: (data: ShowInsert) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function ShowForm({ initialData, onSubmit, onCancel, loading }: Props) {
  const [form, setForm] = useState<ShowInsert>({
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    synopsis: initialData?.synopsis ?? '',
    duration: initialData?.duration ?? undefined,
    thumbnail_url: initialData?.thumbnail_url ?? '',
    cover_image_url: initialData?.cover_image_url ?? '',
    trailer_url: initialData?.trailer_url ?? '',
    tags: initialData?.tags ?? [],
    characters: initialData?.characters ?? [],
  });

  const [tagInput, setTagInput] = useState('');
  const [charInput, setCharInput] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof ShowInsert, string>>>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!form.title.trim()) newErrors.title = 'Tên vở diễn không được để trống';
    if (form.duration && form.duration <= 0) newErrors.duration = 'Thời lượng phải lớn hơn 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
  };

  const addTag = () => {
    const val = tagInput.trim();
    if (val && !form.tags?.includes(val)) {
      setForm(f => ({ ...f, tags: [...(f.tags ?? []), val] }));
    }
    setTagInput('');
  };

  const removeTag = (tag: string) =>
    setForm(f => ({ ...f, tags: f.tags?.filter(t => t !== tag) }));

  const addCharacter = () => {
    const val = charInput.trim();
    if (val && !form.characters?.includes(val)) {
      setForm(f => ({ ...f, characters: [...(f.characters ?? []), val] }));
    }
    setCharInput('');
  };

  const removeCharacter = (char: string) =>
    setForm(f => ({ ...f, characters: f.characters?.filter(c => c !== char) }));

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tên vở diễn <span className="text-red-500">*</span>
        </label>
        <input
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none"
          placeholder="VD: Trưng Nữ Vương"
        />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả ngắn</label>
        <textarea
          value={form.description ?? ''}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={2}
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none resize-none"
          placeholder="Mô tả hiển thị ở card vở diễn..."
        />
      </div>

      {/* Synopsis */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tóm tắt nội dung</label>
        <textarea
          value={form.synopsis ?? ''}
          onChange={e => setForm(f => ({ ...f, synopsis: e.target.value }))}
          rows={4}
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none resize-none"
          placeholder="Tóm tắt toàn bộ nội dung vở diễn..."
        />
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Thời lượng (phút)</label>
        <input
          type="number"
          min={1}
          value={form.duration ?? ''}
          onChange={e => setForm(f => ({ ...f, duration: e.target.value ? Number(e.target.value) : undefined }))}
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none"
          placeholder="VD: 120"
        />
        {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration}</p>}
      </div>

      {/* URLs */}
      {(['thumbnail_url', 'cover_image_url', 'trailer_url'] as const).map(field => (
        <div key={field}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {{ thumbnail_url: 'URL Thumbnail', cover_image_url: 'URL Ảnh Bìa', trailer_url: 'URL Trailer' }[field]}
          </label>
          <input
            value={(form[field] as string) ?? ''}
            onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none"
            placeholder="https://..."
          />
        </div>
      ))}

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
        <div className="flex gap-2 mb-2">
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
            className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none"
            placeholder="Nhập tag rồi Enter..."
          />
          <button type="button" onClick={addTag}
            className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200">
            + Thêm
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {form.tags?.map(tag => (
            <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">×</button>
            </span>
          ))}
        </div>
      </div>

      {/* Characters */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nhân vật</label>
        <div className="flex gap-2 mb-2">
          <input
            value={charInput}
            onChange={e => setCharInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCharacter())}
            className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none"
            placeholder="Tên nhân vật rồi Enter..."
          />
          <button type="button" onClick={addCharacter}
            className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200">
            + Thêm
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {form.characters?.map(char => (
            <span key={char} className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
              {char}
              <button type="button" onClick={() => removeCharacter(char)} className="hover:text-red-500">×</button>
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button type="button" onClick={onCancel}
          className="px-5 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
          Hủy
        </button>
        <button type="submit" disabled={loading}
          className="px-5 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50">
          {loading ? 'Đang lưu...' : initialData ? 'Cập nhật' : 'Tạo mới'}
        </button>
      </div>
    </form>
  );
}
```

### Bước 5 – Tạo trang chính Shows.tsx

```tsx
// src/pages/theater/Shows.tsx
import { useState } from 'react';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { useShows } from '@/hooks/useShows';
import { ShowCard } from '@/components/shows/ShowCard';
import { ShowForm } from '@/components/shows/ShowForm';
import type { Show, ShowInsert } from '@/types/show';

export default function ShowsPage() {
  const [search, setSearch] = useState('');
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Show | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const { shows, loading, error, refetch, createShow, updateShow, deleteShow } =
    useShows({ search });

  const handleSubmit = async (data: ShowInsert) => {
    setFormLoading(true);
    try {
      if (selectedShow) {
        await updateShow(selectedShow.id, data);
      } else {
        await createShow(data);
      }
      setShowForm(false);
      setSelectedShow(null);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteShow(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen bg-amber-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🎭 Quản Lý Vở Diễn</h1>
          <p className="text-sm text-gray-500 mt-1">{shows.length} vở diễn</p>
        </div>
        <button
          onClick={() => { setSelectedShow(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700"
        >
          <Plus size={18} /> Tạo vở diễn
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm kiếm theo tên vở diễn..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 outline-none bg-white"
        />
      </div>

      {/* States */}
      {loading && (
        <div className="flex justify-center py-20 text-amber-500">
          <RefreshCw className="animate-spin" /> &nbsp; Đang tải...
        </div>
      )}
      {error && (
        <div className="text-center py-10 text-red-500">{error}</div>
      )}

      {/* Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {shows.map(show => (
            <ShowCard
              key={show.id}
              show={show}
              onEdit={s => { setSelectedShow(s); setShowForm(true); }}
              onDelete={s => setDeleteTarget(s)}
              onView={s => {/* navigate to detail */}}
            />
          ))}
          {shows.length === 0 && (
            <div className="col-span-full text-center py-20 text-gray-400">
              Chưa có vở diễn nào. Hãy tạo vở diễn đầu tiên!
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-5">
              {selectedShow ? 'Chỉnh sửa vở diễn' : 'Tạo vở diễn mới'}
            </h2>
            <ShowForm
              initialData={selectedShow ?? undefined}
              onSubmit={handleSubmit}
              onCancel={() => { setShowForm(false); setSelectedShow(null); }}
              loading={formLoading}
            />
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <p className="text-lg font-semibold mb-2">Xóa vở diễn?</p>
            <p className="text-gray-500 text-sm mb-6">
              Bạn có chắc muốn xóa "<strong>{deleteTarget.title}</strong>"? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteTarget(null)}
                className="px-5 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">
                Hủy
              </button>
              <button onClick={handleDelete}
                className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Bước 6 – Đăng ký Route

```tsx
// Thêm vào router configuration (App.tsx hoặc router.tsx)
import ShowsPage from '@/pages/theater/Shows';

// Trong phần theater routes (được bảo vệ bởi Theater Owner / Admin)
<Route path="/theater/shows" element={
  <ProtectedRoute roles={['admin', 'theater_owner']}>
    <ShowsPage />
  </ProtectedRoute>
} />
```

---

## 6. Giao Diện & UX

### Layout Tổng Thể

```
┌─────────────────────────────────────────────────────┐
│  🎭 Quản Lý Vở Diễn              [+ Tạo vở diễn]  │
│  12 vở diễn                                         │
├─────────────────────────────────────────────────────┤
│  🔍 Tìm kiếm theo tên vở diễn...                   │
│  [Tag: Lịch sử ×] [Tag: Anh hùng ×]  [Xóa lọc]    │
├─────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ [thumb]  │  │ [thumb]  │  │ [thumb]  │          │
│  │ Tên vở  │  │ Tên vở  │  │ Tên vở  │          │
│  │ Mô tả.. │  │ Mô tả.. │  │ Mô tả.. │          │
│  │ ⏱ 90ph  │  │ ⏱ 120ph │  │ ⏱ 75ph  │          │
│  │ [tags]  │  │ [tags]  │  │ [tags]  │          │
│  │ Xem Sửa Xóa│  │ Xem Sửa Xóa│ │ Xem Sửa Xóa│  │
│  └──────────┘  └──────────┘  └──────────┘          │
└─────────────────────────────────────────────────────┘
```

### Màu sắc chủ đạo (Nhất quán với dự án)

| Yếu tố | Màu |
|--------|-----|
| Nền trang | `amber-50` |
| Card border | `amber-100` |
| Button chính | `amber-600` |
| Tags | `amber-100 / amber-700` |
| Characters | `blue-100 / blue-700` |
| Xóa | `red-500` |
| Text chính | `gray-900` |
| Text phụ | `gray-500` |

### Responsive Breakpoints

```
Mobile  (< 640px)  : 1 cột
Tablet  (640-1024px): 2 cột
Desktop (1024-1280px): 3 cột
Large   (> 1280px)  : 4 cột
```

---

## 7. Validation & Error Handling

### Các quy tắc validation

| Trường | Bắt buộc | Quy tắc |
|--------|----------|---------|
| `title` | ✅ | Không rỗng, tối đa 255 ký tự |
| `duration` | ❌ | Nếu có, phải > 0 (phút) |
| `thumbnail_url` | ❌ | Nếu có, phải là URL hợp lệ |
| `cover_image_url` | ❌ | Nếu có, phải là URL hợp lệ |
| `trailer_url` | ❌ | Nếu có, phải là URL hợp lệ |
| `tags` | ❌ | Mỗi tag không quá 50 ký tự |
| `characters` | ❌ | Mỗi tên không quá 100 ký tự |

### Các trạng thái cần xử lý

```
Loading state    → Skeleton cards hoặc spinner
Empty state      → Hướng dẫn tạo show đầu tiên
Error state      → Thông báo lỗi + nút Thử lại
Create success   → Toast "Tạo thành công!" + refetch
Update success   → Toast "Cập nhật thành công!"
Delete success   → Toast "Đã xóa vở diễn"
Network error    → Toast "Lỗi kết nối, vui lòng thử lại"
```

---

## 8. Tích Hợp Với Các Module Khác

### Kết nối với Schedule (Lịch diễn)

Khi tạo lịch diễn, dropdown chọn vở diễn sẽ lấy dữ liệu từ bảng `shows`:

```typescript
// Trong schedules, thêm foreign key
ALTER TABLE public.schedules
  ADD COLUMN show_id uuid REFERENCES public.shows(id) ON DELETE SET NULL;
```

### Kết nối với Events

```typescript
// Trong events, tham chiếu tới show
ALTER TABLE public.events
  ADD COLUMN show_id uuid REFERENCES public.shows(id);
```

### Kết nối với Seat Booking

Khi user đặt vé, flow sẽ là:
```
Event (ngày/giờ/địa điểm) → Show (vở diễn) → Seat Selection → Booking
```

### Kết nối với Mask Gallery / Character Showcase

Tags và characters trong Show có thể liên kết tới:
- `Character Showcase`: hiển thị chi tiết nhân vật từ `characters[]`
- `Mask Gallery`: lọc mặt nạ liên quan theo `tags[]`

---

## 9. Checklist Hoàn Thành

### Database
- [ ] Chạy migration SQL tạo bảng `shows`
- [ ] Cấu hình RLS Policies
- [ ] Tạo trigger `update_updated_at`
- [ ] Tạo Storage Bucket `show-assets` (nếu cần upload)

### Backend / Service
- [ ] Tạo `src/types/show.ts`
- [ ] Tạo `src/services/showsService.ts` (CRUD functions)
- [ ] Tạo `src/hooks/useShows.ts` (custom hook)

### Components
- [ ] `ShowCard.tsx` – Card hiển thị 1 vở diễn
- [ ] `ShowForm.tsx` – Form tạo/sửa
- [ ] `ShowDeleteConfirm.tsx` – Dialog xác nhận xóa
- [ ] `ShowDetail.tsx` – Trang/modal chi tiết (optional)
- [ ] `ShowFilters.tsx` – Bộ lọc nâng cao (optional)

### Routing & Auth
- [ ] Tạo `src/pages/theater/Shows.tsx`
- [ ] Đăng ký route `/theater/shows`
- [ ] Wrap bằng `ProtectedRoute` với roles `['admin', 'theater_owner']`
- [ ] Thêm link vào Theater Dashboard sidebar

### UI / UX
- [ ] Responsive layout (mobile/tablet/desktop)
- [ ] Loading state (spinner/skeleton)
- [ ] Empty state với CTA "Tạo vở diễn đầu tiên"
- [ ] Toast notifications (success/error)
- [ ] Animations (Framer Motion)

### Testing
- [ ] Tạo show mới thành công
- [ ] Validation khi để trống title
- [ ] Sửa show và lưu thành công
- [ ] Xóa show và xác nhận
- [ ] Tìm kiếm theo tên hoạt động
- [ ] Lọc theo tags hoạt động
- [ ] Phân quyền: user thường không truy cập được `/theater/shows`

---

> **Lưu ý:** Tất cả màu sắc và style nên nhất quán với design system của dự án (amber/gold tones cho chủ đề Tuồng truyền thống). Có thể mở rộng thêm tính năng AI gợi ý nội dung synopsis hoặc auto-tag dựa trên tên vở diễn trong các phiên bản sau.

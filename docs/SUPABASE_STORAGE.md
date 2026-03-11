# Supabase Storage — Hướng Dẫn Lưu Trữ Ảnh

Tài liệu này mô tả cách tích hợp Supabase Storage để lưu trữ ảnh upload từ người dùng, nhà hát (theater) và admin trên nền tảng Tuồng Việt Nam.

---

## 1. Cấu Trúc Storage Buckets

Tạo **3 bucket riêng biệt** trên Supabase Storage tương ứng với từng loại người dùng:

| Bucket Name       | Mục đích                                         | Access     |
|-------------------|--------------------------------------------------|------------|
| `user-photos`     | Ảnh chụp AR Photo Booth của người dùng           | Private    |
| `theater-assets`  | Ảnh/banner của nhà hát, venue, sự kiện           | Public     |
| `admin-assets`    | Ảnh quản trị hệ thống (logo, banner tổng, v.v.)  | Private    |

---

## 2. Tạo Buckets (SQL Migration)

```sql
-- Tạo bucket user-photos (private, giới hạn 50MB/file)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-photos',
  'user-photos',
  false,
  52428800, -- 50MB tính bằng bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Tạo bucket theater-assets (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'theater-assets',
  'theater-assets',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Tạo bucket admin-assets (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'admin-assets',
  'admin-assets',
  false,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);
```

---

## 3. Cấu Trúc Thư Mục Trong Bucket

### `user-photos/`
```
user-photos/
  └── {user_id}/
        └── photobooth/
              └── {timestamp}_{uuid}.png     ← ảnh AR Photo Booth
```

### `theater-assets/`
```
theater-assets/
  └── {theater_id}/
        ├── logo/
        │     └── logo.png
        ├── venues/
        │     └── {venue_id}/
        │           └── {timestamp}.jpg
        └── events/
              └── {event_id}/
                    └── banner.jpg
```

### `admin-assets/`
```
admin-assets/
  └── system/
        ├── banners/
        └── masks/
              └── {mask_id}.png             ← ảnh mặt nạ Tuồng
```

---

## 4. Bảng `user_photo` — Schema & Ràng Buộc

```sql
CREATE TABLE public.user_photo (
  id             UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  image_url      TEXT        NOT NULL,   -- URL từ Supabase Storage (bắt buộc)
  mask_id        UUID        REFERENCES public.masks(id) ON DELETE SET NULL,
  background_url TEXT,
  caption        TEXT,
  is_public      BOOLEAN     DEFAULT false,
  views          INTEGER     DEFAULT 0,
  likes          INTEGER     DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now()
);
```

> **Lưu ý:** `id` và `image_url` là hai trường **NOT NULL** bắt buộc. Các trường còn lại có thể null.

---

## 5. Row Level Security (RLS) Policies

### Bật RLS cho bảng `user_photo`

```sql
ALTER TABLE public.user_photo ENABLE ROW LEVEL SECURITY;
```

### Policies cho bảng `user_photo`

```sql
-- User chỉ đọc được ảnh public hoặc ảnh của chính mình
CREATE POLICY "user_photo_select"
  ON public.user_photo FOR SELECT
  USING (
    is_public = true
    OR auth.uid() = user_id
  );

-- User chỉ insert ảnh của chính mình
CREATE POLICY "user_photo_insert"
  ON public.user_photo FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User chỉ update ảnh của chính mình
CREATE POLICY "user_photo_update"
  ON public.user_photo FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User chỉ xóa ảnh của chính mình; Admin có thể xóa tất cả
CREATE POLICY "user_photo_delete"
  ON public.user_photo FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Policies cho Storage Buckets

```sql
-- ============================================================
-- BUCKET: user-photos
-- ============================================================

-- User chỉ upload vào thư mục của chính mình
CREATE POLICY "user_photos_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- User chỉ đọc file của chính mình
CREATE POLICY "user_photos_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'user-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- User chỉ xóa file của chính mình
CREATE POLICY "user_photos_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- BUCKET: theater-assets (public read, theater owner write)
-- ============================================================

-- Ai cũng đọc được (bucket public)
CREATE POLICY "theater_assets_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'theater-assets');

-- Theater owner hoặc admin mới được upload
CREATE POLICY "theater_assets_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'theater-assets'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('theater_owner', 'admin')
    )
  );

-- Theater owner hoặc admin mới được xóa
CREATE POLICY "theater_assets_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'theater-assets'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('theater_owner', 'admin')
    )
  );

-- ============================================================
-- BUCKET: admin-assets (chỉ admin)
-- ============================================================

CREATE POLICY "admin_assets_all"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'admin-assets'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## 6. Quy Trình Upload Ảnh (Client-side)

### 6.1 Upload ảnh AR Photo Booth (User)

```typescript
import { supabase } from '@/lib/supabase';

/**
 * Upload ảnh AR từ Photo Booth và lưu metadata vào bảng user_photo
 * @param userId     - ID người dùng đang đăng nhập
 * @param imageBlob  - Blob ảnh PNG đã chụp từ canvas
 * @param maskId     - UUID của mặt nạ đã dùng (nullable)
 * @param options    - caption, backgroundUrl, isPublic
 */
export async function uploadPhotoBoothImage(
  userId: string,
  imageBlob: Blob,
  maskId?: string,
  options?: {
    caption?: string;
    backgroundUrl?: string;
    isPublic?: boolean;
  }
): Promise<{ imageUrl: string; photoId: string } | null> {
  const timestamp = Date.now();
  const fileName = `${timestamp}_${crypto.randomUUID()}.png`;
  const storagePath = `${userId}/photobooth/${fileName}`;

  // 1. Upload file lên Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('user-photos')
    .upload(storagePath, imageBlob, {
      contentType: 'image/png',
      upsert: false,
    });

  if (uploadError) {
    console.error('Upload thất bại:', uploadError.message);
    return null;
  }

  // 2. Lấy signed URL (hoặc public URL nếu bucket là public)
  const { data: urlData } = await supabase.storage
    .from('user-photos')
    .createSignedUrl(storagePath, 60 * 60 * 24 * 7); // hết hạn sau 7 ngày

  if (!urlData?.signedUrl) return null;

  // 3. Ghi metadata vào bảng user_photo
  const { data: photo, error: dbError } = await supabase
    .from('user_photo')
    .insert({
      user_id: userId,
      image_url: urlData.signedUrl,      // NOT NULL — bắt buộc
      mask_id: maskId ?? null,
      background_url: options?.backgroundUrl ?? null,
      caption: options?.caption ?? null,
      is_public: options?.isPublic ?? false,
    })
    .select('id')
    .single();

  if (dbError) {
    console.error('Lưu metadata thất bại:', dbError.message);
    return null;
  }

  return { imageUrl: urlData.signedUrl, photoId: photo.id };
}
```

### 6.2 Upload ảnh Theater/Venue (Theater Owner)

```typescript
/**
 * Upload ảnh cho venue/event của nhà hát
 */
export async function uploadTheaterAsset(
  theaterId: string,
  file: File,
  type: 'logo' | 'venues' | 'events',
  subId?: string  // venue_id hoặc event_id nếu cần
): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const subPath = subId ? `${subId}/${Date.now()}.${ext}` : `${Date.now()}.${ext}`;
  const storagePath = `${theaterId}/${type}/${subPath}`;

  const { error } = await supabase.storage
    .from('theater-assets')
    .upload(storagePath, file, { upsert: true });

  if (error) {
    console.error('Upload theater asset thất bại:', error.message);
    return null;
  }

  // Bucket public → dùng getPublicUrl
  const { data } = supabase.storage
    .from('theater-assets')
    .getPublicUrl(storagePath);

  return data.publicUrl;
}
```

### 6.3 Upload ảnh Admin (Mask/System Assets)

```typescript
/**
 * Upload ảnh mặt nạ Tuồng vào admin-assets
 */
export async function uploadAdminMask(
  maskId: string,
  file: File
): Promise<string | null> {
  const storagePath = `system/masks/${maskId}.png`;

  const { error } = await supabase.storage
    .from('admin-assets')
    .upload(storagePath, file, { upsert: true, contentType: 'image/png' });

  if (error) {
    console.error('Upload mask thất bại:', error.message);
    return null;
  }

  const { data } = await supabase.storage
    .from('admin-assets')
    .createSignedUrl(storagePath, 60 * 60 * 24 * 365); // 1 năm

  return data?.signedUrl ?? null;
}
```

---

## 7. Truy Vấn Dữ Liệu `user_photo`

### Lấy ảnh public (Gallery công khai)

```typescript
const { data: publicPhotos } = await supabase
  .from('user_photo')
  .select('id, image_url, caption, mask_id, views, likes, created_at')
  .eq('is_public', true)
  .order('created_at', { ascending: false })
  .limit(20);
```

### Lấy ảnh của user hiện tại

```typescript
const { data: myPhotos } = await supabase
  .from('user_photo')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

### Tăng lượt xem

```typescript
await supabase.rpc('increment_photo_views', { photo_id: id });

-- Tạo function SQL tương ứng:
CREATE OR REPLACE FUNCTION increment_photo_views(photo_id UUID)
RETURNS void LANGUAGE sql AS $$
  UPDATE public.user_photo
  SET views = views + 1
  WHERE id = photo_id AND is_public = true;
$$;
```

---

## 8. Giới Hạn & Validation Phía Client

```typescript
const MAX_FILE_SIZE_MB = 50;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Chỉ hỗ trợ định dạng JPG, PNG hoặc WebP.';
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `Ảnh không được vượt quá ${MAX_FILE_SIZE_MB}MB.`;
  }
  return null; // hợp lệ
}
```

---

## 9. Checklist Triển Khai

- [ ] Tạo 3 bucket trên Supabase Dashboard (`user-photos`, `theater-assets`, `admin-assets`)
- [ ] Chạy SQL migration tạo bảng `user_photo`
- [ ] Bật RLS cho bảng `user_photo` và áp dụng đầy đủ policies
- [ ] Áp dụng storage policies cho từng bucket
- [ ] Tạo SQL function `increment_photo_views`
- [ ] Tích hợp `uploadPhotoBoothImage` vào component Photo Booth
- [ ] Tích hợp `uploadTheaterAsset` vào Theater Dashboard
- [ ] Tích hợp `uploadAdminMask` vào Admin Dashboard → Mask Management
- [ ] Kiểm tra giới hạn 50MB và các MIME type được phép
- [ ] Test RLS: user A không truy cập được ảnh private của user B

# Database Design - Tuồng Platform

## Tổng quan

Database được thiết kế cho nền tảng Tuồng với 3 roles chính:
- **Admin**: Quản trị toàn hệ thống
- **User**: Người dùng xem, đặt vé, tham gia sự kiện
- **Theater**: Nhà hát đăng ký địa điểm, tạo lịch diễn, livestream, sự kiện

## Entity Relationship Diagram (ERD)

```
┌─────────────┐
│  profiles   │ (extends auth.users)
│  - id (PK)  │
│  - email    │
│  - role     │ ──┐
└─────────────┘   │
                  │
                  │ owner_id
                  ↓
┌─────────────────────┐
│     theaters        │
│  - id (PK)          │
│  - owner_id (FK)    │
│  - name             │
│  - status           │ ──┐
└─────────────────────┘   │
                          │ theater_id
                          ↓
┌─────────────────────┐   ┌─────────────────────┐
│      venues         │   │     schedules       │
│  - id (PK)          │   │  - id (PK)          │
│  - theater_id (FK)  │   │  - theater_id (FK)  │
│  - name             │←──│  - venue_id (FK)    │
│  - city             │   │  - show_id (FK)     │
└─────────────────────┘   │  - start_datetime   │
                          └─────────────────────┘
                                    │
                                    │ schedule_id
                                    ↓
                          ┌─────────────────────┐
                          │       seats         │
                          │  - id (PK)          │
                          │  - schedule_id (FK) │
                          │  - seat_id          │
                          │  - status           │
                          │  - price            │
                          └─────────────────────┘
                                    │
                                    │ seat_ids[]
                                    ↓
                          ┌─────────────────────┐
                          │     bookings        │
                          │  - id (PK)          │
                          │  - user_id (FK)     │
                          │  - schedule_id (FK) │
                          │  - seat_ids[]       │
                          │  - status           │
                          └─────────────────────┘
                                    │
                                    │ booking_id
                                    ↓
                          ┌─────────────────────┐
                          │     payments        │
                          │  - id (PK)          │
                          │  - booking_id (FK)  │
                          │  - amount           │
                          │  - status           │
                          └─────────────────────┘
```

## Tables Overview

### 1. User Management

#### profiles
Thông tin người dùng (extends Supabase auth.users)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | User ID (from auth.users) |
| email | TEXT | Email |
| full_name | TEXT | Họ tên |
| phone | TEXT | Số điện thoại |
| avatar_url | TEXT | URL avatar |
| role | ENUM | admin / user / theater |
| created_at | TIMESTAMPTZ | Ngày tạo |
| updated_at | TIMESTAMPTZ | Ngày cập nhật |

**Indexes:**
- `idx_profiles_role` on `role`
- `idx_profiles_email` on `email`

**Triggers:**
- `assign_first_admin_trigger`: User đầu tiên tự động có role admin

### 2. Theater Management

#### theaters
Thông tin nhà hát

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Theater ID |
| owner_id | UUID (FK) | Owner (profiles.id) |
| name | TEXT | Tên nhà hát |
| description | TEXT | Mô tả |
| address | TEXT | Địa chỉ |
| city | TEXT | Thành phố |
| phone | TEXT | Số điện thoại |
| email | TEXT | Email |
| website | TEXT | Website |
| logo_url | TEXT | URL logo |
| cover_image_url | TEXT | URL ảnh bìa |
| capacity | INTEGER | Sức chứa |
| status | ENUM | pending / approved / rejected / suspended |
| business_license | TEXT | Số giấy phép kinh doanh |
| tax_code | TEXT | Mã số thuế |
| created_at | TIMESTAMPTZ | Ngày tạo |
| updated_at | TIMESTAMPTZ | Ngày cập nhật |
| approved_at | TIMESTAMPTZ | Ngày phê duyệt |
| approved_by | UUID (FK) | Admin phê duyệt |

**Indexes:**
- `idx_theaters_owner` on `owner_id`
- `idx_theaters_status` on `status`
- `idx_theaters_city` on `city`

**RLS Policies:**
- Public xem theaters đã approved
- Theater owner quản lý theaters của mình
- Admin quản lý tất cả

#### venues
Địa điểm diễn của nhà hát

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Venue ID |
| theater_id | UUID (FK) | Theater (theaters.id) |
| name | TEXT | Tên địa điểm |
| address | TEXT | Địa chỉ |
| city | TEXT | Thành phố |
| capacity | INTEGER | Sức chứa |
| description | TEXT | Mô tả |
| facilities | TEXT[] | Tiện ích ['parking', 'wheelchair_access'] |
| images | TEXT[] | Array URLs ảnh |
| total_rows | INTEGER | Số hàng ghế |
| seats_per_row | INTEGER | Số ghế mỗi hàng |
| created_at | TIMESTAMPTZ | Ngày tạo |
| updated_at | TIMESTAMPTZ | Ngày cập nhật |

**Indexes:**
- `idx_venues_theater` on `theater_id`
- `idx_venues_city` on `city`

### 3. Shows & Schedules

#### shows
Vở diễn Tuồng

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Show ID |
| title | TEXT | Tên vở diễn |
| description | TEXT | Mô tả |
| synopsis | TEXT | Tóm tắt cốt truyện |
| duration | INTEGER | Thời lượng (phút) |
| thumbnail_url | TEXT | URL thumbnail |
| cover_image_url | TEXT | URL ảnh bìa |
| trailer_url | TEXT | URL trailer |
| tags | TEXT[] | Tags ['cổ điển', 'nữ tướng'] |
| characters | TEXT[] | Nhân vật ['Quan Công'] |
| created_at | TIMESTAMPTZ | Ngày tạo |
| updated_at | TIMESTAMPTZ | Ngày cập nhật |

**Indexes:**
- `idx_shows_tags` on `tags` (GIN)

#### schedules
Lịch diễn cụ thể

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Schedule ID |
| theater_id | UUID (FK) | Theater (theaters.id) |
| show_id | UUID (FK) | Show (shows.id) |
| venue_id | UUID (FK) | Venue (venues.id) |
| title | TEXT | Tiêu đề |
| description | TEXT | Mô tả |
| start_datetime | TIMESTAMPTZ | Thời gian bắt đầu |
| end_datetime | TIMESTAMPTZ | Thời gian kết thúc |
| timezone | TEXT | Timezone |
| status | ENUM | draft / scheduled / ongoing / completed / cancelled |
| ticket_url | TEXT | URL đặt vé external |
| enable_booking | BOOLEAN | Cho phép đặt vé |
| pricing | JSONB | {"vip": 500000, "premium": 350000, ...} |
| created_at | TIMESTAMPTZ | Ngày tạo |
| updated_at | TIMESTAMPTZ | Ngày cập nhật |

**Indexes:**
- `idx_schedules_theater` on `theater_id`
- `idx_schedules_show` on `show_id`
- `idx_schedules_venue` on `venue_id`
- `idx_schedules_start_datetime` on `start_datetime`
- `idx_schedules_status` on `status`

**RLS Policies:**
- Public xem schedules scheduled/ongoing
- Theater owner quản lý schedules của mình

#### seats
Ghế ngồi cho mỗi lịch diễn

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Seat ID |
| schedule_id | UUID (FK) | Schedule (schedules.id) |
| seat_id | TEXT | Mã ghế ('A1', 'B5') |
| row_label | TEXT | Hàng ('A', 'B') |
| seat_number | INTEGER | Số ghế |
| seat_type | ENUM | vip / premium / standard / economy |
| price | INTEGER | Giá (VND) |
| status | ENUM | available / reserved / occupied |
| reserved_by | UUID (FK) | User đang reserve |
| reserved_until | TIMESTAMPTZ | Hết hạn reserve |
| created_at | TIMESTAMPTZ | Ngày tạo |
| updated_at | TIMESTAMPTZ | Ngày cập nhật |

**Indexes:**
- `idx_seats_schedule` on `schedule_id`
- `idx_seats_status` on `status`
- `idx_seats_reserved_by` on `reserved_by`

**Unique Constraint:**
- `(schedule_id, seat_id)`

**Functions:**
- `generate_seats_for_schedule(schedule_id, rows, seats_per_row)`: Tự động tạo ghế

### 4. Booking & Payment

#### bookings
Đặt vé

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Booking ID |
| booking_code | TEXT (UNIQUE) | Mã đặt vé ('BK1234567890ABC') |
| user_id | UUID (FK) | User (profiles.id) |
| schedule_id | UUID (FK) | Schedule (schedules.id) |
| customer_name | TEXT | Tên khách hàng |
| customer_email | TEXT | Email khách hàng |
| customer_phone | TEXT | SĐT khách hàng |
| seat_ids | UUID[] | Array seat IDs |
| total_amount | INTEGER | Tổng tiền (VND) |
| status | ENUM | pending / confirmed / cancelled / refunded |
| created_at | TIMESTAMPTZ | Ngày tạo |
| updated_at | TIMESTAMPTZ | Ngày cập nhật |
| confirmed_at | TIMESTAMPTZ | Ngày xác nhận |
| cancelled_at | TIMESTAMPTZ | Ngày hủy |

**Indexes:**
- `idx_bookings_user` on `user_id`
- `idx_bookings_schedule` on `schedule_id`
- `idx_bookings_status` on `status`
- `idx_bookings_code` on `booking_code`

**RLS Policies:**
- User xem bookings của mình
- Theater owner xem bookings cho events của mình

#### payments
Thanh toán

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Payment ID |
| transaction_id | TEXT (UNIQUE) | Mã giao dịch |
| booking_id | UUID (FK) | Booking (bookings.id) |
| user_id | UUID (FK) | User (profiles.id) |
| amount | INTEGER | Số tiền (VND) |
| payment_method | ENUM | wallet / card / qr / bank_transfer |
| status | ENUM | pending / completed / failed / refunded |
| gateway_response | JSONB | Response từ payment gateway |
| created_at | TIMESTAMPTZ | Ngày tạo |
| updated_at | TIMESTAMPTZ | Ngày cập nhật |
| completed_at | TIMESTAMPTZ | Ngày hoàn thành |
| failed_at | TIMESTAMPTZ | Ngày thất bại |

**Indexes:**
- `idx_payments_booking` on `booking_id`
- `idx_payments_user` on `user_id`
- `idx_payments_status` on `status`

### 5. Livestream & Replay

#### livestreams
Phát trực tiếp

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Livestream ID |
| theater_id | UUID (FK) | Theater (theaters.id) |
| schedule_id | UUID (FK) | Schedule (schedules.id) |
| title | TEXT | Tiêu đề |
| description | TEXT | Mô tả |
| thumbnail_url | TEXT | URL thumbnail |
| stream_url | TEXT | URL stream |
| stream_key | TEXT | RTMP stream key |
| chat_enabled | BOOLEAN | Bật chat |
| start_time | TIMESTAMPTZ | Thời gian bắt đầu |
| end_time | TIMESTAMPTZ | Thời gian kết thúc |
| status | ENUM | upcoming / live / ended / cancelled |
| access_type | ENUM | free / paid / ad_supported |
| price | INTEGER | Giá (VND) |
| current_viewers | INTEGER | Số người xem hiện tại |
| total_views | INTEGER | Tổng lượt xem |
| peak_viewers | INTEGER | Đỉnh người xem |
| partner_name | TEXT | Tên đối tác |
| created_at | TIMESTAMPTZ | Ngày tạo |
| updated_at | TIMESTAMPTZ | Ngày cập nhật |

**Indexes:**
- `idx_livestreams_theater` on `theater_id`
- `idx_livestreams_schedule` on `schedule_id`
- `idx_livestreams_status` on `status`
- `idx_livestreams_start_time` on `start_time`

**RLS Policies:**
- Public xem streams live/upcoming
- Theater owner quản lý streams của mình

**Real-time:**
- Subscribe to viewer count updates

#### replays
Video ghi lại

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Replay ID |
| theater_id | UUID (FK) | Theater (theaters.id) |
| livestream_id | UUID (FK) | Livestream (livestreams.id) |
| schedule_id | UUID (FK) | Schedule (schedules.id) |
| title | TEXT | Tiêu đề |
| description | TEXT | Mô tả |
| thumbnail_url | TEXT | URL thumbnail |
| video_url | TEXT | URL video |
| duration | INTEGER | Thời lượng (giây) |
| access_type | ENUM | free / paid / ad_supported |
| price | INTEGER | Giá (VND) |
| ad_count | INTEGER | Số quảng cáo |
| total_views | INTEGER | Tổng lượt xem |
| original_date | TIMESTAMPTZ | Ngày diễn gốc |
| partner_name | TEXT | Tên đối tác |
| tags | TEXT[] | Tags |
| created_at | TIMESTAMPTZ | Ngày tạo |
| updated_at | TIMESTAMPTZ | Ngày cập nhật |

**Indexes:**
- `idx_replays_theater` on `theater_id`
- `idx_replays_livestream` on `livestream_id`
- `idx_replays_access_type` on `access_type`

**RLS Policies:**
- Public xem replays
- Theater owner quản lý replays của mình

### 6. Events

#### events
Sự kiện (Workshop, Tour, Meet Artist)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Event ID |
| theater_id | UUID (FK) | Theater (theaters.id) |
| venue_id | UUID (FK) | Venue (venues.id) |
| type | ENUM | workshop / tour / meet_artist / other |
| title | TEXT | Tiêu đề |
| description | TEXT | Mô tả |
| thumbnail_url | TEXT | URL thumbnail |
| event_date | TIMESTAMPTZ | Ngày sự kiện |
| duration | INTEGER | Thời lượng (phút) |
| max_participants | INTEGER | Số người tối đa |
| current_participants | INTEGER | Số người hiện tại |
| price | INTEGER | Giá (VND) |
| instructor | TEXT | Giảng viên (workshop) |
| guide | TEXT | Hướng dẫn viên (tour) |
| artists | TEXT[] | Nghệ sĩ (meet-artist) |
| requirements | TEXT[] | Yêu cầu |
| includes | TEXT[] | Bao gồm |
| tags | TEXT[] | Tags |
| status | ENUM | draft / scheduled / ongoing / completed / cancelled |
| created_at | TIMESTAMPTZ | Ngày tạo |
| updated_at | TIMESTAMPTZ | Ngày cập nhật |

**Indexes:**
- `idx_events_theater` on `theater_id`
- `idx_events_type` on `type`
- `idx_events_date` on `event_date`
- `idx_events_status` on `status`

**RLS Policies:**
- Public xem events scheduled
- Theater owner quản lý events của mình

**Triggers:**
- Auto-update `current_participants` khi có registration mới

#### event_registrations
Đăng ký sự kiện

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Registration ID |
| registration_code | TEXT (UNIQUE) | Mã đăng ký |
| event_id | UUID (FK) | Event (events.id) |
| user_id | UUID (FK) | User (profiles.id) |
| participant_name | TEXT | Tên người tham gia |
| participant_email | TEXT | Email |
| participant_phone | TEXT | SĐT |
| amount | INTEGER | Số tiền (VND) |
| payment_status | ENUM | pending / completed / failed / refunded |
| status | ENUM | pending / confirmed / cancelled / refunded |
| created_at | TIMESTAMPTZ | Ngày tạo |
| updated_at | TIMESTAMPTZ | Ngày cập nhật |
| confirmed_at | TIMESTAMPTZ | Ngày xác nhận |
| cancelled_at | TIMESTAMPTZ | Ngày hủy |

**Indexes:**
- `idx_event_registrations_event` on `event_id`
- `idx_event_registrations_user` on `user_id`
- `idx_event_registrations_status` on `status`

### 7. Content

#### masks
Mặt nạ Tuồng (cho AR feature)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Mask ID |
| name | TEXT | Tên mặt nạ |
| character_type | TEXT | Loại nhân vật |
| description | TEXT | Mô tả |
| image_path | TEXT | Path ảnh |
| model_3d_path | TEXT | Path model 3D (GLB) |
| color_scheme | TEXT[] | Màu sắc |
| symbolism | TEXT | Ý nghĩa |
| tags | TEXT[] | Tags |
| usage_count | INTEGER | Số lần sử dụng |
| created_at | TIMESTAMPTZ | Ngày tạo |
| updated_at | TIMESTAMPTZ | Ngày cập nhật |

**Indexes:**
- `idx_masks_character_type` on `character_type`
- `idx_masks_tags` on `tags` (GIN)

**RLS Policies:**
- Public xem tất cả masks

#### user_photos
Ảnh chụp của user với mặt nạ

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Photo ID |
| user_id | UUID (FK) | User (profiles.id) |
| image_url | TEXT | URL ảnh |
| mask_id | UUID (FK) | Mask (masks.id) |
| background_url | TEXT | URL nền |
| caption | TEXT | Caption |
| is_public | BOOLEAN | Public/Private |
| views | INTEGER | Lượt xem |
| likes | INTEGER | Lượt thích |
| created_at | TIMESTAMPTZ | Ngày tạo |

**Indexes:**
- `idx_user_photos_user` on `user_id`
- `idx_user_photos_mask` on `mask_id`
- `idx_user_photos_public` on `is_public`

**RLS Policies:**
- User xem photos của mình
- Public xem photos được set public

## Storage Buckets

### avatars
- User avatars
- Public read
- Authenticated users can upload own avatar

### theater-images
- Theater logos, cover images
- Public read
- Theater owners can upload

### show-images
- Show thumbnails, covers
- Public read
- Admin can upload

### mask-images
- Mask images
- Public read
- Admin can upload

### user-photos
- User photos with masks
- Public read (if is_public = true)
- Users can upload own photos

### livestream-thumbnails
- Livestream thumbnails
- Public read
- Theater owners can upload

## Security (RLS)

### Principle
- Enable RLS trên tất cả tables
- Default deny all
- Explicit allow theo role

### Admin
- Full access tất cả tables
- Approve/reject theaters
- Manage shows, masks

### Theater Owner
- Manage own theaters, venues
- Create schedules, livestreams, events
- View bookings/registrations cho events của mình

### User
- View public content
- Create bookings, registrations
- View own bookings, registrations, photos

## Performance Optimization

### Indexes
- Primary keys: UUID with uuid_generate_v4()
- Foreign keys: Indexed
- Frequently queried columns: Indexed
- Array columns (tags): GIN index

### Triggers
- Auto-update `updated_at` timestamp
- Auto-assign first admin
- Auto-update event participants count

### Functions
- `generate_seats_for_schedule()`: Bulk insert seats
- Cleanup expired reservations (scheduled job)

## Backup & Maintenance

### Daily Tasks
- Cleanup expired seat reservations
- Update livestream status (upcoming → live → ended)
- Archive old bookings/payments

### Weekly Tasks
- Vacuum database
- Analyze query performance
- Review storage usage

### Monthly Tasks
- Full backup
- Review and optimize indexes
- Clean up unused storage files

## Migration Strategy

### Phase 1: Core Setup
1. Create schema
2. Seed initial data (shows, masks)
3. Create first admin user

### Phase 2: Theater Onboarding
1. Theater owners sign up
2. Create theaters (pending approval)
3. Admin approves theaters
4. Theater owners create venues

### Phase 3: Content Creation
1. Theater owners create schedules
2. Generate seats for schedules
3. Create livestreams
4. Create events

### Phase 4: User Engagement
1. Users sign up
2. Browse schedules, events
3. Book tickets
4. Register for events
5. Watch livestreams

## Monitoring

### Key Metrics
- Total users by role
- Active theaters
- Bookings per day/week/month
- Revenue per theater
- Livestream viewers
- Event registrations
- Storage usage

### Alerts
- Failed payments
- Expired seat reservations not cleaned
- Storage quota exceeded
- Database connection issues

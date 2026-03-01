# Theater Manager Dashboard

Trang quản lý dành cho Nhà Hát (Theater Owner role).

## Components

### TheaterDashboard.jsx
Component chính của Theater Dashboard, tích hợp tất cả các component con.

**Features:**
- Load thông tin nhà hát của user hiện tại
- Hiển thị danh sách venues
- Thống kê nhanh
- Lịch sử hoạt động

### TheaterHeader.jsx
Header navigation cho Theater Dashboard.

**Features:**
- Logo và navigation menu
- Search bar
- Notifications
- User menu với avatar

### TheaterProfile.jsx
Card hiển thị thông tin nhà hát.

**Features:**
- Upload logo và cover image
- Hiển thị thông tin cơ bản (tên, địa chỉ, email, phone)
- Status badge (approved/pending/rejected/suspended)
- Edit profile button

### TheaterStats.jsx
Card thống kê nhanh.

**Features:**
- Tổng số venues
- Tổng sức chứa
- Số lịch diễn
- Số sự kiện
- Số livestreams

### VenueList.jsx
Danh sách các địa điểm diễn.

**Features:**
- Grid layout responsive
- Add new venue button
- Venue cards
- Add venue placeholder

### VenueCard.jsx
Card hiển thị thông tin một venue.

**Features:**
- Venue image
- Status badge (active/maintenance/inactive)
- Capacity info
- **Link "Xem trên Google Maps"** ⭐ NEW
- Facilities tags
- Seat map button
- Edit button
- Delete option

### VenueModal.jsx
Modal form để tạo/sửa venue.

**Features:**
- Basic information (name, city, address, capacity)
- **LocationPicker** - Chọn vị trí trên bản đồ ⭐ NEW
- **Google Maps integration** - Xem và chia sẻ vị trí ⭐ NEW
- Seating configuration (rows, seats per row)
- Facilities checkboxes
- Status selector
- Image upload (coming soon)

### LocationPicker.jsx ⭐ NEW
Component chọn vị trí trên bản đồ tương tác.

**Features:**
- 🔍 Tìm kiếm địa chỉ với gợi ý tự động (Nominatim API)
- 🗺️ Bản đồ tương tác (Leaflet + OpenStreetMap)
- 📍 Click để chọn vị trí chính xác
- 📱 Lấy vị trí hiện tại (geolocation)
- 🎨 Nhiều kiểu bản đồ (OpenStreetMap, OpenTopoMap, Esri)
- 🌐 Nút "Xem trên Google Maps"
- 🇻🇳 Tối ưu cho địa chỉ Việt Nam

**Usage:**
```jsx
<LocationPicker
  onLocationSelect={(data) => {
    // data: { address, city, latitude, longitude }
  }}
  initialPosition={{ lat: 21.0285, lng: 105.8542 }}
  initialAddress="Hà Nội"
/>
```

### RecentActivity.jsx
Hiển thị các hoạt động gần đây.

**Features:**
- Activity timeline
- Activity types (edit, add, schedule, livestream)
- Timestamps
- User info

### TheaterRoute.jsx
Protected route cho Theater Dashboard.

**Features:**
- Check authentication
- Check role (theater or admin)
- Redirect to login if not authenticated
- Redirect to home if not authorized

## Usage

```jsx
import TheaterDashboard from './components/Theater/TheaterDashboard'

// In your router
<Route 
  path="/theater" 
  element={
    <TheaterRoute>
      <TheaterDashboard />
    </TheaterRoute>
  } 
/>
```

## Permissions

- **Theater Owner**: Full access to their own theater data
- **Admin**: Full access to all theaters

## API Integration

Components sử dụng các service functions từ:
- `src/services/theaterService.js`
- `src/services/scheduleService.js`
- `src/services/eventService.js`
- `src/services/livestreamService.js`

## Utilities ⭐ NEW

### mapUtils.js
Helper functions cho Google Maps integration:
- `getGoogleMapsUrl(lat, lng, label)` - Tạo Google Maps URL
- `getGoogleMapsDirectionsUrl(lat, lng)` - Tạo URL chỉ đường
- `openInGoogleMaps(lat, lng, label)` - Mở trong Google Maps
- `formatCoordinates(lat, lng, precision)` - Format tọa độ
- `isValidCoordinates(lat, lng)` - Validate tọa độ
- `calculateDistance(lat1, lng1, lat2, lng2)` - Tính khoảng cách (km)
- `getVietnamCenter()` - Lấy tọa độ trung tâm Việt Nam
- `getVietnamCities()` - Danh sách thành phố lớn Việt Nam

## Styling

- Sử dụng Tailwind CSS
- Custom colors: primary (#eec02b), accent-red (#8b0000)
- Dark theme
- Material Symbols icons
- Leaflet CSS cho bản đồ

## Documentation ⭐ NEW

Xem thêm tài liệu chi tiết:
- `docs/THEATER_MANAGER_GUIDE.md` - Hướng dẫn sử dụng Theater Manager
- `docs/LOCATION_PICKER_GUIDE.md` - Chi tiết về LocationPicker component
- `docs/GOOGLE_MAPS_INTEGRATION.md` - Tích hợp Google Maps

## Testing

Sử dụng `LocationPickerDemo.jsx` để test LocationPicker:
```jsx
import LocationPickerDemo from './components/Theater/LocationPickerDemo'
```

## Next Steps

1. Implement Schedule Management page
2. Implement Event Management page
3. Implement Livestream Management page
4. Implement Booking Management page
5. Add image upload for venues
6. Add seat map editor
7. Add analytics/reports page
8. Add settings page

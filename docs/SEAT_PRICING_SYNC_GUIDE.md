# Hướng Dẫn Đồng Bộ Giá Vé Ghế Ngồi

## Tổng Quan

Hệ thống đồng bộ giá vé ghế ngồi đảm bảo rằng khi Theater Manager thay đổi giá vé trong SeatLayoutEditor, giá vé sẽ được cập nhật real-time trong hệ thống booking và hiển thị đúng cho khách hàng.

**🔒 RLS-Safe Design**: Hệ thống được thiết kế để hoạt động ngay cả khi Supabase RLS (Row Level Security) ngăn cản cập nhật trực tiếp database.

## Kiến Trúc Hệ Thống

### 1. Database Schema

```sql
-- Bảng seat_pricing: Lưu giá cơ bản theo loại ghế
CREATE TABLE seat_pricing (
  id uuid PRIMARY KEY,
  theater_id uuid NOT NULL,
  hall_id uuid,
  seat_type text NOT NULL,
  base_price integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp,
  updated_at timestamp
);

-- Bảng seats: Lưu giá cuối cùng của từng ghế
CREATE TABLE seats (
  id uuid PRIMARY KEY,
  hall_id uuid NOT NULL,
  seat_type text NOT NULL,
  base_price integer DEFAULT 0,
  final_price integer DEFAULT 0,
  -- ... other fields
);
```

### 2. Services

#### SeatPricingService (`src/services/seatPricingService.js`)
- `getSeatPricingByType()`: Lấy giá theo loại ghế
- `batchUpdateSeatPricing()`: Cập nhật giá hàng loạt
- `updateSeatFinalPrices()`: Cập nhật giá cuối cùng (RLS-safe với fallback)
- `calculateSeatPricesForHall()`: Tính giá cho tất cả ghế (không cần cập nhật DB)
- `calculateSeatPrices()`: Tính giá ghế với zone multipliers

#### SeatPricingSyncService (`src/services/seatPricingSyncService.js`)
- Quản lý real-time subscriptions
- Đồng bộ thay đổi giá across components
- Tự động cập nhật `final_price` khi `base_price` thay đổi

### 3. Utility Functions

#### SeatPricingUtils (`src/utils/seatPricingUtils.js`)
- `calculateSeatPrice()`: Tính giá ghế với base price và multiplier
- `applySeatPricing()`: Áp dụng giá cho danh sách ghế
- `validatePricing()`: Validate dữ liệu giá
- `createPricingDiff()`: So sánh thay đổi giá

#### RLS Handling (`src/components/Common/RLSInfoBanner.jsx`)
- Hiển thị thông tin về RLS restrictions
- Giải thích cách hệ thống hoạt động khi có RLS
- User-friendly error messages

### 4. Components
- Hiển thị và chỉnh sửa giá vé theo loại ghế
- Lưu vào database khi có thay đổi
- Trigger sync update cho toàn hệ thống

#### SeatSelection (Booking)
- Load giá real-time từ database
- Subscribe to pricing changes
- Hiển thị giá chính xác cho khách hàng

#### BookingSummary (Booking)
- Tính tổng tiền real-time
- Cập nhật khi giá thay đổi

## Luồng Đồng Bộ

### 1. Theater Manager Thay Đổi Giá

```
1. User chỉnh sửa giá trong SeatPriceList
2. Component gọi batchUpdateSeatPricing()
3. Database cập nhật seat_pricing table
4. updateSeatFinalPrices() cố gắng cập nhật final_price
   - Nếu thành công: seats table được cập nhật
   - Nếu RLS block: sử dụng calculation-based pricing
5. SeatPricingSyncService trigger notification
6. Tất cả subscribers nhận update
```

### 2. Booking System Nhận Update

```
1. SeatSelection subscribe to pricing changes
2. Nhận notification từ SeatPricingSyncService
3. Reload seat data với giá mới (calculation-based nếu cần)
4. BookingSummary tự động recalculate total
5. UI update với giá mới
```

## Cách Sử Dụng

### 1. Trong Theater Manager

```jsx
// SeatPriceList component tự động sync
<SeatPriceList 
  theaterId={theater.id} 
  hallId={hall.id} 
/>
```

### 2. Trong Booking System

```jsx
// Sử dụng hook để get real-time pricing
const { pricing, loading } = useSeatPricing(theaterId, hallId)

// Hoặc sử dụng hook để tính total real-time
const { total, loading } = useBookingTotal(selectedSeats, theaterId, hallId)
```

### 3. Manual Sync

```javascript
import seatPricingSyncService from './services/seatPricingSyncService'

// Trigger manual update
await seatPricingSyncService.triggerPricingUpdate(theaterId, hallId)
```

## Real-time Features

### 1. Supabase Realtime
- Listen to `seat_pricing` table changes
- Listen to `seats` table changes
- Automatic reconnection

### 2. Subscription Management
- Automatic cleanup on component unmount
- Efficient subscription sharing
- Memory leak prevention

### 3. Error Handling
- Fallback to default pricing
- Graceful degradation
- User-friendly error messages

## Testing

### 1. Manual Testing
1. Mở Theater Manager và Booking cùng lúc
2. Thay đổi giá trong SeatPriceList
3. Kiểm tra giá cập nhật real-time trong Booking

### 2. Console Logs
```javascript
// Enable debug logs
localStorage.setItem('debug-seat-pricing', 'true')
```

## Troubleshooting

### 1. Giá Không Cập Nhật
- Kiểm tra network connection
- Verify Supabase realtime connection
- Check console for errors

### 2. Performance Issues
- Monitor subscription count
- Check for memory leaks
- Optimize re-render frequency

### 3. Data Inconsistency
- Run manual sync: `triggerPricingUpdate()`
- Check database constraints
- Verify RLS policies

## Best Practices

### 1. Component Design
- Always pass theaterId and hallId
- Use loading states
- Handle errors gracefully

### 2. Performance
- Debounce frequent updates
- Use React.memo for expensive components
- Cleanup subscriptions properly

### 3. User Experience
- Show loading indicators
- Highlight price changes
- Provide feedback on save

## Migration Guide

### Existing Components
1. Add theaterId/hallId props
2. Replace static pricing with dynamic
3. Add loading states
4. Test real-time updates

### Database Updates
```sql
-- Add pricing columns to seats if not exists
ALTER TABLE seats 
ADD COLUMN IF NOT EXISTS base_price integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_price integer DEFAULT 0;

-- Initialize default pricing
INSERT INTO seat_pricing (theater_id, seat_type, base_price) 
VALUES 
  ('theater-id', 'standard', 250000),
  ('theater-id', 'vip', 500000),
  ('theater-id', 'couple', 600000),
  ('theater-id', 'wheelchair', 250000);
```

## API Reference

### SeatPricingService

```javascript
// Get pricing by type
const pricing = await getSeatPricingByType(theaterId, hallId)

// Update pricing
await batchUpdateSeatPricing(theaterId, hallId, {
  standard: 250000,
  vip: 500000
})

// Update final prices
await updateSeatFinalPrices(hallId, theaterId)
```

### Hooks

```javascript
// Real-time pricing
const { pricing, loading, error } = useSeatPricing(theaterId, hallId)

// Real-time total
const { total, loading } = useBookingTotal(selectedSeats, theaterId, hallId)
```

### Sync Service

```javascript
// Subscribe to changes
const unsubscribe = seatPricingSyncService.subscribe(
  theaterId, 
  hallId, 
  (payload) => console.log('Price changed:', payload)
)

// Cleanup
unsubscribe()
```
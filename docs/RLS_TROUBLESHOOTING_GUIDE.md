# Hướng Dẫn Khắc Phục Lỗi RLS (Row Level Security)

## Tổng Quan Lỗi

Lỗi `42501: new row violates row-level security policy for table "seats"` xảy ra khi Supabase RLS (Row Level Security) không cho phép user hiện tại cập nhật bảng `seats`.

## Nguyên Nhân

1. **RLS Policy chưa được cấu hình đúng** cho bảng `seats`
2. **User không có quyền** cập nhật seats
3. **Authentication context** không đúng

## Giải Pháp Đã Triển Khai

### 1. Fallback Mechanism

Hệ thống đã được thiết kế để hoạt động ngay cả khi RLS ngăn cản cập nhật:

```javascript
// Trong updateSeatFinalPrices()
try {
  // Cố gắng cập nhật database
  await updateSeatsInDatabase()
} catch (rlsError) {
  // Fallback: sử dụng calculation-based pricing
  return calculatePricesOnly()
}
```

### 2. Calculation-Based Pricing

Thay vì dựa vào `final_price` trong database, hệ thống tính toán giá real-time:

```javascript
// Tính giá dựa trên seat_pricing + zone_multiplier
const price = calculateSeatPrice(seatType, basePricing, zoneMultiplier)
```

### 3. Graceful Error Handling

- Hiển thị thông báo thân thiện với user
- Không làm gián đoạn workflow
- Vẫn đồng bộ giá vé real-time

## Cách Khắc Phục Hoàn Toàn

### Option 1: Cấu Hình RLS Policy (Recommended)

```sql
-- Cho phép authenticated users cập nhật seats
CREATE POLICY "Allow authenticated users to update seats" ON public.seats
FOR UPDATE USING (auth.role() = 'authenticated');

-- Hoặc cho phép theater owners cập nhật seats của theater họ
CREATE POLICY "Allow theater owners to update their seats" ON public.seats
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM halls h
    JOIN theaters t ON h.theater_id = t.id
    WHERE h.id = seats.hall_id 
    AND t.owner_id = auth.uid()
  )
);
```

### Option 2: Sử dụng Service Role

```javascript
// Tạo Supabase client với service role key
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Sử dụng admin client để cập nhật seats
await supabaseAdmin.from('seats').update(...)
```

### Option 3: Database Function

```sql
-- Tạo function với SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_seat_prices(
  p_hall_id uuid,
  p_theater_id uuid
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Update logic here
  UPDATE seats SET 
    final_price = (
      SELECT sp.base_price * COALESCE(sz.price_multiplier, 1.0)
      FROM seat_pricing sp
      LEFT JOIN seat_zones sz ON seats.zone_id = sz.id
      WHERE sp.theater_id = p_theater_id
      AND sp.seat_type = seats.seat_type
      AND sp.is_active = true
    )
  WHERE hall_id = p_hall_id;
  
  GET DIAGNOSTICS result = ROW_COUNT;
  RETURN json_build_object('updated', result);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_seat_prices TO authenticated;
```

## Testing

### 1. Kiểm Tra RLS Policies

```sql
-- Xem các policies hiện tại
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'seats';
```

### 2. Test với User Context

```sql
-- Test với user ID cụ thể
SET LOCAL rls.user_id = 'user-uuid-here';
UPDATE seats SET final_price = 100000 WHERE id = 'seat-uuid';
```

### 3. Kiểm Tra Permissions

```sql
-- Kiểm tra quyền của user hiện tại
SELECT has_table_privilege('seats', 'UPDATE');
```

## Monitoring

### 1. Console Logs

Hệ thống sẽ log các thông tin sau:

```javascript
// Success case
console.log('Updated 50 seats in database, 0 failed')

// RLS case  
console.warn('Database update prevented by RLS, using calculated prices')
```

### 2. User Feedback

- ✅ "Đã lưu giá vé thành công!" (Normal case)
- ✅ "Đã lưu giá vé! (Cập nhật ghế bị hạn chế bởi RLS)" (RLS case)
- ❌ "Lỗi quyền truy cập (RLS). Liên hệ admin để cấp quyền cập nhật ghế."

## Best Practices

### 1. Development

- Test với different user roles
- Verify RLS policies in staging
- Monitor error rates

### 2. Production

- Set up proper RLS policies
- Use service role for admin operations
- Monitor seat pricing accuracy

### 3. User Experience

- Always show loading states
- Provide clear error messages
- Maintain functionality even with RLS

## FAQ

### Q: Tại sao không disable RLS?

A: RLS là security feature quan trọng. Thay vì disable, nên cấu hình policies đúng.

### Q: Giá vé có chính xác không khi có RLS error?

A: Có, hệ thống sử dụng calculation-based pricing để đảm bảo tính chính xác.

### Q: Có cần restart application không?

A: Không, hệ thống tự động fallback và tiếp tục hoạt động.

### Q: Làm sao biết RLS đang block?

A: Check console logs và user feedback messages.

## Liên Hệ

Nếu cần hỗ trợ thêm về RLS configuration:

1. Check Supabase dashboard → Authentication → Policies
2. Review database logs
3. Contact system administrator
4. Tham khảo [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
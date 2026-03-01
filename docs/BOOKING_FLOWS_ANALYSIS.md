# Phân Tích Alternative và Exception Flows - Booking System

## 📋 Tổng Quan

Phân tích chi tiết các flows trong hệ thống đặt vé, bao gồm:
- **Happy Path**: Flow chính khi mọi thứ diễn ra bình thường
- **Alternative Flows**: Các flow thay thế (user chọn options khác)
- **Exception Flows**: Các flow xử lý lỗi và edge cases

---

## 🟢 HAPPY PATH (Main Flow)

### Flow: User đặt vé thành công

```
1. User mở BookingModal
   ✅ Event được truyền vào
   ✅ Modal hiển thị

2. User chọn ghế (SeatSelection)
   ✅ Generate seating chart (mock data hiện tại)
   ✅ User click chọn ghế
   ✅ Validate: min 1, max 10 ghế
   ✅ Click "Tiếp tục" → Chuyển sang Summary

3. User điền thông tin (BookingSummary)
   ✅ Validate: name, email, phone
   ✅ Click "Tiếp tục" → Generate bookingId
   ✅ Chuyển sang Payment

4. User chọn payment method (PaymentMethod)
   ✅ Chọn method: wallet/card/qr
   ✅ Nếu QR: Generate QR code
   ✅ Nếu wallet/card: Process payment
   ✅ Payment thành công

5. Confirmation
   ✅ Hiển thị booking details
   ✅ Send email/SMS confirmation
   ✅ Schedule reminder
```

**Status**: ✅ Hoàn chỉnh (nhưng đang dùng mock data)

---

## 🟡 ALTERNATIVE FLOWS

### Alt-1: User chọn QR Payment

**Flow hiện tại:**
```
1. User chọn QR payment method
   ✅ Generate QR code từ VietQR.io API
   ✅ Hiển thị QR code và bank info
   ✅ Start polling payment status (mỗi 5 giây)

2. User quét QR và thanh toán
   ✅ Polling detect payment success
   ✅ Trigger onPayment callback
   ✅ Chuyển sang Confirmation
```

**Vấn đề:**
- ❌ Không có timeout (15 phút)
- ❌ Không có retry khi generate QR failed
- ❌ Không có cancel booking khi timeout
- ❌ Không có warning khi sắp hết thời gian

**Cần bổ sung:**
- [ ] Timeout 15 phút cho QR payment
- [ ] Countdown timer hiển thị
- [ ] Auto-cancel booking khi timeout
- [ ] Retry button khi generate QR failed

---

### Alt-2: User quay lại (Back Navigation)

**Flow hiện tại:**
```
1. User ở step Payment
   ✅ Click "Quay lại" → Về Summary

2. User ở step Summary
   ✅ Click "Quay lại" → Về SeatSelection

3. User ở step SeatSelection
   ✅ Click "Quay lại" → Về step trước (nếu có)
```

**Vấn đề:**
- ❌ Không release reserved seats khi back
- ❌ Không clear booking data khi back
- ❌ Không có confirmation khi back từ Payment

**Cần bổ sung:**
- [ ] Release reserved seats khi back từ Summary
- [ ] Clear bookingId khi back từ Payment
- [ ] Confirmation dialog khi back từ Payment (có booking đã tạo)

---

### Alt-3: User đóng modal (Close/Cancel)

**Flow hiện tại:**
```
1. User click X hoặc click outside modal
   ✅ Nếu ở Confirmation: Close ngay
   ✅ Nếu ở step khác: Confirm dialog
   ✅ Close modal
```

**Vấn đề:**
- ❌ Không release reserved seats khi close
- ❌ Không cancel booking nếu đã tạo
- ❌ Không clear state khi close

**Cần bổ sung:**
- [ ] Release reserved seats khi close
- [ ] Cancel booking nếu đã tạo (status = pending)
- [ ] Clear all state khi close

---

### Alt-4: User chọn nhiều ghế (Group Booking)

**Flow hiện tại:**
```
1. User chọn nhiều ghế (1-10 ghế)
   ✅ Validate max 10 ghế
   ✅ Hiển thị tổng tiền
   ✅ Continue với tất cả ghế
```

**Status**: ✅ Hoàn chỉnh

---

## 🔴 EXCEPTION FLOWS

### Exc-1: Load Seats Failed

**Flow hiện tại:**
```
1. BookingModal load seats
   ❌ Không có load seats từ database (đang dùng mock)
   ❌ Không có error handling
   ❌ Không có retry mechanism
```

**Cần bổ sung:**
- [ ] Try-catch khi load seats
- [ ] Error message hiển thị
- [ ] Retry button
- [ ] Fallback to mock data nếu cần

---

### Exc-2: Seat Conflict (Seat đã bị đặt)

**Flow hiện tại:**
```
1. User chọn ghế
   ✅ Check seat.status === 'occupied'
   ✅ Show error: "Ghế này đã được đặt"
   ✅ Prevent selection
```

**Vấn đề:**
- ❌ Không có real-time update
- ❌ User có thể chọn ghế đã bị đặt trong lúc điền form
- ❌ Không refresh seat status

**Cần bổ sung:**
- [ ] Real-time subscription để update seat status
- [ ] Auto-remove seat khỏi selected nếu bị đặt
- [ ] Warning khi seat bị conflict

---

### Exc-3: Generate QR Code Failed

**Flow hiện tại:**
```
1. User chọn QR payment
   ✅ Try generate QR
   ✅ Catch error
   ✅ Show error message
   ✅ Show retry button
```

**Status**: ✅ Có error handling cơ bản

**Cần cải thiện:**
- [ ] Retry với exponential backoff
- [ ] Max retry attempts (3 lần)
- [ ] Fallback payment method suggestion

---

### Exc-4: Payment Failed (Wallet/Card)

**Flow hiện tại:**
```
1. User chọn wallet/card
   ✅ Process payment (mock)
   ✅ 90% success rate
   ✅ If failed: Show error message
   ❌ Không có retry
   ❌ Không có alternative payment
```

**Cần bổ sung:**
- [ ] Retry button
- [ ] Suggest alternative payment method
- [ ] Clear payment state để retry
- [ ] Log error for debugging

---

### Exc-5: Payment Check Failed (QR Polling)

**Flow hiện tại:**
```
1. Polling payment status
   ✅ Try checkPaymentStatus
   ✅ Catch error → Log only
   ❌ Không có error handling
   ❌ Không có retry mechanism
   ❌ Không có max retry attempts
```

**Cần bổ sung:**
- [ ] Error handling cho network errors
- [ ] Retry với exponential backoff
- [ ] Max retry attempts
- [ ] Show error nếu polling failed nhiều lần

---

### Exc-6: Network Error

**Flow hiện tại:**
```
1. Any API call
   ❌ Không có network error handling
   ❌ Không có offline detection
   ❌ Không có retry mechanism
```

**Cần bổ sung:**
- [ ] Detect network errors
- [ ] Show offline message
- [ ] Retry khi network recover
- [ ] Queue requests khi offline

---

### Exc-7: Validation Failed

**Flow hiện tại:**
```
1. Seat Selection
   ✅ Validate min/max seats
   ✅ Show error message

2. Customer Info
   ✅ Validate name, email, phone
   ✅ Show error messages

3. Payment
   ✅ Validate payment method, amount
   ✅ Show error message
```

**Status**: ✅ Có validation cơ bản

**Cần cải thiện:**
- [ ] Real-time validation (on blur)
- [ ] Better error messages
- [ ] Highlight invalid fields

---

### Exc-8: Booking Creation Failed

**Flow hiện tại:**
```
1. Create booking (chưa có trong code hiện tại)
   ❌ Không có createBooking call
   ❌ Không có error handling
```

**Cần bổ sung:**
- [ ] Try-catch khi create booking
- [ ] Error message hiển thị
- [ ] Retry mechanism
- [ ] Release seats on error

---

### Exc-9: Payment Record Creation Failed

**Flow hiện tại:**
```
1. Create payment record (chưa có trong code hiện tại)
   ❌ Không có createPayment call
   ❌ Không có error handling
```

**Cần bổ sung:**
- [ ] Try-catch khi create payment
- [ ] Error message hiển thị
- [ ] Retry mechanism
- [ ] Rollback booking nếu cần

---

### Exc-10: Email/SMS Send Failed

**Flow hiện tại:**
```
1. Send confirmations
   ✅ Try sendEmailConfirmation
   ✅ Try sendSMSConfirmation
   ✅ Catch error → Log only
   ❌ Không có retry
   ❌ Không có user notification
```

**Cần bổ sung:**
- [ ] Retry mechanism
- [ ] User notification nếu send failed
- [ ] Queue để send later
- [ ] Log errors

---

### Exc-11: Session Timeout / User Logout

**Flow hiện tại:**
```
1. User đang trong booking flow
   ❌ Không detect session timeout
   ❌ Không handle user logout
   ❌ Không save booking state
```

**Cần bổ sung:**
- [ ] Detect session timeout
- [ ] Save booking state to localStorage
- [ ] Restore state khi user login lại
- [ ] Warning khi session sắp hết

---

### Exc-12: Booking Expired / Schedule Cancelled

**Flow hiện tại:**
```
1. User đang trong booking flow
   ❌ Không check schedule status
   ❌ Không check booking expiry
   ❌ Không validate schedule còn available
```

**Cần bổ sung:**
- [ ] Check schedule status trước khi booking
- [ ] Check booking expiry
- [ ] Validate schedule còn available
- [ ] Show error nếu schedule cancelled

---

### Exc-13: Amount Mismatch

**Flow hiện tại:**
```
1. QR Payment
   ❌ Không validate amount khi check payment
   ❌ Không check amount mismatch
```

**Cần bổ sung:**
- [ ] Validate amount khi check payment
- [ ] Show error nếu amount mismatch
- [ ] Suggest correct amount

---

### Exc-14: Duplicate Payment

**Flow hiện tại:**
```
1. User thanh toán 2 lần
   ❌ Không check duplicate payment
   ❌ Không prevent double payment
```

**Cần bổ sung:**
- [ ] Check duplicate payment
- [ ] Prevent double payment
- [ ] Show warning nếu duplicate detected

---

## 📊 Tổng Kết

### Đã Có Exception Handling
- ✅ Generate QR failed (có retry button)
- ✅ Seat validation
- ✅ Customer info validation
- ✅ Payment validation
- ✅ Basic error messages

### Thiếu Exception Handling
- ❌ Load seats failed
- ❌ Network errors
- ❌ Booking creation failed
- ❌ Payment record creation failed
- ❌ Session timeout
- ❌ Booking expired
- ❌ Amount mismatch
- ❌ Duplicate payment
- ❌ Real-time seat conflict

### Cần Cải Thiện
- ⚠️ QR payment timeout
- ⚠️ Payment check retry
- ⚠️ Email/SMS retry
- ⚠️ Better error messages
- ⚠️ Retry mechanisms

---

## 🎯 Priority Actions

### Priority 1 (Critical)
1. **Booking Creation Error Handling**
   - Try-catch khi create booking
   - Release seats on error
   - User-friendly error messages

2. **Payment Record Creation Error Handling**
   - Try-catch khi create payment
   - Rollback booking nếu cần
   - Retry mechanism

3. **Network Error Handling**
   - Detect network errors
   - Retry với exponential backoff
   - Offline detection

### Priority 2 (Important)
4. **QR Payment Timeout**
   - 15 phút timeout
   - Countdown timer
   - Auto-cancel booking

5. **Real-time Seat Conflict**
   - Supabase subscription
   - Auto-remove conflicted seats
   - Warning messages

6. **Session Timeout Handling**
   - Detect session timeout
   - Save state to localStorage
   - Restore state

### Priority 3 (Nice to Have)
7. **Better Error Messages**
   - Error codes
   - User-friendly messages
   - Retry buttons

8. **Validation Improvements**
   - Real-time validation
   - Better error highlighting
   - Field-level errors

---

**Ngày phân tích**: 2025-01-01  
**Người phân tích**: AI Assistant

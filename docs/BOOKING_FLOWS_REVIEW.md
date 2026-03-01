# Rà Soát Toàn Bộ Booking Flow - Alternative & Exception Flows

## 📋 Tổng Quan

Rà soát chi tiết các flows đã implement và còn thiếu trong hệ thống booking.

---

## ✅ ĐÃ HOÀN THÀNH

### Happy Path
- ✅ User đặt vé thành công (mock data)
- ✅ Flow từ chọn ghế → Summary → Payment → Confirmation

### Alternative Flows
- ✅ **Alt-1: QR Payment** - Có generate QR, polling, retry
- ✅ **Alt-4: Group Booking** - Có validate max 10 ghế

### Exception Flows
- ✅ **Exc-2: Seat Conflict** - Có real-time subscription, auto-remove conflicted seats
- ✅ **Exc-3: Generate QR Failed** - Có retry với exponential backoff (max 3 lần)
- ✅ **Exc-4: Payment Failed** - Có retry button và error handling
- ✅ **Exc-5: Payment Check Failed** - Có retry với exponential backoff
- ✅ **Exc-6: Network Error** - Có detection, offline banner, retry mechanism
- ✅ **Exc-7: Validation Failed** - Có validation cho seats, customer info, payment
- ✅ **Exc-8: Booking Creation Failed** - Có error handling, retry button
- ✅ **Exc-9: Payment Record Creation Failed** - Có error handling trong PaymentMethod
- ✅ **Exc-10: Email/SMS Send Failed** - Có non-blocking (không fail flow nếu email/SMS lỗi)

---

## ⚠️ MỘT PHẦN (Cần Hoàn Thiện)

### Alt-1: QR Payment Timeout
**Đã có:**
- ✅ Generate QR code
- ✅ Polling payment status
- ✅ Retry mechanism

**Thiếu:**
- ❌ Timeout 15 phút
- ❌ Countdown timer hiển thị
- ❌ Auto-cancel booking khi timeout
- ❌ Warning khi sắp hết thời gian

**Priority**: 🔴 High

---

### Alt-2: Back Navigation Cleanup
**Đã có:**
- ✅ Back button hoạt động
- ✅ Navigate về step trước

**Thiếu:**
- ❌ Release reserved seats khi back từ Summary
- ❌ Clear bookingId khi back từ Payment
- ❌ Confirmation dialog khi back từ Payment (có booking đã tạo)

**Priority**: 🟡 Medium

---

### Alt-3: Close/Cancel Cleanup
**Đã có:**
- ✅ Confirm dialog khi close
- ✅ Close modal

**Thiếu:**
- ❌ Release reserved seats khi close
- ❌ Cancel booking nếu đã tạo (status = pending)
- ❌ Clear all state khi close

**Priority**: 🟡 Medium

---

## ❌ CHƯA CÓ

### Exc-1: Load Seats Failed
**Status**: ❌ Chưa có
**Vấn đề:**
- Đang dùng mock data (`generateSeatingChart`)
- Không có error handling khi load từ database
- Không có retry mechanism

**Cần bổ sung:**
- [ ] Try-catch khi load seats từ database
- [ ] Error message hiển thị
- [ ] Retry button
- [ ] Fallback to mock data nếu cần

**Priority**: 🟡 Medium (chỉ khi tích hợp database)

---

### Exc-11: Session Timeout / User Logout
**Status**: ❌ Chưa có
**Vấn đề:**
- Không detect session timeout
- Không handle user logout trong booking flow
- Không save booking state

**Cần bổ sung:**
- [ ] Detect session timeout
- [ ] Save booking state to localStorage
- [ ] Restore state khi user login lại
- [ ] Warning khi session sắp hết

**Priority**: 🟡 Medium

---

### Exc-12: Booking Expired / Schedule Cancelled
**Status**: ❌ Chưa có
**Vấn đề:**
- Không check schedule status trước khi booking
- Không check booking expiry
- Không validate schedule còn available

**Cần bổ sung:**
- [ ] Check schedule status trước khi booking
- [ ] Check booking expiry
- [ ] Validate schedule còn available
- [ ] Show error nếu schedule cancelled

**Priority**: 🟡 Medium

---

### Exc-13: Amount Mismatch
**Status**: ❌ Chưa có
**Vấn đề:**
- Không validate amount khi check payment
- Không check amount mismatch

**Cần bổ sung:**
- [ ] Validate amount khi check payment
- [ ] Show error nếu amount mismatch
- [ ] Suggest correct amount

**Priority**: 🟢 Low

---

### Exc-14: Duplicate Payment
**Status**: ❌ Chưa có
**Vấn đề:**
- Không check duplicate payment
- Không prevent double payment

**Cần bổ sung:**
- [ ] Check duplicate payment
- [ ] Prevent double payment
- [ ] Show warning nếu duplicate detected

**Priority**: 🟢 Low

---

## 📊 Tổng Kết

### Đã Hoàn Thành: 10/14 Flows
- ✅ Happy Path
- ✅ QR Payment (thiếu timeout)
- ✅ Group Booking
- ✅ Seat Conflict (real-time)
- ✅ Generate QR Failed
- ✅ Payment Failed
- ✅ Payment Check Failed
- ✅ Network Error
- ✅ Validation Failed
- ✅ Booking Creation Failed
- ✅ Payment Record Creation Failed
- ✅ Email/SMS Send Failed

### Cần Hoàn Thiện: 2 Flows
- ⚠️ QR Payment Timeout
- ⚠️ Back Navigation Cleanup
- ⚠️ Close/Cancel Cleanup

### Chưa Có: 4 Flows
- ❌ Load Seats Failed
- ❌ Session Timeout
- ❌ Booking Expired
- ❌ Amount Mismatch
- ❌ Duplicate Payment

---

## 🎯 Kế Hoạch Hoàn Thiện

### Priority 1 (High) - Cần làm ngay
1. **QR Payment Timeout** (15 phút)
   - Countdown timer
   - Auto-cancel booking
   - Warning messages

### Priority 2 (Medium) - Nên có
2. **Back Navigation Cleanup**
   - Release reserved seats
   - Clear booking data
   - Confirmation dialog

3. **Close/Cancel Cleanup**
   - Release reserved seats
   - Cancel pending booking
   - Clear state

4. **Load Seats Error Handling**
   - Try-catch khi load từ database
   - Retry mechanism
   - Fallback to mock

5. **Session Timeout Handling**
   - Detect timeout
   - Save state to localStorage
   - Restore state

6. **Booking Expired / Schedule Cancelled**
   - Check schedule status
   - Validate availability
   - Show errors

### Priority 3 (Low) - Nice to have
7. **Amount Mismatch Validation**
   - Validate amount khi check payment
   - Show error nếu mismatch

8. **Duplicate Payment Prevention**
   - Check duplicate
   - Prevent double payment

---

## 🔍 Chi Tiết Các Flow Cần Bổ Sung

### 1. QR Payment Timeout

**Cần implement:**
```javascript
// PaymentMethod.jsx
- Timeout 15 phút cho QR payment
- Countdown timer hiển thị (MM:SS)
- Warning khi còn < 1 phút
- Auto-cancel booking khi timeout
- Button "Tạo lại mã QR" khi timeout
```

**Files cần sửa:**
- `src/components/Booking/PaymentMethod.jsx`

---

### 2. Back Navigation Cleanup

**Cần implement:**
```javascript
// BookingModal.jsx
- handleBack() cần release reserved seats khi back từ Summary
- handleBack() cần clear bookingId khi back từ Payment
- Confirmation dialog khi back từ Payment nếu có booking
```

**Files cần sửa:**
- `src/components/Booking/BookingModal.jsx`

---

### 3. Close/Cancel Cleanup

**Cần implement:**
```javascript
// BookingModal.jsx
- handleClose() cần release reserved seats
- handleClose() cần cancel booking nếu status = pending
- Clear all state khi close
```

**Files cần sửa:**
- `src/components/Booking/BookingModal.jsx`

---

### 4. Load Seats Error Handling

**Cần implement:**
```javascript
// BookingModal.jsx
- Try-catch khi load seats từ database
- Error message hiển thị
- Retry button
- Fallback to mock data
```

**Files cần sửa:**
- `src/components/Booking/BookingModal.jsx`
- `src/components/Booking/SeatSelection.jsx`

---

### 5. Session Timeout Handling

**Cần implement:**
```javascript
// BookingModal.jsx
- Detect session timeout từ AuthContext
- Save booking state to localStorage
- Restore state khi user login lại
- Warning khi session sắp hết
```

**Files cần sửa:**
- `src/components/Booking/BookingModal.jsx`

---

### 6. Booking Expired / Schedule Cancelled

**Cần implement:**
```javascript
// BookingModal.jsx
- Check schedule status trước khi booking
- Check booking expiry
- Validate schedule còn available
- Show error nếu schedule cancelled
```

**Files cần sửa:**
- `src/components/Booking/BookingModal.jsx`

---

### 7. Amount Mismatch Validation

**Cần implement:**
```javascript
// PaymentMethod.jsx hoặc paymentService.js
- Validate amount khi check payment
- Compare với expected amount
- Show error nếu mismatch
```

**Files cần sửa:**
- `src/services/paymentService.js`
- `src/components/Booking/PaymentMethod.jsx`

---

### 8. Duplicate Payment Prevention

**Cần implement:**
```javascript
// PaymentMethod.jsx
- Check duplicate payment trước khi process
- Prevent double payment
- Show warning nếu duplicate detected
```

**Files cần sửa:**
- `src/components/Booking/PaymentMethod.jsx`

---

## 📝 Checklist Hoàn Thiện

### Priority 1 (High)
- [ ] QR Payment Timeout (15 phút)
- [ ] Countdown timer hiển thị
- [ ] Auto-cancel booking khi timeout

### Priority 2 (Medium)
- [ ] Back Navigation Cleanup
- [ ] Close/Cancel Cleanup
- [ ] Load Seats Error Handling
- [ ] Session Timeout Handling
- [ ] Booking Expired / Schedule Cancelled

### Priority 3 (Low)
- [ ] Amount Mismatch Validation
- [ ] Duplicate Payment Prevention

---

**Ngày rà soát**: 2025-01-01  
**Người rà soát**: AI Assistant  
**Trạng thái**: Đã hoàn thành 10/14 flows, cần hoàn thiện 4 flows

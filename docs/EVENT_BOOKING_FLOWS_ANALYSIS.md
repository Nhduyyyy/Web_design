# Rà Soát Alternative & Exception Flows - Event Booking

## 📋 Tổng Quan

Báo cáo chi tiết về các alternative và exception flows trong hệ thống booking sự kiện (events), so sánh với booking lịch chiếu (shows).

**Ngày rà soát**: 2025-01-01  
**Phạm vi**: Event Booking System

---

## ✅ ĐÃ HOÀN THÀNH

### Happy Path
- ✅ User đăng ký sự kiện thành công
- ✅ Flow từ Summary → Payment → Confirmation
- ✅ Hỗ trợ cả mock data và database data

### Alternative Flows

#### Alt-1: QR Payment ✅
**Status**: Hoàn thành
- ✅ Generate QR code với VietQR.io API
- ✅ Polling payment status (mỗi 5 giây)
- ✅ Retry mechanism với exponential backoff
- ✅ **QR Payment Timeout (15 phút)** ✅
  - Countdown timer hiển thị (MM:SS)
  - Warning khi còn < 1 phút (màu đỏ)
  - Auto-cancel registration khi timeout
  - Button "Tạo lại mã QR" khi timeout
- ✅ Memoized QR code để tránh flicker

**Files**: `PaymentMethod.jsx`, `qrPaymentService.js`

#### Alt-2: Free Event (price = 0) ✅
**Status**: Hoàn thành
- ✅ Skip payment step nếu event.price === 0
- ✅ Direct confirmation
- ✅ Hiển thị "Miễn phí" trong summary và confirmation

**Files**: `EventBookingModal.jsx`, `EventBookingSummary.jsx`, `EventConfirmation.jsx`

#### Alt-3: Group Registration ✅
**Status**: Hoàn thành
- ✅ Quantity selector (1 - max_available)
- ✅ Validate quantity không vượt quá available slots
- ✅ Tính tổng tiền = price * quantity
- ✅ Hiển thị số chỗ còn trống

**Files**: `EventBookingSummary.jsx`

### Exception Flows

#### Exc-1: Network Error ✅
**Status**: Hoàn thành
- ✅ Detect online/offline status
- ✅ Network error banner hiển thị
- ✅ Block actions khi offline
- ✅ Auto-retry khi network restore
- ✅ User-friendly error messages

**Files**: `EventBookingModal.jsx` (lines 127-149, 151-186)

#### Exc-2: Event Status Check ✅
**Status**: Hoàn thành
- ✅ Check event status trước khi booking
- ✅ Periodic check (mỗi 30 giây)
- ✅ Detect event cancelled
- ✅ Detect event full
- ✅ Show error banner khi event cancelled/full

**Files**: `EventBookingModal.jsx` (lines 91-113, 442-461)

#### Exc-3: Validation Failed ✅
**Status**: Hoàn thành
- ✅ Validate customer info (name, email, phone)
- ✅ Validate quantity (1 - max_available)
- ✅ Show inline error messages
- ✅ Disable continue button khi có lỗi

**Files**: `EventBookingSummary.jsx` (lines 76-109)

#### Exc-4: Registration Creation Failed ✅
**Status**: Hoàn thành
- ✅ Error handling khi tạo registration
- ✅ Retry button với exponential backoff (max 3 lần)
- ✅ User-friendly error messages
- ✅ Network error detection

**Files**: `EventBookingModal.jsx` (lines 188-253)

#### Exc-5: Payment Failed ✅
**Status**: Hoàn thành
- ✅ Error handling trong payment flow
- ✅ Retry payment button
- ✅ Network error detection
- ✅ User-friendly error messages

**Files**: `EventBookingModal.jsx` (lines 255-342), `PaymentMethod.jsx`

#### Exc-6: QR Generation Failed ✅
**Status**: Hoàn thành
- ✅ Error handling khi generate QR
- ✅ Retry với exponential backoff (max 3 lần)
- ✅ Fallback error message

**Files**: `PaymentMethod.jsx`, `qrPaymentService.js`

#### Exc-7: Payment Check Failed ✅
**Status**: Hoàn thành
- ✅ Error handling khi check payment status
- ✅ Retry polling với exponential backoff
- ✅ Network error detection

**Files**: `PaymentMethod.jsx`, `paymentService.js`

#### Exc-8: Email/SMS Send Failed ✅
**Status**: Hoàn thành
- ✅ Non-blocking (không fail flow nếu email/SMS lỗi)
- ✅ Error logging
- ✅ Flow vẫn tiếp tục dù email/SMS fail

**Files**: `EventBookingModal.jsx` (lines 287-296)

#### Exc-9: QR Payment Timeout ✅
**Status**: Hoàn thành
- ✅ Timeout 15 phút
- ✅ Countdown timer (MM:SS)
- ✅ Warning khi còn < 1 phút
- ✅ Auto-cancel registration khi timeout
- ✅ Button "Tạo lại mã QR"
- ✅ Reset timer khi regenerate

**Files**: `PaymentMethod.jsx` (lines 10, 62-121, 123-145, 343-410)

#### Exc-10: Back Navigation Cleanup ✅
**Status**: Hoàn thành
- ✅ Confirmation dialog khi back từ Payment
- ✅ Cancel registration khi back từ Payment
- ✅ Clear registrationId
- ✅ Navigate về step trước

**Files**: `EventBookingModal.jsx` (lines 344-362)

#### Exc-11: Close/Cancel Cleanup ✅
**Status**: Hoàn thành
- ✅ Confirmation dialog khi close
- ✅ Cancel registration nếu đã tạo
- ✅ Clear all state
- ✅ Cleanup on unmount

**Files**: `EventBookingModal.jsx` (lines 364-388, 78-88)

#### Exc-12: Event Expired/Cancelled ✅
**Status**: Hoàn thành
- ✅ Check event status trước khi booking
- ✅ Periodic check (mỗi 30 giây)
- ✅ Show error nếu event cancelled
- ✅ Show error nếu event full
- ✅ Block booking khi event cancelled/full

**Files**: `EventBookingModal.jsx` (lines 91-113, 195-205, 442-461)

---

## ⚠️ MỘT PHẦN (Cần Hoàn Thiện)

### Alt-4: Real-time Participant Updates
**Status**: ⚠️ Một phần

**Đã có:**
- ✅ Periodic check event status (mỗi 30 giây)
- ✅ Check event full/cancelled

**Thiếu:**
- ❌ Real-time subscription đến `events` table
- ❌ Auto-update available slots khi có người đăng ký khác
- ❌ Warning khi available slots giảm trong lúc user đang điền form
- ❌ Auto-adjust quantity nếu user chọn nhiều hơn available slots

**Priority**: 🟡 Medium

**Cần implement:**
```javascript
// EventBookingModal.jsx
- Supabase real-time subscription đến events table
- Listen to UPDATE events
- Auto-update event.current_participants
- Recalculate available slots
- Show warning nếu slots giảm
- Auto-adjust quantity nếu cần
```

**Files cần sửa:**
- `EventBookingModal.jsx`
- `EventBookingSummary.jsx`

---

## ❌ CHƯA CÓ

### Exc-13: Load Event Failed
**Status**: ❌ Chưa có

**Vấn đề:**
- Đang dùng mock data từ `eventsData.js`
- Không có error handling khi load từ database
- Không có retry mechanism

**Cần bổ sung:**
- [ ] Try-catch khi load event từ database
- [ ] Error message hiển thị
- [ ] Retry button
- [ ] Fallback to mock data nếu cần

**Priority**: 🟡 Medium (chỉ khi tích hợp database)

**Files cần sửa:**
- `EventDetail.jsx`
- `Events.jsx`

---

### Exc-14: Session Timeout / User Logout
**Status**: ❌ Chưa có

**Vấn đề:**
- Không detect session timeout
- Không handle user logout trong booking flow
- Không save booking state

**Cần bổ sung:**
- [ ] Detect session timeout từ AuthContext
- [ ] Save booking state to localStorage
- [ ] Restore state khi user login lại
- [ ] Warning khi session sắp hết

**Priority**: 🟡 Medium

**Files cần sửa:**
- `EventBookingModal.jsx`
- `AuthContext.jsx`

---

### Exc-15: Amount Mismatch
**Status**: ❌ Chưa có

**Vấn đề:**
- Không validate amount khi check payment
- Không check amount mismatch

**Cần bổ sung:**
- [ ] Validate amount khi check payment
- [ ] Compare với expected amount
- [ ] Show error nếu mismatch
- [ ] Suggest correct amount

**Priority**: 🟢 Low

**Files cần sửa:**
- `paymentService.js`
- `PaymentMethod.jsx`

---

### Exc-16: Duplicate Payment
**Status**: ❌ Chưa có

**Vấn đề:**
- Không check duplicate payment
- Không prevent double payment

**Cần bổ sung:**
- [ ] Check duplicate payment
- [ ] Prevent double payment
- [ ] Show warning nếu duplicate detected

**Priority**: 🟢 Low

**Files cần sửa:**
- `PaymentMethod.jsx`
- `paymentService.js`

---

### Exc-17: Registration Creation Conflict
**Status**: ❌ Chưa có

**Vấn đề:**
- Không check race condition khi nhiều user đăng ký cùng lúc
- Không handle conflict khi event đã full

**Cần bổ sung:**
- [ ] Check available slots trước khi tạo registration
- [ ] Handle conflict khi event đã full
- [ ] Show error nếu conflict

**Priority**: 🟡 Medium

**Files cần sửa:**
- `EventBookingModal.jsx`
- `eventService.js`

---

## 📊 So Sánh Với Theater Booking

### Điểm Giống
- ✅ QR Payment timeout (15 phút)
- ✅ Network error handling
- ✅ Retry mechanisms
- ✅ Validation
- ✅ Back navigation cleanup
- ✅ Close/Cancel cleanup
- ✅ Email/SMS non-blocking

### Điểm Khác

| Feature | Theater Booking | Event Booking | Status |
|---------|----------------|---------------|--------|
| **Seat Selection** | ✅ Có | ❌ Không cần | ✅ OK |
| **Real-time Updates** | ✅ Seat conflict | ⚠️ Chưa có participant updates | ⚠️ Cần bổ sung |
| **Reservation** | ✅ Seat reservation | ❌ Không có (không cần) | ✅ OK |
| **Quantity Selection** | ❌ Không (chọn ghế) | ✅ Có | ✅ OK |
| **Status Check** | ✅ Schedule status | ✅ Event status | ✅ OK |

---

## 📊 Tổng Kết

### Đã Hoàn Thành: 12/17 Flows
- ✅ Happy Path
- ✅ QR Payment (có timeout)
- ✅ Free Event
- ✅ Group Registration
- ✅ Network Error
- ✅ Event Status Check
- ✅ Validation Failed
- ✅ Registration Creation Failed
- ✅ Payment Failed
- ✅ QR Generation Failed
- ✅ Payment Check Failed
- ✅ Email/SMS Send Failed
- ✅ QR Payment Timeout
- ✅ Back Navigation Cleanup
- ✅ Close/Cancel Cleanup
- ✅ Event Expired/Cancelled

### Cần Hoàn Thiện: 1 Flow
- ⚠️ Real-time Participant Updates

### Chưa Có: 5 Flows
- ❌ Load Event Failed
- ❌ Session Timeout
- ❌ Amount Mismatch
- ❌ Duplicate Payment
- ❌ Registration Creation Conflict

---

## 🎯 Kế Hoạch Hoàn Thiện

### Priority 1 (High) - Cần làm ngay
**Không có** - Tất cả flows quan trọng đã hoàn thành

### Priority 2 (Medium) - Nên có
1. **Real-time Participant Updates**
   - Supabase subscription đến `events` table
   - Auto-update available slots
   - Warning khi slots giảm
   - Auto-adjust quantity

2. **Load Event Error Handling**
   - Try-catch khi load từ database
   - Retry mechanism
   - Fallback to mock

3. **Session Timeout Handling**
   - Detect timeout
   - Save state to localStorage
   - Restore state

4. **Registration Creation Conflict**
   - Check available slots trước khi tạo
   - Handle conflict
   - Show error

### Priority 3 (Low) - Nice to have
5. **Amount Mismatch Validation**
   - Validate amount khi check payment
   - Show error nếu mismatch

6. **Duplicate Payment Prevention**
   - Check duplicate
   - Prevent double payment

---

## 🔍 Chi Tiết Các Flow Cần Bổ Sung

### 1. Real-time Participant Updates

**Cần implement:**
```javascript
// EventBookingModal.jsx
useEffect(() => {
  if (!isOpen || !event?.id) return
  
  // Skip for mock data
  if (event.id.startsWith && event.id.startsWith('evt-')) return
  
  // Subscribe to events table
  const subscription = supabase
    .channel(`event-${event.id}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'events',
      filter: `id=eq.${event.id}`
    }, (payload) => {
      // Update event data
      const updatedEvent = payload.new
      setEvent(prev => ({ ...prev, ...updatedEvent }))
      
      // Recalculate available slots
      const available = updatedEvent.max_participants - updatedEvent.current_participants
      
      // Show warning nếu slots giảm
      if (available < quantity) {
        setBookingError(`Chỉ còn ${available} chỗ trống. Vui lòng giảm số lượng.`)
        // Auto-adjust quantity
        if (quantity > available) {
          setQuantity(available)
        }
      }
    })
    .subscribe()
  
  return () => {
    subscription.unsubscribe()
  }
}, [isOpen, event, quantity])
```

**Files cần sửa:**
- `EventBookingModal.jsx`
- `EventBookingSummary.jsx`

---

### 2. Load Event Error Handling

**Cần implement:**
```javascript
// EventDetail.jsx
const [eventError, setEventError] = useState(null)
const [isLoadingEvent, setIsLoadingEvent] = useState(false)

const loadEvent = async () => {
  setIsLoadingEvent(true)
  setEventError(null)
  
  try {
    // Try load from database
    const eventData = await getEventById(eventId)
    setEvent(eventData)
  } catch (error) {
    console.error('Error loading event:', error)
    setEventError('Không thể tải thông tin sự kiện. Vui lòng thử lại.')
    
    // Fallback to mock data
    const mockEvent = getEventByIdFromMock(eventId)
    if (mockEvent) {
      setEvent(mockEvent)
    }
  } finally {
    setIsLoadingEvent(false)
  }
}
```

**Files cần sửa:**
- `EventDetail.jsx`
- `Events.jsx`

---

### 3. Session Timeout Handling

**Cần implement:**
```javascript
// EventBookingModal.jsx
const { user, isAuthenticated } = useAuth()

useEffect(() => {
  // Check session timeout
  if (!isAuthenticated && user) {
    // Save state to localStorage
    localStorage.setItem('eventBookingState', JSON.stringify({
      event,
      quantity,
      customerInfo,
      currentStep,
      registrationId
    }))
    
    // Show warning
    setBookingError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
  }
}, [isAuthenticated, user])

// Restore state when user logs back in
useEffect(() => {
  if (isAuthenticated && user) {
    const savedState = localStorage.getItem('eventBookingState')
    if (savedState) {
      const state = JSON.parse(savedState)
      // Restore state
      setEvent(state.event)
      setQuantity(state.quantity)
      setCustomerInfo(state.customerInfo)
      setCurrentStep(state.currentStep)
      setRegistrationId(state.registrationId)
      
      // Clear saved state
      localStorage.removeItem('eventBookingState')
    }
  }
}, [isAuthenticated, user])
```

**Files cần sửa:**
- `EventBookingModal.jsx`
- `AuthContext.jsx`

---

### 4. Registration Creation Conflict

**Cần implement:**
```javascript
// EventBookingModal.jsx
const handleSummaryContinue = async (info, qty) => {
  // ... existing code ...
  
  try {
    // Double-check available slots before creating registration
    const eventData = await getEventById(event.id)
    const availableSlots = eventData.max_participants - eventData.current_participants
    
    if (qty > availableSlots) {
      setBookingError(`Chỉ còn ${availableSlots} chỗ trống. Vui lòng giảm số lượng.`)
      return
    }
    
    // Create registration
    const registration = await createEventRegistration({
      event_id: event.id,
      user_id: user.id,
      quantity: qty,
      // ... other data
    })
    
    setRegistrationId(registration.id)
    setCurrentStep(STEPS.PAYMENT)
  } catch (error) {
    // Handle conflict
    if (error.message.includes('full') || error.message.includes('available')) {
      setBookingError('Sự kiện đã hết chỗ. Vui lòng chọn sự kiện khác.')
    } else {
      const errorMessage = getErrorMessage(error, 'Không thể tạo mã đăng ký. Vui lòng thử lại.')
      setBookingError(errorMessage)
    }
  }
}
```

**Files cần sửa:**
- `EventBookingModal.jsx`
- `eventService.js`

---

## 📝 Checklist Hoàn Thiện

### Priority 1 (High)
- ✅ QR Payment Timeout (15 phút) - **ĐÃ HOÀN THÀNH**

### Priority 2 (Medium)
- [ ] Real-time Participant Updates
- [ ] Load Event Error Handling
- [ ] Session Timeout Handling
- [ ] Registration Creation Conflict

### Priority 3 (Low)
- [ ] Amount Mismatch Validation
- [ ] Duplicate Payment Prevention

---

## 🎉 Kết Luận

**Event Booking System đã hoàn thành 12/17 flows (70.6%)**

Các flows quan trọng nhất đã được implement:
- ✅ Happy Path
- ✅ QR Payment với timeout
- ✅ Network error handling
- ✅ Validation
- ✅ Cleanup (back, close)
- ✅ Event status check

**Cần bổ sung:**
- ⚠️ Real-time participant updates (quan trọng cho UX)
- ❌ Load event error handling (khi tích hợp database)
- ❌ Session timeout (nice to have)
- ❌ Conflict handling (quan trọng cho production)

**Đánh giá tổng thể**: ⭐⭐⭐⭐ (4/5)
- Hệ thống đã rất hoàn chỉnh
- Cần bổ sung real-time updates để cải thiện UX
- Cần error handling khi tích hợp database

---

**Ngày rà soát**: 2025-01-01  
**Người rà soát**: AI Assistant  
**Trạng thái**: Đã hoàn thành 12/17 flows, cần bổ sung 5 flows

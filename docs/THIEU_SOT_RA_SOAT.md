# Báo Cáo Rà Soát - Các Thiếu Sót Cần Bổ Sung

## 📋 Tổng Quan

Sau khi rà soát toàn bộ hệ thống đặt vé, phát hiện các thiếu sót quan trọng cần được bổ sung để hệ thống hoạt động đầy đủ với database thực.

---

## 🔴 THIẾU SÓT NGHIÊM TRỌNG

### 1. **Frontend KHÔNG tích hợp với Backend Services**

**Vấn đề:**
- `BookingModal.jsx` sử dụng mock functions từ `utils/booking.js` thay vì gọi `bookingService.js`
- `SeatSelection.jsx` tạo random seats bằng `generateSeatingChart()` thay vì lấy từ database
- `BookingSummary.jsx` chỉ validate form, không lưu booking vào database
- `PaymentMethod.jsx` chỉ check payment status, không tạo booking/payment record khi chọn QR

**File liên quan:**
- `src/components/Booking/BookingModal.jsx` (dòng 7, 34, 59)
- `src/components/Booking/SeatSelection.jsx` (không có import service)
- `src/components/Booking/BookingSummary.jsx` (không có import service)
- `src/components/Booking/PaymentMethod.jsx` (chỉ có checkPaymentStatus, không có createBooking/createPayment)

**Cần sửa:**
```javascript
// BookingModal.jsx - Thay vì:
import { generateSeatingChart, processPayment } from '../../utils/booking'

// Cần:
import { getSeatsBySchedule, getScheduleById } from '../../services/scheduleService'
import { completeBookingFlow, createBooking, createPayment } from '../../services/bookingService'
```

---

### 2. **SeatSelection không lấy seats từ Database**

**Vấn đề:**
- `SeatSelection` component nhận `seatingChart` từ props (được tạo random trong `BookingModal`)
- Không có API call để lấy seats thực từ database theo `schedule_id`
- Không có real-time update khi seats bị đặt bởi user khác

**File liên quan:**
- `src/components/Booking/BookingModal.jsx` (dòng 34-35)
- `src/components/Booking/SeatSelection.jsx` (nhận seatingChart từ props)

**Cần sửa:**
```javascript
// BookingModal.jsx
useEffect(() => {
  if (isOpen && event?.schedule_id) {
    // Lấy seats từ database
    loadSeatsFromDatabase(event.schedule_id)
  }
}, [isOpen, event])

const loadSeatsFromDatabase = async (scheduleId) => {
  try {
    const seats = await getSeatsBySchedule(scheduleId)
    setSeatingChart(seats)
  } catch (error) {
    console.error('Error loading seats:', error)
  }
}
```

---

### 3. **Booking không được lưu vào Database**

**Vấn đề:**
- `BookingModal.handlePayment()` gọi `processPayment()` từ `utils/booking.js` (mock function)
- Không có `createBooking()` call trước khi thanh toán
- Không có `createPayment()` call để lưu payment record
- Booking ID được generate local, không sync với database

**File liên quan:**
- `src/components/Booking/BookingModal.jsx` (dòng 57-79)
- `src/utils/booking.js` (dòng 69-122 - mock function)

**Cần sửa:**
```javascript
// BookingModal.jsx - handlePayment
const handlePayment = async (method, amount) => {
  try {
    // 1. Tạo booking trong database
    const booking = await createBooking({
      user_id: user?.id || null,
      schedule_id: event.schedule_id,
      seat_ids: selectedSeats.map(s => s.id),
      customer_name: customerInfo.name,
      customer_email: customerInfo.email,
      customer_phone: customerInfo.phone,
      total_amount: amount
    })
    
    // 2. Tạo payment record
    const payment = await createPayment({
      booking_id: booking.id,
      user_id: user?.id || null,
      amount: amount,
      payment_method: method
    })
    
    // 3. Nếu QR payment, đã có QR code và polling
    // 4. Nếu wallet/card, process payment
    if (method !== 'qr') {
      await processPayment(payment.id)
    }
    
    setPaymentResult({ success: true, booking, payment })
    setCurrentStep(STEPS.CONFIRMATION)
  } catch (error) {
    console.error('Payment error:', error)
    setPaymentResult({ success: false, message: error.message })
  }
}
```

---

### 4. **PaymentMethod chưa tạo Booking/Payment khi chọn QR**

**Vấn đề:**
- Khi user chọn QR payment, chỉ generate QR code
- Không tạo booking record trong database
- Không tạo payment record với QR fields (transfer_content, bank_account, etc.)
- `checkPaymentStatus()` sẽ không tìm thấy booking vì chưa được tạo

**File liên quan:**
- `src/components/Booking/PaymentMethod.jsx` (dòng 82-94)
- `src/services/paymentService.js` (checkPaymentStatus sẽ fail nếu booking chưa tồn tại)

**Cần sửa:**
```javascript
// PaymentMethod.jsx - Cần nhận thêm props: event, selectedSeats, customerInfo, user
// Và gọi createBooking/createPayment khi generate QR

const generateQRCode = async () => {
  setIsGeneratingQR(true)
  setPaymentError(null)
  try {
    // 1. Tạo booking trước
    const booking = await createBooking({
      user_id: user?.id || null,
      schedule_id: event.schedule_id,
      seat_ids: selectedSeats.map(s => s.id),
      customer_name: customerInfo.name,
      customer_email: customerInfo.email,
      customer_phone: customerInfo.phone,
      total_amount: total
    })
    
    // 2. Generate QR với booking_code thực
    const qr = await generateStaticQR(booking.booking_code, total)
    
    // 3. Tạo payment record với QR fields
    await createPaymentRecord({
      booking_id: booking.id,
      user_id: user?.id || null,
      amount: total,
      payment_method: 'qr',
      transfer_content: qr.transferContent,
      bank_account_no: qr.bankInfo.accountNo,
      bank_account_name: qr.bankInfo.accountName,
      bank_code: qr.bankInfo.bankCode,
      qr_code_url: qr.qrImageUrl,
      status: 'pending'
    })
    
    setQrData(qr)
  } catch (error) {
    console.error('Error generating QR:', error)
    setPaymentError('Không thể tạo mã QR. Vui lòng thử lại.')
  } finally {
    setIsGeneratingQR(false)
  }
}
```

---

### 5. **Thiếu User Authentication Context**

**Vấn đề:**
- `BookingModal` không có access đến `user` từ `AuthContext`
- Không biết user đã đăng nhập hay chưa
- `user_id` trong booking sẽ là `null` nếu không có user context

**File liên quan:**
- `src/components/Booking/BookingModal.jsx` (không import useAuth)
- `src/contexts/AuthContext.jsx` (đã có nhưng chưa được sử dụng)

**Cần sửa:**
```javascript
// BookingModal.jsx
import { useAuth } from '../../contexts/AuthContext'

export default function BookingModal({ event, isOpen, onClose }) {
  const { user } = useAuth()
  // ... rest of code
}
```

---

### 6. **Thiếu Reservation Mechanism**

**Vấn đề:**
- Khi user chọn seats, không có reservation (temporary hold)
- Seats có thể bị đặt bởi user khác trong lúc đang điền form
- Không có timeout để release reserved seats

**Cần bổ sung:**
```javascript
// SeatSelection.jsx - Khi user chọn seats
const handleSeatClick = async (seat) => {
  // Reserve seats khi user chọn
  try {
    await reserveSeats([seat.id], user?.id, 10) // 10 minutes
  } catch (error) {
    // Seat đã bị đặt
    setSeatError('Ghế này đã được đặt bởi người khác')
  }
}

// BookingModal.jsx - Cleanup khi đóng modal
useEffect(() => {
  return () => {
    // Release reserved seats khi đóng modal
    if (selectedSeats.length > 0) {
      releaseSeats(selectedSeats.map(s => s.id))
    }
  }
}, [])
```

---

## 🟡 THIẾU SÓT QUAN TRỌNG

### 7. **Thiếu Exception Handling cho QR Payment**

**Vấn đề:**
- Không có handling cho các trường hợp:
  - Generate QR failed
  - Network error khi check payment
  - Payment timeout (quá 15 phút)
  - Amount mismatch
  - Booking expired

**File liên quan:**
- `src/components/Booking/PaymentMethod.jsx` (cần thêm error states)

**Cần bổ sung:**
```javascript
// PaymentMethod.jsx
const [qrError, setQrError] = useState(null)
const [paymentTimeout, setPaymentTimeout] = useState(false)

// Timeout sau 15 phút
useEffect(() => {
  if (selectedMethod === 'qr' && qrData) {
    const timeout = setTimeout(() => {
      setPaymentTimeout(true)
      clearInterval(pollingIntervalRef.current)
    }, 15 * 60 * 1000) // 15 minutes
    
    return () => clearTimeout(timeout)
  }
}, [selectedMethod, qrData])
```

---

### 8. **Thiếu Integration với Schedule/Event Data**

**Vấn đề:**
- `BookingModal` nhận `event` prop nhưng không có `schedule_id`
- Không có mapping giữa `event` và `schedule` trong database
- Không validate xem schedule có còn available không

**Cần bổ sung:**
- Event object cần có `schedule_id` field
- Hoặc cần query schedule từ event
- Validate schedule status trước khi cho phép booking

---

### 9. **Thiếu Real-time Seat Updates**

**Vấn đề:**
- Seats được load một lần khi mở modal
- Không có real-time subscription để update khi seats bị đặt
- User có thể chọn seats đã bị đặt bởi user khác

**Cần bổ sung:**
```javascript
// SeatSelection.jsx
useEffect(() => {
  if (scheduleId) {
    // Subscribe to seat updates
    const subscription = supabase
      .channel('seat-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'seats',
        filter: `schedule_id=eq.${scheduleId}`
      }, (payload) => {
        // Update seat status in real-time
        updateSeatStatus(payload.new)
      })
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }
}, [scheduleId])
```

---

### 10. **Thiếu Validation cho Booking Flow**

**Vấn đề:**
- Không validate seats còn available trước khi tạo booking
- Không validate schedule còn active
- Không validate total amount match với seat prices

**Cần bổ sung:**
```javascript
// bookingService.js - completeBookingFlow
export const completeBookingFlow = async ({...}) => {
  // 1. Validate seats are still available
  const { data: seats } = await supabase
    .from('seats')
    .select('*')
    .in('id', seatIds)
    .eq('status', 'available')
  
  if (seats.length !== seatIds.length) {
    throw new Error('Một số ghế đã được đặt')
  }
  
  // 2. Validate schedule
  const schedule = await getScheduleById(scheduleId)
  if (schedule.status !== 'scheduled') {
    throw new Error('Lịch diễn không còn available')
  }
  
  // 3. Validate amount
  const calculatedTotal = seats.reduce((sum, s) => sum + s.price, 0)
  if (calculatedTotal !== totalAmount) {
    throw new Error('Số tiền không khớp')
  }
  
  // ... rest of flow
}
```

---

## 🟢 THIẾU SÓT NHỎ

### 11. **Thiếu Loading States**

- Không có loading indicator khi tạo booking
- Không có loading khi reserve seats
- Không có skeleton loading khi load seats

### 12. **Thiếu Error Messages User-friendly**

- Error messages quá technical
- Không có retry mechanism
- Không có fallback options

### 13. **Thiếu Booking Expiry**

- Không có `payment_expires_at` được set khi tạo booking
- Không có cleanup job để cancel expired bookings

### 14. **Thiếu Email/SMS Integration**

- `sendEmailConfirmation()` và `sendSMSConfirmation()` chỉ log, không gửi thực
- Cần tích hợp với email service (SendGrid, AWS SES, etc.)
- Cần tích hợp với SMS service (Twilio, etc.)

---

## 📝 KẾ HOẠCH SỬA CHỮA

### Phase 1: Core Integration (Ưu tiên cao)
1. ✅ Tích hợp `BookingModal` với `bookingService` và `scheduleService`
2. ✅ Load seats từ database thay vì generate random
3. ✅ Tạo booking record khi user chọn seats
4. ✅ Tạo payment record khi chọn payment method
5. ✅ Tích hợp user authentication context

### Phase 2: Reservation & Real-time (Ưu tiên trung bình)
6. ✅ Implement seat reservation mechanism
7. ✅ Real-time seat updates với Supabase subscriptions
8. ✅ Cleanup expired reservations

### Phase 3: Error Handling & Validation (Ưu tiên trung bình)
9. ✅ Exception handling cho QR payment
10. ✅ Validation cho booking flow
11. ✅ User-friendly error messages

### Phase 4: Polish & Enhancement (Ưu tiên thấp)
12. ✅ Loading states và skeleton screens
13. ✅ Email/SMS integration thực
14. ✅ Booking expiry và cleanup jobs

---

## 🔗 Files Cần Sửa

### High Priority
- `src/components/Booking/BookingModal.jsx`
- `src/components/Booking/SeatSelection.jsx`
- `src/components/Booking/PaymentMethod.jsx`
- `src/components/Booking/BookingSummary.jsx`

### Medium Priority
- `src/services/bookingService.js` (thêm validation)
- `src/services/scheduleService.js` (thêm real-time)

### Low Priority
- `src/utils/booking.js` (có thể giữ lại cho mock data/testing)
- Email/SMS service integration

---

## ✅ Đã Hoàn Thành

- ✅ QR Payment service với VietQR.io API
- ✅ Payment status checking service
- ✅ Database migration cho QR payment fields
- ✅ PaymentMethod component với QR display và polling
- ✅ Exception flows documentation

---

**Ngày rà soát:** 2025-01-01  
**Người rà soát:** AI Assistant  
**Trạng thái:** Cần sửa chữa ngay

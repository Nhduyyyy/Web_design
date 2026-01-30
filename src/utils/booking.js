// Booking utility functions

// Generate seating chart for a venue
export function generateSeatingChart(rows = 10, seatsPerRow = 12) {
  const seats = []
  const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P']
  
  for (let i = 0; i < rows; i++) {
    for (let j = 1; j <= seatsPerRow; j++) {
      const seatId = `${rowLabels[i]}${j}`
      seats.push({
        id: seatId,
        row: rowLabels[i],
        number: j,
        status: Math.random() > 0.7 ? 'occupied' : 'available', // 30% occupied for demo
        price: calculateSeatPrice(i, rows, j, seatsPerRow),
        type: getSeatType(i, rows)
      })
    }
  }
  
  return seats
}

function calculateSeatPrice(rowIndex, totalRows, seatNumber, seatsPerRow) {
  // VIP seats (first 2 rows): 500k
  if (rowIndex < 2) return 500000
  // Premium seats (rows 2-4): 350k
  if (rowIndex < 4) return 350000
  // Standard seats (middle): 250k
  if (rowIndex < totalRows - 2) return 250000
  // Economy seats (last 2 rows): 150k
  return 150000
}

function getSeatType(rowIndex, totalRows) {
  if (rowIndex < 2) return 'vip'
  if (rowIndex < 4) return 'premium'
  if (rowIndex < totalRows - 2) return 'standard'
  return 'economy'
}

// Get seat status (available, occupied, selected)
export function getSeatStatus(seat, selectedSeats = []) {
  if (seat.status === 'occupied') return 'occupied'
  if (selectedSeats.some(s => s.id === seat.id)) return 'selected'
  return 'available'
}

// Calculate total price
export function calculateTotal(selectedSeats = []) {
  return selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0)
}

// Format price in VND
export function formatPrice(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}

// Generate booking ID
export function generateBookingId() {
  return `BK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`
}

// Simulate payment processing with validation
export async function processPayment(paymentMethod, amount, bookingId) {
  // Validate inputs
  if (!paymentMethod || !['wallet', 'card', 'qr'].includes(paymentMethod)) {
    return {
      success: false,
      transactionId: null,
      bookingId,
      amount,
      paymentMethod,
      timestamp: new Date().toISOString(),
      message: 'Phương thức thanh toán không hợp lệ'
    }
  }
  
  if (!amount || amount <= 0) {
    return {
      success: false,
      transactionId: null,
      bookingId,
      amount,
      paymentMethod,
      timestamp: new Date().toISOString(),
      message: 'Số tiền không hợp lệ'
    }
  }
  
  if (!bookingId) {
    return {
      success: false,
      transactionId: null,
      bookingId: null,
      amount,
      paymentMethod,
      timestamp: new Date().toISOString(),
      message: 'Mã đặt vé không hợp lệ'
    }
  }
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Simulate 90% success rate
  const success = Math.random() > 0.1
  
  return {
    success,
    transactionId: success ? `TXN${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}` : null,
    bookingId,
    amount,
    paymentMethod,
    timestamp: new Date().toISOString(),
    message: success ? 'Thanh toán thành công' : 'Thanh toán thất bại. Vui lòng thử lại.'
  }
}

// Simulate sending confirmation email with validation
export async function sendEmailConfirmation(booking) {
  // Validate booking data
  if (!booking || !booking.customerEmail || !booking.bookingId) {
    console.error('❌ Không thể gửi email: thiếu thông tin booking')
    return { success: false, error: 'Thiếu thông tin booking' }
  }
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500))
  
  console.log('📧 Email xác nhận đã được gửi đến:', booking.customerEmail)
  console.log('Nội dung:', {
    bookingId: booking.bookingId,
    event: booking.event?.title || 'N/A',
    seats: booking.selectedSeats?.map(s => s.id).join(', ') || 'N/A',
    total: formatPrice(booking.total || 0)
  })
  
  return { success: true }
}

// Simulate sending SMS confirmation with validation
export async function sendSMSConfirmation(booking) {
  // Validate booking data
  if (!booking || !booking.customerPhone || !booking.bookingId) {
    console.error('❌ Không thể gửi SMS: thiếu thông tin booking')
    return { success: false, error: 'Thiếu thông tin booking' }
  }
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500))
  
  console.log('📱 SMS xác nhận đã được gửi đến:', booking.customerPhone)
  console.log('Nội dung: Mã đặt vé của bạn là', booking.bookingId)
  
  return { success: true }
}

// Schedule reminder email (would be scheduled on backend)
export function scheduleReminder(event, booking) {
  // Validate inputs
  if (!event || !event.startDatetime) {
    console.error('❌ Không thể lên lịch reminder: thiếu thông tin event')
    return { scheduled: false, error: 'Thiếu thông tin event' }
  }
  
  if (!booking || !booking.bookingId) {
    console.error('❌ Không thể lên lịch reminder: thiếu thông tin booking')
    return { scheduled: false, error: 'Thiếu thông tin booking' }
  }
  
  const eventDate = new Date(event.startDatetime)
  if (isNaN(eventDate.getTime())) {
    console.error('❌ Không thể lên lịch reminder: ngày event không hợp lệ')
    return { scheduled: false, error: 'Ngày event không hợp lệ' }
  }
  
  const reminderDate = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000) // 24 hours before
  
  // Check if reminder date is in the past (event is too soon)
  const now = new Date()
  if (reminderDate < now) {
    console.warn('⚠️ Reminder date đã qua, sẽ gửi ngay lập tức')
  }
  
  console.log('⏰ Reminder đã được lên lịch cho:', reminderDate.toLocaleString('vi-VN'))
  console.log('Sẽ gửi reminder cho booking:', booking.bookingId)
  
  return { scheduled: true, reminderDate: reminderDate.toISOString() }
}

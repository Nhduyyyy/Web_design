// Comprehensive validation utilities for all features

// ===== EMAIL VALIDATION =====
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email không được để trống' }
  }
  
  const trimmed = email.trim()
  if (trimmed.length === 0) {
    return { valid: false, error: 'Email không được để trống' }
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Email không hợp lệ. Vui lòng nhập đúng định dạng email' }
  }
  
  // Check for common typos
  if (trimmed.includes('..') || trimmed.startsWith('.') || trimmed.endsWith('.')) {
    return { valid: false, error: 'Email không hợp lệ' }
  }
  
  return { valid: true, error: null }
}

// ===== PHONE VALIDATION =====
export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Số điện thoại không được để trống' }
  }
  
  const cleaned = phone.replace(/\s/g, '').replace(/[()-]/g, '')
  
  // Vietnamese phone numbers: 10-11 digits, starting with 0 or +84
  const phoneRegex = /^(\+84|0)[1-9][0-9]{8,9}$/
  if (!phoneRegex.test(cleaned)) {
    return { valid: false, error: 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10-11 chữ số)' }
  }
  
  return { valid: true, error: null, cleaned }
}

// ===== NAME VALIDATION =====
export function validateName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Họ tên không được để trống' }
  }
  
  const trimmed = name.trim()
  if (trimmed.length === 0) {
    return { valid: false, error: 'Họ tên không được để trống' }
  }
  
  if (trimmed.length < 2) {
    return { valid: false, error: 'Họ tên phải có ít nhất 2 ký tự' }
  }
  
  if (trimmed.length > 100) {
    return { valid: false, error: 'Họ tên không được vượt quá 100 ký tự' }
  }
  
  // Check for valid characters (allow Vietnamese characters)
  const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/
  if (!nameRegex.test(trimmed)) {
    return { valid: false, error: 'Họ tên chỉ được chứa chữ cái và khoảng trắng' }
  }
  
  return { valid: true, error: null, cleaned: trimmed }
}

// ===== DATE VALIDATION =====
export function validateDate(dateString, fieldName = 'Ngày') {
  if (!dateString) {
    return { valid: false, error: `${fieldName} không được để trống` }
  }
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    return { valid: false, error: `${fieldName} không hợp lệ` }
  }
  
  return { valid: true, error: null, date }
}

export function validateDateRange(fromDate, toDate) {
  if (!fromDate || !toDate) {
    return { valid: true, error: null } // Allow empty dates
  }
  
  const from = new Date(fromDate)
  const to = new Date(toDate)
  
  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return { valid: false, error: 'Ngày không hợp lệ' }
  }
  
  if (to < from) {
    return { valid: false, error: 'Ngày kết thúc phải sau ngày bắt đầu' }
  }
  
  return { valid: true, error: null }
}

// ===== QUANTITY VALIDATION =====
export function validateQuantity(quantity, min = 1, max = 100) {
  if (quantity === null || quantity === undefined || quantity === '') {
    return { valid: false, error: 'Số lượng không được để trống' }
  }
  
  const num = parseInt(quantity, 10)
  if (isNaN(num)) {
    return { valid: false, error: 'Số lượng phải là số' }
  }
  
  if (num < min) {
    return { valid: false, error: `Số lượng tối thiểu là ${min}` }
  }
  
  if (num > max) {
    return { valid: false, error: `Số lượng tối đa là ${max}` }
  }
  
  return { valid: true, error: null, value: num }
}

// ===== PRICE VALIDATION =====
export function validatePrice(price) {
  if (price === null || price === undefined) {
    return { valid: false, error: 'Giá không được để trống' }
  }
  
  const num = parseFloat(price)
  if (isNaN(num)) {
    return { valid: false, error: 'Giá phải là số' }
  }
  
  if (num < 0) {
    return { valid: false, error: 'Giá không được âm' }
  }
  
  return { valid: true, error: null, value: num }
}

// ===== SEAT VALIDATION =====
export function validateSeatSelection(selectedSeats, minSeats = 1, maxSeats = 10) {
  if (!Array.isArray(selectedSeats)) {
    return { valid: false, error: 'Danh sách ghế không hợp lệ' }
  }
  
  if (selectedSeats.length < minSeats) {
    return { valid: false, error: `Vui lòng chọn ít nhất ${minSeats} ghế` }
  }
  
  if (selectedSeats.length > maxSeats) {
    return { valid: false, error: `Bạn chỉ có thể chọn tối đa ${maxSeats} ghế` }
  }
  
  // Check for duplicate seats
  const seatIds = selectedSeats.map(s => s.id)
  const uniqueIds = new Set(seatIds)
  if (uniqueIds.size !== seatIds.length) {
    return { valid: false, error: 'Có ghế bị trùng lặp' }
  }
  
  // Check all seats are available
  const occupiedSeats = selectedSeats.filter(s => s.status === 'occupied')
  if (occupiedSeats.length > 0) {
    return { valid: false, error: 'Một số ghế đã được chọn không còn trống' }
  }
  
  return { valid: true, error: null }
}

// ===== BOOKING VALIDATION =====
export function validateBookingData(bookingData) {
  const errors = {}
  
  // Validate customer info
  const nameValidation = validateName(bookingData.name)
  if (!nameValidation.valid) {
    errors.name = nameValidation.error
  }
  
  const emailValidation = validateEmail(bookingData.email)
  if (!emailValidation.valid) {
    errors.email = emailValidation.error
  }
  
  const phoneValidation = validatePhone(bookingData.phone)
  if (!phoneValidation.valid) {
    errors.phone = phoneValidation.error
  }
  
  // Validate seats
  if (!bookingData.selectedSeats || bookingData.selectedSeats.length === 0) {
    errors.seats = 'Vui lòng chọn ít nhất 1 ghế'
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

// ===== EVENT REGISTRATION VALIDATION =====
export function validateEventRegistration(registrationData, event) {
  const errors = {}
  
  // Validate customer info
  const nameValidation = validateName(registrationData.name)
  if (!nameValidation.valid) {
    errors.name = nameValidation.error
  }
  
  const emailValidation = validateEmail(registrationData.email)
  if (!emailValidation.valid) {
    errors.email = emailValidation.error
  }
  
  const phoneValidation = validatePhone(registrationData.phone)
  if (!phoneValidation.valid) {
    errors.phone = phoneValidation.error
  }
  
  // Validate quantity
  if (!event) {
    errors.event = 'Sự kiện không hợp lệ'
  } else {
    const availableSlots = event.maxParticipants - event.currentParticipants
    const quantityValidation = validateQuantity(
      registrationData.quantity,
      1,
      availableSlots
    )
    if (!quantityValidation.valid) {
      errors.quantity = quantityValidation.error
    }
    
    // Check if event is full
    if (event.currentParticipants >= event.maxParticipants) {
      errors.event = 'Sự kiện đã hết chỗ'
    }
    
    // Check if event date has passed
    const eventDate = new Date(event.date)
    const now = new Date()
    if (eventDate < now) {
      errors.event = 'Sự kiện đã kết thúc'
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

// ===== PAYMENT VALIDATION =====
export function validatePayment(paymentMethod, amount) {
  const errors = {}
  
  if (!paymentMethod) {
    errors.method = 'Vui lòng chọn phương thức thanh toán'
  } else {
    const validMethods = ['wallet', 'card', 'qr']
    if (!validMethods.includes(paymentMethod)) {
      errors.method = 'Phương thức thanh toán không hợp lệ'
    }
  }
  
  const priceValidation = validatePrice(amount)
  if (!priceValidation.valid) {
    errors.amount = priceValidation.error
  } else if (priceValidation.value <= 0) {
    errors.amount = 'Số tiền phải lớn hơn 0'
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

// ===== STREAM VALIDATION =====
export function validateStreamAccess(stream, userHasAccess = false) {
  if (!stream) {
    return { valid: false, error: 'Stream không tồn tại' }
  }
  
  // Check if stream is live or upcoming
  if (stream.status === 'ended') {
    return { valid: false, error: 'Stream đã kết thúc' }
  }
  
  // Check if paid stream requires payment
  if (!stream.isFree && stream.price > 0 && !userHasAccess) {
    return { valid: false, error: 'Stream này yêu cầu thanh toán', requiresPayment: true }
  }
  
  return { valid: true, error: null }
}

export function validateReplayAccess(replay, userHasPaid = false) {
  if (!replay) {
    return { valid: false, error: 'Replay không tồn tại' }
  }
  
  // Check access type
  if (replay.accessType === 'paid' && !userHasPaid) {
    return { valid: false, error: 'Replay này yêu cầu thanh toán', requiresPayment: true }
  }
  
  return { valid: true, error: null }
}

// ===== SEARCH QUERY VALIDATION =====
export function validateSearchQuery(query, minLength = 2) {
  if (!query || typeof query !== 'string') {
    return { valid: true, error: null } // Empty query is allowed
  }
  
  const trimmed = query.trim()
  if (trimmed.length > 0 && trimmed.length < minLength) {
    return { valid: false, error: `Từ khóa tìm kiếm phải có ít nhất ${minLength} ký tự` }
  }
  
  if (trimmed.length > 100) {
    return { valid: false, error: 'Từ khóa tìm kiếm quá dài' }
  }
  
  return { valid: true, error: null, cleaned: trimmed }
}

// ===== NOTES VALIDATION =====
export function validateNotes(notes, maxLength = 500) {
  if (!notes || typeof notes !== 'string') {
    return { valid: true, error: null } // Notes are optional
  }
  
  if (notes.length > maxLength) {
    return { valid: false, error: `Ghi chú không được vượt quá ${maxLength} ký tự` }
  }
  
  return { valid: true, error: null, cleaned: notes.trim() }
}

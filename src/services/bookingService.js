import { supabase } from '../lib/supabase'
import { occupySeats, releaseSeats } from './scheduleService'

// ============================================
// BOOKING SERVICE
// ============================================

/**
 * Generate booking code
 */
export const generateBookingCode = () => {
  return `BK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`
}

/**
 * Create booking
 */
export const createBooking = async (bookingData) => {
  const bookingCode = generateBookingCode()
  const timeoutMinutes = bookingData?.payment_timeout_minutes ?? 15
  const paymentExpiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      ...bookingData,
      booking_code: bookingCode,
      status: 'pending',
      payment_timeout_minutes: timeoutMinutes,
      payment_expires_at: paymentExpiresAt,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get booking by ID
 */
export const getBookingById = async (bookingId) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      schedule:schedules(
        *,
        venue:venues(*),
        theater:theaters(*)
      )
    `)
    .eq('id', bookingId)
    .single()

  if (error) throw error
  return data
}

/**
 * Get booking by code
 */
export const getBookingByCode = async (bookingCode) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      schedule:schedules(
        *,
        venue:venues(*),
        theater:theaters(*)
      )
    `)
    .eq('booking_code', bookingCode)
    .single()

  if (error) throw error
  return data
}

/**
 * Lấy seat_label (và fallback row_number, seat_number) từ bảng seats theo danh sách id.
 * Trả về Map(id -> { seat_label?, row_number?, seat_number? }).
 */
export const getSeatLabelsByIds = async (seatIds) => {
  if (!seatIds || seatIds.length === 0) return new Map()
  const unique = [...new Set(seatIds)]
  const { data, error } = await supabase
    .from('seats')
    .select('id, seat_label, row_number, seat_number')
    .in('id', unique)
  if (error) throw error
  const map = new Map()
  ;(data || []).forEach((row) => {
    map.set(row.id, {
      seat_label: row.seat_label,
      row_number: row.row_number,
      seat_number: row.seat_number
    })
  })
  return map
}

/**
 * Get bookings by user
 */
/**
 * Lấy danh sách đặt vé theo user.
 * Mỗi booking được gắn thêm seat_labels: string[] (từ bảng seats.seat_label, fallback row_number-seat_number).
 * Lưu ý: Không select schedule.status để tránh PostgREST ghi đè booking.status khi join.
 */
export const getBookingsByUser = async (userId) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      schedule:schedules(
        id,
        title,
        start_datetime,
        end_datetime,
        venue_id,
        theater_id,
        venue:venues(*),
        theater:theaters(*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  const bookings = data || []
  const allSeatIds = [...new Set(bookings.flatMap((b) => b.seat_ids || []))]
  const seatMap = allSeatIds.length > 0 ? await getSeatLabelsByIds(allSeatIds) : new Map()
  const getLabel = (id) => {
    const row = seatMap.get(id)
    if (!row) return id
    if (row.seat_label != null && String(row.seat_label).trim() !== '') return row.seat_label
    if (row.row_number != null && row.seat_number != null) return `R${row.row_number}-${row.seat_number}`
    return id
  }
  return bookings.map((b) => ({
    ...b,
    seat_labels: (b.seat_ids || []).map(getLabel)
  }))
}

/**
 * Get bookings by schedule
 */
export const getBookingsBySchedule = async (scheduleId) => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('schedule_id', scheduleId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Lấy danh sách id ghế đã được đặt (pending hoặc confirmed) cho một lịch diễn.
 * Dùng để hiển thị ghế occupied khi chọn ghế theo bảng seats (hall_id).
 */
export const getBookedSeatIdsForSchedule = async (scheduleId) => {
  const { data, error } = await supabase
    .from('bookings')
    .select('seat_ids')
    .eq('schedule_id', scheduleId)
    .in('status', ['pending', 'confirmed'])

  if (error) throw error
  const ids = (data || []).flatMap((b) => b.seat_ids || [])
  return [...new Set(ids)]
}

/**
 * Cập nhật thông tin booking (ví dụ customer khi chuyển từ chọn ghế sang thanh toán).
 * PGRST116 xảy ra khi .single() không nhận đủ 1 dòng (0 dòng) — thường do RLS hoặc booking không tồn tại.
 */
export const updateBooking = async (bookingId, updates) => {
  const { data, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', bookingId)
    .select()
    .maybeSingle()

  if (error) throw error
  if (data == null) {
    const e = new Error('Không tìm thấy đặt vé hoặc không có quyền đọc (RLS). Mã: PGRST116')
    e.code = 'PGRST116'
    throw e
  }
  return data
}

/**
 * Confirm booking
 */
export const confirmBooking = async (bookingId) => {
  try {
    console.log('🔄 Confirming booking:', bookingId)
    
    // Get booking first to verify it exists
    const booking = await getBookingById(bookingId)
    console.log('📦 Booking data:', booking)
    
    if (!booking) {
      throw new Error('Booking not found')
    }
    
    if (booking.status === 'confirmed') {
      console.log('ℹ️ Booking already confirmed')
      return booking
    }

    // Trạng thái ghế đã đặt theo bảng bookings (seats không cập nhật status theo schedule)
    if (booking.seat_ids && booking.seat_ids.length > 0) {
      await occupySeats(booking.seat_ids)
      console.log('✅ Seats occupied:', booking.seat_ids)
    }

    // Update booking status
    const { data, error } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating booking status:', error)
      throw error
    }
    
    console.log('✅ Booking confirmed successfully:', data)
    return data
  } catch (error) {
    console.error('❌ Error in confirmBooking:', error)
    throw error
  }
}

/**
 * Cancel booking
 */
export const cancelBooking = async (bookingId) => {
  const booking = await getBookingById(bookingId)

  // Giải phóng ghế (no-op trên bảng seats; availability theo bookings)
  await releaseSeats(booking.seat_ids || [])

  // Update booking status
  const { data, error } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    })
    .eq('id', bookingId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get booking statistics for theater
 */
export const getBookingStats = async (theaterId, startDate, endDate) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      schedule:schedules!inner(theater_id)
    `)
    .eq('schedule.theater_id', theaterId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  if (error) throw error

  // Calculate stats
  const stats = {
    total: data.length,
    confirmed: data.filter(b => b.status === 'confirmed').length,
    cancelled: data.filter(b => b.status === 'cancelled').length,
    pending: data.filter(b => b.status === 'pending').length,
    revenue: data
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + b.total_amount, 0)
  }

  return stats
}

// ============================================
// PAYMENT SERVICE
// ============================================

/**
 * Generate transaction ID
 */
export const generateTransactionId = () => {
  return `TXN${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`
}

/**
 * Create payment
 */
export const createPayment = async (paymentData) => {
  const transactionId = generateTransactionId()

  const { data, error } = await supabase
    .from('payments')
    .insert({
      ...paymentData,
      transaction_id: transactionId,
      status: 'pending'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Process payment (simulate)
 */
export const processPayment = async (paymentId, gatewayResponse = {}) => {
  // Simulate payment processing
  await new Promise(resolve => setTimeout(resolve, 2000))

  // 90% success rate for demo
  const success = Math.random() > 0.1

  const { data, error } = await supabase
    .from('payments')
    .update({
      status: success ? 'completed' : 'failed',
      gateway_response: gatewayResponse,
      [success ? 'completed_at' : 'failed_at']: new Date().toISOString()
    })
    .eq('id', paymentId)
    .select()
    .single()

  if (error) throw error

  // If payment successful, confirm booking
  if (success && data.booking_id) {
    await confirmBooking(data.booking_id)
  }

  return data
}

/**
 * Get payment by booking
 */
export const getPaymentByBooking = async (bookingId) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) throw error
  return data
}

/**
 * Refund payment
 */
export const refundPayment = async (paymentId) => {
  const { data, error } = await supabase
    .from('payments')
    .update({ status: 'refunded' })
    .eq('id', paymentId)
    .select()
    .single()

  if (error) throw error

  // Update booking status
  const payment = await getPaymentByBooking(data.booking_id)
  await supabase
    .from('bookings')
    .update({ status: 'refunded' })
    .eq('id', payment.booking_id)

  return data
}

/**
 * Complete booking flow
 */
export const completeBookingFlow = async ({
  userId,
  scheduleId,
  seatIds,
  customerInfo,
  paymentMethod
}) => {
  try {
    // 1. Calculate total amount
    const { data: seats } = await supabase
      .from('seats')
      .select('price')
      .in('id', seatIds)

    const totalAmount = seats.reduce((sum, seat) => sum + seat.price, 0)

    // 2. Create booking
    const booking = await createBooking({
      user_id: userId,
      schedule_id: scheduleId,
      seat_ids: seatIds,
      customer_name: customerInfo.name,
      customer_email: customerInfo.email,
      customer_phone: customerInfo.phone,
      total_amount: totalAmount
    })

    // 3. Create payment
    const payment = await createPayment({
      booking_id: booking.id,
      user_id: userId,
      amount: totalAmount,
      payment_method: paymentMethod
    })

    // 4. Process payment
    const processedPayment = await processPayment(payment.id)

    // 5. Return result
    return {
      success: processedPayment.status === 'completed',
      booking,
      payment: processedPayment
    }
  } catch (error) {
    console.error('Booking flow error:', error)
    throw error
  }
}
/**
 * Lấy thông tin chi tiết booking cho seat editor (bao gồm customer info).
 * Chỉ hiển thị ghế đã thanh toán thành công, không bao gồm pending.
 */
export const getDetailedBookingInfoForSchedule = async (scheduleId) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      seat_ids,
      customer_name,
      customer_email,
      created_at,
      confirmed_at
    `)
    .eq('schedule_id', scheduleId)
    .eq('status', 'confirmed') // Chỉ lấy booking đã confirmed

  if (error) throw error
  
  // Tạo map từ seat_id đến booking info
  const seatBookingMap = {}
  
  data?.forEach(booking => {
    const seatIds = booking.seat_ids || []
    seatIds.forEach(seatId => {
      seatBookingMap[seatId] = {
        customerName: booking.customer_name,
        customerEmail: booking.customer_email,
        bookedAt: booking.created_at,
        confirmedAt: booking.confirmed_at
      }
    })
  })
  
  return seatBookingMap
}
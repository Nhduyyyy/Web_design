import { supabase } from '../lib/supabase'

/**
 * Check payment status from database
 * Backend sẽ cập nhật status khi nhận được webhook từ ngân hàng
 */
export const checkPaymentStatus = async (bookingId) => {
  try {
    // Check từ database
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        payments (
          id,
          status,
          amount,
          transaction_id,
          completed_at
        )
      `)
      .eq('booking_code', bookingId)
      .single()

    if (error) {
      // Nếu không tìm thấy trong database, có thể là booking chưa được tạo
      // Hoặc đang dùng dữ liệu tĩnh
      console.warn('Booking not found in database, using mock check:', error)
      return {
        success: false,
        message: 'Đang chờ thanh toán...',
        isMock: true
      }
    }

    // Check if payment exists and is completed
    const payment = booking?.payments?.[0]
    const isPaid = payment?.status === 'completed'
    
    return {
      success: isPaid,
      booking,
      payment,
      message: isPaid 
        ? 'Thanh toán thành công!' 
        : 'Đang chờ thanh toán...'
    }
  } catch (error) {
    console.error('Error checking payment:', error)
    return {
      success: false,
      message: 'Lỗi kiểm tra thanh toán'
    }
  }
}

/**
 * Verify payment by transfer content
 * Backend sẽ match nội dung chuyển khoản với booking ID
 */
export const verifyPaymentByContent = async (transferContent) => {
  // Extract booking ID from transfer content
  // Format: TUONGVN-BK1234567890ABC
  const bookingId = transferContent.replace('TUONGVN-', '')
  
  return checkPaymentStatus(bookingId)
}

/**
 * Create payment record in database
 */
export const createPaymentRecord = async (paymentData) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating payment record:', error)
    throw error
  }
}

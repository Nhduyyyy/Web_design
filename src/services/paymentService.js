import { supabase } from '../lib/supabase'

/**
 * Check payment status from database
 * Backend sẽ cập nhật status khi nhận được webhook từ ngân hàng
 * @param {string} bookingId - Booking code
 * @param {number} expectedAmount - Expected payment amount (optional, for validation)
 */
export const checkPaymentStatus = async (bookingId, expectedAmount = null) => {
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
    
    // Validate amount mismatch if expectedAmount is provided
    if (isPaid && expectedAmount !== null && payment?.amount) {
      const paidAmount = payment.amount
      const tolerance = 1000 // Allow 1000 VND tolerance for rounding
      const amountDiff = Math.abs(paidAmount - expectedAmount)
      
      if (amountDiff > tolerance) {
        console.warn('Amount mismatch detected:', {
          expected: expectedAmount,
          paid: paidAmount,
          difference: amountDiff
        })
        
        return {
          success: false,
          booking,
          payment,
          amountMismatch: true,
          expectedAmount,
          paidAmount,
          message: `Số tiền thanh toán không khớp. Mong đợi: ${formatPrice(expectedAmount)}, Đã thanh toán: ${formatPrice(paidAmount)}. Vui lòng liên hệ hỗ trợ.`
        }
      }
    }
    
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
 * Format price helper (if not imported)
 */
const formatPrice = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
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
 * Check for duplicate payment
 * @param {string} bookingId - Booking code
 * @param {number} amount - Payment amount
 * @returns {Promise<{isDuplicate: boolean, existingPayment: object|null}>}
 */
export const checkDuplicatePayment = async (bookingId, amount) => {
  try {
    // Check if there's already a completed payment for this booking
    const { data: existingPayments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('status', 'completed')
      .eq('amount', amount)
      .order('completed_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error checking duplicate payment:', error)
      // Don't throw, allow to proceed (fail-safe)
      return { isDuplicate: false, existingPayment: null }
    }

    if (existingPayments && existingPayments.length > 0) {
      return {
        isDuplicate: true,
        existingPayment: existingPayments[0]
      }
    }

    return { isDuplicate: false, existingPayment: null }
  } catch (error) {
    console.error('Error checking duplicate payment:', error)
    // Don't throw, allow to proceed (fail-safe)
    return { isDuplicate: false, existingPayment: null }
  }
}

/**
 * Create payment record in database
 * @param {object} paymentData - Payment data
 * @param {boolean} checkDuplicate - Whether to check for duplicate payments (default: true)
 */
export const createPaymentRecord = async (paymentData, checkDuplicate = true) => {
  try {
    // Check for duplicate payment if enabled
    if (checkDuplicate && paymentData.booking_id && paymentData.amount) {
      const duplicateCheck = await checkDuplicatePayment(
        paymentData.booking_id,
        paymentData.amount
      )
      
      if (duplicateCheck.isDuplicate) {
        console.warn('Duplicate payment detected:', duplicateCheck.existingPayment)
        // Return existing payment instead of creating new one
        return {
          ...duplicateCheck.existingPayment,
          isDuplicate: true,
          warning: 'Payment already exists for this booking'
        }
      }
    }
    
    const { data, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single()

    if (error) {
      // Check if error is due to duplicate (unique constraint violation)
      if (error.code === '23505' || error.message.includes('duplicate')) {
        console.warn('Duplicate payment detected (database constraint):', error)
        // Try to get existing payment
        const { data: existing } = await supabase
          .from('payments')
          .select('*')
          .eq('booking_id', paymentData.booking_id)
          .eq('amount', paymentData.amount)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(1)
          .single()
        
        if (existing) {
          return {
            ...existing,
            isDuplicate: true,
            warning: 'Payment already exists for this booking'
          }
        }
      }
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Error creating payment record:', error)
    throw error
  }
}

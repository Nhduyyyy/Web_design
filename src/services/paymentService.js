import { supabase } from '../lib/supabase'

const generateTransactionId = () => {
  return `TXN${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`
}

/**
 * Check payment status from database
 * Backend sẽ cập nhật status khi nhận được webhook từ ngân hàng
 * @param {string} bookingId - Booking code (BK...)
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
      .maybeSingle()

    if (error) {
      console.error('Error querying booking status:', error)
      return {
        success: false,
        message: 'Lỗi kiểm tra thanh toán'
      }
    }

    if (!booking) {
      // Nếu không tìm thấy trong database, có thể là booking chưa được tạo
      // Hoặc đang dùng dữ liệu tĩnh
      console.warn('Booking not found in database, using mock check')
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
 * Check payment status for event registration by registration_code (REG...)
 * @param {string} registrationCode
 * @param {number} expectedAmount
 */
export const checkEventRegistrationPaymentStatus = async (registrationCode, expectedAmount = null) => {
  try {
    const { data: reg, error: regError } = await supabase
      .from('event_registrations')
      .select('id, registration_code, amount, payment_status, status')
      .eq('registration_code', registrationCode)
      .maybeSingle()

    if (regError) {
      console.error('Error querying event registration:', regError)
      return { success: false, message: 'Lỗi kiểm tra thanh toán' }
    }

    if (!reg) {
      return { success: false, message: 'Đang chờ thanh toán...', isMock: true }
    }

    const { data: payment, error: payError } = await supabase
      .from('payments')
      .select('id, status, amount, transaction_id, completed_at')
      .eq('event_registration_id', reg.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (payError) {
      console.error('Error querying event payment:', payError)
      return { success: false, message: 'Lỗi kiểm tra thanh toán' }
    }

    const isPaid = payment?.status === 'completed' || reg.payment_status === 'completed'

    if (isPaid && expectedAmount !== null && payment?.amount) {
      const tolerance = 1000
      const amountDiff = Math.abs(payment.amount - expectedAmount)
      if (amountDiff > tolerance) {
        return {
          success: false,
          registration: reg,
          payment,
          amountMismatch: true,
          expectedAmount,
          paidAmount: payment.amount,
          message: `Số tiền thanh toán không khớp. Mong đợi: ${formatPrice(expectedAmount)}, Đã thanh toán: ${formatPrice(payment.amount)}. Vui lòng liên hệ hỗ trợ.`
        }
      }
    }

    return {
      success: isPaid,
      registration: reg,
      payment,
      message: isPaid ? 'Thanh toán thành công!' : 'Đang chờ thanh toán...'
    }
  } catch (error) {
    console.error('Error checking event registration payment:', error)
    return { success: false, message: 'Lỗi kiểm tra thanh toán' }
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
  // Format: TUONGVN-BK... or TUONGVN-REG...
  const ref = transferContent.replace('TUONGVN-', '')
  if (ref.startsWith('REG')) return checkEventRegistrationPaymentStatus(ref)
  return checkPaymentStatus(ref)
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
    if (checkDuplicate && paymentData.amount) {
      const duplicateCheck = paymentData.booking_id
        ? await checkDuplicatePayment(paymentData.booking_id, paymentData.amount)
        : paymentData.event_registration_id
          ? await checkDuplicateEventPayment(paymentData.event_registration_id, paymentData.amount)
          : { isDuplicate: false, existingPayment: null }
      
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
    
    const payload = {
      transaction_id: paymentData.transaction_id || generateTransactionId(),
      ...paymentData,
    }

    const { data, error } = await supabase
      .from('payments')
      .insert(payload)
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

/**
 * Check for duplicate payment for event registration
 * @param {string} eventRegistrationId
 * @param {number} amount
 */
export const checkDuplicateEventPayment = async (eventRegistrationId, amount) => {
  try {
    const { data: existingPayments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('event_registration_id', eventRegistrationId)
      .eq('status', 'completed')
      .eq('amount', amount)
      .order('completed_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error checking duplicate event payment:', error)
      return { isDuplicate: false, existingPayment: null }
    }

    if (existingPayments && existingPayments.length > 0) {
      return { isDuplicate: true, existingPayment: existingPayments[0] }
    }

    return { isDuplicate: false, existingPayment: null }
  } catch (error) {
    console.error('Error checking duplicate event payment:', error)
    return { isDuplicate: false, existingPayment: null }
  }
}

/**
 * Mark a QR payment as completed (called when user confirms transfer).
 * Also confirms the event_registration so participant count updates.
 *
 * @param {string} eventRegistrationId - event_registrations.id (uuid)
 * @param {string|null} paymentId - payments.id (uuid); if null, finds latest pending payment
 */
export const completeEventPayment = async (eventRegistrationId, paymentId = null) => {
  try {
    const now = new Date().toISOString()

    // 1) Find the pending payment if paymentId not provided
    let targetPaymentId = paymentId
    if (!targetPaymentId) {
      const { data: pendingPayments, error: findError } = await supabase
        .from('payments')
        .select('id, status')
        .eq('event_registration_id', eventRegistrationId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)

      if (findError) throw findError
      if (!pendingPayments?.length) {
        return { success: false, message: 'Không tìm thấy payment đang chờ xử lý.' }
      }
      targetPaymentId = pendingPayments[0].id
    }

    // 2) Update payment → completed
    const { error: payError } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        completed_at: now,
        updated_at: now,
      })
      .eq('id', targetPaymentId)

    if (payError) throw payError

    // 3) Update event_registration → confirmed + payment_status = completed
    const { data: updatedReg, error: regError } = await supabase
      .from('event_registrations')
      .update({
        payment_status: 'completed',
        status: 'confirmed',
        updated_at: now,
      })
      .eq('id', eventRegistrationId)
      .select('id, registration_code, status, payment_status')
      .single()

    if (regError) throw regError

    return {
      success: true,
      message: 'Thanh toán thành công!',
      registration: updatedReg,
      paymentId: targetPaymentId,
    }
  } catch (error) {
    console.error('Error completing event payment:', error)
    return {
      success: false,
      message: error?.message || 'Không thể xác nhận thanh toán. Vui lòng liên hệ hỗ trợ.',
    }
  }
}

/**
 * Đánh dấu thanh toán QR cho booking là thành công (dùng cho fake/demo sau 20s).
 * Cập nhật payment → completed, sau đó confirm booking.
 *
 * @param {string} bookingDbId - bookings.id (uuid)
 * @param {string|null} paymentId - payments.id (uuid); nếu null thì tìm payment pending mới nhất của booking
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const completeBookingPayment = async (bookingDbId, paymentId = null) => {
  try {
    const now = new Date().toISOString()

    let targetPaymentId = paymentId
    if (!targetPaymentId) {
      const { data: pendingPayments, error: findError } = await supabase
        .from('payments')
        .select('id, status')
        .eq('booking_id', bookingDbId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)

      if (findError) throw findError
      if (!pendingPayments?.length) {
        return { success: false, message: 'Không tìm thấy thanh toán đang chờ.' }
      }
      targetPaymentId = pendingPayments[0].id
    }

    const { error: payError } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        completed_at: now,
        updated_at: now,
      })
      .eq('id', targetPaymentId)

    if (payError) throw payError

    const { confirmBooking } = await import('./bookingService')
    await confirmBooking(bookingDbId)

    return {
      success: true,
      message: 'Thanh toán thành công!',
      paymentId: targetPaymentId,
    }
  } catch (error) {
    console.error('Error completing booking payment:', error)
    return {
      success: false,
      message: error?.message || 'Không thể xác nhận thanh toán. Vui lòng thử lại.',
    }
  }
}

-- ============================================
-- Migration: Add QR Payment Support
-- Date: 2025-01-01
-- Description: Thêm các fields và functions cần thiết cho QR payment
-- ============================================

-- ============================================
-- 1. Add columns to payments table
-- ============================================

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS transfer_content TEXT,
ADD COLUMN IF NOT EXISTS bank_account_no TEXT,
ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
ADD COLUMN IF NOT EXISTS bank_code TEXT,
ADD COLUMN IF NOT EXISTS reference_number TEXT,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS qr_code_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN payments.transfer_content IS 'Nội dung chuyển khoản (TUONGVN-BK123...) để match với webhook từ ngân hàng';
COMMENT ON COLUMN payments.bank_account_no IS 'Số tài khoản ngân hàng nhận tiền';
COMMENT ON COLUMN payments.bank_account_name IS 'Tên chủ tài khoản ngân hàng';
COMMENT ON COLUMN payments.bank_code IS 'Mã ngân hàng (VBA, VCB, etc.)';
COMMENT ON COLUMN payments.reference_number IS 'Mã tham chiếu từ ngân hàng khi nhận webhook';
COMMENT ON COLUMN payments.expires_at IS 'Thời gian hết hạn thanh toán (thường là 15 phút sau khi tạo)';
COMMENT ON COLUMN payments.qr_code_url IS 'URL của QR code được generate từ VietQR.io';

-- ============================================
-- 2. Add indexes for performance
-- ============================================

-- Index for transfer_content (used to find payment when webhook arrives)
CREATE INDEX IF NOT EXISTS idx_payments_transfer_content 
ON payments(transfer_content) 
WHERE transfer_content IS NOT NULL;

-- Index for reference_number (bank reference code)
CREATE INDEX IF NOT EXISTS idx_payments_reference_number 
ON payments(reference_number) 
WHERE reference_number IS NOT NULL;

-- Index for expires_at (used to find expired payments)
CREATE INDEX IF NOT EXISTS idx_payments_expires_at 
ON payments(expires_at) 
WHERE expires_at IS NOT NULL;

-- Composite index for finding pending payments by transfer content
CREATE INDEX IF NOT EXISTS idx_payments_transfer_status 
ON payments(transfer_content, status) 
WHERE transfer_content IS NOT NULL AND status = 'pending';

-- ============================================
-- 3. Add payment timeout to bookings table (optional)
-- ============================================

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_timeout_minutes INTEGER DEFAULT 15;

COMMENT ON COLUMN bookings.payment_expires_at IS 'Thời gian hết hạn thanh toán cho booking này';
COMMENT ON COLUMN bookings.payment_timeout_minutes IS 'Số phút để thanh toán (mặc định 15 phút)';

-- ============================================
-- 4. Create function to find payment by transfer content
-- ============================================

CREATE OR REPLACE FUNCTION find_payment_by_transfer_content(
  p_transfer_content TEXT
)
RETURNS TABLE (
  payment_id UUID,
  booking_id UUID,
  amount INTEGER,
  status TEXT,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.booking_id,
    p.amount,
    p.status::TEXT,
    p.created_at,
    p.expires_at
  FROM payments p
  WHERE p.transfer_content = p_transfer_content
    AND p.status = 'pending'
    AND (p.expires_at IS NULL OR p.expires_at > NOW())
  ORDER BY p.created_at DESC
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION find_payment_by_transfer_content IS 'Tìm payment đang pending bằng transfer content (dùng khi nhận webhook)';

-- ============================================
-- 5. Create function to expire old payments
-- ============================================

CREATE OR REPLACE FUNCTION expire_old_payments()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE payments
  SET 
    status = 'failed',
    failed_at = NOW(),
    updated_at = NOW()
  WHERE status = 'pending'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Also update related bookings if payment expired
  UPDATE bookings
  SET 
    status = 'cancelled',
    cancelled_at = NOW(),
    updated_at = NOW()
  WHERE id IN (
    SELECT booking_id 
    FROM payments 
    WHERE status = 'failed' 
      AND failed_at > NOW() - INTERVAL '1 minute'
  )
  AND status = 'pending';
  
  RETURN expired_count;
END;
$$;

COMMENT ON FUNCTION expire_old_payments IS 'Tự động expire các payments quá hạn và cancel bookings liên quan';

-- ============================================
-- 6. Create function to verify payment amount
-- ============================================

CREATE OR REPLACE FUNCTION verify_payment_amount(
  p_booking_id UUID,
  p_received_amount INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expected_amount INTEGER;
BEGIN
  -- Get expected amount from booking
  SELECT total_amount INTO v_expected_amount
  FROM bookings
  WHERE id = p_booking_id;
  
  -- Return true if amounts match (allow small difference for rounding)
  RETURN ABS(v_expected_amount - p_received_amount) <= 1000; -- Allow 1000 VND difference
END;
$$;

COMMENT ON FUNCTION verify_payment_amount IS 'Verify số tiền nhận được có khớp với booking không (cho phép sai số 1000 VND)';

-- ============================================
-- 7. Create trigger to auto-set expires_at when payment created
-- ============================================

CREATE OR REPLACE FUNCTION set_payment_expires_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Set expires_at to 15 minutes from now if payment_method is 'qr' or 'bank_transfer'
  IF NEW.payment_method IN ('qr', 'bank_transfer') AND NEW.expires_at IS NULL THEN
    NEW.expires_at := NOW() + INTERVAL '15 minutes';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_payment_expires_at
BEFORE INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION set_payment_expires_at();

COMMENT ON TRIGGER trigger_set_payment_expires_at ON payments IS 'Tự động set expires_at khi tạo payment với QR hoặc bank transfer';

-- ============================================
-- 8. Update RLS policies (if needed)
-- ============================================

-- Ensure users can read their own payments
-- (This should already exist, but adding for safety)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payments' 
    AND policyname = 'Users can view own payments'
  ) THEN
    CREATE POLICY "Users can view own payments"
    ON payments FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Allow service role to update payments (for webhook)
-- Note: This is handled by service_role key, but we document it here
COMMENT ON TABLE payments IS 'Payments table - service_role can update for webhook processing';

-- ============================================
-- 9. Create view for payment statistics
-- ============================================

CREATE OR REPLACE VIEW payment_stats AS
SELECT 
  payment_method,
  status,
  COUNT(*) as count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount,
  COUNT(*) FILTER (WHERE expires_at < NOW() AND status = 'pending') as expired_count
FROM payments
GROUP BY payment_method, status;

COMMENT ON VIEW payment_stats IS 'Thống kê payments theo method và status';

-- ============================================
-- Migration Complete
-- ============================================

-- Verify the changes
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Added columns: transfer_content, bank_account_no, bank_account_name, bank_code, reference_number, expires_at, qr_code_url';
  RAISE NOTICE 'Created functions: find_payment_by_transfer_content, expire_old_payments, verify_payment_amount';
  RAISE NOTICE 'Created trigger: trigger_set_payment_expires_at';
END $$;

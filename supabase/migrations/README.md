# Database Migrations

Thư mục này chứa các file migration SQL để cập nhật database schema.

## Cách sử dụng

### 1. Chạy migration trong Supabase Dashboard

1. Vào Supabase Dashboard → SQL Editor
2. Copy nội dung file migration
3. Paste và Run

### 2. Chạy migration bằng Supabase CLI

```bash
# Nếu có Supabase CLI
supabase db push
```

## Danh sách migrations

### 20250101_add_qr_payment_fields.sql
- **Mô tả**: Thêm support cho QR payment
- **Thay đổi**:
  - Thêm columns: `transfer_content`, `bank_account_no`, `bank_account_name`, `bank_code`, `reference_number`, `expires_at`, `qr_code_url`
  - Thêm indexes cho performance
  - Tạo functions: `find_payment_by_transfer_content()`, `expire_old_payments()`, `verify_payment_amount()`
  - Tạo trigger: `trigger_set_payment_expires_at`
  - Tạo view: `payment_stats`

## Lưu ý

- **Backup database** trước khi chạy migration
- Chạy migrations theo thứ tự thời gian
- Test trên staging trước khi chạy production
- Kiểm tra RLS policies sau khi migration

## Rollback

Nếu cần rollback, chạy script sau:

```sql
-- Rollback QR payment fields
ALTER TABLE payments
DROP COLUMN IF EXISTS transfer_content,
DROP COLUMN IF EXISTS bank_account_no,
DROP COLUMN IF EXISTS bank_account_name,
DROP COLUMN IF EXISTS bank_code,
DROP COLUMN IF EXISTS reference_number,
DROP COLUMN IF EXISTS expires_at,
DROP COLUMN IF EXISTS qr_code_url;

DROP INDEX IF EXISTS idx_payments_transfer_content;
DROP INDEX IF EXISTS idx_payments_reference_number;
DROP INDEX IF EXISTS idx_payments_expires_at;
DROP INDEX IF EXISTS idx_payments_transfer_status;

DROP FUNCTION IF EXISTS find_payment_by_transfer_content(TEXT);
DROP FUNCTION IF EXISTS expire_old_payments();
DROP FUNCTION IF EXISTS verify_payment_amount(UUID, INTEGER);

DROP TRIGGER IF EXISTS trigger_set_payment_expires_at ON payments;
DROP FUNCTION IF EXISTS set_payment_expires_at();

DROP VIEW IF EXISTS payment_stats;
```

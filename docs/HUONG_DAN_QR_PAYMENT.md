# Hướng dẫn QR Payment

## Tổng quan

Hệ thống hỗ trợ thanh toán bằng QR code thông qua chuyển khoản ngân hàng. User quét QR code và chuyển khoản, hệ thống sẽ tự động nhận và xác nhận thanh toán.

## Flow thanh toán

### 1. User chọn QR Code
- Hệ thống tạo QR code tĩnh với thông tin:
  - Số tài khoản: `2005206295400`
  - Ngân hàng: Agribank (VBA)
  - Chủ tài khoản: PHUNG VAN DAT
  - Nội dung CK: `TUONGVN-{bookingId}`
  - Số tiền: `{total}`

### 2. User quét và chuyển khoản
- User mở app ngân hàng/ví điện tử
- Quét QR code hoặc nhập thông tin thủ công
- Chuyển khoản với nội dung: `TUONGVN-{bookingId}`

### 3. Hệ thống nhận webhook
- Ngân hàng gửi webhook về server
- Server verify và cập nhật payment status

### 4. Frontend polling
- Frontend tự động check payment status mỗi 5 giây
- Khi phát hiện payment thành công, tự động xác nhận

## Database Schema

### Payments Table - New Columns

| Column | Type | Description |
|--------|------|-------------|
| `transfer_content` | TEXT | Nội dung chuyển khoản (TUONGVN-BK123...) |
| `bank_account_no` | TEXT | Số tài khoản nhận tiền |
| `bank_account_name` | TEXT | Tên chủ tài khoản |
| `bank_code` | TEXT | Mã ngân hàng (VBA, VCB, etc.) |
| `reference_number` | TEXT | Mã tham chiếu từ ngân hàng |
| `expires_at` | TIMESTAMPTZ | Thời gian hết hạn (15 phút) |
| `qr_code_url` | TEXT | URL QR code từ VietQR.io |

### Indexes

- `idx_payments_transfer_content` - Tìm payment nhanh khi webhook đến
- `idx_payments_reference_number` - Tìm bằng mã tham chiếu
- `idx_payments_expires_at` - Tìm payments quá hạn
- `idx_payments_transfer_status` - Composite index cho query tối ưu

### Functions

#### `find_payment_by_transfer_content(transfer_content)`
Tìm payment đang pending bằng nội dung chuyển khoản.

```sql
SELECT * FROM find_payment_by_transfer_content('TUONGVN-BK1234567890ABC');
```

#### `expire_old_payments()`
Tự động expire các payments quá hạn và cancel bookings liên quan.

```sql
SELECT expire_old_payments();
```

#### `verify_payment_amount(booking_id, received_amount)`
Verify số tiền nhận được có khớp với booking không.

```sql
SELECT verify_payment_amount('booking-uuid', 500000);
```

## Cấu hình

### Environment Variables

Thêm vào `.env.local`:

```env
VITE_BANK_ACCOUNT=2005206295400
VITE_BANK_ACCOUNT_NAME=PHUNG VAN DAT
VITE_BANK_CODE=VBA
```

## Backend Webhook

### Endpoint

```
POST /api/payments/webhook
```

### Request Body

```json
{
  "transactionId": "TXN1234567890",
  "amount": 500000,
  "transferContent": "TUONGVN-BK1234567890ABC",
  "accountNo": "2005206295400",
  "referenceNumber": "REF123456",
  "timestamp": "2025-01-01T10:00:00Z",
  "signature": "signature_hash"
}
```

### Processing Flow

1. Verify signature
2. Extract booking ID từ `transferContent`
3. Find payment bằng `find_payment_by_transfer_content()`
4. Verify amount bằng `verify_payment_amount()`
5. Update payment status = 'completed'
6. Confirm booking
7. Send notification

### Example Code

```javascript
// Backend webhook handler
app.post('/api/payments/webhook', async (req, res) => {
  const { transferContent, amount, referenceNumber } = req.body
  
  // 1. Find payment
  const { data: payment } = await supabase
    .rpc('find_payment_by_transfer_content', {
      p_transfer_content: transferContent
    })
  
  if (!payment || payment.length === 0) {
    return res.status(404).json({ error: 'Payment not found' })
  }
  
  // 2. Verify amount
  const isValid = await supabase
    .rpc('verify_payment_amount', {
      p_booking_id: payment[0].booking_id,
      p_received_amount: amount
    })
  
  if (!isValid) {
    return res.status(400).json({ error: 'Amount mismatch' })
  }
  
  // 3. Update payment
  await supabase
    .from('payments')
    .update({
      status: 'completed',
      reference_number: referenceNumber,
      completed_at: new Date().toISOString()
    })
    .eq('id', payment[0].payment_id)
  
  // 4. Confirm booking
  await supabase
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', payment[0].booking_id)
  
  res.json({ success: true })
})
```

## Frontend Integration

### Create Payment Record

```javascript
import { createPaymentRecord } from '../services/paymentService'

const payment = await createPaymentRecord({
  booking_id: bookingId,
  user_id: userId,
  amount: total,
  payment_method: 'qr',
  transfer_content: `TUONGVN-${bookingId}`,
  bank_account_no: '2005206295400',
  bank_account_name: 'PHUNG VAN DAT',
  bank_code: 'VBA',
  expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
})
```

### Check Payment Status

```javascript
import { checkPaymentStatus } from '../services/paymentService'

const status = await checkPaymentStatus(bookingId)
if (status.success) {
  // Payment completed
}
```

## Maintenance

### Expire Old Payments

Chạy function này định kỳ (mỗi 5 phút) để expire payments quá hạn:

```sql
SELECT expire_old_payments();
```

Hoặc setup cron job:

```sql
-- Nếu dùng pg_cron
SELECT cron.schedule(
  'expire-payments',
  '*/5 * * * *',
  'SELECT expire_old_payments()'
);
```

## Troubleshooting

### Payment không được nhận

1. Kiểm tra webhook có đến server không
2. Kiểm tra `transfer_content` có đúng format không
3. Kiểm tra payment có expired không
4. Kiểm tra amount có khớp không

### Payment bị duplicate

- Kiểm tra `reference_number` để tránh duplicate
- Verify payment đã completed chưa trước khi update

### Performance

- Sử dụng indexes đã tạo
- Cache payment status nếu cần
- Limit polling frequency

## Security

1. **Verify signature** từ ngân hàng
2. **Validate amount** trước khi confirm
3. **Check expires_at** để tránh expired payments
4. **Use RLS policies** để bảo vệ data
5. **Log all webhook requests** để audit

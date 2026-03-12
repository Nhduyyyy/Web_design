import QRCode from 'qrcode'

/**
 * Lấy tên ngân hàng từ mã ngân hàng
 */
function getBankName(bankCode) {
  const banks = {
    'VBA': 'Agribank',
    'VTB': 'Vietinbank',
    'TPB': 'TPBank',
    'ACB': 'ACB',
    'TCB': 'Techcombank',
    'BID': 'BIDV',
    'MSB': 'MBBank',
    'VPB': 'VPBank',
    'SHB': 'SHB',
    'VAB': 'VietABank',
    'VCB': 'Vietcombank',
    '970415': 'Vietcombank',
    '970405': 'Agribank',
    '970422': 'Vietinbank',
    '970436': 'TPBank',
    '970441': 'ACB',
    '970416': 'Techcombank',
    '970418': 'BIDV',
    '970423': 'MBBank',
    '970427': 'VPBank',
    '970428': 'SHB',
    '970430': 'VietABank'
  }
  return banks[bankCode] || 'Ngân hàng'
}

/**
 * Lấy thông tin tài khoản từ config 
 */
async function getBankAccountInfo() {
  // Lấy từ environment variables hoặc dùng default
  // Từ QR code URL: https://img.vietqr.io/image/VBA-2005206295400-compact.png
  const accountNo = import.meta.env.VITE_BANK_ACCOUNT || '5650506310'
  const accountName = import.meta.env.VITE_BANK_ACCOUNT_NAME || 'NGUYEN VAN HIEU'
  const bankCode = import.meta.env.VITE_BANK_CODE || 'BIDV'
  
  return {
    accountNo,
    accountName,
    bankCode,
    bankName: getBankName(bankCode)
  }
}

/**
 * Tạo QR code tĩnh theo chuẩn VietQR
 * Sử dụng API VietQR.io để generate QR code hợp lệ
 */
export const generateVietQR = async (bookingId, amount, bankInfo) => {
  const { accountNo, accountName, bankCode } = bankInfo
  
  // Tạo nội dung chuyển khoản (chứa Booking ID để tracking)
  const transferContent = `TUONGVN-${bookingId}`
  
  // Sử dụng API VietQR.io để generate QR code hợp lệ
  // Format URL: https://img.vietqr.io/image/{bankCode}-{accountNo}-compact.png?amount={amount}&addInfo={transferContent}
  const qrImageUrl = `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}`
  
  // Fetch QR code image từ API
  try {
    const response = await fetch(qrImageUrl)
    if (!response.ok) {
      throw new Error('Failed to fetch QR code from VietQR.io')
    }
    
    const blob = await response.blob()
    const qrImage = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    
    return {
      qrImage,
      qrImageUrl,
      bankInfo: {
        accountNo,
        accountName,
        bankCode,
        bankName: getBankName(bankCode)
      },
      transferContent,
      amount
    }
  } catch (error) {
    console.error('Error generating QR from VietQR.io:', error)
    throw new Error('Không thể tạo mã QR. Vui lòng thử lại sau.')
  }
}

/**
 * Tạo QR code với thông tin đầy đủ
 */
export const generateStaticQR = async (bookingId, amount) => {
  // Lấy thông tin tài khoản
  const bankInfo = await getBankAccountInfo()
  
  return generateVietQR(bookingId, amount, bankInfo)
}

/**
 * Generate QR code URL từ VietQR.io API (alternative)
 * Nếu muốn dùng API thay vì generate local
 */
export const generateVietQRUrl = (bankCode, accountNo, amount, transferContent, accountName) => {
  const params = new URLSearchParams({
    accountNo,
    accountName,
    bankCode,
    amount: amount.toString(),
    addInfo: transferContent
  })
  
  return `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}`
}

# Hướng Dẫn Xử Lý Lỗi Mạng (Network Error Handling)

## Tổng Quan

Hệ thống đã được thiết kế để xử lý robust các vấn đề về kết nối mạng, bao gồm:
- CORS errors
- 502 Bad Gateway
- Network timeouts
- Connection failures
- Offline/Online detection

## Các Loại Lỗi Mạng

### 1. **CORS Error**
```
Access to fetch at '...' has been blocked by CORS policy
```
**Nguyên nhân**: Server configuration issue
**Xử lý**: Hiển thị thông báo liên hệ admin

### 2. **502 Bad Gateway**
```
PATCH https://... 502 (Bad Gateway)
```
**Nguyên nhân**: Server tạm thời không khả dụng
**Xử lý**: Retry với exponential backoff

### 3. **Network Timeout**
```
fetch timeout / net::ERR_NETWORK_TIMEOUT
```
**Nguyên nhân**: Kết nối chậm hoặc không ổn định
**Xử lý**: Retry với timeout tăng dần

### 4. **Connection Failure**
```
net::ERR_FAILED / Failed to fetch
```
**Nguyên nhân**: Mất kết nối internet
**Xử lý**: Offline mode với local calculation

## Giải Pháp Đã Triển Khai

### 1. **Network Detection Utilities**

```javascript
// src/utils/networkUtils.js

// Detect network errors
const isNetworkError = (error) => {
  // Check error message, status codes, and navigator.onLine
}

// Get user-friendly messages
const getNetworkErrorMessage = (error) => {
  // Return appropriate Vietnamese message
}

// Retry with exponential backoff
const retryWithBackoff = async (operation, maxRetries = 3) => {
  // Implement retry logic with increasing delays
}
```

### 2. **Fallback Mechanisms**

#### Seat Pricing Updates
```javascript
// Try database update first
try {
  await updateSeatsInDatabase()
} catch (error) {
  if (isNetworkError(error)) {
    // Use calculation-based pricing
    return calculatePricesOnly()
  }
  throw error
}
```

#### Real-time Sync
```javascript
// Graceful sync failure handling
try {
  await seatPricingSyncService.triggerPricingUpdate()
} catch (syncError) {
  console.warn('Sync notification failed (non-critical):', syncError)
  // Continue without sync - not critical for functionality
}
```

### 3. **User Experience Enhancements**

#### Network Status Indicator
```jsx
<NetworkStatusIndicator 
  showWhenOnline={false}
  position="top-right" 
/>
```

#### Error Messages
- ✅ "Đã lưu giá vé! (Server tạm thời không khả dụng)"
- ⚠️ "Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại"
- 🔄 "Đang thử lại... (2/3)"

### 4. **Offline Support**

#### Calculation-Based Pricing
```javascript
// Works without database updates
const price = calculateSeatPrice(seatType, basePricing, zoneMultiplier)
```

#### Local State Management
```javascript
// Maintain pricing in memory
const { pricing, loading } = useSeatPricing(theaterId, hallId)
```

## Testing Network Issues

### 1. **Simulate Network Conditions**

```javascript
// Chrome DevTools -> Network -> Throttling
// - Slow 3G
// - Offline
// - Custom (high latency)
```

### 2. **Manual Testing**

```javascript
// Disconnect internet during operations
// Block specific domains in hosts file
// Use network proxy to simulate errors
```

### 3. **Error Injection**

```javascript
// Temporarily modify fetch to simulate errors
const originalFetch = window.fetch
window.fetch = (...args) => {
  if (Math.random() < 0.3) { // 30% failure rate
    return Promise.reject(new Error('Simulated network error'))
  }
  return originalFetch(...args)
}
```

## Monitoring & Debugging

### 1. **Console Logs**

```javascript
// Network error detection
console.warn('Network operation failed (attempt 1/3), retrying in 1000ms:', error)

// Fallback activation
console.log('Database update prevented by network, using calculated prices')

// Sync failures
console.warn('Sync notification failed (non-critical):', syncError)
```

### 2. **User Feedback**

```javascript
// Loading states
setSaving(true) // Show spinner during operations

// Error states
setError('Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.')

// Success with warnings
setError('✅ Đã lưu giá vé! (Một số cập nhật thất bại do lỗi mạng)')
```

### 3. **Network Status Monitoring**

```javascript
// Real-time network status
const { online, timestamp } = useNetworkStatus()

// Connection change events
networkMonitor.addListener((status) => {
  console.log('Network status changed:', status)
})
```

## Best Practices

### 1. **Graceful Degradation**
- Core functionality works offline
- Non-critical features fail silently
- Clear user communication

### 2. **Retry Strategy**
- Exponential backoff for transient errors
- Maximum retry limits (3 attempts)
- Different strategies for different error types

### 3. **User Experience**
- Loading indicators for all network operations
- Clear error messages in Vietnamese
- Automatic recovery when connection restored

### 4. **Performance**
- Timeout configurations (5-10 seconds)
- Debounce rapid operations
- Cache frequently used data

## Configuration

### 1. **Retry Settings**

```javascript
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  timeoutMs: 10000
}
```

### 2. **Error Thresholds**

```javascript
const ERROR_THRESHOLDS = {
  networkErrorRate: 0.3, // 30% failure rate triggers offline mode
  consecutiveFailures: 3, // 3 consecutive failures = connection issue
  retryAfterMs: 30000     // Wait 30s before retrying after threshold
}
```

### 3. **User Messages**

```javascript
const NETWORK_MESSAGES = {
  offline: 'Không có kết nối internet',
  cors: 'Lỗi CORS. Liên hệ admin',
  badGateway: 'Server tạm thời không khả dụng',
  timeout: 'Kết nối quá chậm'
}
```

## Troubleshooting

### Q: Tại sao vẫn thấy lỗi CORS?
A: CORS là server-side issue. Client không thể fix được, chỉ có thể handle gracefully.

### Q: Làm sao biết lỗi là do mạng hay do code?
A: Sử dụng `isNetworkError()` utility để phân biệt.

### Q: Có cần restart app khi có network error không?
A: Không, hệ thống tự động recovery khi connection restored.

### Q: Dữ liệu có bị mất khi offline không?
A: Không, pricing được tính toán local và sync khi online trở lại.

## Liên Hệ

Nếu gặp network issues liên tục:
1. Check Supabase dashboard status
2. Verify DNS resolution
3. Test with different networks
4. Contact infrastructure team
/**
 * Network utility functions for handling connection issues
 */

import { useState, useEffect } from 'react'

/**
 * Check if error is network-related
 */
export const isNetworkError = (error) => {
  if (!error) return false
  
  const errorMessage = error.message?.toLowerCase() || ''
  const errorCode = error.code?.toLowerCase() || ''
  
  // Common network error indicators
  const networkIndicators = [
    'fetch',
    'network',
    'cors',
    'connection',
    'timeout',
    'offline',
    'net::err_',
    'failed to fetch',
    'networkerror',
    'no internet',
    'bad gateway',
    'service unavailable',
    'gateway timeout'
  ]
  
  // Check message
  const hasNetworkMessage = networkIndicators.some(indicator => 
    errorMessage.includes(indicator)
  )
  
  // Check status codes
  const networkStatusCodes = [502, 503, 504, 0]
  const hasNetworkStatus = networkStatusCodes.includes(error.status)
  
  // Check error codes
  const networkErrorCodes = ['network_error', 'econnaborted', 'enotfound']
  const hasNetworkCode = networkErrorCodes.some(code => 
    errorCode.includes(code)
  )
  
  return hasNetworkMessage || hasNetworkStatus || hasNetworkCode || !navigator.onLine
}

/**
 * Get user-friendly error message for network issues
 */
export const getNetworkErrorMessage = (error) => {
  if (!isNetworkError(error)) {
    return null
  }
  
  if (!navigator.onLine) {
    return 'Không có kết nối internet. Vui lòng kiểm tra kết nối và thử lại.'
  }
  
  const errorMessage = error.message?.toLowerCase() || ''
  
  if (errorMessage.includes('cors')) {
    return 'Lỗi CORS. Vui lòng liên hệ admin để kiểm tra cấu hình server.'
  }
  
  if (errorMessage.includes('502') || errorMessage.includes('bad gateway')) {
    return 'Server tạm thời không khả dụng. Vui lòng thử lại sau ít phút.'
  }
  
  if (errorMessage.includes('503') || errorMessage.includes('service unavailable')) {
    return 'Dịch vụ đang bảo trì. Vui lòng thử lại sau.'
  }
  
  if (errorMessage.includes('504') || errorMessage.includes('gateway timeout')) {
    return 'Kết nối quá chậm. Vui lòng thử lại.'
  }
  
  if (errorMessage.includes('timeout')) {
    return 'Kết nối bị timeout. Vui lòng kiểm tra mạng và thử lại.'
  }
  
  return 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.'
}

/**
 * Retry function with exponential backoff for network operations
 */
export const retryWithBackoff = async (
  operation, 
  maxRetries = 3, 
  baseDelay = 1000,
  maxDelay = 10000
) => {
  let lastError
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      // Don't retry if it's not a network error
      if (!isNetworkError(error)) {
        throw error
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
      
      console.warn(`Network operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`, error)
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

/**
 * Check network connectivity
 */
export const checkNetworkConnectivity = async () => {
  if (!navigator.onLine) {
    return { online: false, message: 'Không có kết nối internet' }
  }
  
  try {
    // Try to fetch a small resource to test connectivity
    const response = await fetch('/favicon.ico', { 
      method: 'HEAD',
      cache: 'no-cache',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })
    
    return { 
      online: response.ok, 
      message: response.ok ? 'Kết nối bình thường' : 'Kết nối không ổn định'
    }
  } catch (error) {
    return { 
      online: false, 
      message: getNetworkErrorMessage(error) || 'Không thể kết nối'
    }
  }
}

/**
 * Network status monitor
 */
export class NetworkMonitor {
  constructor() {
    this.listeners = new Set()
    this.isOnline = navigator.onLine
    this.setupEventListeners()
  }
  
  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.notifyListeners({ online: true, event: 'online' })
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
      this.notifyListeners({ online: false, event: 'offline' })
    })
  }
  
  addListener(callback) {
    this.listeners.add(callback)
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback)
    }
  }
  
  notifyListeners(status) {
    this.listeners.forEach(callback => {
      try {
        callback(status)
      } catch (error) {
        console.error('Error in network status listener:', error)
      }
    })
  }
  
  getStatus() {
    return {
      online: this.isOnline,
      timestamp: new Date().toISOString()
    }
  }
}

// Create singleton instance
export const networkMonitor = new NetworkMonitor()

/**
 * React hook for network status
 */
export const useNetworkStatus = () => {
  const [status, setStatus] = useState({
    online: navigator.onLine,
    timestamp: new Date().toISOString()
  })
  
  useEffect(() => {
    const unsubscribe = networkMonitor.addListener((newStatus) => {
      setStatus({
        ...newStatus,
        timestamp: new Date().toISOString()
      })
    })
    
    return unsubscribe
  }, [])
  
  return status
}
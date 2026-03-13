import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info, X, Shield, Database, RefreshCw, Wifi, WifiOff } from 'lucide-react'

/**
 * Information banner explaining RLS and how pricing sync works
 */
export default function RLSInfoBanner({ show = true, onDismiss }) {
  const [isVisible, setIsVisible] = useState(show)

  const handleDismiss = () => {
    setIsVisible(false)
    if (onDismiss) onDismiss()
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="rls-info-banner"
          style={{
            background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
            border: '1px solid #2196f3',
            borderRadius: '12px',
            padding: '1rem 1.5rem',
            margin: '1rem 0',
            position: 'relative'
          }}
        >
          <button
            onClick={handleDismiss}
            style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X className="w-4 h-4" />
          </button>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{
              background: '#2196f3',
              borderRadius: '50%',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Info className="w-5 h-5 text-white" />
            </div>

            <div style={{ flex: 1 }}>
              <h4 style={{ 
                margin: '0 0 0.75rem 0', 
                color: '#1565c0',
                fontSize: '1.1rem',
                fontWeight: 600
              }}>
                Thông Tin Về Đồng Bộ Giá Vé
              </h4>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <Shield className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong style={{ color: '#e65100', fontSize: '0.9rem' }}>Row Level Security (RLS)</strong>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#666' }}>
                      Supabase RLS có thể hạn chế cập nhật trực tiếp bảng ghế. Hệ thống sẽ tự động sử dụng phương pháp tính toán thay thế.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <Database className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong style={{ color: '#2e7d32', fontSize: '0.9rem' }}>Lưu Trữ Giá Vé</strong>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#666' }}>
                      Giá cơ bản được lưu trong bảng <code>seat_pricing</code>. Giá cuối cùng được tính toán real-time.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <RefreshCw className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong style={{ color: '#1976d2', fontSize: '0.9rem' }}>Đồng Bộ Real-time</strong>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#666' }}>
                      Thay đổi giá sẽ được đồng bộ ngay lập tức giữa Theater Manager và Booking System.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  {navigator.onLine ? (
                    <Wifi className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <strong style={{ color: navigator.onLine ? '#2e7d32' : '#d32f2f', fontSize: '0.9rem' }}>
                      Kết Nối Mạng
                    </strong>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#666' }}>
                      {navigator.onLine ? 
                        'Kết nối bình thường. Hệ thống hoạt động đầy đủ.' :
                        'Mất kết nối. Một số tính năng có thể bị hạn chế.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '8px',
                padding: '0.75rem',
                fontSize: '0.85rem',
                color: '#555'
              }}>
                <strong>💡 Lưu ý:</strong> Hệ thống được thiết kế để hoạt động robust ngay cả khi có vấn đề về RLS hoặc kết nối mạng. 
                Giá vé sẽ luôn được tính toán chính xác thông qua calculation-based pricing. 
                {!navigator.onLine && ' Khi có kết nối trở lại, hệ thống sẽ tự động đồng bộ.'}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
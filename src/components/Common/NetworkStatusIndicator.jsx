import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, AlertTriangle, X } from 'lucide-react'
import { useNetworkStatus } from '../../utils/networkUtils'

/**
 * Network status indicator component
 * Shows connection status and provides user feedback
 */
export default function NetworkStatusIndicator({ 
  showWhenOnline = false, 
  position = 'top-right',
  className = '' 
}) {
  const networkStatus = useNetworkStatus()
  const [showIndicator, setShowIndicator] = useState(false)
  const [lastOfflineTime, setLastOfflineTime] = useState(null)

  useEffect(() => {
    if (!networkStatus.online) {
      setShowIndicator(true)
      setLastOfflineTime(new Date())
    } else {
      // Show briefly when coming back online
      if (lastOfflineTime) {
        setShowIndicator(true)
        setTimeout(() => {
          if (!showWhenOnline) {
            setShowIndicator(false)
          }
        }, 3000)
      } else if (showWhenOnline) {
        setShowIndicator(true)
      }
    }
  }, [networkStatus.online, showWhenOnline, lastOfflineTime])

  const getStatusColor = () => {
    if (!networkStatus.online) return '#f44336' // Red
    return '#4caf50' // Green
  }

  const getStatusText = () => {
    if (!networkStatus.online) {
      return 'Mất kết nối mạng'
    }
    
    if (lastOfflineTime) {
      return 'Đã kết nối lại'
    }
    
    return 'Kết nối bình thường'
  }

  const getIcon = () => {
    if (!networkStatus.online) {
      return <WifiOff className="w-4 h-4" />
    }
    
    if (lastOfflineTime) {
      return <AlertTriangle className="w-4 h-4" />
    }
    
    return <Wifi className="w-4 h-4" />
  }

  const positionStyles = {
    'top-right': {
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      zIndex: 9999
    },
    'top-left': {
      position: 'fixed',
      top: '1rem',
      left: '1rem',
      zIndex: 9999
    },
    'bottom-right': {
      position: 'fixed',
      bottom: '1rem',
      right: '1rem',
      zIndex: 9999
    },
    'bottom-left': {
      position: 'fixed',
      bottom: '1rem',
      left: '1rem',
      zIndex: 9999
    },
    'inline': {
      position: 'relative'
    }
  }

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          className={`network-status-indicator ${className}`}
          style={{
            ...positionStyles[position],
            background: networkStatus.online ? 
              'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)' : 
              'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
            border: `2px solid ${getStatusColor()}`,
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(10px)',
            maxWidth: '300px'
          }}
        >
          <div style={{ color: getStatusColor() }}>
            {getIcon()}
          </div>
          
          <div>
            <div style={{ 
              fontWeight: 600, 
              fontSize: '0.875rem',
              color: getStatusColor(),
              marginBottom: '0.25rem'
            }}>
              {getStatusText()}
            </div>
            
            {!networkStatus.online && (
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#666',
                lineHeight: 1.3
              }}>
                Một số tính năng có thể bị hạn chế. Hệ thống sẽ tự động đồng bộ khi có kết nối.
              </div>
            )}
            
            {networkStatus.online && lastOfflineTime && (
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#666',
                lineHeight: 1.3
              }}>
                Hệ thống đang đồng bộ dữ liệu...
              </div>
            )}
          </div>
          
          {position !== 'inline' && (
            <button
              onClick={() => setShowIndicator(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '0.5rem'
              }}
            >
              <X className="w-3 h-3" style={{ color: '#666' }} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Compact network status badge
 */
export function NetworkStatusBadge({ className = '' }) {
  const networkStatus = useNetworkStatus()
  
  return (
    <div 
      className={`network-status-badge ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.25rem 0.5rem',
        borderRadius: '12px',
        background: networkStatus.online ? '#e8f5e8' : '#ffebee',
        border: `1px solid ${networkStatus.online ? '#4caf50' : '#f44336'}`,
        fontSize: '0.75rem',
        fontWeight: 500
      }}
      title={networkStatus.online ? 'Kết nối bình thường' : 'Mất kết nối mạng'}
    >
      {networkStatus.online ? (
        <Wifi className="w-3 h-3" style={{ color: '#4caf50' }} />
      ) : (
        <WifiOff className="w-3 h-3" style={{ color: '#f44336' }} />
      )}
      <span style={{ color: networkStatus.online ? '#2e7d32' : '#c62828' }}>
        {networkStatus.online ? 'Online' : 'Offline'}
      </span>
    </div>
  )
}
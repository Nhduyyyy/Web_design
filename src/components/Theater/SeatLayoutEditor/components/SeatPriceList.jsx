import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  ChevronDown, 
  ChevronUp,
  Armchair,
  Star,
  Sofa,
  Accessibility,
  Edit2,
  Check,
  Plus,
  Minus,
  Save,
  RefreshCw
} from 'lucide-react';
import { useSeatLayoutStore } from '@/stores/seatLayoutStore';
import { SeatType } from '@/types/seat.types';
import { 
  getSeatPricingByType, 
  batchUpdateSeatPricing, 
  updateSeatFinalPrices,
  getDefaultSeatPricing 
} from '@/services/seatPricingService';
import seatPricingSyncService from '@/services/seatPricingSyncService';
import RLSInfoBanner from '@/components/Common/RLSInfoBanner';
import { isNetworkError, getNetworkErrorMessage } from '@/utils/networkUtils';

const seatTypeInfo = {
  [SeatType.STANDARD]: { icon: Armchair, label: 'Thường', color: '#4A90E2', defaultPrice: 250000 },
  [SeatType.VIP]: { icon: Star, label: 'VIP', color: '#F5A623', defaultPrice: 500000 },
  [SeatType.COUPLE]: { icon: Sofa, label: 'Đôi', color: '#E91E63', defaultPrice: 600000 },
  [SeatType.WHEELCHAIR]: { icon: Accessibility, label: 'Xe lăn', color: '#50C878', defaultPrice: 250000 },
};

export default function SeatPriceList({ theaterId, hallId }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [prices, setPrices] = useState({});
  const [editingType, setEditingType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showRLSInfo, setShowRLSInfo] = useState(false);

  const { getStatistics } = useSeatLayoutStore();
  const stats = getStatistics();

  // Load pricing from database
  useEffect(() => {
    if (theaterId) {
      loadPricing();
    }
  }, [theaterId, hallId]);

  // Set up real-time pricing sync
  useEffect(() => {
    if (!theaterId) return;

    const unsubscribe = seatPricingSyncService.subscribe(
      theaterId,
      hallId,
      (payload) => {
        console.log('Pricing changed, reloading...', payload);
        loadPricing();
      }
    );

    return unsubscribe;
  }, [theaterId, hallId]);

  const loadPricing = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const pricingData = await getSeatPricingByType(theaterId, hallId);
      
      // Merge with defaults for any missing types
      const defaultPricing = getDefaultSeatPricing();
      const mergedPricing = { ...defaultPricing, ...pricingData };
      
      setPrices(mergedPricing);
      setHasChanges(false);
    } catch (err) {
      console.error('Error loading pricing:', err);
      setError('Không thể tải giá vé. Sử dụng giá mặc định.');
      // Use default pricing on error
      setPrices(getDefaultSeatPricing());
    } finally {
      setLoading(false);
    }
  };

  const savePricing = async () => {
    if (!theaterId || !hasChanges) return;
    
    try {
      setSaving(true);
      setError(null);
      
      // Save pricing to database
      await batchUpdateSeatPricing(theaterId, hallId, prices);
      
      // Try to update seat final prices in the hall (may fail due to RLS)
      if (hallId) {
        try {
          const result = await updateSeatFinalPrices(hallId, theaterId);
          console.log('Seat price update result:', result);
          
          if (result.note) {
            setError(`✅ Đã lưu giá vé! ${result.note}`);
          } else {
            setError('✅ Đã lưu giá vé thành công!');
          }
        } catch (seatUpdateError) {
          console.warn('Seat final price update failed:', seatUpdateError);
          
          if (isNetworkError(seatUpdateError)) {
            const networkMessage = getNetworkErrorMessage(seatUpdateError);
            setError(`✅ Đã lưu giá vé! (${networkMessage})`);
          } else if (seatUpdateError.code === '42501') {
            setError('✅ Đã lưu giá vé! (Cập nhật ghế bị hạn chế bởi RLS)');
            setShowRLSInfo(true);
          } else {
            setError('✅ Đã lưu giá vé! (Cập nhật ghế thất bại - sử dụng tính toán real-time)');
          }
        }
      } else {
        setError('✅ Đã lưu giá vé thành công!');
      }
      
      setHasChanges(false);
      setTimeout(() => setError(null), 5000);
      
      // Trigger sync update to notify other components
      try {
        await seatPricingSyncService.triggerPricingUpdate(theaterId, hallId);
      } catch (syncError) {
        console.warn('Sync notification failed (non-critical):', syncError);
      }
      
    } catch (err) {
      console.error('Error saving pricing:', err);
      
      if (isNetworkError(err)) {
        const networkMessage = getNetworkErrorMessage(err);
        setError(networkMessage);
      } else if (err.code === '42501') {
        setError('Lỗi quyền truy cập (RLS). Liên hệ admin để cấp quyền cập nhật ghế.');
        setShowRLSInfo(true);
      } else {
        setError('Không thể lưu giá vé. Vui lòng thử lại.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Filter only seat types that exist in the layout (exclude stage and aisle)
  const activeSeatTypes = Object.entries(seatTypeInfo).filter(([type]) => {
    return stats.byType[type] > 0;
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleEditPrice = (type) => {
    setEditingType(type);
  };

  const handlePriceChange = (type, newPrice) => {
    if (newPrice >= 0) {
      setPrices(prev => ({ ...prev, [type]: newPrice }));
      setHasChanges(true);
    }
  };

  const handleIncrement = (type, step = 10000) => {
    setPrices(prev => ({ ...prev, [type]: prev[type] + step }));
    setHasChanges(true);
  };

  const handleDecrement = (type, step = 10000) => {
    setPrices(prev => ({ 
      ...prev, 
      [type]: Math.max(0, prev[type] - step) 
    }));
    setHasChanges(true);
  };

  const handleSavePrice = () => {
    setEditingType(null);
  };

  const calculateTotalRevenue = () => {
    let total = 0;
    activeSeatTypes.forEach(([type]) => {
      const count = stats.byType[type] || 0;
      total += count * prices[type];
    });
    return total;
  };

  if (activeSeatTypes.length === 0 && !loading) {
    return null;
  }

  return (
    <motion.div
      className="seat-price-list"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {/* RLS Information Banner */}
      <RLSInfoBanner 
        show={showRLSInfo} 
        onDismiss={() => setShowRLSInfo(false)} 
      />

      <div className="price-list-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          <span className="font-semibold">Giá vé</span>
          {loading && <RefreshCw className="w-3 h-3 animate-spin" />}
          {hasChanges && <span className="text-orange-500 text-xs">●</span>}
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                savePricing();
              }}
              disabled={saving}
              className="save-button"
              title="Lưu thay đổi"
            >
              <Save className="w-3 h-3" />
            </button>
          )}
          <button className="expand-button">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="price-list-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Error/Success Message */}
            {error && (
              <div className={`price-message ${error.includes('✅') ? 'success' : 'error'}`}>
                {error}
              </div>
            )}

            {loading ? (
              <div className="price-loading">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang tải giá vé...</span>
              </div>
            ) : (
              <>
                <div className="price-items">
                  {activeSeatTypes.map(([type, info]) => {
                    const Icon = info.icon;
                    const count = stats.byType[type] || 0;
                    const isEditing = editingType === type;
                    const currentPrice = prices[type] || info.defaultPrice;

                    return (
                      <div key={type} className="price-item">
                        <div className="price-item-header">
                          <div className="flex items-center gap-2">
                            <div 
                              className="price-item-icon"
                              style={{ backgroundColor: info.color }}
                            >
                              <Icon className="w-3 h-3" />
                            </div>
                            <div className="price-item-info">
                              <span className="price-item-label">{info.label}</span>
                              <span className="price-item-count">{count} ghế</span>
                            </div>
                          </div>
                          
                          {!isEditing ? (
                            <button
                              className="price-edit-button"
                              onClick={() => handleEditPrice(type)}
                              disabled={saving}
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          ) : (
                            <button
                              className="price-save-button"
                              onClick={handleSavePrice}
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="price-editor">
                            <button
                              className="price-step-button"
                              onClick={() => handleDecrement(type)}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            
                            <div className="price-input-wrapper">
                              <input
                                type="number"
                                value={currentPrice}
                                onChange={(e) => handlePriceChange(type, parseInt(e.target.value) || 0)}
                                className="price-input-field"
                              />
                              <span className="price-currency">₫</span>
                            </div>
                            
                            <button
                              className="price-step-button"
                              onClick={() => handleIncrement(type)}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="price-item-price">
                            {formatPrice(currentPrice)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="price-total">
                  <span className="price-total-label">Tổng doanh thu dự kiến</span>
                  <span className="price-total-value">{formatPrice(calculateTotalRevenue())}</span>
                </div>

                {hasChanges && (
                  <div className="price-actions">
                    <button
                      onClick={savePricing}
                      disabled={saving}
                      className="btn-save-pricing"
                    >
                      {saving ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Save className="w-3 h-3" />
                          Lưu giá vé
                        </>
                      )}
                    </button>
                    <button
                      onClick={loadPricing}
                      disabled={saving}
                      className="btn-cancel-pricing"
                    >
                      Hủy thay đổi
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

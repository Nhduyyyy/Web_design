import React, { useState } from 'react';
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
  X,
  Plus,
  Minus
} from 'lucide-react';
import { useSeatLayoutStore } from '@/stores/seatLayoutStore';
import { SeatType } from '@/types/seat.types';

const seatTypeInfo = {
  [SeatType.STANDARD]: { icon: Armchair, label: 'Thường', color: '#4A90E2', defaultPrice: 100000 },
  [SeatType.VIP]: { icon: Star, label: 'VIP', color: '#F5A623', defaultPrice: 200000 },
  [SeatType.COUPLE]: { icon: Sofa, label: 'Đôi', color: '#E91E63', defaultPrice: 300000 },
  [SeatType.WHEELCHAIR]: { icon: Accessibility, label: 'Xe lăn', color: '#50C878', defaultPrice: 100000 },
};

export default function SeatPriceList() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [prices, setPrices] = useState({
    [SeatType.STANDARD]: 100000,
    [SeatType.VIP]: 200000,
    [SeatType.COUPLE]: 300000,
    [SeatType.WHEELCHAIR]: 100000,
  });
  const [editingType, setEditingType] = useState(null);

  const { getStatistics } = useSeatLayoutStore();
  const stats = getStatistics();

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
    }
  };

  const handleIncrement = (type, step = 10000) => {
    setPrices(prev => ({ ...prev, [type]: prev[type] + step }));
  };

  const handleDecrement = (type, step = 10000) => {
    setPrices(prev => ({ 
      ...prev, 
      [type]: Math.max(0, prev[type] - step) 
    }));
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

  if (activeSeatTypes.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="seat-price-list"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="price-list-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          <span className="font-semibold">Giá vé</span>
        </div>
        <button className="expand-button">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
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
            <div className="price-items">
              {activeSeatTypes.map(([type, info]) => {
                const Icon = info.icon;
                const count = stats.byType[type] || 0;
                const isEditing = editingType === type;

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
                            value={prices[type]}
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
                        {formatPrice(prices[type])}
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

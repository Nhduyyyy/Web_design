import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Eye, EyeOff, Users, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getConfirmedBookedSeatIdsForSchedule } from '@/services/bookingService';

export default function BookingStatusOverlay({ hallId, theaterId, onBookingStatusChange }) {
  const [isVisible, setIsVisible] = useState(true); // Mặc định hiển thị
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [bookedSeatIds, setBookedSeatIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load schedules for this hall/theater
  useEffect(() => {
    if (theaterId) {
      loadSchedules();
    }
  }, [theaterId, hallId]);

  // Real-time booking updates
  useEffect(() => {
    if (!selectedSchedule) return;

    const channel = supabase
      .channel(`booking-status-${selectedSchedule}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `schedule_id=eq.${selectedSchedule}`
        },
        (payload) => {
          // Chỉ reload khi có booking confirmed hoặc cancelled
          if (payload.new?.status === 'confirmed' || 
              payload.old?.status === 'confirmed' ||
              payload.eventType === 'DELETE') {
            loadBookingStatus(selectedSchedule);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedSchedule]);

  const loadSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          id,
          title,
          start_datetime,
          end_datetime,
          status,
          venue:venues(name)
        `)
        .eq('theater_id', theaterId)
        .gte('start_datetime', new Date().toISOString())
        .order('start_datetime', { ascending: true })
        .limit(10);

      if (error) throw error;
      setSchedules(data || []);
    } catch (err) {
      console.error('Error loading schedules:', err);
      setError('Không thể tải lịch diễn');
    }
  };

  const loadBookingStatus = async (scheduleId) => {
    if (!scheduleId) {
      setBookedSeatIds([]);
      onBookingStatusChange([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading booking status for schedule:', scheduleId); // Debug log
      const bookedIds = await getConfirmedBookedSeatIdsForSchedule(scheduleId);
      console.log('Found booked seat IDs:', bookedIds); // Debug log
      
      setBookedSeatIds(bookedIds);
      onBookingStatusChange(bookedIds);
    } catch (err) {
      console.error('Error loading booking status:', err);
      setError('Không thể tải trạng thái đặt vé');
      setBookedSeatIds([]);
      onBookingStatusChange([]);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleChange = (scheduleId) => {
    console.log('Schedule changed to:', scheduleId); // Debug log
    setSelectedSchedule(scheduleId);
    loadBookingStatus(scheduleId);
  };

  const toggleVisibility = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    
    if (!newVisibility) {
      // Hide booking status
      setSelectedSchedule(null);
      setBookedSeatIds([]);
      onBookingStatusChange([]);
    }
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      className="booking-status-overlay"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.9)',
        borderRadius: '12px',
        padding: '16px',
        minWidth: '280px',
        maxWidth: '320px',
        zIndex: 1000,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          <span className="text-white font-semibold text-sm">Trạng thái đặt vé</span>
          {loading && <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />}
        </div>
        <div className="flex items-center gap-1">
          {selectedSchedule && (
            <button
              onClick={() => loadBookingStatus(selectedSchedule)}
              className="p-1 rounded-md hover:bg-white/10 transition-colors"
              title="Làm mới trạng thái"
              disabled={loading}
            >
              <RefreshCw className={`w-3 h-3 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            onClick={toggleVisibility}
            className="p-1 rounded-md hover:bg-white/10 transition-colors"
            title={isVisible ? 'Ẩn trạng thái' : 'Hiện trạng thái'}
          >
            {isVisible ? (
              <EyeOff className="w-4 h-4 text-gray-400" />
            ) : (
              <Eye className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Schedule Selector */}
            <div className="mb-3">
              <label className="block text-xs text-gray-300 mb-2">
                Chọn suất diễn:
              </label>
              <select
                value={selectedSchedule || ''}
                onChange={(e) => handleScheduleChange(e.target.value || null)}
                className="w-full bg-gray-800 text-white text-sm rounded-md px-3 py-2 border border-gray-600 focus:border-blue-400 focus:outline-none"
              >
                <option value="">-- Chọn suất diễn --</option>
                {schedules.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {schedule.title} - {formatDateTime(schedule.start_datetime)}
                  </option>
                ))}
              </select>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center gap-2 text-blue-400 text-sm mb-2">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Đang tải trạng thái ghế...</span>
              </div>
            )}

            {/* Success message */}
            {selectedSchedule && !loading && !error && (
              <div className="text-green-400 text-xs mb-2">
                ✅ Đã tải trạng thái {bookedSeatIds.length} ghế đã bán
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-red-400 text-xs bg-red-900/20 rounded-md p-2 mb-2">
                {error}
              </div>
            )}

            {/* Debug: Show booked seat IDs */}
            {selectedSchedule && bookedSeatIds.length > 0 && (
              <div className="text-xs text-gray-400 mb-2 p-2 bg-gray-800 rounded">
                <div className="font-semibold mb-1">Debug - Booked Seat IDs:</div>
                <div className="max-h-20 overflow-y-auto">
                  {bookedSeatIds.map((id, index) => (
                    <div key={index} className="text-[10px]">{id}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Booking Statistics */}
            {selectedSchedule && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gray-800/50 rounded-md p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-green-400" />
                  <span className="text-white font-medium text-sm">Thống kê</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Ghế đã bán:</span>
                    <span className="text-red-400 font-semibold">{bookedSeatIds.length}</span>
                  </div>
                  <div className="text-gray-400 text-[10px] mt-2">
                    💡 Ghế đã bán sẽ có dấu chấm đỏ ở góc trên
                  </div>
                </div>
              </motion.div>
            )}

            {/* Legend */}
            {selectedSchedule && bookedSeatIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 pt-3 border-t border-gray-700"
              >
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-red-500 rounded-full border border-white"></div>
                  <span className="text-gray-300">Ghế đã bán (confirmed)</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Eye, EyeOff, Users, RefreshCw, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getDetailedBookingInfoForSchedule } from '@/services/bookingService';

export default function BookingStatusOverlay({ hallId, theaterId, onBookingStatusChange }) {
  const [isVisible, setIsVisible] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [bookedSeatIds, setBookedSeatIds] = useState([]);
  const [bookingDetails, setBookingDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load schedules for this hall/theater
  useEffect(() => {
    console.log('🎭 BookingStatusOverlay useEffect triggered:', { theaterId, hallId });
    
    if (theaterId) {
      console.log('✅ Theater ID exists, loading schedules...');
      loadSchedules();
    } else {
      console.log('⚠️ No theater ID provided');
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
      console.log('🔍 Loading schedules for theaterId:', theaterId);
      
      // First, check venues for this theater
      const { data: venues, error: venuesError } = await supabase
        .from('venues')
        .select('id, name, theater_id')
        .eq('theater_id', theaterId);
      
      console.log('🏛️ Venues for theater:', venues);
      
      if (venuesError) {
        console.error('❌ Error loading venues:', venuesError);
      }
      
      if (!venues || venues.length === 0) {
        console.log('⚠️ No venues found for theater:', theaterId);
        setSchedules([]);
        return;
      }
      
      // Get venue IDs
      const venueIds = venues.map(v => v.id);
      console.log('🎯 Venue IDs to search:', venueIds);
      
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
        .in('venue_id', venueIds)
        .order('start_datetime', { ascending: true })
        .limit(10);

      console.log('📅 Schedules query result:', { data, error });
      
      if (error) throw error;
      setSchedules(data || []);
    } catch (err) {
      console.error('❌ Error loading schedules:', err);
      setError('Không thể tải lịch diễn');
    }
  };

  const loadBookingStatus = async (scheduleId) => {
    if (!scheduleId) {
      setBookedSeatIds([]);
      setBookingDetails({});
      onBookingStatusChange([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const bookingMap = await getDetailedBookingInfoForSchedule(scheduleId);
      const seatIds = Object.keys(bookingMap);
      
      setBookedSeatIds(seatIds);
      setBookingDetails(bookingMap);
      onBookingStatusChange(seatIds, bookingMap);
    } catch (err) {
      console.error('Error loading booking status:', err);
      setError('Không thể tải trạng thái đặt vé');
      setBookedSeatIds([]);
      setBookingDetails({});
      onBookingStatusChange([]);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleChange = (scheduleId) => {
    console.log('📋 Schedule changed:', scheduleId);
    setSelectedSchedule(scheduleId);
    loadBookingStatus(scheduleId);
  };

  const toggleVisibility = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    
    if (!newVisibility) {
      setSelectedSchedule(null);
      setBookedSeatIds([]);
      setBookingDetails({});
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
        background: '#1A0F0F',
        border: '1px solid #432828',
        borderRadius: '12px',
        padding: '16px',
        minWidth: '300px',
        maxWidth: '350px',
        maxHeight: 'calc(100vh - 100px)',
        overflowY: 'auto',
        zIndex: 45,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#432828]">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5" style={{ color: '#D33131' }} />
          <span className="text-white font-semibold">Trạng thái đặt vé</span>
          {loading && <RefreshCw className="w-4 h-4 animate-spin text-[#D33131]" />}
        </div>
        <div className="flex items-center gap-1">
          {selectedSchedule && (
            <button
              onClick={() => loadBookingStatus(selectedSchedule)}
              className="p-1.5 rounded-md transition-colors"
              style={{
                background: '#2D1B1B',
                border: '1px solid #432828',
                color: '#9CA3AF'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#3D2525';
                e.target.style.borderColor = '#D33131';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#2D1B1B';
                e.target.style.borderColor = '#432828';
                e.target.style.color = '#9CA3AF';
              }}
              title="Làm mới trạng thái"
              disabled={loading}
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            onClick={toggleVisibility}
            className="p-1.5 rounded-md transition-colors ml-1"
            style={{
              background: '#2D1B1B',
              border: '1px solid #432828',
              color: '#9CA3AF'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#3D2525';
              e.target.style.borderColor = '#D33131';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#2D1B1B';
              e.target.style.borderColor = '#432828';
              e.target.style.color = '#9CA3AF';
            }}
            title={isVisible ? 'Ẩn trạng thái' : 'Hiện trạng thái'}
          >
            {isVisible ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
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
            className="space-y-4"
          >
            {/* Schedule Selector */}
            <div>
              <label className="block text-sm font-medium text-[#E5E7EB] mb-2">
                Chọn suất diễn:
              </label>
              <div className="relative">
                <select
                  value={selectedSchedule || ''}
                  onChange={(e) => handleScheduleChange(e.target.value || null)}
                  className="w-full text-sm rounded-lg px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-[#D33131] appearance-none"
                  style={{
                    background: '#2D1B1B',
                    border: '1px solid #432828',
                    color: 'white'
                  }}
                >
                  <option value="">-- Chọn suất diễn --</option>
                  {schedules.map((schedule) => (
                    <option key={schedule.id} value={schedule.id}>
                      {schedule.title} - {formatDateTime(schedule.start_datetime)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-[#D33131] text-sm p-3 rounded-lg"
                style={{ background: '#2D1B1B', border: '1px solid #432828' }}
              >
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang tải trạng thái ghế...</span>
              </motion.div>
            )}

            {/* Error State */}
            {error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-sm p-3 rounded-lg"
                style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
              >
                {error}
              </motion.div>
            )}

            {/* Booking Statistics */}
            {selectedSchedule && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg"
                style={{ background: '#2D1B1B', border: '1px solid #432828' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-[#D33131]" />
                  <span className="text-white font-semibold text-sm">Thống kê đặt vé</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[#9CA3AF] text-sm">Ghế đã bán:</span>
                    <span className="text-[#D33131] font-bold text-lg">{bookedSeatIds.length}</span>
                  </div>
                  <div className="text-[#9CA3AF] text-xs p-2 rounded" style={{ background: '#1A0F0F' }}>
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
                className="pt-3 border-t border-[#432828]"
              >
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-[#D33131] rounded-full border border-white shadow-sm"></div>
                  <span className="text-[#E5E7EB]">Ghế đã bán (confirmed)</span>
                </div>
              </motion.div>
            )}

            {/* Empty State */}
            {!selectedSchedule && schedules.length === 0 && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-6"
              >
                <Calendar className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
                <p className="text-[#9CA3AF] text-sm">Không có suất diễn nào</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
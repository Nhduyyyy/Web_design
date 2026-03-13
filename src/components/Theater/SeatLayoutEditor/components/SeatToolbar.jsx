import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Armchair, 
  Sofa, 
  Star, 
  Accessibility, 
  DoorOpen, 
  Square,
  Trash2,
  MousePointer,
  Hand,
  ChevronRight,
  ChevronDown,
  Info,
  MapPin,
  Tag,
  Palette,
  User,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSeatLayoutStore } from '@/stores/seatLayoutStore';
import { ToolType } from '@/types/seat.types';

export default function SeatToolbar({ bookedSeatIds = [], bookingDetails = {} }) {
  const { selectedTool, setSelectedTool, selectedCells, seats } = useSeatLayoutStore();
  const [isToolsExpanded, setIsToolsExpanded] = useState(true);
  const [isSeatInfoExpanded, setIsSeatInfoExpanded] = useState(true);

  // Get selected seat info
  const selectedSeat = selectedCells && selectedCells.length === 1 && seats
    ? seats.find(seat => seat.id === selectedCells[0])
    : null;

  // Get booking info for selected seat
  const selectedSeatBookingInfo = selectedSeat ? (() => {
    const seatIdWithoutPrefix = selectedSeat.id.startsWith('seat-') 
      ? selectedSeat.id.substring(5) 
      : selectedSeat.id;
    return bookingDetails[seatIdWithoutPrefix] || null;
  })() : null;

  const showSeatInfo = selectedTool === ToolType.SELECT && selectedSeat && seats && seats.length > 0;

  // Group tools by category
  const toolCategories = [
    {
      name: "Điều hướng",
      tools: [
        { id: ToolType.SELECT, icon: MousePointer, label: 'Chọn', shortcut: 'V', color: 'text-gray-300' },
        { id: ToolType.PAN, icon: Hand, label: 'Di chuyển', shortcut: 'H', color: 'text-gray-300' },
      ]
    },
    {
      name: "Loại ghế",
      tools: [
        { id: ToolType.STANDARD, icon: Armchair, label: 'Ghế thường', shortcut: '1', color: 'text-gray-400' },
        { id: ToolType.VIP, icon: Star, label: 'Ghế VIP', shortcut: '2', color: 'text-yellow-300' },
        { id: ToolType.COUPLE, icon: Sofa, label: 'Ghế đôi', shortcut: '3', color: 'text-pink-300' },
        { id: ToolType.WHEELCHAIR, icon: Accessibility, label: 'Ghế xe lăn', shortcut: '4', color: 'text-cyan-300' },
      ]
    },
    {
      name: "Khu vực",
      tools: [
        { id: ToolType.AISLE, icon: DoorOpen, label: 'Lối đi', shortcut: '5', color: 'text-gray-400' },
        { id: ToolType.STAGE, icon: Square, label: 'Sân khấu', shortcut: '6', color: 'text-red-300' },
      ]
    },
    {
      name: "Hành động",
      tools: [
        { id: ToolType.DELETE, icon: Trash2, label: 'Xóa', shortcut: 'D', color: 'text-red-400' },
      ]
    }
  ];

  return (
    <motion.div 
      className="seat-toolbar fixed left-0 top-20 h-[calc(100vh-5rem)] w-80 shadow-2xl z-10 flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #1A0505, #2B0707)'
      }}
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
    >
      <TooltipProvider>
        <div className="flex flex-col h-full w-full">
          {/* Tools Subsection */}
          <div className="flex-shrink-0">
            {/* Tools Header */}
            <div 
              className="p-4 border-b cursor-pointer hover:bg-white hover:bg-opacity-5 transition-colors duration-200"
              style={{ 
                borderColor: '#7F1D1D',
                background: 'linear-gradient(180deg, #1A0505, #2B0707)'
              }}
              onClick={() => setIsToolsExpanded(!isToolsExpanded)}
            >
              <div className="flex items-center gap-3">
                {isToolsExpanded ? (
                  <ChevronDown className="w-4 h-4" style={{ color: '#6B8DB5' }} />
                ) : (
                  <ChevronRight className="w-4 h-4" style={{ color: '#6B8DB5' }} />
                )}
                <span className="font-semibold text-base" style={{ color: '#6B8DB5' }}>
                  Công cụ
                </span>
                <div className="text-xs px-2 py-1 rounded ml-auto" style={{ 
                  background: '#7F1D1D', 
                  color: '#E5E7EB' 
                }}>
                  {toolCategories.reduce((total, cat) => total + cat.tools.length, 0)}
                </div>
              </div>
            </div>

            {/* Tools Content */}
            {isToolsExpanded && (
              <motion.div 
                className="px-4 pb-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {toolCategories.map((category) => (
                  <div key={category.name} className="mb-6">
                    {/* Category Header */}
                    <div className="mb-3 mt-4">
                      <h3 className="text-xs font-medium uppercase tracking-wider" 
                          style={{ color: '#9CA3AF' }}>
                        {category.name}
                      </h3>
                    </div>
                    
                    {/* Category Tools */}
                    <div className="space-y-2">
                      {category.tools.map((tool) => {
                        const Icon = tool.icon;
                        const isActive = selectedTool === tool.id;
                        
                        return (
                          <Tooltip key={tool.id}>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                onClick={() => setSelectedTool(tool.id)}
                                className={`w-full h-12 flex items-center justify-between px-3 rounded-lg transition-all duration-200 group ${
                                  isActive 
                                    ? 'shadow-md transform scale-[1.01]' 
                                    : 'hover:transform hover:scale-[1.005]'
                                }`}
                                style={{
                                  background: isActive ? '#7F1D1D' : 'transparent',
                                  border: `1px solid ${isActive ? '#991B1B' : 'transparent'}`,
                                  color: isActive ? '#F3F4F6' : '#E5E7EB'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isActive) {
                                    e.target.style.background = '#3B0A0A';
                                    e.target.style.borderColor = '#7F1D1D';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isActive) {
                                    e.target.style.background = 'transparent';
                                    e.target.style.borderColor = 'transparent';
                                  }
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : tool.color}`} />
                                  <span className={`font-medium text-sm ${isActive ? 'text-white' : 'text-gray-200'}`}>
                                    {tool.label}
                                  </span>
                                </div>
                                <div className={`text-xs px-2 py-1 rounded font-mono ${
                                  isActive ? 'bg-white bg-opacity-20 text-white' : 'bg-gray-700 text-gray-300'
                                }`}>
                                  {tool.shortcut}
                                </div>
                                {isActive && (
                                  <motion.div
                                    className="absolute inset-0 rounded-lg"
                                    style={{ 
                                      border: '1px solid #991B1B',
                                      boxShadow: '0 0 15px rgba(159, 27, 27, 0.2)'
                                    }}
                                    layoutId="activeToolBorder"
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                  />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent 
                              side="right" 
                              className="ml-2"
                              style={{ 
                                background: '#2B0707', 
                                border: '1px solid #7F1D1D',
                                color: '#E5E7EB'
                              }}
                            >
                              <div className="text-center">
                                <p className="font-medium">{tool.label}</p>
                                <p className="text-xs opacity-75">Phím tắt: {tool.shortcut}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Seat Info Subsection */}
          <div className="border-t flex-shrink-0" style={{ borderColor: '#7F1D1D' }}>
            {/* Seat Info Header */}
            <div 
              className="p-4 cursor-pointer hover:bg-white hover:bg-opacity-5 transition-colors duration-200"
              onClick={() => setIsSeatInfoExpanded(!isSeatInfoExpanded)}
            >
              <div className="flex items-center gap-3">
                {isSeatInfoExpanded ? (
                  <ChevronDown className="w-4 h-4" style={{ color: '#6B8DB5' }} />
                ) : (
                  <ChevronRight className="w-4 h-4" style={{ color: '#6B8DB5' }} />
                )}
                <Info className="w-4 h-4" style={{ color: '#6B8DB5' }} />
                <span className="font-semibold text-base" style={{ color: '#6B8DB5' }}>
                  Thông tin ghế
                </span>
              </div>
            </div>

            {/* Seat Info Content */}
            {isSeatInfoExpanded && (
              <motion.div 
                className="px-4 pb-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {showSeatInfo ? (
                  <div className="space-y-2">
                    {/* Seat Label */}
                    <div className="flex items-center gap-3 p-2 rounded-lg" style={{ background: '#3B0A0A' }}>
                      <MapPin className="w-4 h-4" style={{ color: '#6B8DB5' }} />
                      <div className="flex-1">
                        <div className="text-xs font-medium" style={{ color: '#9CA3AF' }}>
                          VỊ TRÍ GHẾ
                        </div>
                        <div className="text-sm font-semibold" style={{ color: '#E5E7EB' }}>
                          {selectedSeat?.label || 'N/A'}
                        </div>
                      </div>
                    </div>
                    {/* Seat Type */}
                    <div className="flex items-center gap-3 p-2 rounded-lg" style={{ background: '#3B0A0A' }}>
                      <Tag className="w-4 h-4" style={{ color: '#6B8DB5' }} />
                      <div className="flex-1">
                        <div className="text-xs font-medium" style={{ color: '#9CA3AF' }}>
                          LOẠI GHẾ
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedSeat?.type === 'standard' && <Armchair className="w-4 h-4 text-gray-400" />}
                          {selectedSeat?.type === 'vip' && <Star className="w-4 h-4 text-yellow-300" />}
                          {selectedSeat?.type === 'couple' && <Sofa className="w-4 h-4 text-pink-300" />}
                          {selectedSeat?.type === 'wheelchair' && <Accessibility className="w-4 h-4 text-cyan-300" />}
                          {selectedSeat?.type === 'aisle' && <DoorOpen className="w-4 h-4 text-gray-400" />}
                          {selectedSeat?.type === 'stage' && <Square className="w-4 h-4 text-red-300" />}
                          <span className="text-sm font-medium" style={{ color: '#E5E7EB' }}>
                            {selectedSeat?.type === 'standard' && 'Ghế thường'}
                            {selectedSeat?.type === 'vip' && 'Ghế VIP'}
                            {selectedSeat?.type === 'couple' && 'Ghế đôi'}
                            {selectedSeat?.type === 'wheelchair' && 'Ghế xe lăn'}
                            {selectedSeat?.type === 'aisle' && 'Lối đi'}
                            {selectedSeat?.type === 'stage' && 'Sân khấu'}
                            {!selectedSeat?.type && 'Không xác định'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Grid Position */}
                    <div className="flex items-center gap-3 p-2 rounded-lg" style={{ background: '#3B0A0A' }}>
                      <Palette className="w-4 h-4" style={{ color: '#6B8DB5' }} />
                      <div className="flex-1">
                        <div className="text-xs font-medium" style={{ color: '#9CA3AF' }}>
                          TỌA ĐỘ LƯỚI
                        </div>
                        <div className="text-sm font-medium" style={{ color: '#E5E7EB' }}>
                          Hàng {(selectedSeat?.row ?? -1) + 1}, Cột {(selectedSeat?.col ?? -1) + 1}
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-3 p-2 rounded-lg" style={{ background: '#3B0A0A' }}>
                      <div className={`w-3 h-3 rounded-full ${
                        selectedSeatBookingInfo ? 'bg-red-400' : 'bg-green-400'
                      }`} />
                      <div className="flex-1">
                        <div className="text-xs font-medium" style={{ color: '#9CA3AF' }}>
                          TRẠNG THÁI
                        </div>
                        <div className="text-sm font-medium" style={{ color: '#E5E7EB' }}>
                          {selectedSeatBookingInfo ? 'Đã bán' : 'Còn trống'}
                        </div>
                      </div>
                    </div>

                    {/* Booking Info - Only show if seat is booked */}
                    {selectedSeatBookingInfo && (
                      <>
                        {/* Customer Name */}
                        <div className="flex items-center gap-3 p-2 rounded-lg" style={{ background: '#3B0A0A' }}>
                          <User className="w-4 h-4" style={{ color: '#6B8DB5' }} />
                          <div className="flex-1">
                            <div className="text-xs font-medium" style={{ color: '#9CA3AF' }}>
                              NGƯỜI MUA
                            </div>
                            <div className="text-sm font-medium" style={{ color: '#E5E7EB' }}>
                              {selectedSeatBookingInfo.customerName || 'Không có thông tin'}
                            </div>
                          </div>
                        </div>

                        {/* Purchase Time */}
                        <div className="flex items-center gap-3 p-2 rounded-lg" style={{ background: '#3B0A0A' }}>
                          <Calendar className="w-4 h-4" style={{ color: '#6B8DB5' }} />
                          <div className="flex-1">
                            <div className="text-xs font-medium" style={{ color: '#9CA3AF' }}>
                              THỜI GIAN MUA
                            </div>
                            <div className="text-sm font-medium" style={{ color: '#E5E7EB' }}>
                              {selectedSeatBookingInfo.confirmedAt 
                                ? new Date(selectedSeatBookingInfo.confirmedAt).toLocaleString('vi-VN')
                                : selectedSeatBookingInfo.bookedAt
                                ? new Date(selectedSeatBookingInfo.bookedAt).toLocaleString('vi-VN')
                                : 'Không có thông tin'
                              }
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  /* Empty State */
                  <div className="flex flex-col items-center justify-center p-6 rounded-lg" style={{ background: '#3B0A0A' }}>
                    <Info className="w-8 h-8 mb-3" style={{ color: '#6B8DB5' }} />
                    <div className="text-center">
                      <div className="text-sm font-medium mb-1" style={{ color: '#E5E7EB' }}>
                        Chưa chọn ghế
                      </div>
                      <div className="text-xs" style={{ color: '#9CA3AF' }}>
                        {selectedTool === ToolType.SELECT 
                          ? 'Hãy click vào ghế để xem thông tin'
                          : 'Chọn công cụ "Chọn" và click vào ghế'
                        }
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

        </div>
      </TooltipProvider>
    </motion.div>
  );
}
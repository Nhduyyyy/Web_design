import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout, Check, Grid, Users, Accessibility, Star, Building } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSeatLayoutStore } from '@/stores/seatLayoutStore';
import { generateSeat } from '../utils/seatGenerator';
import { SeatType } from '@/types/seat.types';

const templates = [
  {
    id: 'classic-theater',
    name: 'Rạp hát cổ điển',
    description: 'Bố trí rạp hát truyền thống với lối đi giữa',
    icon: Building,
    rows: 12,
    cols: 20,
    generate: () => {
      const seats = [];
      for (let row = 0; row < 12; row++) {
        for (let col = 0; col < 20; col++) {
          // Center aisle
          if (col === 9 || col === 10) continue;
          
          // VIP front rows
          const type = row < 3 ? SeatType.VIP : SeatType.STANDARD;
          seats.push(generateSeat(row, col, type));
        }
      }
      return seats;
    }
  },
  {
    id: 'modern-cinema',
    name: 'Rạp chiếu phim hiện đại',
    description: 'Bố trí rạp chiếu phim với ghế đôi ở hàng sau',
    icon: Grid,
    rows: 10,
    cols: 16,
    generate: () => {
      const seats = [];
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 16; col++) {
          // Side aisles
          if (col === 0 || col === 15) continue;
          
          // Couple seats in back rows
          const type = row >= 7 ? SeatType.COUPLE : SeatType.STANDARD;
          seats.push(generateSeat(row, col, type));
        }
      }
      return seats;
    }
  },
  {
    id: 'small-venue',
    name: 'Địa điểm nhỏ',
    description: 'Không gian thân mật với chỗ ngồi hỗn hợp',
    icon: Users,
    rows: 8,
    cols: 12,
    generate: () => {
      const seats = [];
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 12; col++) {
          // Wheelchair accessible seats on sides
          let type = SeatType.STANDARD;
          if (row === 7 && (col === 0 || col === 11)) {
            type = SeatType.WHEELCHAIR;
          } else if (row < 2) {
            type = SeatType.VIP;
          }
          seats.push(generateSeat(row, col, type));
        }
      }
      return seats;
    }
  },
  {
    id: 'amphitheater',
    name: 'Nhà hát vòng cung',
    description: 'Bố trí ghế ngồi cong',
    icon: Star,
    rows: 15,
    cols: 24,
    generate: () => {
      const seats = [];
      const centerCol = 12;
      for (let row = 0; row < 15; row++) {
        const rowWidth = Math.min(24, 12 + row);
        const startCol = Math.floor((24 - rowWidth) / 2);
        
        for (let col = startCol; col < startCol + rowWidth; col++) {
          // Center aisle
          if (col === centerCol - 1 || col === centerCol) continue;
          
          const type = row < 5 ? SeatType.VIP : SeatType.STANDARD;
          seats.push(generateSeat(row, col, type));
        }
      }
      return seats;
    }
  },
  {
    id: 'accessible-venue',
    name: 'Địa điểm tiếp cận',
    description: 'Bố trí tối ưu cho khả năng tiếp cận',
    icon: Accessibility,
    rows: 10,
    cols: 18,
    generate: () => {
      const seats = [];
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 18; col++) {
          // Wide aisles
          if (col === 5 || col === 6 || col === 11 || col === 12) continue;
          
          // Wheelchair seats distributed throughout
          let type = SeatType.STANDARD;
          if (row % 3 === 0 && (col === 0 || col === 17)) {
            type = SeatType.WHEELCHAIR;
          }
          seats.push(generateSeat(row, col, type));
        }
      }
      return seats;
    }
  },
  {
    id: 'empty',
    name: 'Bố trí trống',
    description: 'Bắt đầu từ đầu',
    icon: Layout,
    rows: 10,
    cols: 15,
    generate: () => []
  }
];

export default function TemplateSelector() {
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const { loadSeats, setRows, setCols, clearSeats } = useSeatLayoutStore();

  const handleApplyTemplate = (template) => {
    setSelectedTemplate(template.id);
    
    // Update grid size
    setRows(template.rows);
    setCols(template.cols);
    
    // Generate and load seats
    const seats = template.generate();
    clearSeats();
    loadSeats(seats);
    
    // Close dialog after a short delay
    setTimeout(() => {
      setOpen(false);
      setSelectedTemplate(null);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="bg-transparent border-[#432828] text-white hover:bg-[#2D1B1B] hover:border-[#D33131]">
          <Layout className="w-4 h-4 mr-2" />
          Mẫu có sẵn
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="max-w-4xl max-h-[85vh] overflow-hidden"
        style={{
          background: '#1A0F0F',
          border: '1px solid #432828',
          color: 'white',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
        }}
      >
        <div 
          className="absolute inset-0 -z-10"
          style={{
            background: '#1A0F0F',
            opacity: 0.98
          }}
        />
        <DialogHeader className="pb-4 border-b border-[#432828] relative z-10">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold" style={{ color: '#D33131' }}>
            <Layout className="w-6 h-6" />
            Mẫu bố trí
          </DialogTitle>
          <DialogDescription className="text-[#9CA3AF] mt-2">
            Chọn một mẫu có sẵn để bắt đầu nhanh chóng
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto relative z-10" style={{ maxHeight: 'calc(85vh - 120px)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
            <AnimatePresence>
              {templates.map((template, index) => {
                const IconComponent = template.icon;
                const isSelected = selectedTemplate === template.id;
                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className={`template-card cursor-pointer h-full transition-all duration-200 ${
                        isSelected ? 'selected' : ''
                      }`}
                      onClick={() => handleApplyTemplate(template)}
                      style={{
                        background: isSelected ? '#3D2525' : '#2D1B1B',
                        border: isSelected ? '1px solid #D33131' : '1px solid #432828',
                        boxShadow: isSelected ? '0 0 0 2px rgba(211, 49, 49, 0.2)' : 'none'
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-12 h-12 rounded-lg flex items-center justify-center"
                              style={{
                                background: isSelected ? '#D33131' : '#432828'
                              }}
                            >
                              <IconComponent className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <CardTitle className="template-title text-white text-base font-semibold">
                                {template.name}
                              </CardTitle>
                            </div>
                          </div>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-6 h-6 rounded-full bg-[#D33131] flex items-center justify-center"
                            >
                              <Check className="w-4 h-4 text-white" />
                            </motion.div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <CardDescription className="template-description text-[#9CA3AF] text-sm mb-4">
                          {template.description}
                        </CardDescription>
                        
                        <div className="template-meta flex items-center justify-between text-sm">
                          <span className="text-[#9CA3AF]">Kích thước:</span>
                          <span className="text-white font-medium">
                            {template.rows} hàng × {template.cols} cột
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

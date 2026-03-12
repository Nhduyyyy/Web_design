import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout, Check } from 'lucide-react';
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
        <Button variant="outline" size="sm">
          <Layout className="w-4 h-4 mr-2" />
          Mẫu có sẵn
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mẫu bố trí</DialogTitle>
          <DialogDescription>
            Chọn một mẫu có sẵn để bắt đầu nhanh chóng
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {templates.map((template) => (
            <motion.div
              key={template.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className={`cursor-pointer transition-all ${
                  selectedTemplate === template.id 
                    ? 'ring-2 ring-primary' 
                    : 'hover:border-primary'
                }`}
                onClick={() => handleApplyTemplate(template)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    {template.name}
                    {selectedTemplate === template.id && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {template.rows} hàng × {template.cols} cột
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Armchair, 
  Sofa, 
  Star, 
  Accessibility, 
  Minus, 
  Square,
  Trash2,
  MousePointer,
  Hand
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useSeatLayoutStore } from '@/stores/seatLayoutStore';
import { ToolType } from '@/types/seat.types';
import HistoryControls from './HistoryControls';

const tools = [
  { id: ToolType.SELECT, icon: MousePointer, label: 'Chọn (V)', color: 'text-gray-600' },
  { id: ToolType.PAN, icon: Hand, label: 'Di chuyển', color: 'text-gray-600' },
  { id: ToolType.STANDARD, icon: Armchair, label: 'Ghế thường (1)', color: 'text-theater-standard' },
  { id: ToolType.VIP, icon: Star, label: 'Ghế VIP (2)', color: 'text-theater-vip' },
  { id: ToolType.COUPLE, icon: Sofa, label: 'Ghế đôi (3)', color: 'text-theater-couple' },
  { id: ToolType.WHEELCHAIR, icon: Accessibility, label: 'Ghế xe lăn (4)', color: 'text-theater-wheelchair' },
  { id: ToolType.AISLE, icon: Minus, label: 'Lối đi (5)', color: 'text-gray-400' },
  { id: ToolType.STAGE, icon: Square, label: 'Khu vực sân khấu (6)', color: 'text-theater-stage' },
  { id: ToolType.DELETE, icon: Trash2, label: 'Xóa (D)', color: 'text-destructive' },
];

export default function SeatToolbar() {
  const { selectedTool, setSelectedTool } = useSeatLayoutStore();

  return (
    <motion.div 
      className="seat-toolbar"
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      <TooltipProvider>
        <div className="flex items-center gap-1">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = selectedTool === tool.id;
            
            return (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setSelectedTool(tool.id)}
                    className={`relative ${!isActive && tool.color}`}
                  >
                    <Icon className="w-5 h-5" />
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 border-2 border-primary rounded-md"
                        layoutId="activeToolBorder"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tool.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
          
          <Separator orientation="vertical" className="h-8 mx-2" />
          
          <HistoryControls />
        </div>
      </TooltipProvider>
    </motion.div>
  );
}

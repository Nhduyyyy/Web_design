import React from 'react';
import { motion } from 'framer-motion';
import { Undo2, Redo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSeatLayoutStore } from '@/stores/seatLayoutStore';

export default function HistoryControls() {
  const { undo, redo, canUndo, canRedo } = useSeatLayoutStore();

  return (
    <motion.div 
      className="history-controls flex justify-center gap-4 w-full"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="lg"
              onClick={undo}
              disabled={!canUndo()}
              className="flex flex-col items-center justify-center gap-2 w-24 h-16 rounded-xl transition-all duration-200"
              style={{
                background: canUndo() ? 'transparent' : 'transparent',
                border: `2px solid ${canUndo() ? '#7F1D1D' : '#4B1D1D'}`,
                color: canUndo() ? '#E5E7EB' : '#6B7280',
                opacity: canUndo() ? 1 : 0.5
              }}
              onMouseEnter={(e) => {
                if (canUndo()) {
                  e.target.style.background = '#3B0A0A';
                }
              }}
              onMouseLeave={(e) => {
                if (canUndo()) {
                  e.target.style.background = 'transparent';
                }
              }}
            >
              <Undo2 className="w-5 h-5" />
              <span className="text-xs font-medium">Hoàn tác</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent 
            side="top"
            style={{ 
              background: '#2B0707', 
              border: '1px solid #7F1D1D',
              color: '#E5E7EB'
            }}
          >
            <p>Hoàn tác (Ctrl+Z)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="lg"
              onClick={redo}
              disabled={!canRedo()}
              className="flex flex-col items-center justify-center gap-2 w-24 h-16 rounded-xl transition-all duration-200"
              style={{
                background: canRedo() ? 'transparent' : 'transparent',
                border: `2px solid ${canRedo() ? '#7F1D1D' : '#4B1D1D'}`,
                color: canRedo() ? '#E5E7EB' : '#6B7280',
                opacity: canRedo() ? 1 : 0.5
              }}
              onMouseEnter={(e) => {
                if (canRedo()) {
                  e.target.style.background = '#3B0A0A';
                }
              }}
              onMouseLeave={(e) => {
                if (canRedo()) {
                  e.target.style.background = 'transparent';
                }
              }}
            >
              <Redo2 className="w-5 h-5" />
              <span className="text-xs font-medium">Làm lại</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent 
            side="top"
            style={{ 
              background: '#2B0707', 
              border: '1px solid #7F1D1D',
              color: '#E5E7EB'
            }}
          >
            <p>Làm lại (Ctrl+Y)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  );
}

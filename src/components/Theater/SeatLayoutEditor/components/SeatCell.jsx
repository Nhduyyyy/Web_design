import React, { memo, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { useDraggable } from '@dnd-kit/core';
import { 
  Armchair, 
  Sofa, 
  Star, 
  Accessibility, 
  DoorOpen, 
  Square 
} from 'lucide-react';
import { useSeatLayoutStore } from '@/stores/seatLayoutStore';
import { SeatType, ToolType } from '@/types/seat.types';

const seatIcons = {
  [SeatType.STANDARD]: Armchair,
  [SeatType.VIP]: Star,
  [SeatType.COUPLE]: Sofa,
  [SeatType.WHEELCHAIR]: Accessibility,
  [SeatType.AISLE]: DoorOpen,
  [SeatType.STAGE]: Square,
};

const seatClasses = {
  [SeatType.STANDARD]: 'seat-standard',
  [SeatType.VIP]: 'seat-vip',
  [SeatType.COUPLE]: 'seat-couple',
  [SeatType.WHEELCHAIR]: 'seat-wheelchair',
  [SeatType.AISLE]: 'seat-aisle',
  [SeatType.STAGE]: 'seat-stage',
};

const seatBackgrounds = {
  [SeatType.STANDARD]: 'bg-gray-600',
  [SeatType.VIP]: 'bg-yellow-500',
  [SeatType.COUPLE]: 'bg-pink-600',
  [SeatType.WHEELCHAIR]: 'bg-blue-600',
  [SeatType.AISLE]: 'bg-gray-400',
  [SeatType.STAGE]: 'bg-red-700',
};

const SeatCell = forwardRef(({ seat }, ref) => {
  const { 
    selectedCells,
    selectedTool,
    selectCell,
    deselectCell,
    toggleCellSelection,
    clearSelection,
    removeSeat,
    cellSize 
  } = useSeatLayoutStore();

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: seat.id,
    disabled: selectedTool !== ToolType.SELECT
  });

  const isSelected = selectedCells.includes(seat.id);
  const Icon = seatIcons[seat.type] || Armchair;

  const handleClick = (e) => {
    e.stopPropagation();
    
    if (selectedTool !== ToolType.SELECT) return;
    
    if (e.shiftKey) {
      // Shift+Click: Add to selection
      toggleCellSelection(seat.id);
    } else if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd+Click: Toggle selection
      toggleCellSelection(seat.id);
    } else {
      // Regular click: Select only this seat
      clearSelection();
      selectCell(seat.id);
    }
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    removeSeat(seat.id);
  };

  return (
    <motion.div
      ref={(node) => {
        // Combine refs: one from forwardRef, one from dnd-kit
        setNodeRef(node);
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      {...(selectedTool === ToolType.SELECT ? listeners : {})}
      {...(selectedTool === ToolType.SELECT ? attributes : {})}
      className={`
        seat-cell absolute
        ${seatClasses[seat.type]}
        ${isSelected ? 'seat-selected' : ''}
        ${isDragging ? 'opacity-50 cursor-grabbing' : ''}
      `}
      style={{
        left: seat.col * cellSize,
        top: seat.row * cellSize,
        width: cellSize,
        height: cellSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `rotate(${seat.rotation}deg)`,
      }}
      initial={{ scale: 0, opacity: 0, rotate: -180 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        rotate: 0
      }}
      exit={{ 
        scale: 0, 
        opacity: 0,
        rotate: 180,
        transition: { duration: 0.2 }
      }}
      whileHover={{ 
        scale: 1.1,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 10
      }}
      whileTap={{ scale: 0.95 }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 25,
        mass: 0.5
      }}
      onClick={handleClick}
      onContextMenu={handleRightClick}
    >
      <div className={`flex flex-col items-center justify-center gap-0.5 p-1 rounded-lg text-white shadow-lg ${seatBackgrounds[seat.type] || 'bg-gray-600'}`}
           style={{ 
             width: cellSize - 8, 
             height: cellSize - 8,
             maxWidth: '100%',
             maxHeight: '100%'
           }}>
        <Icon className="w-4 h-4 flex-shrink-0 drop-shadow-sm" />
        {seat.type !== 'aisle' && (
          <span className="text-[10px] font-bold leading-none drop-shadow-sm">{seat.label}</span>
        )}
      </div>
    </motion.div>
  );
});

SeatCell.displayName = 'SeatCell';

// Wrap with memo for performance optimization
export default memo(SeatCell, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.seat.id === nextProps.seat.id &&
    prevProps.seat.type === nextProps.seat.type &&
    prevProps.seat.rotation === nextProps.seat.rotation &&
    prevProps.seat.label === nextProps.seat.label &&
    prevProps.seat.row === nextProps.seat.row &&
    prevProps.seat.col === nextProps.seat.col
  );
});

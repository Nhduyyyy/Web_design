import React, { useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useSeatLayoutStore } from '@/stores/seatLayoutStore';
import { ToolType, SeatType } from '@/types/seat.types';
import { generateSeat } from '../utils/seatGenerator';
import SeatGrid from './SeatGrid';
import SeatCell from './SeatCell';
import StageArea from './StageArea';
import ZoomControls from './ZoomControls';
import SeatPriceList from './SeatPriceList';

export default function SeatCanvas({ hall }) {
  const canvasRef = useRef(null);
  const [isPainting, setIsPainting] = useState(false);
  
  const {
    seats,
    selectedTool,
    zoom,
    panX,
    panY,
    rows,
    cols,
    cellSize,
    addSeat,
    removeSeat,
    moveSeat,
    setPan
  } = useSeatLayoutStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleCanvasClick = useCallback((e) => {
    if (selectedTool === ToolType.SELECT || selectedTool === ToolType.PAN) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - panX) / zoom;
    const y = (e.clientY - rect.top - panY) / zoom;
    
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);

    // Check bounds
    if (row < 0 || row >= rows || col < 0 || col >= cols) return;

    // Check if seat exists at this position
    const existingSeat = seats.find(s => s.row === row && s.col === col);

    if (selectedTool === ToolType.DELETE) {
      if (existingSeat) {
        removeSeat(existingSeat.id);
      }
    } else {
      if (!existingSeat) {
        const newSeat = generateSeat(row, col, selectedTool);
        addSeat(newSeat);
      }
    }
  }, [selectedTool, panX, panY, zoom, cellSize, rows, cols, seats, addSeat, removeSeat]);

  const handleMouseDown = useCallback((e) => {
    if (selectedTool !== ToolType.SELECT && selectedTool !== ToolType.PAN) {
      setIsPainting(true);
    }
  }, [selectedTool]);

  const handleMouseMove = useCallback((e) => {
    if (!isPainting) return;
    handleCanvasClick(e);
  }, [isPainting, handleCanvasClick]);

  const handleMouseUp = useCallback(() => {
    setIsPainting(false);
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    
    if (!over || !active) return;
    
    const seatId = active.id;
    const [newRow, newCol] = over.id.split('-').map(Number);
    
    if (!isNaN(newRow) && !isNaN(newCol)) {
      moveSeat(seatId, newRow, newCol);
    }
  }, [moveSeat]);

  const getCursorStyle = useMemo(() => {
    switch (selectedTool) {
      case ToolType.PAN:
        return 'cursor-grab active:cursor-grabbing';
      case ToolType.DELETE:
        return 'cursor-crosshair';
      case ToolType.SELECT:
        return 'cursor-default';
      default:
        return 'cursor-cell';
    }
  }, [selectedTool]);

  const canvasStyle = useMemo(() => ({
    width: cols * cellSize + 40, 
    height: rows * cellSize + 40,
    padding: '20px'
  }), [cols, rows, cellSize]);

  return (
    <div className="seat-canvas relative w-full h-full overflow-hidden" style={{ backgroundColor: '#1A0F0F' }}>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <motion.div
          ref={canvasRef}
          className={`absolute inset-0 ${getCursorStyle}`}
          animate={{
            scale: zoom,
            x: panX,
            y: panY
          }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 25,
            mass: 0.5
          }}
          style={{
            transformOrigin: '0 0',
            backgroundColor: '#1A0F0F'
          }}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="relative" style={canvasStyle}>
            <SeatGrid />
            <StageArea />
            
            <AnimatePresence mode="popLayout">
              {seats
                .filter(seat => seat.type !== SeatType.STAGE) // Ẩn các seat loại STAGE vì đã render trong StageArea
                .map((seat) => (
                  <SeatCell key={seat.id} seat={seat} />
                ))
              }
            </AnimatePresence>
          </div>
        </motion.div>
        
        <SeatPriceList 
          theaterId={hall?.theater_id} 
          hallId={hall?.id} 
        />
        <ZoomControls />
      </DndContext>
    </div>
  );
}

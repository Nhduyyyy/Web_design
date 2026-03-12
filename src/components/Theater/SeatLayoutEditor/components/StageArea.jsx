import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { useSeatLayoutStore } from '@/stores/seatLayoutStore';
import { SeatType } from '@/types/seat.types';

const StageArea = memo(() => {
  const { seats, cellSize } = useSeatLayoutStore();

  // Tìm tất cả ghế loại STAGE
  const stageSeats = seats.filter(seat => seat.type === SeatType.STAGE);
  
  if (stageSeats.length === 0) return null;

  // Nhóm các ghế STAGE liền kề thành các khu vực
  const stageAreas = groupAdjacentStageSeats(stageSeats);

  return (
    <>
      {stageAreas.map((area, index) => (
        <motion.div
          key={`stage-area-${index}`}
          className="absolute flex items-center justify-center"
          style={{
            left: area.minCol * cellSize,
            top: area.minRow * cellSize,
            width: (area.maxCol - area.minCol + 1) * cellSize,
            height: (area.maxRow - area.minRow + 1) * cellSize,
            background: 'linear-gradient(135deg, rgba(139, 0, 0, 0.3) 0%, rgba(165, 42, 42, 0.4) 50%, rgba(139, 0, 0, 0.3) 100%)',
            border: '3px solid #DC143C',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(139, 0, 0, 0.4), inset 0 2px 10px rgba(255, 255, 255, 0.1)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ 
            type: 'spring', 
            stiffness: 400, 
            damping: 25 
          }}
        >
          <div className="flex items-center justify-center text-white">
            <span 
              className="font-bold tracking-wider"
              style={{
                fontSize: Math.min((area.maxCol - area.minCol + 1) * cellSize * 0.08, 18),
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                letterSpacing: '2px'
              }}
            >
              SÂN KHẤU
            </span>
          </div>
        </motion.div>
      ))}
    </>
  );
});

// Hàm nhóm các ghế STAGE liền kề
function groupAdjacentStageSeats(stageSeats) {
  if (stageSeats.length === 0) return [];

  const areas = [];
  const processed = new Set();

  stageSeats.forEach(seat => {
    if (processed.has(seat.id)) return;

    // Tìm tất cả ghế liền kề với ghế này
    const area = findConnectedStageSeats(seat, stageSeats, processed);
    if (area.seats.length > 0) {
      areas.push({
        seats: area.seats,
        minRow: Math.min(...area.seats.map(s => s.row)),
        maxRow: Math.max(...area.seats.map(s => s.row)),
        minCol: Math.min(...area.seats.map(s => s.col)),
        maxCol: Math.max(...area.seats.map(s => s.col))
      });
    }
  });

  return areas;
}

// Tìm tất cả ghế STAGE liền kề với ghế cho trước
function findConnectedStageSeats(startSeat, allStageSeats, processed) {
  const connected = [];
  const queue = [startSeat];
  const visited = new Set();

  while (queue.length > 0) {
    const current = queue.shift();
    
    if (visited.has(current.id) || processed.has(current.id)) continue;
    
    visited.add(current.id);
    processed.add(current.id);
    connected.push(current);

    // Tìm các ghế liền kề (4 hướng: trên, dưới, trái, phải)
    const neighbors = allStageSeats.filter(seat => {
      if (visited.has(seat.id) || processed.has(seat.id)) return false;
      
      const rowDiff = Math.abs(seat.row - current.row);
      const colDiff = Math.abs(seat.col - current.col);
      
      // Liền kề nếu cách nhau 1 ô theo chiều ngang hoặc dọc (không chéo)
      return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    });

    queue.push(...neighbors);
  }

  return { seats: connected };
}

StageArea.displayName = 'StageArea';

export default StageArea;
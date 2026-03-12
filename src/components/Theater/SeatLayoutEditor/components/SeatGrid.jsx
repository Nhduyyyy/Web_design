import React, { memo } from 'react';
import { useSeatLayoutStore } from '@/stores/seatLayoutStore';

const SeatGrid = memo(() => {
  const { rows, cols, cellSize, showGrid } = useSeatLayoutStore();

  if (!showGrid) return null;

  const width = cols * cellSize;
  const height = rows * cellSize;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    >
      {/* Grid dots at intersection points */}
      {Array.from({ length: rows + 1 }).map((_, row) =>
        Array.from({ length: cols + 1 }).map((_, col) => (
          <circle
            key={`dot-${row}-${col}`}
            cx={col * cellSize}
            cy={row * cellSize}
            r="1.5"
            className="fill-white"
          />
        ))
      )}
      
      {/* Row labels */}
      {Array.from({ length: rows }).map((_, i) => (
        <text
          key={`row-${i}`}
          x={-10}
          y={i * cellSize + cellSize / 2}
          className="text-xs fill-muted-foreground"
          textAnchor="end"
          dominantBaseline="middle"
        >
          {String.fromCharCode(65 + i)}
        </text>
      ))}
      
      {/* Column labels */}
      {Array.from({ length: cols }).map((_, i) => (
        <text
          key={`col-${i}`}
          x={i * cellSize + cellSize / 2}
          y={-10}
          className="text-xs fill-muted-foreground"
          textAnchor="middle"
        >
          {i + 1}
        </text>
      ))}
    </svg>
  );
});

SeatGrid.displayName = 'SeatGrid';

export default SeatGrid;

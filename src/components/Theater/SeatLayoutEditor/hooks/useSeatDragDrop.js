import { useState } from 'react';

export function useSeatDragDrop() {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return { isDragging, handleDragStart, handleDragEnd };
}

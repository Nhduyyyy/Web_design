import { useState } from 'react';

export function useSeatSelection() {
  const [selectedSeats, setSelectedSeats] = useState([]);

  const selectSeat = (seatId) => {
    setSelectedSeats(prev => [...prev, seatId]);
  };

  const deselectSeat = (seatId) => {
    setSelectedSeats(prev => prev.filter(id => id !== seatId));
  };

  const clearSelection = () => {
    setSelectedSeats([]);
  };

  return { selectedSeats, selectSeat, deselectSeat, clearSelection };
}

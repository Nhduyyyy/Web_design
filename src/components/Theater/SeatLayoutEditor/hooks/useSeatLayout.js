import { useState, useEffect } from 'react';

export function useSeatLayout(hallId) {
  const [layout, setLayout] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load layout logic here
    setLoading(false);
  }, [hallId]);

  return { layout, loading, setLayout };
}

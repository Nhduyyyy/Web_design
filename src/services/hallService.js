import { supabase } from '../lib/supabase'

// ============================================
// FLOOR SERVICE
// ============================================

export const createFloor = async (floorData) => {
  const { data, error } = await supabase
    .from('floors')
    .insert(floorData)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getFloorsByTheater = async (theaterId) => {
  const { data, error } = await supabase
    .from('floors')
    .select('*')
    .eq('theater_id', theaterId)
    .order('floor_number')

  if (error) throw error
  return data
}

export const getFloorsByVenue = async (venueId) => {
  const { data, error } = await supabase
    .from('floors')
    .select('*')
    .eq('venue_id', venueId)
    .order('floor_number')

  if (error) throw error
  return data
}

export const updateFloor = async (floorId, updates) => {
  const { data, error } = await supabase
    .from('floors')
    .update(updates)
    .eq('id', floorId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteFloor = async (floorId) => {
  const { error } = await supabase
    .from('floors')
    .delete()
    .eq('id', floorId)

  if (error) throw error
}

// ============================================
// HALL SERVICE
// ============================================

export const createHall = async (hallData) => {
  const { data, error } = await supabase
    .from('halls')
    .insert(hallData)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getHallsByFloor = async (floorId) => {
  const { data, error } = await supabase
    .from('halls')
    .select('*')
    .eq('floor_id', floorId)
    .order('name')

  if (error) throw error
  return data
}

export const getHallsByTheater = async (theaterId) => {
  const { data, error } = await supabase
    .from('halls')
    .select(`
      *,
      floor:floors(*)
    `)
    .eq('theater_id', theaterId)
    .order('name')

  if (error) throw error
  return data
}

export const getHallsByVenue = async (venueId) => {
  const { data, error } = await supabase
    .from('halls')
    .select(`
      *,
      floor:floors(*)
    `)
    .eq('venue_id', venueId)
    .order('name')

  if (error) throw error
  return data
}

export const getHallById = async (hallId) => {
  const { data, error } = await supabase
    .from('halls')
    .select(`
      *,
      floor:floors(*)
    `)
    .eq('id', hallId)
    .single()

  if (error) throw error
  return data
}

export const updateHall = async (hallId, updates) => {
  const { data, error } = await supabase
    .from('halls')
    .update(updates)
    .eq('id', hallId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteHall = async (hallId) => {
  const { error } = await supabase
    .from('halls')
    .delete()
    .eq('id', hallId)

  if (error) throw error
}

// ============================================
// SEAT SERVICE
// ============================================

export const createSeats = async (seatsData) => {
  const { data, error } = await supabase
    .from('seats')
    .insert(seatsData)
    .select()

  if (error) throw error
  return data
}

export const getSeatsByHall = async (hallId) => {
  const { data, error } = await supabase
    .from('seats')
    .select('*')
    .eq('hall_id', hallId)
    .order('row_number')
    .order('seat_number')

  if (error) throw error
  return data
}

export const updateSeat = async (seatId, updates) => {
  const { data, error } = await supabase
    .from('seats')
    .update(updates)
    .eq('id', seatId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteSeat = async (seatId) => {
  const { error } = await supabase
    .from('seats')
    .delete()
    .eq('id', seatId)

  if (error) throw error
}

// Generate seats automatically
export const generateSeats = async (hallId, totalRows, seatsPerRow, seatType = 'standard') => {
  const seats = []
  
  for (let row = 1; row <= totalRows; row++) {
    for (let seat = 1; seat <= seatsPerRow; seat++) {
      seats.push({
        hall_id: hallId,
        row_number: row,
        seat_number: seat,
        seat_type: seatType,
        is_active: true
      })
    }
  }

  return createSeats(seats)
}

// ============================================
// SEAT LAYOUT SERVICE
// ============================================

/**
 * Save seat layout to database
 * Deletes existing seats and creates new ones
 */
export const saveSeatLayout = async (hallId, layoutData) => {
  try {
    // Start transaction by deleting existing seats
    const { error: deleteError } = await supabase
      .from('seats')
      .delete()
      .eq('hall_id', hallId);

    if (deleteError) throw deleteError;

    // If no seats to save, just update capacity and return
    if (!layoutData.seats || layoutData.seats.length === 0) {
      await updateHall(hallId, { capacity: 0 });
      return { success: true, count: 0 };
    }

    // Transform seats data for database
    const seatsToInsert = layoutData.seats.map(seat => ({
      hall_id: hallId,
      row_number: seat.row + 1, // Convert 0-based to 1-based
      seat_number: seat.col + 1, // Convert 0-based to 1-based
      seat_label: seat.label,
      seat_type: seat.type,
      rotation: seat.rotation || 0,
      is_active: true,
      status: seat.status || 'available'
    }));

    // Batch insert seats
    const { data, error: insertError } = await supabase
      .from('seats')
      .insert(seatsToInsert)
      .select();

    if (insertError) throw insertError;

    // Update hall capacity
    await updateHall(hallId, { capacity: seatsToInsert.length });

    return { success: true, count: data.length, seats: data };
  } catch (error) {
    console.error('Error saving seat layout:', error);
    throw error;
  }
};

/**
 * Load seat layout from database
 */
export const loadSeatLayout = async (hallId) => {
  try {
    const { data: seats, error } = await supabase
      .from('seats')
      .select('*')
      .eq('hall_id', hallId)
      .order('row_number')
      .order('seat_number');

    if (error) throw error;

    // Transform database seats to layout format
    const layoutSeats = seats.map(seat => ({
      id: `seat-${seat.id}`,
      row: seat.row_number - 1, // Convert 1-based to 0-based
      col: seat.seat_number - 1, // Convert 1-based to 0-based
      label: seat.seat_label,
      type: seat.seat_type,
      rotation: seat.rotation || 0,
      status: seat.status || 'available'
    }));

    // Calculate statistics
    const stats = {
      total: layoutSeats.length,
      byType: {}
    };

    layoutSeats.forEach(seat => {
      stats.byType[seat.type] = (stats.byType[seat.type] || 0) + 1;
    });

    return {
      seats: layoutSeats,
      statistics: stats
    };
  } catch (error) {
    console.error('Error loading seat layout:', error);
    throw error;
  }
};

/**
 * Export layout to JSON
 */
export const exportLayoutToJSON = (layout, hallId, hallName) => {
  const exportData = {
    version: '1.0',
    hallId,
    hallName,
    exportedAt: new Date().toISOString(),
    layout: {
      rows: layout.rows,
      cols: layout.cols,
      cellSize: layout.cellSize,
      seats: layout.seats
    }
  };

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `seat-layout-${hallId}-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);

  return exportData;
};

/**
 * Import layout from JSON file
 */
export const importLayoutFromJSON = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Validate structure
        if (!data.layout || !data.layout.seats) {
          reject(new Error('Invalid layout file structure'));
          return;
        }

        resolve(data.layout);
      } catch (error) {
        reject(new Error('Failed to parse JSON file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};

/**
 * Delete all seats for a hall
 */
export const clearSeatLayout = async (hallId) => {
  try {
    const { error } = await supabase
      .from('seats')
      .delete()
      .eq('hall_id', hallId);

    if (error) throw error;

    // Update hall capacity to 0
    await updateHall(hallId, { capacity: 0 });

    return { success: true };
  } catch (error) {
    console.error('Error clearing seat layout:', error);
    throw error;
  }
};

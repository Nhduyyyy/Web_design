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

// ============================================
// ENHANCED SEAT LAYOUT SERVICE (Phase 2)
// ============================================

/**
 * Get layout configuration
 */
export const getLayoutConfig = async (hallId) => {
  console.log('🔍 [getLayoutConfig] Starting fetch for hallId:', hallId);
  
  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  console.log('🔐 [getLayoutConfig] Auth session:', session ? 'Authenticated' : 'Not authenticated');
  console.log('🔐 [getLayoutConfig] User ID:', session?.user?.id);
  
  // Don't use .single() to avoid 406 error when no data exists
  const { data, error } = await supabase
    .from('seat_layout_configs')
    .select('*')
    .eq('hall_id', hallId)
    .maybeSingle(); // Use maybeSingle() instead of single()
  
  console.log('📊 [getLayoutConfig] Response:', { data, error });
  
  if (error) {
    console.error('❌ [getLayoutConfig] Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      status: error.status
    });
    throw error;
  }
  
  // Return default config if not found
  if (!data) {
    const defaultConfig = {
      rows: 10,
      cols: 15,
      cellSize: 40,
      showGrid: true,
      labelType: 'letters'
    };
    console.log('✅ [getLayoutConfig] Returning default config:', defaultConfig);
    return defaultConfig;
  }
  
  // Convert snake_case to camelCase for JavaScript
  const result = {
    rows: data.rows,
    cols: data.cols,
    cellSize: data.cell_size, // Convert cell_size to cellSize
    showGrid: data.show_grid, // Convert show_grid to showGrid
    labelType: data.label_type, // Convert label_type to labelType
    canvasWidth: data.canvas_width,
    canvasHeight: data.canvas_height,
    settings: data.settings || {}
  };
  
  console.log('✅ [getLayoutConfig] Returning:', result);
  return result;
};

/**
 * Save layout configuration
 */
export const saveLayoutConfig = async (hallId, config) => {
  // Convert camelCase to snake_case for database
  const dbConfig = {
    hall_id: hallId,
    rows: config.rows,
    cols: config.cols,
    cell_size: config.cellSize, // Convert cellSize to cell_size
    show_grid: config.showGrid, // Convert showGrid to show_grid
    label_type: config.labelType, // Convert labelType to label_type
    canvas_width: config.canvasWidth,
    canvas_height: config.canvasHeight,
    settings: config.settings || {},
    updated_at: new Date().toISOString()
  };
  
  // Use upsert with onConflict to specify the unique constraint
  const { data, error } = await supabase
    .from('seat_layout_configs')
    .upsert(dbConfig, {
      onConflict: 'hall_id' // Specify the unique constraint column
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Save complete seat layout with metadata
 * @param {string} hallId - Hall UUID
 * @param {object} layoutData - Complete layout data from store
 * @param {object} options - Save options (createVersion, description)
 */
export const saveSeatLayoutComplete = async (hallId, layoutData, options = {}) => {
  try {
    const { createVersion = false, description = '' } = options;
    
    // 1. Save/update layout config
    if (layoutData.config) {
      await saveLayoutConfig(hallId, layoutData.config);
    }
    
    // 2. Delete existing seats
    const { error: deleteError } = await supabase
      .from('seats')
      .delete()
      .eq('hall_id', hallId);

    if (deleteError) throw deleteError;

    // 3. If no seats to save, just update capacity and return
    if (!layoutData.seats || layoutData.seats.length === 0) {
      await updateHall(hallId, { capacity: 0 });
      return { success: true, count: 0 };
    }

    // 4. Transform seats data for database
    const seatsToInsert = layoutData.seats.map(seat => ({
      hall_id: hallId,
      row_number: seat.row + 1, // Convert 0-based to 1-based
      seat_number: seat.col + 1, // Convert 0-based to 1-based
      seat_label: seat.label,
      seat_type: seat.type, // Use seat type directly now that all types are supported
      rotation: seat.rotation || 0,
      zone_id: seat.zoneId || null,
      position_x: seat.col,
      position_y: seat.row,
      status: seat.status || 'available',
      is_active: true
    }));

    // 5. Batch insert seats
    const { data, error: insertError } = await supabase
      .from('seats')
      .insert(seatsToInsert)
      .select();

    if (insertError) throw insertError;

    // 6. Update hall capacity
    await updateHall(hallId, { capacity: seatsToInsert.length });

    // 7. Create version if requested
    if (createVersion) {
      await createLayoutVersion(hallId, layoutData, description);
    }

    return { success: true, count: data.length, seats: data };
  } catch (error) {
    console.error('Error saving complete layout:', error);
    throw error;
  }
};

/**
 * Load complete seat layout with metadata
 * @param {string} hallId - Hall UUID
 * @param {number} versionNumber - Optional version to load
 */
export const loadSeatLayoutComplete = async (hallId, versionNumber = null) => {
  try {
    // 1. Load layout config
    const config = await getLayoutConfig(hallId);
    
    // 2. Load seats (from version or current)
    let seats;
    if (versionNumber) {
      const versionData = await loadLayoutVersion(hallId, versionNumber);
      seats = versionData.seats || [];
    } else {
      const { data, error } = await supabase
        .from('seats')
        .select('*')
        .eq('hall_id', hallId)
        .order('row_number')
        .order('seat_number');

      if (error) throw error;
      
      // Transform database seats to layout format
      seats = data.map(seat => ({
        id: `seat-${seat.id}`,
        row: seat.row_number - 1,
        col: seat.seat_number - 1,
        label: seat.seat_label,
        type: seat.seat_type,
        rotation: seat.rotation || 0,
        zoneId: seat.zone_id,
        status: seat.status || 'available'
      }));
    }
    
    // 3. Load zones
    const zones = await getZonesByHall(hallId);
    
    // 4. Calculate statistics
    const statistics = {
      total: seats.length,
      byType: {}
    };
    
    seats.forEach(seat => {
      statistics.byType[seat.type] = (statistics.byType[seat.type] || 0) + 1;
    });
    
    return {
      config,
      seats,
      zones,
      statistics,
      version: versionNumber
    };
  } catch (error) {
    console.error('Error loading complete layout:', error);
    throw error;
  }
};

// ============================================
// ZONE MANAGEMENT SERVICE
// ============================================

/**
 * Create a new zone
 */
export const createZone = async (hallId, zoneData) => {
  const { data, error } = await supabase
    .from('seat_zones')
    .insert({
      hall_id: hallId,
      ...zoneData
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Get all zones for a hall
 */
export const getZonesByHall = async (hallId) => {
  const { data, error } = await supabase
    .from('seat_zones')
    .select('*')
    .eq('hall_id', hallId)
    .eq('is_active', true)
    .order('display_order');
  
  if (error) throw error;
  return data || [];
};

/**
 * Update zone
 */
export const updateZone = async (zoneId, updates) => {
  const { data, error } = await supabase
    .from('seat_zones')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', zoneId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Delete zone
 */
export const deleteZone = async (zoneId) => {
  // First, remove zone_id from all seats
  await supabase
    .from('seats')
    .update({ zone_id: null })
    .eq('zone_id', zoneId);
  
  // Then delete zone
  const { error } = await supabase
    .from('seat_zones')
    .delete()
    .eq('id', zoneId);
  
  if (error) throw error;
};

/**
 * Assign seats to zone
 */
export const assignSeatsToZone = async (seatIds, zoneId) => {
  const { error } = await supabase
    .from('seats')
    .update({ zone_id: zoneId })
    .in('id', seatIds);
  
  if (error) throw error;
};

// ============================================
// VERSION MANAGEMENT SERVICE
// ============================================

/**
 * Create a new version of the layout
 */
export const createLayoutVersion = async (hallId, layoutData, description = '') => {
  try {
    // Get current max version number
    const { data: versions } = await supabase
      .from('seat_layout_versions')
      .select('version_number')
      .eq('hall_id', hallId)
      .order('version_number', { ascending: false })
      .limit(1);
    
    const nextVersion = versions && versions.length > 0 
      ? versions[0].version_number + 1 
      : 1;
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Create new version
    const { data, error } = await supabase
      .from('seat_layout_versions')
      .insert({
        hall_id: hallId,
        version_number: nextVersion,
        layout_data: layoutData,
        config_data: layoutData.config || null,
        description,
        created_by: user?.id
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating layout version:', error);
    throw error;
  }
};

/**
 * Get all versions for a hall
 */
export const getLayoutVersions = async (hallId) => {
  const { data, error } = await supabase
    .from('seat_layout_versions')
    .select(`
      *,
      creator:profiles(full_name, email)
    `)
    .eq('hall_id', hallId)
    .order('version_number', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

/**
 * Load a specific version
 */
export const loadLayoutVersion = async (hallId, versionNumber) => {
  const { data, error } = await supabase
    .from('seat_layout_versions')
    .select('*')
    .eq('hall_id', hallId)
    .eq('version_number', versionNumber)
    .single();
  
  if (error) throw error;
  return data.layout_data;
};

/**
 * Restore a version (make it current)
 */
export const restoreLayoutVersion = async (hallId, versionNumber) => {
  try {
    // Load the version
    const versionData = await loadLayoutVersion(hallId, versionNumber);
    
    // Save as current layout
    await saveSeatLayoutComplete(hallId, versionData, {
      createVersion: true,
      description: `Restored from version ${versionNumber}`
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error restoring version:', error);
    throw error;
  }
};

/**
 * Delete a version
 */
export const deleteLayoutVersion = async (hallId, versionNumber) => {
  const { error } = await supabase
    .from('seat_layout_versions')
    .delete()
    .eq('hall_id', hallId)
    .eq('version_number', versionNumber);
  
  if (error) throw error;
};

// ============================================
// TEMPLATE MANAGEMENT SERVICE
// ============================================

/**
 * Get all public templates
 */
export const getPublicTemplates = async (category = null) => {
  let query = supabase
    .from('seat_layout_templates')
    .select('*')
    .eq('is_public', true)
    .order('usage_count', { ascending: false });
  
  if (category) {
    query = query.eq('category', category);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

/**
 * Create a template from current layout
 */
export const createTemplate = async (templateData) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('seat_layout_templates')
    .insert({
      ...templateData,
      created_by: user?.id
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Apply template to hall
 */
export const applyTemplate = async (hallId, templateId) => {
  try {
    // Load template
    const { data: template, error } = await supabase
      .from('seat_layout_templates')
      .select('*')
      .eq('id', templateId)
      .single();
    
    if (error) throw error;
    
    // Increment usage count
    await supabase
      .from('seat_layout_templates')
      .update({ usage_count: template.usage_count + 1 })
      .eq('id', templateId);
    
    // Apply to hall
    await saveSeatLayoutComplete(hallId, template.layout_data, {
      createVersion: true,
      description: `Applied template: ${template.name}`
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error applying template:', error);
    throw error;
  }
};

// ============================================
// PERFORMANCE OPTIMIZATION
// ============================================

/**
 * Batch insert seats with optimized query
 */
export const batchInsertSeats = async (hallId, seats, batchSize = 100) => {
  try {
    const results = [];
    
    // Split into batches
    for (let i = 0; i < seats.length; i += batchSize) {
      const batch = seats.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('seats')
        .insert(batch)
        .select();
      
      if (error) throw error;
      results.push(...data);
    }
    
    return results;
  } catch (error) {
    console.error('Batch insert failed:', error);
    throw error;
  }
};

/**
 * Optimized load with pagination
 */
export const loadSeatsOptimized = async (hallId, options = {}) => {
  const { limit = 1000, offset = 0 } = options;
  
  const { data, error, count } = await supabase
    .from('seats')
    .select('*', { count: 'exact' })
    .eq('hall_id', hallId)
    .order('row_number')
    .order('seat_number')
    .range(offset, offset + limit - 1);
  
  if (error) throw error;
  
  return {
    seats: data,
    total: count,
    hasMore: count > offset + limit
  };
};

// Simple in-memory cache
const layoutCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Load layout with caching
 */
export const loadSeatLayoutCached = async (hallId, forceRefresh = false) => {
  const cacheKey = `layout-${hallId}`;
  
  // Check cache
  if (!forceRefresh && layoutCache.has(cacheKey)) {
    const cached = layoutCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }
  
  // Load from database
  const data = await loadSeatLayoutComplete(hallId);
  
  // Update cache
  layoutCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  
  return data;
};

/**
 * Invalidate cache
 */
export const invalidateLayoutCache = (hallId) => {
  const cacheKey = `layout-${hallId}`;
  layoutCache.delete(cacheKey);
};

/**
 * Clear all cache
 */
export const clearLayoutCache = () => {
  layoutCache.clear();
};

# Seat Layout Persistence - Implementation Tasks

## 📋 Tổng quan

Tài liệu này cung cấp roadmap chi tiết để hoàn thiện hệ thống lưu trữ và quản lý cấu hình ghế (seat layout) đã được đặt trong canvas vào database Supabase.

**Mục tiêu chính:**
1. Lưu trữ vị trí chính xác của từng ghế trong canvas
2. Lưu trữ metadata của layout (grid size, cell size, zones)
3. Hỗ trợ versioning và history
4. Tối ưu performance khi load/save large layouts
5. Đảm bảo data integrity và validation

**Thời gian ước tính:** 4-6 giờ  
**Độ khó:** Intermediate-Advanced  
**Tech Stack:** Supabase, PostgreSQL, React, Zustand

---

## 🔍 Phân tích hệ thống hiện tại

### ✅ Đã có (Completed)
- ✅ Zustand store với state management hoàn chỉnh
- ✅ Canvas rendering với drag & drop
- ✅ Basic save/load functions trong hallService.js
- ✅ Seat types và properties
- ✅ Export/Import JSON functionality

### ❌ Thiếu sót (Missing)
- ❌ Không lưu metadata của layout (grid config, zones)
- ❌ Không có versioning/history trong database
- ❌ Không có validation trước khi save
- ❌ Không có conflict resolution
- ❌ Không có auto-save functionality
- ❌ Không có layout templates trong database
- ❌ Performance chưa tối ưu cho large layouts (1000+ seats)

---

## 📊 Database Schema Analysis

### Current Schema (seats table)
```sql
CREATE TABLE public.seats (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  hall_id uuid NOT NULL REFERENCES halls(id),
  row_number integer NOT NULL CHECK (row_number > 0),
  seat_number integer NOT NULL CHECK (seat_number > 0),
  seat_type seat_type NOT NULL DEFAULT 'standard',
  is_wheelchair_accessible boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);
```


### Issues với current schema:
1. ❌ Không có field `seat_label` (A1, B2, etc.)
2. ❌ Không có field `rotation` (0, 90, 180, 270)
3. ❌ Không có field `status` (available, booked, blocked)
4. ❌ Không có field `zone_id` (for pricing zones)
5. ❌ Không có field `position_x`, `position_y` (canvas coordinates)
6. ❌ Không có table để lưu layout metadata
7. ❌ Không có table để lưu layout versions/history

---

## 🎯 Phase 1: Database Schema Enhancement (1 giờ)

### Task 1.1: Alter seats table
**File:** `supabase/migrations/add_seat_layout_fields.sql`

**SQL cần chạy:**
```sql
-- Add missing fields to seats table
ALTER TABLE public.seats
ADD COLUMN IF NOT EXISTS seat_label text,
ADD COLUMN IF NOT EXISTS rotation integer DEFAULT 0 CHECK (rotation IN (0, 90, 180, 270)),
ADD COLUMN IF NOT EXISTS status text DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked', 'maintenance')),
ADD COLUMN IF NOT EXISTS zone_id uuid REFERENCES seat_zones(id),
ADD COLUMN IF NOT EXISTS position_x numeric,
ADD COLUMN IF NOT EXISTS position_y numeric,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_seats_hall_id ON seats(hall_id);
CREATE INDEX IF NOT EXISTS idx_seats_position ON seats(hall_id, row_number, seat_number);
CREATE INDEX IF NOT EXISTS idx_seats_status ON seats(status) WHERE status != 'available';
```

**Checklist:**
- [ ] Tạo migration file
- [ ] Test migration trên local database
- [ ] Verify không break existing data
- [ ] Update RLS policies nếu cần

### Task 1.2: Create seat_layout_configs table
**Purpose:** Lưu metadata của layout (grid size, cell size, settings)

```sql
CREATE TABLE public.seat_layout_configs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  hall_id uuid NOT NULL UNIQUE REFERENCES halls(id) ON DELETE CASCADE,
  rows integer NOT NULL DEFAULT 10 CHECK (rows > 0 AND rows <= 50),
  cols integer NOT NULL DEFAULT 15 CHECK (cols > 0 AND cols <= 50),
  cell_size integer NOT NULL DEFAULT 40 CHECK (cell_size >= 20 AND cell_size <= 100),
  show_grid boolean DEFAULT true,
  label_type text DEFAULT 'letters' CHECK (label_type IN ('letters', 'numbers', 'custom')),
  canvas_width numeric,
  canvas_height numeric,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS policies
ALTER TABLE seat_layout_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Theater owners can manage their layout configs"
  ON seat_layout_configs
  FOR ALL
  USING (
    hall_id IN (
      SELECT h.id FROM halls h
      JOIN theaters t ON h.theater_id = t.id
      WHERE t.owner_id = auth.uid()
    )
  );
```

**Checklist:**
- [ ] Tạo table
- [ ] Setup RLS policies
- [ ] Test CRUD operations
- [ ] Add indexes


### Task 1.3: Create seat_zones table
**Purpose:** Định nghĩa các zones trong rạp (VIP zone, Regular zone, etc.)

```sql
CREATE TABLE public.seat_zones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  hall_id uuid NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text DEFAULT '#3b82f6',
  price_multiplier numeric DEFAULT 1.0 CHECK (price_multiplier >= 0),
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(hall_id, name)
);

-- RLS policies
ALTER TABLE seat_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Theater owners can manage their zones"
  ON seat_zones
  FOR ALL
  USING (
    hall_id IN (
      SELECT h.id FROM halls h
      JOIN theaters t ON h.theater_id = t.id
      WHERE t.owner_id = auth.uid()
    )
  );

-- Index
CREATE INDEX idx_seat_zones_hall_id ON seat_zones(hall_id);
```

**Checklist:**
- [ ] Tạo table
- [ ] Setup RLS policies
- [ ] Test zone creation
- [ ] Integrate với UI

### Task 1.4: Create seat_layout_versions table
**Purpose:** Version control cho layouts (undo/redo history trong database)

```sql
CREATE TABLE public.seat_layout_versions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  hall_id uuid NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  layout_data jsonb NOT NULL,
  config_data jsonb,
  created_by uuid REFERENCES profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  description text,
  is_published boolean DEFAULT false,
  UNIQUE(hall_id, version_number)
);

-- RLS policies
ALTER TABLE seat_layout_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Theater owners can manage their layout versions"
  ON seat_layout_versions
  FOR ALL
  USING (
    hall_id IN (
      SELECT h.id FROM halls h
      JOIN theaters t ON h.theater_id = t.id
      WHERE t.owner_id = auth.uid()
    )
  );

-- Index
CREATE INDEX idx_layout_versions_hall_id ON seat_layout_versions(hall_id, version_number DESC);
```

**Checklist:**
- [ ] Tạo table
- [ ] Setup RLS policies
- [ ] Test versioning
- [ ] Add restore functionality


### Task 1.5: Create seat_layout_templates table
**Purpose:** Lưu templates có sẵn để reuse

```sql
CREATE TABLE public.seat_layout_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  description text,
  thumbnail_url text,
  category text DEFAULT 'general',
  rows integer NOT NULL,
  cols integer NOT NULL,
  layout_data jsonb NOT NULL,
  config_data jsonb,
  usage_count integer DEFAULT 0,
  is_public boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS policies
ALTER TABLE seat_layout_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public templates"
  ON seat_layout_templates
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "Creators can manage their templates"
  ON seat_layout_templates
  FOR ALL
  USING (created_by = auth.uid());

-- Index
CREATE INDEX idx_templates_category ON seat_layout_templates(category);
CREATE INDEX idx_templates_public ON seat_layout_templates(is_public) WHERE is_public = true;
```

**Checklist:**
- [ ] Tạo table
- [ ] Setup RLS policies
- [ ] Seed sample templates
- [ ] Integrate với TemplateSelector component

---

## 🔧 Phase 2: Service Layer Enhancement (1.5 giờ)

### Task 2.1: Update hallService.js - Enhanced Save
**File:** `src/services/hallService.js`

**Features cần implement:**

```javascript
/**
 * Save complete seat layout with metadata
 * @param {string} hallId - Hall UUID
 * @param {object} layoutData - Complete layout data from store
 * @param {object} options - Save options (createVersion, description)
 */
export const saveSeatLayoutComplete = async (hallId, layoutData, options = {}) => {
  try {
    const { createVersion = false, description = '' } = options;
    
    // 1. Start transaction
    // 2. Save/update layout config
    // 3. Delete existing seats
    // 4. Batch insert new seats with all fields
    // 5. Update hall capacity
    // 6. Create version if requested
    // 7. Return result with statistics
    
    // Implementation here...
  } catch (error) {
    console.error('Error saving complete layout:', error);
    throw error;
  }
};
```

**Checklist:**
- [ ] Implement saveSeatLayoutComplete()
- [ ] Add transaction support
- [ ] Add validation before save
- [ ] Add error recovery
- [ ] Test với large layouts (500+ seats)


### Task 2.2: Update hallService.js - Enhanced Load
**File:** `src/services/hallService.js`

```javascript
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
    const seats = versionNumber 
      ? await loadLayoutVersion(hallId, versionNumber)
      : await getSeatsByHall(hallId);
    
    // 3. Load zones
    const zones = await getZonesByHall(hallId);
    
    // 4. Transform to store format
    // 5. Calculate statistics
    // 6. Return complete layout object
    
    return {
      config,
      seats: transformedSeats,
      zones,
      statistics,
      version: versionNumber
    };
  } catch (error) {
    console.error('Error loading complete layout:', error);
    throw error;
  }
};

/**
 * Get layout configuration
 */
export const getLayoutConfig = async (hallId) => {
  const { data, error } = await supabase
    .from('seat_layout_configs')
    .select('*')
    .eq('hall_id', hallId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  
  // Return default config if not found
  return data || {
    rows: 10,
    cols: 15,
    cellSize: 40,
    showGrid: true,
    labelType: 'letters'
  };
};

/**
 * Save layout configuration
 */
export const saveLayoutConfig = async (hallId, config) => {
  const { data, error } = await supabase
    .from('seat_layout_configs')
    .upsert({
      hall_id: hallId,
      ...config,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};
```

**Checklist:**
- [ ] Implement loadSeatLayoutComplete()
- [ ] Implement getLayoutConfig()
- [ ] Implement saveLayoutConfig()
- [ ] Add caching strategy
- [ ] Test load performance

### Task 2.3: Zone Management Functions
**File:** `src/services/hallService.js`

```javascript
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
```

**Checklist:**
- [ ] Implement all zone functions
- [ ] Add validation
- [ ] Test zone assignment
- [ ] Integrate với UI


### Task 2.4: Version Management Functions
**File:** `src/services/hallService.js`

```javascript
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
    
    // Create new version
    const { data, error } = await supabase
      .from('seat_layout_versions')
      .insert({
        hall_id: hallId,
        version_number: nextVersion,
        layout_data: layoutData,
        description,
        created_by: (await supabase.auth.getUser()).data.user?.id
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
```

**Checklist:**
- [ ] Implement all version functions
- [ ] Add version limit (keep last 50 versions)
- [ ] Add version comparison UI
- [ ] Test restore functionality


### Task 2.5: Template Management Functions
**File:** `src/services/hallService.js`

```javascript
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
  const { data, error } = await supabase
    .from('seat_layout_templates')
    .insert({
      ...templateData,
      created_by: (await supabase.auth.getUser()).data.user?.id
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
```

**Checklist:**
- [ ] Implement template functions
- [ ] Seed sample templates
- [ ] Add template preview
- [ ] Test template application

---

## 🎨 Phase 3: Store Enhancement (1 giờ)

### Task 3.1: Update seatLayoutStore.js
**File:** `src/stores/seatLayoutStore.js`

**Features cần thêm:**

```javascript
// Add to initial state
const initialState = {
  // ... existing state
  
  // Layout config
  config: {
    rows: 10,
    cols: 15,
    cellSize: 40,
    showGrid: true,
    labelType: 'letters'
  },
  
  // Zones
  zones: [],
  
  // Version info
  currentVersion: null,
  versions: [],
  
  // Auto-save
  isDirty: false,
  lastSaved: null,
  autoSaveEnabled: true,
  
  // Loading states
  isLoading: false,
  isSaving: false
};

// Add new actions
export const useSeatLayoutStore = create(
  immer((set, get) => ({
    ...initialState,
    
    // ... existing actions
    
    // Config actions
    setConfig: (config) => set({ config }),
    updateConfig: (updates) => set((state) => {
      Object.assign(state.config, updates);
      state.isDirty = true;
    }),
    
    // Zone actions
    addZone: (zone) => set((state) => {
      state.zones.push(zone);
      state.isDirty = true;
    }),
    
    updateZone: (zoneId, updates) => set((state) => {
      const zone = state.zones.find(z => z.id === zoneId);
      if (zone) {
        Object.assign(zone, updates);
        state.isDirty = true;
      }
    }),
    
    removeZone: (zoneId) => set((state) => {
      state.zones = state.zones.filter(z => z.id !== zoneId);
      // Remove zone from seats
      state.seats.forEach(seat => {
        if (seat.zoneId === zoneId) {
          seat.zoneId = null;
        }
      });
      state.isDirty = true;
    }),
    
    assignSeatsToZone: (seatIds, zoneId) => set((state) => {
      seatIds.forEach(seatId => {
        const seat = state.seats.find(s => s.id === seatId);
        if (seat) {
          seat.zoneId = zoneId;
        }
      });
      state.isDirty = true;
    }),
    
    // Version actions
    setCurrentVersion: (version) => set({ currentVersion: version }),
    setVersions: (versions) => set({ versions }),
    
    // Dirty state tracking
    markDirty: () => set({ isDirty: true }),
    markClean: () => set({ 
      isDirty: false, 
      lastSaved: new Date().toISOString() 
    }),
    
    // Loading states
    setLoading: (isLoading) => set({ isLoading }),
    setSaving: (isSaving) => set({ isSaving }),
    
    // Auto-save
    toggleAutoSave: () => set((state) => {
      state.autoSaveEnabled = !state.autoSaveEnabled;
    })
  }))
);
```

**Checklist:**
- [ ] Add new state fields
- [ ] Implement config actions
- [ ] Implement zone actions
- [ ] Implement version actions
- [ ] Add dirty state tracking
- [ ] Test all new actions


### Task 3.2: Add Validation Logic
**File:** `src/stores/seatLayoutStore.js`

```javascript
// Add validation functions
export const useSeatLayoutStore = create(
  immer((set, get) => ({
    // ... existing code
    
    // Validation
    validateLayout: () => {
      const state = get();
      const errors = [];
      
      // Check if seats are within bounds
      state.seats.forEach(seat => {
        if (seat.row < 0 || seat.row >= state.config.rows) {
          errors.push(`Seat ${seat.label} row out of bounds`);
        }
        if (seat.col < 0 || seat.col >= state.config.cols) {
          errors.push(`Seat ${seat.label} column out of bounds`);
        }
      });
      
      // Check for duplicate positions
      const positions = new Set();
      state.seats.forEach(seat => {
        const key = `${seat.row}-${seat.col}`;
        if (positions.has(key)) {
          errors.push(`Duplicate seat at position ${key}`);
        }
        positions.add(key);
      });
      
      // Check zone assignments
      state.seats.forEach(seat => {
        if (seat.zoneId && !state.zones.find(z => z.id === seat.zoneId)) {
          errors.push(`Seat ${seat.label} assigned to non-existent zone`);
        }
      });
      
      return {
        isValid: errors.length === 0,
        errors
      };
    },
    
    // Get layout data for saving
    getLayoutData: () => {
      const state = get();
      return {
        config: state.config,
        seats: state.seats.map(seat => ({
          row: seat.row,
          col: seat.col,
          label: seat.label,
          type: seat.type,
          rotation: seat.rotation || 0,
          zoneId: seat.zoneId || null,
          status: seat.status || 'available'
        })),
        zones: state.zones,
        statistics: state.getStatistics()
      };
    }
  }))
);
```

**Checklist:**
- [ ] Implement validateLayout()
- [ ] Implement getLayoutData()
- [ ] Add validation before save
- [ ] Show validation errors to user

---

## 🖥️ Phase 4: UI Components Enhancement (1 giờ)

### Task 4.1: Update SeatLayoutEditor.jsx
**File:** `src/components/Theater/SeatLayoutEditor/SeatLayoutEditor.jsx`

**Features cần thêm:**

```javascript
// Add to component
const [showVersionHistory, setShowVersionHistory] = useState(false);
const [showZoneManager, setShowZoneManager] = useState(false);
const [autoSaveInterval, setAutoSaveInterval] = useState(null);

const { 
  isDirty, 
  autoSaveEnabled, 
  validateLayout,
  getLayoutData,
  markClean 
} = useSeatLayoutStore();

// Auto-save functionality
useEffect(() => {
  if (autoSaveEnabled && isDirty) {
    const interval = setInterval(() => {
      handleAutoSave();
    }, 30000); // Auto-save every 30 seconds
    
    setAutoSaveInterval(interval);
    return () => clearInterval(interval);
  }
}, [autoSaveEnabled, isDirty]);

const handleAutoSave = async () => {
  if (!isDirty) return;
  
  try {
    const validation = validateLayout();
    if (!validation.isValid) {
      console.warn('Layout validation failed:', validation.errors);
      return;
    }
    
    const layoutData = getLayoutData();
    await saveSeatLayoutComplete(hallId, layoutData);
    markClean();
    
    toast.success('Auto-saved', { duration: 2000 });
  } catch (error) {
    console.error('Auto-save failed:', error);
  }
};

// Enhanced save with validation
const handleSave = async () => {
  try {
    setSaving(true);
    
    // Validate before save
    const validation = validateLayout();
    if (!validation.isValid) {
      toast.error('Validation failed');
      validation.errors.forEach(err => toast.error(err));
      return;
    }
    
    const layoutData = getLayoutData();
    
    // Save with version creation
    const result = await saveSeatLayoutComplete(hallId, layoutData, {
      createVersion: true,
      description: 'Manual save'
    });
    
    markClean();
    toast.success(`Layout saved! ${result.count} seats created.`);
  } catch (error) {
    console.error('Failed to save layout:', error);
    toast.error('Failed to save layout');
  } finally {
    setSaving(false);
  }
};
```

**Checklist:**
- [ ] Add auto-save functionality
- [ ] Add validation before save
- [ ] Add dirty state indicator
- [ ] Add version history button
- [ ] Add zone manager button
- [ ] Test auto-save


### Task 4.2: Create VersionHistoryModal Component
**File:** `src/components/Theater/SeatLayoutEditor/components/VersionHistoryModal.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, RotateCcw, Trash2 } from 'lucide-react';
import { getLayoutVersions, restoreLayoutVersion, deleteLayoutVersion } from '@/services/hallService';
import toast from 'react-hot-toast';

export default function VersionHistoryModal({ hallId, isOpen, onClose, onRestore }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen, hallId]);
  
  const loadVersions = async () => {
    try {
      setLoading(true);
      const data = await getLayoutVersions(hallId);
      setVersions(data);
    } catch (error) {
      console.error('Failed to load versions:', error);
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRestore = async (versionNumber) => {
    if (!confirm(`Restore version ${versionNumber}? Current layout will be saved as a new version.`)) {
      return;
    }
    
    try {
      await restoreLayoutVersion(hallId, versionNumber);
      toast.success('Version restored successfully');
      onRestore();
      onClose();
    } catch (error) {
      console.error('Failed to restore version:', error);
      toast.error('Failed to restore version');
    }
  };
  
  const handleDelete = async (versionNumber) => {
    if (!confirm(`Delete version ${versionNumber}? This cannot be undone.`)) {
      return;
    }
    
    try {
      await deleteLayoutVersion(hallId, versionNumber);
      toast.success('Version deleted');
      loadVersions();
    } catch (error) {
      console.error('Failed to delete version:', error);
      toast.error('Failed to delete version');
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No version history available
          </div>
        ) : (
          <div className="space-y-2">
            {versions.map((version) => (
              <div 
                key={version.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Version {version.version_number}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {version.description || 'No description'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(version.created_at).toLocaleString()} by {version.creator?.full_name || 'Unknown'}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRestore(version.version_number)}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Restore
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(version.version_number)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

**Checklist:**
- [ ] Create component
- [ ] Add to SeatLayoutEditor
- [ ] Test restore functionality
- [ ] Add version comparison (optional)


### Task 4.3: Create ZoneManagerModal Component
**File:** `src/components/Theater/SeatLayoutEditor/components/ZoneManagerModal.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useSeatLayoutStore } from '@/stores/seatLayoutStore';
import { createZone, updateZone, deleteZone } from '@/services/hallService';
import toast from 'react-hot-toast';

export default function ZoneManagerModal({ hallId, isOpen, onClose }) {
  const { zones, addZone, updateZone: updateStoreZone, removeZone } = useSeatLayoutStore();
  const [editingZone, setEditingZone] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    price_multiplier: 1.0
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingZone) {
        // Update existing zone
        const updated = await updateZone(editingZone.id, formData);
        updateStoreZone(editingZone.id, updated);
        toast.success('Zone updated');
      } else {
        // Create new zone
        const newZone = await createZone(hallId, formData);
        addZone(newZone);
        toast.success('Zone created');
      }
      
      resetForm();
    } catch (error) {
      console.error('Failed to save zone:', error);
      toast.error('Failed to save zone');
    }
  };
  
  const handleDelete = async (zoneId) => {
    if (!confirm('Delete this zone? Seats will be unassigned.')) {
      return;
    }
    
    try {
      await deleteZone(zoneId);
      removeZone(zoneId);
      toast.success('Zone deleted');
    } catch (error) {
      console.error('Failed to delete zone:', error);
      toast.error('Failed to delete zone');
    }
  };
  
  const resetForm = () => {
    setEditingZone(null);
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6',
      price_multiplier: 1.0
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Zone Manager</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Zone Form */}
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
            <div>
              <Label>Zone Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., VIP Section"
                required
              />
            </div>
            
            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Color</Label>
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
              
              <div>
                <Label>Price Multiplier</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.price_multiplier}
                  onChange={(e) => setFormData({ ...formData, price_multiplier: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button type="submit">
                {editingZone ? 'Update Zone' : 'Create Zone'}
              </Button>
              {editingZone && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
          
          {/* Zone List */}
          <div className="space-y-2">
            <h3 className="font-medium">Existing Zones</h3>
            {zones.length === 0 ? (
              <p className="text-sm text-muted-foreground">No zones created yet</p>
            ) : (
              zones.map((zone) => (
                <div 
                  key={zone.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: zone.color }}
                    />
                    <div>
                      <p className="font-medium">{zone.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Multiplier: {zone.price_multiplier}x
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingZone(zone);
                        setFormData(zone);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(zone.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Checklist:**
- [ ] Create component
- [ ] Add to SeatLayoutEditor
- [ ] Test zone CRUD operations
- [ ] Add zone assignment UI


### Task 4.4: Update SeatSidebar with Zone Info
**File:** `src/components/Theater/SeatLayoutEditor/components/SeatSidebar.jsx`

**Add new tab for Zones:**

```javascript
// Add to tabs
<Tabs defaultValue="grid" className="w-full">
  <TabsList className="grid w-full grid-cols-4">
    <TabsTrigger value="grid">Grid</TabsTrigger>
    <TabsTrigger value="types">Types</TabsTrigger>
    <TabsTrigger value="zones">Zones</TabsTrigger>
    <TabsTrigger value="stats">Stats</TabsTrigger>
  </TabsList>
  
  {/* ... existing tabs ... */}
  
  <TabsContent value="zones" className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Zone Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {zones.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No zones defined. Create zones to organize pricing.
          </p>
        ) : (
          zones.map((zone) => {
            const seatCount = seats.filter(s => s.zoneId === zone.id).length;
            return (
              <div key={zone.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: zone.color }}
                  />
                  <span className="text-sm">{zone.name}</span>
                </div>
                <Badge variant="secondary">{seatCount} seats</Badge>
              </div>
            );
          })
        )}
        
        <Button 
          size="sm" 
          className="w-full"
          onClick={() => setShowZoneManager(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Manage Zones
        </Button>
      </CardContent>
    </Card>
    
    {/* Zone Assignment Tool */}
    {selectedCells.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Assign to Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={(zoneId) => assignSeatsToZone(selectedCells, zoneId)}>
            <SelectTrigger>
              <SelectValue placeholder="Select zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null">No Zone</SelectItem>
              {zones.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>
                  {zone.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    )}
  </TabsContent>
</Tabs>
```

**Checklist:**
- [ ] Add zones tab
- [ ] Show zone statistics
- [ ] Add zone assignment UI
- [ ] Test zone assignment

---

## ⚡ Phase 5: Performance Optimization (30 phút)

### Task 5.1: Implement Batch Operations
**File:** `src/services/hallService.js`

```javascript
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
```

**Checklist:**
- [ ] Implement batch operations
- [ ] Add pagination for large layouts
- [ ] Test with 1000+ seats
- [ ] Measure performance improvement


### Task 5.2: Add Caching Strategy
**File:** `src/services/hallService.js`

```javascript
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
```

**Checklist:**
- [ ] Implement caching
- [ ] Add cache invalidation on save
- [ ] Test cache behavior
- [ ] Consider using React Query (optional)

### Task 5.3: Optimize Rendering
**File:** `src/components/Theater/SeatLayoutEditor/components/SeatCanvas.jsx`

```javascript
// Add virtualization for large grids (optional)
import { useVirtualizer } from '@tanstack/react-virtual';

// Memoize expensive calculations
const visibleSeats = useMemo(() => {
  // Only render seats in viewport
  const viewportBounds = {
    minX: -panX / zoom,
    maxX: (-panX + canvasWidth) / zoom,
    minY: -panY / zoom,
    maxY: (-panY + canvasHeight) / zoom
  };
  
  return seats.filter(seat => {
    const seatX = seat.col * cellSize;
    const seatY = seat.row * cellSize;
    
    return (
      seatX >= viewportBounds.minX &&
      seatX <= viewportBounds.maxX &&
      seatY >= viewportBounds.minY &&
      seatY <= viewportBounds.maxY
    );
  });
}, [seats, panX, panY, zoom, cellSize]);

// Render only visible seats
<AnimatePresence mode="popLayout">
  {visibleSeats.map((seat) => (
    <SeatCell key={seat.id} seat={seat} />
  ))}
</AnimatePresence>
```

**Checklist:**
- [ ] Add viewport culling
- [ ] Memoize calculations
- [ ] Test with 1000+ seats
- [ ] Measure FPS improvement

---

## 🧪 Phase 6: Testing & Validation (30 phút)

### Task 6.1: Database Testing
**Test cases:**

```javascript
// Test file: tests/hallService.test.js

describe('Seat Layout Persistence', () => {
  test('Save and load layout', async () => {
    const layoutData = {
      config: { rows: 10, cols: 15 },
      seats: [/* ... */],
      zones: []
    };
    
    await saveSeatLayoutComplete(hallId, layoutData);
    const loaded = await loadSeatLayoutComplete(hallId);
    
    expect(loaded.seats.length).toBe(layoutData.seats.length);
  });
  
  test('Version creation', async () => {
    await createLayoutVersion(hallId, layoutData, 'Test version');
    const versions = await getLayoutVersions(hallId);
    
    expect(versions.length).toBeGreaterThan(0);
  });
  
  test('Zone management', async () => {
    const zone = await createZone(hallId, {
      name: 'VIP',
      color: '#ff0000',
      price_multiplier: 2.0
    });
    
    expect(zone.id).toBeDefined();
    
    await assignSeatsToZone([seat1.id, seat2.id], zone.id);
    const seats = await getSeatsByHall(hallId);
    
    expect(seats.filter(s => s.zone_id === zone.id).length).toBe(2);
  });
  
  test('Large layout performance', async () => {
    const largeLayout = generateLargeLayout(1000); // 1000 seats
    
    const startTime = Date.now();
    await saveSeatLayoutComplete(hallId, largeLayout);
    const saveTime = Date.now() - startTime;
    
    expect(saveTime).toBeLessThan(5000); // Should save in < 5 seconds
  });
});
```

**Checklist:**
- [ ] Write unit tests
- [ ] Test edge cases
- [ ] Test performance
- [ ] Test error handling


### Task 6.2: Integration Testing
**Test scenarios:**

1. **Complete workflow test:**
   - [ ] Create new hall
   - [ ] Open seat editor
   - [ ] Place 100 seats
   - [ ] Create 2 zones
   - [ ] Assign seats to zones
   - [ ] Save layout
   - [ ] Reload page
   - [ ] Verify all data persisted

2. **Auto-save test:**
   - [ ] Enable auto-save
   - [ ] Make changes
   - [ ] Wait 30 seconds
   - [ ] Verify auto-save triggered
   - [ ] Check database

3. **Version history test:**
   - [ ] Create initial layout
   - [ ] Make changes and save (v2)
   - [ ] Make more changes and save (v3)
   - [ ] Restore v2
   - [ ] Verify layout matches v2

4. **Concurrent editing test:**
   - [ ] Open editor in 2 tabs
   - [ ] Make changes in tab 1
   - [ ] Save in tab 1
   - [ ] Make changes in tab 2
   - [ ] Save in tab 2
   - [ ] Verify conflict handling

**Checklist:**
- [ ] Run all integration tests
- [ ] Document test results
- [ ] Fix any issues found

---

## 📝 Phase 7: Documentation (30 phút)

### Task 7.1: Update API Documentation
**File:** `docs/SEAT_LAYOUT_API.md`

**Content:**
```markdown
# Seat Layout API Documentation

## Database Schema

### Tables
- `seats` - Individual seat records
- `seat_layout_configs` - Layout metadata
- `seat_zones` - Zone definitions
- `seat_layout_versions` - Version history
- `seat_layout_templates` - Reusable templates

## Service Functions

### Layout Management
- `saveSeatLayoutComplete(hallId, layoutData, options)`
- `loadSeatLayoutComplete(hallId, versionNumber)`
- `getLayoutConfig(hallId)`
- `saveLayoutConfig(hallId, config)`

### Zone Management
- `createZone(hallId, zoneData)`
- `getZonesByHall(hallId)`
- `updateZone(zoneId, updates)`
- `deleteZone(zoneId)`
- `assignSeatsToZone(seatIds, zoneId)`

### Version Management
- `createLayoutVersion(hallId, layoutData, description)`
- `getLayoutVersions(hallId)`
- `loadLayoutVersion(hallId, versionNumber)`
- `restoreLayoutVersion(hallId, versionNumber)`
- `deleteLayoutVersion(hallId, versionNumber)`

### Template Management
- `getPublicTemplates(category)`
- `createTemplate(templateData)`
- `applyTemplate(hallId, templateId)`

## Store Actions

### Config Actions
- `setConfig(config)`
- `updateConfig(updates)`

### Zone Actions
- `addZone(zone)`
- `updateZone(zoneId, updates)`
- `removeZone(zoneId)`
- `assignSeatsToZone(seatIds, zoneId)`

### Version Actions
- `setCurrentVersion(version)`
- `setVersions(versions)`

### State Management
- `markDirty()`
- `markClean()`
- `validateLayout()`
- `getLayoutData()`

## Usage Examples

### Save Layout with Zones
```javascript
const layoutData = {
  config: { rows: 10, cols: 15, cellSize: 40 },
  seats: [...],
  zones: [...]
};

await saveSeatLayoutComplete(hallId, layoutData, {
  createVersion: true,
  description: 'Added VIP section'
});
```

### Restore Previous Version
```javascript
await restoreLayoutVersion(hallId, 5);
```

### Apply Template
```javascript
await applyTemplate(hallId, templateId);
```
```

**Checklist:**
- [ ] Document all functions
- [ ] Add usage examples
- [ ] Document data structures
- [ ] Add troubleshooting guide


### Task 7.2: Update User Guide
**File:** `docs/SEAT_EDITOR_USER_GUIDE.md`

**Add new sections:**

```markdown
## Working with Zones

### Creating Zones
1. Click "Manage Zones" in the sidebar
2. Enter zone name and properties
3. Choose a color for visual identification
4. Set price multiplier (e.g., 2.0 for VIP)
5. Click "Create Zone"

### Assigning Seats to Zones
1. Select seats using Select tool
2. Go to Zones tab in sidebar
3. Choose zone from dropdown
4. Seats will be highlighted with zone color

## Version History

### Viewing History
1. Click "Version History" button in header
2. See list of all saved versions
3. View creation date and description

### Restoring a Version
1. Open Version History
2. Find the version you want
3. Click "Restore"
4. Current layout will be saved as new version
5. Selected version becomes active

## Auto-Save

### Enabling Auto-Save
- Auto-save is enabled by default
- Saves every 30 seconds when changes detected
- Look for "Auto-saved" notification

### Manual Save
- Click "Save Layout" button anytime
- Creates a new version
- Recommended before major changes

## Templates

### Using Templates
1. Click "Templates" button
2. Browse available templates
3. Preview template layout
4. Click "Apply" to use template
5. Customize as needed

### Creating Templates
1. Design your layout
2. Click "Save as Template"
3. Enter name and description
4. Choose if public or private
5. Template available for reuse
```

**Checklist:**
- [ ] Add zones section
- [ ] Add version history section
- [ ] Add auto-save section
- [ ] Add templates section
- [ ] Add screenshots (optional)

---

## ✅ Final Checklist

### Database
- [ ] All tables created
- [ ] RLS policies configured
- [ ] Indexes added
- [ ] Migration tested

### Service Layer
- [ ] All CRUD functions implemented
- [ ] Validation added
- [ ] Error handling complete
- [ ] Performance optimized

### Store
- [ ] Config management added
- [ ] Zone management added
- [ ] Version tracking added
- [ ] Dirty state tracking added

### UI Components
- [ ] Auto-save implemented
- [ ] Version history modal created
- [ ] Zone manager modal created
- [ ] Sidebar updated with zones tab

### Testing
- [ ] Unit tests written
- [ ] Integration tests passed
- [ ] Performance tests passed
- [ ] Edge cases covered

### Documentation
- [ ] API documentation complete
- [ ] User guide updated
- [ ] Code comments added
- [ ] Examples provided

### Performance
- [ ] Batch operations implemented
- [ ] Caching added
- [ ] Rendering optimized
- [ ] Large layouts tested (1000+ seats)

---

## 🎯 Success Metrics

### Functionality
- [ ] Save/load works 100% reliably
- [ ] No data loss on save
- [ ] Versions restore correctly
- [ ] Zones work as expected

### Performance
- [ ] Save < 3 seconds for 500 seats
- [ ] Load < 2 seconds for 500 seats
- [ ] 60 FPS with 1000 seats
- [ ] Auto-save doesn't block UI

### User Experience
- [ ] Auto-save is transparent
- [ ] Version history is clear
- [ ] Zone management is intuitive
- [ ] No confusing errors

---

## 🚨 Common Issues & Solutions

### Issue 1: Seats not saving
**Causes:**
- Validation failed
- Database connection issue
- RLS policy blocking

**Solutions:**
- Check validation errors
- Verify Supabase connection
- Check RLS policies
- Check browser console

### Issue 2: Version restore not working
**Causes:**
- Version data corrupted
- Missing permissions
- Database constraint violation

**Solutions:**
- Verify version data structure
- Check user permissions
- Validate data before restore
- Check error logs

### Issue 3: Auto-save too frequent
**Causes:**
- Dirty state not managed correctly
- Interval not cleared

**Solutions:**
- Check isDirty flag
- Clear interval on unmount
- Debounce auto-save trigger

### Issue 4: Performance degradation
**Causes:**
- Too many seats rendering
- No memoization
- Large database queries

**Solutions:**
- Implement viewport culling
- Add React.memo
- Use batch operations
- Add pagination

---

## 📊 Implementation Priority

### High Priority (Must Have)
1. ✅ Database schema enhancement
2. ✅ Enhanced save/load functions
3. ✅ Layout config persistence
4. ✅ Basic validation

### Medium Priority (Should Have)
5. ✅ Zone management
6. ✅ Version history
7. ✅ Auto-save
8. ✅ Performance optimization

### Low Priority (Nice to Have)
9. ⬜ Templates in database
10. ⬜ Conflict resolution
11. ⬜ Real-time collaboration
12. ⬜ Advanced analytics

---

## 🎓 Learning Resources

### Supabase
- [Supabase Docs](https://supabase.com/docs)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Batch Operations](https://supabase.com/docs/reference/javascript/insert)

### Performance
- [React Performance](https://react.dev/learn/render-and-commit)
- [Memoization](https://react.dev/reference/react/memo)
- [Virtualization](https://tanstack.com/virtual/latest)

### State Management
- [Zustand Best Practices](https://docs.pmnd.rs/zustand/guides/recipes)
- [Immer](https://immerjs.github.io/immer/)

---

## 🎉 Completion Criteria

Project is complete when:

1. **All data persists correctly** ✅
   - Seats save with all properties
   - Config saves and loads
   - Zones work end-to-end
   - Versions can be restored

2. **Performance is acceptable** ✅
   - Save < 3s for 500 seats
   - Load < 2s for 500 seats
   - Smooth rendering with 1000 seats

3. **User experience is smooth** ✅
   - Auto-save works transparently
   - No data loss
   - Clear error messages
   - Intuitive UI

4. **Code quality is high** ✅
   - Well documented
   - Properly tested
   - Error handling complete
   - No console errors

---

**Estimated Total Time: 4-6 hours**  
**Difficulty: Intermediate-Advanced**  
**Prerequisites: Supabase, React, Zustand, SQL**

**Good luck with implementation! 🚀**

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { generateSeatId, generateLabel, generateSequentialLabel } from '../components/Theater/SeatLayoutEditor/utils/seatNumbering';

const MAX_HISTORY = 50;

const initialState = {
  // Layout configuration
  rows: 10,
  cols: 15,
  cellSize: 40,
  showGrid: true,
  labelType: 'letters', // 'letters', 'numbers', 'custom'
  
  // Config object (for persistence)
  config: {
    rows: 10,
    cols: 15,
    cellSize: 40,
    showGrid: true,
    labelType: 'letters'
  },
  
  // Seats data
  seats: [],
  
  // Selection and tools
  selectedTool: 'select',
  selectedCells: [],
  clipboard: [],
  
  // View state
  zoom: 1,
  panX: 0,
  panY: 0,
  
  // History for undo/redo
  past: [],
  future: [],
  
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

export const useSeatLayoutStore = create(
  immer((set, get) => ({
    ...initialState,

    // Layout actions
    setRows: (rows) => set((state) => {
      state.rows = rows;
      // Remove seats outside new bounds
      state.seats = state.seats.filter(seat => seat.row < rows);
      state.selectedCells = state.selectedCells.filter(id => 
        state.seats.some(seat => seat.id === id)
      );
      get().pushHistory();
    }),
    setCols: (cols) => set((state) => {
      state.cols = cols;
      // Remove seats outside new bounds
      state.seats = state.seats.filter(seat => seat.col < cols);
      state.selectedCells = state.selectedCells.filter(id => 
        state.seats.some(seat => seat.id === id)
      );
      get().pushHistory();
    }),
    setCellSize: (cellSize) => set({ cellSize }),
    setShowGrid: (showGrid) => set({ showGrid }),
    setLabelType: (labelType) => set({ labelType }),

    // Seat actions
    addSeat: (seat) => set((state) => {
      // Check if seat already exists at this position
      const exists = state.seats.some(
        s => s.row === seat.row && s.col === seat.col
      );
      if (!exists) {
        // Add seat with temporary label first
        state.seats.push({
          id: seat.id || generateSeatId(),
          ...seat,
          label: 'temp' // Temporary label, will be regenerated
        });
        
        // Regenerate all labels immediately within the same state update
        const occupiedRows = [...new Set(state.seats.map(seat => seat.row))].sort((a, b) => a - b);
        const rowMapping = {};
        occupiedRows.forEach((gridRow, index) => {
          rowMapping[gridRow] = index;
        });
        
        const seatsByRow = {};
        state.seats.forEach(seat => {
          if (!seatsByRow[seat.row]) {
            seatsByRow[seat.row] = [];
          }
          seatsByRow[seat.row].push(seat);
        });
        
        Object.keys(seatsByRow).forEach(gridRow => {
          const gridRowNum = parseInt(gridRow);
          const displayRow = rowMapping[gridRowNum];
          const seatsInRow = seatsByRow[gridRow].sort((a, b) => a.col - b.col);
          
          seatsInRow.forEach((seat, index) => {
            if (state.labelType === 'letters') {
              seat.label = `${String.fromCharCode(65 + displayRow)}${index + 1}`;
            } else {
              seat.label = `${displayRow + 1}-${index + 1}`;
            }
          });
        });
        
        get().pushHistory();
      }
    }),

    removeSeat: (seatId) => set((state) => {
      state.seats = state.seats.filter(s => s.id !== seatId);
      state.selectedCells = state.selectedCells.filter(id => id !== seatId);
      
      // Regenerate all labels immediately within the same state update
      const occupiedRows = [...new Set(state.seats.map(seat => seat.row))].sort((a, b) => a - b);
      const rowMapping = {};
      occupiedRows.forEach((gridRow, index) => {
        rowMapping[gridRow] = index;
      });
      
      const seatsByRow = {};
      state.seats.forEach(seat => {
        if (!seatsByRow[seat.row]) {
          seatsByRow[seat.row] = [];
        }
        seatsByRow[seat.row].push(seat);
      });
      
      Object.keys(seatsByRow).forEach(gridRow => {
        const gridRowNum = parseInt(gridRow);
        const displayRow = rowMapping[gridRowNum];
        const seatsInRow = seatsByRow[gridRow].sort((a, b) => a.col - b.col);
        
        seatsInRow.forEach((seat, index) => {
          if (state.labelType === 'letters') {
            seat.label = `${String.fromCharCode(65 + displayRow)}${index + 1}`;
          } else {
            seat.label = `${displayRow + 1}-${index + 1}`;
          }
        });
      });
      
      get().pushHistory();
    }),

    updateSeat: (seatId, updates) => set((state) => {
      const seat = state.seats.find(s => s.id === seatId);
      if (seat) {
        Object.assign(seat, updates);
        get().pushHistory();
      }
    }),

    moveSeat: (seatId, newRow, newCol) => set((state) => {
      const seat = state.seats.find(s => s.id === seatId);
      if (seat) {
        // Check if target position is occupied
        const occupied = state.seats.some(
          s => s.id !== seatId && s.row === newRow && s.col === newCol
        );
        if (!occupied) {
          seat.row = newRow;
          seat.col = newCol;
          
          // Regenerate all labels immediately within the same state update
          const occupiedRows = [...new Set(state.seats.map(seat => seat.row))].sort((a, b) => a - b);
          const rowMapping = {};
          occupiedRows.forEach((gridRow, index) => {
            rowMapping[gridRow] = index;
          });
          
          const seatsByRow = {};
          state.seats.forEach(seat => {
            if (!seatsByRow[seat.row]) {
              seatsByRow[seat.row] = [];
            }
            seatsByRow[seat.row].push(seat);
          });
          
          Object.keys(seatsByRow).forEach(gridRow => {
            const gridRowNum = parseInt(gridRow);
            const displayRow = rowMapping[gridRowNum];
            const seatsInRow = seatsByRow[gridRow].sort((a, b) => a.col - b.col);
            
            seatsInRow.forEach((seat, index) => {
              if (state.labelType === 'letters') {
                seat.label = `${String.fromCharCode(65 + displayRow)}${index + 1}`;
              } else {
                seat.label = `${displayRow + 1}-${index + 1}`;
              }
            });
          });
          
          get().pushHistory();
        }
      }
    }),

    clearSeats: () => set((state) => {
      state.seats = [];
      state.selectedCells = [];
      get().pushHistory();
    }),

    loadSeats: (seats) => set({ seats }),

    // Helper function to regenerate labels for a specific row
    regenerateRowLabels: (row) => set((state) => {
      // Get all unique rows that have seats, sorted by row number
      const occupiedRows = [...new Set(state.seats.map(seat => seat.row))].sort((a, b) => a - b);
      
      // Find display row for the given grid row
      const displayRow = occupiedRows.indexOf(row);
      if (displayRow === -1) return; // Row not found
      
      const seatsInRow = state.seats
        .filter(seat => seat.row === row)
        .sort((a, b) => a.col - b.col); // Sort by column position
      
      seatsInRow.forEach((seat, index) => {
        if (state.labelType === 'letters') {
          seat.label = `${String.fromCharCode(65 + displayRow)}${index + 1}`;
        } else {
          seat.label = `${displayRow + 1}-${index + 1}`;
        }
      });
    }),

    // Regenerate all labels
    regenerateAllLabels: () => set((state) => {
      // Get all unique rows that have seats, sorted by row number
      const occupiedRows = [...new Set(state.seats.map(seat => seat.row))].sort((a, b) => a - b);
      
      // Create mapping from grid row to display row (A, B, C...)
      const rowMapping = {};
      occupiedRows.forEach((gridRow, index) => {
        rowMapping[gridRow] = index;
      });
      
      // Group seats by grid row
      const seatsByRow = {};
      state.seats.forEach(seat => {
        if (!seatsByRow[seat.row]) {
          seatsByRow[seat.row] = [];
        }
        seatsByRow[seat.row].push(seat);
      });
      
      // Regenerate labels for each row
      Object.keys(seatsByRow).forEach(gridRow => {
        const gridRowNum = parseInt(gridRow);
        const displayRow = rowMapping[gridRowNum];
        const seatsInRow = seatsByRow[gridRow].sort((a, b) => a.col - b.col);
        
        seatsInRow.forEach((seat, index) => {
          if (state.labelType === 'letters') {
            seat.label = `${String.fromCharCode(65 + displayRow)}${index + 1}`;
          } else {
            seat.label = `${displayRow + 1}-${index + 1}`;
          }
        });
      });
    }),

    // Selection actions
    selectCell: (seatId) => set((state) => {
      if (!state.selectedCells.includes(seatId)) {
        state.selectedCells.push(seatId);
      }
    }),

    deselectCell: (seatId) => set((state) => {
      state.selectedCells = state.selectedCells.filter(id => id !== seatId);
    }),

    toggleCellSelection: (seatId) => set((state) => {
      const index = state.selectedCells.indexOf(seatId);
      if (index >= 0) {
        state.selectedCells.splice(index, 1);
      } else {
        state.selectedCells.push(seatId);
      }
    }),

    selectMultipleCells: (seatIds) => set((state) => {
      state.selectedCells = [...new Set([...state.selectedCells, ...seatIds])];
    }),

    clearSelection: () => set({ selectedCells: [] }),

    selectAll: () => set((state) => {
      state.selectedCells = state.seats.map(s => s.id);
    }),

    // Tool actions
    setSelectedTool: (tool) => set({ selectedTool: tool }),

    // Clipboard actions
    copySelected: () => set((state) => {
      const selected = state.seats.filter(s => 
        state.selectedCells.includes(s.id)
      );
      state.clipboard = selected.map(s => ({ ...s }));
    }),

    pasteClipboard: (offsetRow = 1, offsetCol = 1) => set((state) => {
      state.clipboard.forEach(seat => {
        const newSeat = {
          ...seat,
          id: generateSeatId(),
          row: seat.row + offsetRow,
          col: seat.col + offsetCol
        };
        // Check if position is valid and not occupied
        if (newSeat.row >= 0 && newSeat.row < state.rows &&
            newSeat.col >= 0 && newSeat.col < state.cols) {
          const occupied = state.seats.some(
            s => s.row === newSeat.row && s.col === newSeat.col
          );
          if (!occupied) {
            newSeat.label = generateLabel(newSeat.row, newSeat.col, state.labelType);
            state.seats.push(newSeat);
          }
        }
      });
      get().pushHistory();
    }),

    deleteSelected: () => set((state) => {
      state.seats = state.seats.filter(s => 
        !state.selectedCells.includes(s.id)
      );
      state.selectedCells = [];
      get().pushHistory();
    }),

    rotateSelected: () => set((state) => {
      state.selectedCells.forEach(seatId => {
        const seat = state.seats.find(s => s.id === seatId);
        if (seat) {
          seat.rotation = (seat.rotation + 90) % 360;
        }
      });
      get().pushHistory();
    }),

    // View actions
    setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(3, zoom)) }),
    zoomIn: () => set((state) => ({ zoom: Math.min(3, state.zoom + 0.1) })),
    zoomOut: () => set((state) => ({ zoom: Math.max(0.1, state.zoom - 0.1) })),
    resetZoom: () => set({ zoom: 1, panX: 0, panY: 0 }),
    setPan: (panX, panY) => set({ panX, panY }),

    // History actions
    pushHistory: () => set((state) => {
      const currentState = {
        seats: state.seats.map(s => ({ ...s })),
        rows: state.rows,
        cols: state.cols
      };
      
      state.past.push(currentState);
      if (state.past.length > MAX_HISTORY) {
        state.past.shift();
      }
      state.future = [];
    }),

    undo: () => set((state) => {
      if (state.past.length > 0) {
        const currentState = {
          seats: state.seats.map(s => ({ ...s })),
          rows: state.rows,
          cols: state.cols
        };
        state.future.push(currentState);
        
        const previousState = state.past.pop();
        state.seats = previousState.seats;
        state.rows = previousState.rows;
        state.cols = previousState.cols;
      }
    }),

    redo: () => set((state) => {
      if (state.future.length > 0) {
        const currentState = {
          seats: state.seats.map(s => ({ ...s })),
          rows: state.rows,
          cols: state.cols
        };
        state.past.push(currentState);
        
        const nextState = state.future.pop();
        state.seats = nextState.seats;
        state.rows = nextState.rows;
        state.cols = nextState.cols;
      }
    }),

    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,

    // Config actions
    setConfig: (config) => set((state) => {
      state.config = config;
      state.rows = config.rows;
      state.cols = config.cols;
      state.cellSize = config.cellSize;
      state.showGrid = config.showGrid;
      state.labelType = config.labelType;
    }),
    
    updateConfig: (updates) => set((state) => {
      Object.assign(state.config, updates);
      
      // Sync with top-level state and clean up seats if needed
      if (updates.rows !== undefined) {
        state.rows = updates.rows;
        // Remove seats outside new bounds
        state.seats = state.seats.filter(seat => seat.row < updates.rows);
      }
      if (updates.cols !== undefined) {
        state.cols = updates.cols;
        // Remove seats outside new bounds
        state.seats = state.seats.filter(seat => seat.col < updates.cols);
      }
      if (updates.cellSize !== undefined) state.cellSize = updates.cellSize;
      if (updates.showGrid !== undefined) state.showGrid = updates.showGrid;
      if (updates.labelType !== undefined) state.labelType = updates.labelType;
      
      // Clean up selected cells that no longer exist
      state.selectedCells = state.selectedCells.filter(id => 
        state.seats.some(seat => seat.id === id)
      );
      
      state.isDirty = true;
      get().pushHistory();
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
    }),
    
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
    },

    // Statistics
    getStatistics: () => {
      const state = get();
      const stats = {
        total: state.seats.length,
        byType: {}
      };
      
      state.seats.forEach(seat => {
        stats.byType[seat.type] = (stats.byType[seat.type] || 0) + 1;
      });
      
      return stats;
    },

    // Reset store
    reset: () => set(initialState)
  }))
);

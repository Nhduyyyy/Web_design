// Seat type definitions

export const SeatType = {
  STANDARD: 'standard',
  VIP: 'vip',
  COUPLE: 'couple',
  WHEELCHAIR: 'wheelchair',
  AISLE: 'aisle',
  STAGE: 'stage'
};

export const SeatStatus = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
  BLOCKED: 'blocked'
};

export const ToolType = {
  SELECT: 'select',
  PAN: 'pan',
  DELETE: 'delete',
  STANDARD: 'standard',
  VIP: 'vip',
  COUPLE: 'couple',
  WHEELCHAIR: 'wheelchair',
  AISLE: 'aisle',
  STAGE: 'stage'
};

/**
 * @typedef {Object} SeatCell
 * @property {string} id - Unique seat identifier
 * @property {number} row - Row index
 * @property {number} col - Column index
 * @property {string} type - Seat type (standard, vip, couple, etc.)
 * @property {string} label - Display label (e.g., "A1")
 * @property {number} rotation - Rotation angle (0, 90, 180, 270)
 * @property {string} status - Seat status (available, occupied, etc.)
 */

/**
 * @typedef {Object} Zone
 * @property {string} id - Zone identifier
 * @property {string} name - Zone name
 * @property {string} color - Zone color
 * @property {number} priceMultiplier - Price multiplier for this zone
 */

/**
 * @typedef {Object} SeatLayout
 * @property {number} rows - Number of rows
 * @property {number} cols - Number of columns
 * @property {number} cellSize - Size of each cell in pixels
 * @property {SeatCell[]} seats - Array of seats
 * @property {Zone[]} zones - Array of zones
 * @property {Object} metadata - Additional metadata
 */

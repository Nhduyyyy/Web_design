/**
 * Seat generation utilities
 * Provides functions for creating seat objects and generating seat grids
 */
import { generateLabel, generateSeatId } from './seatNumbering';

/**
 * Creates a new seat object with all required properties
 * @param {number} row - Zero-based row index
 * @param {number} col - Zero-based column index
 * @param {string} type - Seat type: 'standard', 'vip', 'couple', 'wheelchair', 'aisle', 'stage'
 * @returns {Object} Complete seat object with id, position, type, label, rotation, and status
 * @example
 * generateSeat(0, 5, 'vip') 
 * // Returns { id: "seat-...", row: 0, col: 5, type: "vip", label: "A6", rotation: 0, status: "available" }
 */
export function generateSeat(row, col, type = 'standard') {
  return {
    id: generateSeatId(),
    row,
    col,
    type,
    label: generateLabel(row, col),
    rotation: 0,
    status: 'available'
  };
}

/**
 * Generates a complete grid of seats
 * Useful for creating template layouts or filling entire sections
 * @param {number} rows - Number of rows to generate
 * @param {number} cols - Number of columns to generate
 * @param {string} type - Seat type for all generated seats (default: 'standard')
 * @returns {Array<Object>} Array of seat objects filling the specified grid
 * @example
 * generateGrid(5, 10, 'standard') // Creates 50 standard seats in a 5x10 grid
 */
export function generateGrid(rows, cols, type = 'standard') {
  const seats = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      seats.push(generateSeat(row, col, type));
    }
  }
  return seats;
}

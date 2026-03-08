/**
 * Seat numbering utilities
 * Provides functions for generating seat labels and unique IDs
 */

/**
 * Generates a human-readable label for a seat based on its position
 * @param {number} row - Zero-based row index
 * @param {number} col - Zero-based column index
 * @param {string} type - Label type: 'letters' (A1, B2) or 'numbers' (1-1, 2-2)
 * @returns {string} Formatted seat label (e.g., "A1", "B12", "1-5")
 * @example
 * generateLabel(0, 0, 'letters') // Returns "A1"
 * generateLabel(2, 5, 'numbers') // Returns "3-6"
 */
export function generateLabel(row, col, type = 'letters') {
  if (type === 'letters') {
    // Convert row index to letter (0=A, 1=B, etc.) and col to 1-based number
    return `${String.fromCharCode(65 + row)}${col + 1}`;
  }
  // Both row and col as 1-based numbers
  return `${row + 1}-${col + 1}`;
}

/**
 * Generates a unique ID for a seat
 * Uses timestamp and random string to ensure uniqueness across sessions
 * @returns {string} Unique seat ID (e.g., "seat-1709856000000-x7k2m9p4q")
 * @example
 * generateSeatId() // Returns "seat-1709856000000-x7k2m9p4q"
 */
export function generateSeatId() {
  return `seat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

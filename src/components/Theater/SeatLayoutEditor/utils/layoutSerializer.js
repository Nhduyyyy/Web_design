/**
 * Layout serialization utilities
 * Handles conversion between layout objects and JSON format for export/import
 */

/**
 * Converts a layout object to formatted JSON string
 * @param {Object} layout - Layout object containing seats, rows, cols, etc.
 * @returns {string} Pretty-printed JSON string with 2-space indentation
 */
export function serializeLayout(layout) {
  return JSON.stringify(layout, null, 2);
}

/**
 * Parses a JSON string back into a layout object
 * @param {string} jsonString - JSON string representation of layout
 * @returns {Object|null} Parsed layout object, or null if parsing fails
 */
export function deserializeLayout(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to parse layout:', error);
    return null;
  }
}

/**
 * Exports a layout object as a downloadable JSON file
 * Creates a Blob, generates a download link, and triggers browser download
 * @param {Object} layout - Layout object to export
 * @param {string} filename - Name for the downloaded file (default: 'seat-layout.json')
 * @example
 * exportLayoutToFile(myLayout, 'theater-hall-1.json')
 */
export function exportLayoutToFile(layout, filename = 'seat-layout.json') {
  const json = serializeLayout(layout);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  // Clean up the object URL to prevent memory leaks
  URL.revokeObjectURL(url);
}

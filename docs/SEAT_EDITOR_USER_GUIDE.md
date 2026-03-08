# Seat Layout Editor - User Guide

Complete guide for using the Seat Layout Editor to create and manage theater seating layouts.

## 📖 Table of Contents

1. [Getting Started](#getting-started)
2. [Basic Operations](#basic-operations)
3. [Advanced Features](#advanced-features)
4. [Tips & Tricks](#tips--tricks)
5. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the Editor

1. Navigate to **Theater Dashboard**
2. Select a **Venue**
3. Click on a **Hall**
4. Go to **"Sơ đồ ghế"** (Seats) tab
5. Click **"Chỉnh sửa sơ đồ"** (Edit Layout) button

### Interface Overview

The editor consists of four main areas:

- **Header**: Navigation, save, export/import buttons
- **Toolbar**: Seat type tools and history controls
- **Canvas**: Main editing area with grid
- **Sidebar**: Grid settings, seat types, and statistics

---

## Basic Operations

### Placing Seats

1. **Select a Tool**: Click a seat type in the toolbar (or press 1-6)
2. **Click to Place**: Click on the canvas grid to place a seat
3. **Drag to Paint**: Click and drag to place multiple seats quickly

**Available Seat Types:**
- **Standard** (1): Regular theater seats
- **VIP** (2): Premium/VIP seats
- **Couple** (3): Loveseat/couple seats
- **Wheelchair** (4): Accessible seating
- **Aisle** (5): Aisle markers
- **Stage** (6): Stage area markers

### Selecting Seats

1. Press `V` or click the **Select Tool**
2. Click a seat to select it
3. **Shift+Click** to add more seats to selection
4. **Ctrl+Click** to toggle seat selection
5. Press `Escape` to clear selection

### Moving Seats

1. Select the **Select Tool** (V)
2. Click and drag a seat to move it
3. Seat will snap to grid positions
4. Release to place in new location

### Deleting Seats

**Method 1: Delete Tool**
1. Press `D` or click **Delete Tool**
2. Click seats to remove them

**Method 2: Select and Delete**
1. Select seats with Select Tool
2. Press `Delete` or `Backspace` key

**Method 3: Right-Click**
1. Right-click any seat
2. Seat is immediately deleted

### Rotating Seats

1. Select one or more seats
2. Press `R` key
3. Seats rotate 90° clockwise
4. Press `R` again to continue rotating (90°, 180°, 270°, 0°)

### Undo/Redo

- **Undo**: Press `Ctrl+Z` or click Undo button
- **Redo**: Press `Ctrl+Y` or click Redo button
- History stores up to 50 actions

---

## Advanced Features

### Copy and Paste

1. Select seats you want to copy
2. Press `Ctrl+C` to copy
3. Press `Ctrl+V` to paste
4. Pasted seats appear with 1 row/column offset
5. Paste multiple times to duplicate sections

### Grid Settings

Access from **Sidebar → Grid Tab**:

- **Rows**: Adjust number of rows (1-40)
- **Columns**: Adjust number of columns (1-40)
- **Cell Size**: Change seat spacing (20-80px)
- **Show Grid**: Toggle grid lines visibility

### Using Templates

1. Click **"Templates"** button in header
2. Browse available templates:
   - Classic Theater
   - Modern Cinema
   - Small Venue
   - Amphitheater
   - Accessible Venue
   - Empty Layout
3. Click a template to apply it
4. Template loads instantly with pre-configured seats

### Zoom and Pan

**Zoom:**
- Press `+` to zoom in
- Press `-` to zoom out
- Press `0` to reset zoom
- Or use Zoom Controls in bottom-right corner

**Pan:**
- Select Pan Tool (hand icon)
- Click and drag to move canvas
- Or use scroll wheel (if enabled)

### Export/Import

**Export Layout:**
1. Click **"Export"** button
2. JSON file downloads automatically
3. File includes all seats and settings

**Import Layout:**
1. Click **"Import"** button
2. Select a JSON file
3. Layout loads immediately
4. Existing layout is replaced

### Saving

1. Click **"Save Layout"** button
2. Layout saves to database
3. Hall capacity updates automatically
4. Toast notification confirms success

---

## Tips & Tricks

### Efficient Layout Creation

1. **Start with a Template**: Use templates as starting points
2. **Use Drag-to-Paint**: Quickly fill rows by dragging
3. **Copy Sections**: Create one row perfectly, then copy it
4. **Zoom In for Precision**: Zoom in when placing individual seats
5. **Zoom Out for Overview**: Zoom out to see full layout

### Keyboard Shortcuts

- Learn the number keys (1-6) for quick tool switching
- Use `V` and `D` to toggle between Select and Delete
- Master `Ctrl+Z` for fearless editing
- Use `Ctrl+A` to select all seats for bulk operations

### Grid Configuration

- **Start Large**: Begin with more rows/columns than needed
- **Adjust Cell Size**: Larger cells for easier clicking
- **Show Grid**: Keep grid visible while editing
- **Hide Grid**: Turn off for final preview

### Seat Placement Strategy

1. **Mark Stage First**: Place stage markers to orient layout
2. **Create Aisles**: Mark aisles before placing seats
3. **VIP Front**: Place VIP seats in front rows
4. **Wheelchair Access**: Place accessible seats on sides/back
5. **Couple Seats**: Place in back rows for privacy

### Quality Checks

- **Count Verification**: Check statistics tab for seat counts
- **Visual Inspection**: Zoom out to see full layout
- **Test Selection**: Try selecting seats to verify placement
- **Save Often**: Save frequently to prevent data loss

---

## Troubleshooting

### Seats Not Appearing

**Problem**: Clicking doesn't place seats

**Solutions**:
- Verify a seat tool is selected (not Select or Pan)
- Check if position already has a seat
- Ensure click is within grid bounds
- Try refreshing the page

### Can't Select Seats

**Problem**: Clicking seats doesn't select them

**Solutions**:
- Press `V` to activate Select Tool
- Check if Delete tool is active
- Clear any existing selections with `Escape`
- Verify seats exist at that position

### Drag and Drop Not Working

**Problem**: Can't move seats

**Solutions**:
- Ensure Select Tool is active (not other tools)
- Click and hold before dragging
- Check if seat is selected
- Try clicking the seat first, then dragging

### Save Failed

**Problem**: Layout doesn't save to database

**Solutions**:
- Check internet connection
- Verify you're logged in
- Ensure you have theater permissions
- Check browser console for errors
- Try exporting as backup

### Performance Issues

**Problem**: Editor is slow or laggy

**Solutions**:
- Reduce number of seats (split into sections)
- Close other browser tabs
- Disable browser extensions
- Try a different browser (Chrome recommended)
- Reduce cell size for smaller seats

### Import Failed

**Problem**: Can't import JSON file

**Solutions**:
- Verify file is valid JSON
- Check file was exported from this editor
- Ensure file isn't corrupted
- Try exporting a test layout first
- Check file size (should be < 1MB)

### Keyboard Shortcuts Not Working

**Problem**: Shortcuts don't respond

**Solutions**:
- Click on canvas to focus editor
- Check if typing in an input field
- Verify Caps Lock is off
- Try using mouse alternatives
- Check browser shortcut conflicts

### Undo/Redo Not Available

**Problem**: Undo button is disabled

**Solutions**:
- No actions to undo yet
- History was cleared (page refresh)
- Maximum history reached (50 actions)
- Try making a new change first

---

## Best Practices

### Before You Start

- [ ] Review hall dimensions and capacity requirements
- [ ] Check accessibility requirements
- [ ] Plan aisle locations
- [ ] Identify VIP/premium areas
- [ ] Consider sightlines to stage

### During Editing

- [ ] Save frequently (every 5-10 minutes)
- [ ] Use templates for consistency
- [ ] Test seat selection regularly
- [ ] Verify seat counts in statistics
- [ ] Export backup before major changes

### Before Saving

- [ ] Zoom out to review full layout
- [ ] Check all aisles are marked
- [ ] Verify VIP seat placement
- [ ] Count total seats vs. capacity
- [ ] Test a few seat selections
- [ ] Review statistics tab

### After Saving

- [ ] Verify save confirmation
- [ ] Check hall capacity updated
- [ ] Test loading layout again
- [ ] Export a backup copy
- [ ] Document any special configurations

---

## Keyboard Reference Card

```
TOOLS:        1-6, D, V
EDIT:         Ctrl+Z, Ctrl+Y, Ctrl+C, Ctrl+V, Delete, R
SELECT:       Escape, Ctrl+A, Shift+Click, Ctrl+Click
VIEW:         +, -, 0
MOUSE:        Click, Drag, Right-Click
```

---

## Support

For additional help:
- Check keyboard shortcuts guide
- Review component documentation
- Contact system administrator
- Report bugs to development team

---

**Version**: 1.0  
**Last Updated**: 2026-03-07  
**Author**: Theater Management System Team

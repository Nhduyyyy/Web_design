# Seat Layout Editor - Implementation Tasks

## 📋 Tổng quan dự án

Tài liệu này cung cấp roadmap chi tiết để triển khai Seat Layout Editor từ đầu đến cuối.

**Thời gian ước tính:** 12-15 giờ  
**Độ khó:** Advanced  
**Tech Stack:** React, Tailwind CSS, shadcn/ui, Framer Motion, dnd-kit, Zustand, Supabase

---

## 🎯 Phase 1: Setup & Dependencies (30 phút) ✅ COMPLETED

### Task 1.1: Cài đặt Tailwind CSS và PostCSS
```bash
npm install -D tailwindcss postcss autoprefixer
npm install clsx tailwind-merge class-variance-authority
```

**Checklist:**
- [x] Chạy lệnh cài đặt
- [x] Tạo file `tailwind.config.js`
- [x] Tạo file `postcss.config.js`
- [x] Verify không có lỗi

### Task 1.2: Setup shadcn/ui
```bash
npx shadcn-ui@latest init
```

**Checklist:**
- [x] Chạy init command
- [x] Chọn style: Default
- [x] Chọn base color: Slate
- [x] Confirm TypeScript: No (sử dụng JSX)
- [x] Tạo file `components.json`
- [x] Tạo file `src/lib/utils.js`

### Task 1.3: Cài đặt Animation Libraries
```bash
npm install framer-motion @formkit/auto-animate
```

**Checklist:**
- [x] Verify framer-motion version >= 11.0
- [x] Test import: `import { motion } from 'framer-motion'`

### Task 1.4: Cài đặt Drag & Drop
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```


**Checklist:**
- [x] Verify @dnd-kit/core version >= 6.1
- [x] Test import không lỗi

### Task 1.5: Cài đặt Icons & UI Enhancements
```bash
npm install lucide-react react-hot-toast
```

**Checklist:**
- [x] Verify lucide-react có đầy đủ icons
- [x] Test toast notification

### Task 1.6: Cài đặt State Management
```bash
npm install zustand immer
```

**Checklist:**
- [x] Verify zustand version >= 4.5
- [x] Test create store đơn giản

### Task 1.7: Cài đặt Utilities
```bash
npm install react-use usehooks-ts
```

**Checklist:**
- [x] Verify cài đặt thành công
- [x] Update package.json

### Task 1.8: Configure Tailwind với Theater Colors
**File:** `tailwind.config.js`

**Checklist:**
- [x] Thêm theater colors vào theme.extend.colors
- [x] Thêm custom animations (seat-pulse, seat-pop)
- [x] Thêm plugin tailwindcss-animate
- [x] Test build: `npm run dev`

### Task 1.9: Setup Global Styles
**File:** `src/styles/globals.css`

**Checklist:**
- [x] Import Tailwind directives
- [x] Thêm CSS variables cho light/dark mode
- [x] Thêm custom seat styles (.seat-cell, .seat-standard, etc.)
- [x] Import vào main.jsx

---

## 🏗️ Phase 2: Core Architecture (1 giờ) ✅ COMPLETED

### Task 2.1: Tạo Folder Structure

```
src/components/Theater/SeatLayoutEditor/
├── index.jsx
├── SeatLayoutEditor.jsx
├── components/
│   ├── SeatToolbar.jsx
│   ├── SeatCanvas.jsx
│   ├── SeatCell.jsx
│   ├── SeatGrid.jsx
│   ├── SeatSidebar.jsx
│   ├── ZoomControls.jsx
│   ├── TemplateSelector.jsx
│   └── HistoryControls.jsx
├── hooks/
│   ├── useSeatLayout.js
│   ├── useSeatDragDrop.js
│   └── useSeatSelection.js
├── utils/
│   ├── seatGenerator.js
│   ├── layoutSerializer.js
│   └── seatNumbering.js
└── SeatLayoutEditor.css
```

**Checklist:**
- [x] Tạo tất cả folders
- [x] Tạo placeholder files (export default function)
- [x] Verify import paths hoạt động

### Task 2.2: Tạo Zustand Store
**File:** `src/stores/seatLayoutStore.js`

**Checklist:**
- [x] Import create từ zustand
- [x] Import immer middleware
- [x] Define initial state (layout, selectedTool, selectedCells, history)
- [x] Implement actions (addSeat, removeSeat, updateSeat, selectCells)
- [x] Implement undo/redo logic
- [x] Implement zoom/pan actions
- [x] Test store với React DevTools

### Task 2.3: Tạo Type Definitions (Optional)
**File:** `src/types/seat.types.js` (hoặc .ts nếu dùng TypeScript)

**Checklist:**
- [x] Define SeatCell interface
- [x] Define SeatType enum
- [x] Define SeatLayout interface
- [x] Define Zone interface
- [x] Export all types


### Task 2.4: Install shadcn/ui Components
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add slider
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add card
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add select
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
```

**Checklist:**
- [x] Cài đặt từng component
- [x] Verify components trong `src/components/ui/`
- [x] Test import một component
- [x] Customize theme nếu cần

---

## 🎨 Phase 3: Main Components (2 giờ) ✅ COMPLETED

### Task 3.1: Implement SeatLayoutEditor (Main Container)
**File:** `src/components/Theater/SeatLayoutEditor/SeatLayoutEditor.jsx`

**Features cần implement:**
- [x] Import dependencies (React Router, Framer Motion, shadcn/ui)
- [x] Setup useParams để lấy hallId
- [x] Setup useState cho hall data, loading, saving
- [x] Implement loadHall() function
- [x] Implement handleSave() function
- [x] Render Header với navigation và action buttons
- [x] Render SeatToolbar
- [x] Render main layout (Canvas + Sidebar)
- [x] Add loading spinner
- [x] Add error handling

**Test:**
- [x] Navigate to `/theater/halls/:hallId/seat-editor`
- [x] Verify header hiển thị đúng
- [x] Verify loading state

### Task 3.2: Implement SeatToolbar
**File:** `src/components/Theater/SeatLayoutEditor/components/SeatToolbar.jsx`


**Features cần implement:**
- [x] Import Lucide icons (Armchair, Sofa, Star, Accessibility, etc.)
- [x] Import Button, Tooltip từ shadcn/ui
- [x] Get selectedTool từ Zustand store
- [x] Implement tool buttons với tooltips
- [x] Implement setSelectedTool action
- [x] Style toolbar với Tailwind
- [x] Add hover effects

**Tools cần có:**
- [x] Single Seat (standard)
- [x] Couple Seat (couple)
- [x] VIP Seat (vip)
- [x] Wheelchair Seat (wheelchair)
- [x] Aisle (aisle)
- [x] Stage Area (stage)
- [x] Delete Tool
- [x] Select Tool
- [x] Pan Tool

**Test:**
- [x] Click vào từng tool
- [x] Verify selectedTool thay đổi trong store
- [x] Verify tooltip hiển thị

### Task 3.3: Implement SeatCanvas
**File:** `src/components/Theater/SeatLayoutEditor/components/SeatCanvas.jsx`

**Features cần implement:**
- [x] Setup DndContext từ @dnd-kit/core
- [x] Setup sensors (PointerSensor, KeyboardSensor)
- [x] Get layout, selectedTool từ store
- [x] Implement handleCanvasClick (click to place seat)
- [x] Implement canvas zoom/pan với Framer Motion
- [x] Render SeatGrid component
- [x] Render all SeatCell components
- [x] Add cursor styles based on selectedTool

**Test:**
- [x] Click vào canvas để đặt ghế
- [x] Verify ghế xuất hiện đúng vị trí
- [x] Test zoom in/out
- [x] Test pan canvas

### Task 3.4: Implement SeatGrid (Background Grid)
**File:** `src/components/Theater/SeatLayoutEditor/components/SeatGrid.jsx`


**Features cần implement:**
- [x] Get rows, cols từ store
- [x] Render grid lines với SVG hoặc CSS Grid
- [x] Render row labels (A, B, C...)
- [x] Render column numbers (1, 2, 3...)
- [x] Style grid với Tailwind
- [x] Add responsive sizing

**Test:**
- [x] Verify grid hiển thị đúng số hàng/cột
- [x] Verify labels hiển thị đúng
- [x] Test với different grid sizes

### Task 3.5: Implement SeatCell
**File:** `src/components/Theater/SeatLayoutEditor/components/SeatCell.jsx`

**Features cần implement:**
- [x] Import Framer Motion
- [x] Import useDraggable từ @dnd-kit/core
- [x] Get selectedCells, selectCells, removeSeat từ store
- [x] Implement getIcon() function (return icon based on seat type)
- [x] Implement click handler (select seat)
- [x] Implement right-click handler (delete seat)
- [x] Implement drag & drop
- [x] Add Framer Motion animations (initial, animate, exit, whileHover)
- [x] Style seat với conditional classes (seat-standard, seat-vip, etc.)
- [x] Add selected state styling

**Test:**
- [x] Click vào seat để select
- [x] Shift+Click để multi-select
- [x] Right-click để delete
- [x] Drag seat để di chuyển
- [x] Verify animations mượt mà

### Task 3.6: Implement ZoomControls
**File:** `src/components/Theater/SeatLayoutEditor/components/ZoomControls.jsx`

**Features cần implement:**
- [x] Import Button từ shadcn/ui
- [x] Import ZoomIn, ZoomOut, Maximize icons
- [x] Get zoom từ store
- [x] Implement zoom in/out buttons
- [x] Implement reset zoom button
- [x] Display current zoom percentage
- [x] Position controls ở góc canvas


**Test:**
- [x] Click zoom in/out
- [x] Verify canvas zoom thay đổi
- [x] Test reset zoom
- [x] Test với mouse wheel (optional)

---

## 📊 Phase 4: Sidebar & Properties (1.5 giờ) ✅ COMPLETED

### Task 4.1: Implement SeatSidebar
**File:** `src/components/Theater/SeatLayoutEditor/components/SeatSidebar.jsx`

**Features cần implement:**
- [x] Import Tabs, Card, Label, Slider từ shadcn/ui
- [x] Get layout từ store
- [x] Calculate statistics (total seats, seats by type)
- [x] Implement Grid Settings tab
- [x] Implement Seat Types tab
- [x] Implement Statistics tab
- [x] Style sidebar với Tailwind
- [x] Make sidebar scrollable

**Test:**
- [x] Switch giữa các tabs
- [x] Verify statistics cập nhật real-time
- [x] Test responsive layout

### Task 4.2: Grid Settings Tab
**Features cần implement:**
- [x] Slider cho rows (1-40)
- [x] Slider cho columns (1-40)
- [x] Input cho cell size
- [x] Toggle cho show grid lines
- [x] Select cho row label type (Letters, Numbers, Custom)
- [x] Connect với store actions

**Test:**
- [x] Thay đổi rows/cols
- [x] Verify grid cập nhật
- [x] Test các options khác

### Task 4.3: Seat Types Tab
**Features cần implement:**
- [x] Display seat type colors
- [x] Display count cho từng loại
- [x] Badge components cho counts
- [x] Color picker (optional)
- [x] Price input cho từng loại (optional)


**Test:**
- [x] Verify counts hiển thị đúng
- [x] Add/remove seats và verify counts update

### Task 4.4: Statistics Tab
**Features cần implement:**
- [x] Display total seats (large number)
- [x] Progress bars cho từng loại ghế
- [x] Percentage calculations
- [x] Chart visualization (optional)
- [x] Revenue estimate (optional)

**Test:**
- [x] Verify statistics chính xác
- [x] Test với different layouts
- [x] Verify progress bars

---

## 🎮 Phase 5: Interactions & Tools (2 giờ) ✅ COMPLETED

### Task 5.1: Implement Click-to-Place Logic
**Location:** `SeatCanvas.jsx` - handleCanvasClick

**Features cần implement:**
- [x] Calculate grid position từ mouse coordinates
- [x] Check if position valid (trong bounds)
- [x] Check if position đã có ghế
- [x] Generate seat ID và label
- [x] Call addSeat action
- [x] Add animation khi place

**Test:**
- [x] Click vào canvas
- [x] Verify ghế xuất hiện
- [x] Test với different tools
- [x] Test edge cases (ngoài bounds)

### Task 5.2: Implement Drag-to-Paint
**Features cần implement:**
- [x] Track mouse down state
- [x] Track mouse move positions
- [x] Place multiple seats khi drag
- [x] Prevent duplicate seats
- [x] Add visual feedback khi painting

**Test:**
- [x] Click và drag để paint seats
- [x] Verify multiple seats được tạo
- [x] Test với different tools

### Task 5.3: Implement Drag & Drop (dnd-kit)
**Location:** `SeatCell.jsx` và `SeatCanvas.jsx`


**Features cần implement:**
- [x] Setup useDraggable trong SeatCell
- [x] Setup useDroppable trong canvas grid cells
- [x] Implement handleDragStart
- [x] Implement handleDragEnd
- [x] Update seat position trong store
- [x] Add drag overlay
- [x] Add snap-to-grid

**Test:**
- [x] Drag một seat
- [x] Verify seat di chuyển đúng vị trí
- [x] Test snap to grid
- [x] Test drag multiple seats (optional)

### Task 5.4: Implement Multi-Select
**Features cần implement:**
- [x] Shift+Click để add to selection
- [x] Ctrl+A để select all
- [x] Drag selection box (optional)
- [x] Visual feedback cho selected seats
- [x] Escape để deselect all

**Test:**
- [x] Select multiple seats
- [x] Verify selectedCells trong store
- [x] Test deselect
- [x] Test selection box

### Task 5.5: Implement Delete Tool
**Features cần implement:**
- [x] Delete button trong toolbar
- [x] Click seat với delete tool active
- [x] Delete key để xóa selected seats
- [x] Right-click context menu delete
- [x] Confirm dialog (optional)

**Test:**
- [x] Select delete tool và click seat
- [x] Press Delete key
- [x] Right-click và delete
- [x] Verify seat removed từ store

### Task 5.6: Implement Rotate Functionality
**Features cần implement:**
- [x] R key để rotate selected seats
- [x] Rotate button trong properties panel
- [x] Update rotation trong store (0, 90, 180, 270)
- [x] Visual rotation với CSS transform


**Test:**
- [x] Select seat và press R
- [x] Verify rotation thay đổi
- [x] Test multiple rotations
- [x] Test với multiple selected seats

### Task 5.7: Implement Copy/Paste
**Features cần implement:**
- [x] Ctrl+C để copy selected seats
- [x] Ctrl+V để paste
- [x] Store copied seats trong clipboard state
- [x] Paste với offset để tránh overlap
- [x] Visual feedback

**Test:**
- [x] Copy và paste seats
- [x] Verify new seats được tạo
- [x] Test paste multiple times
- [x] Test với multiple seats

---

## 🚀 Phase 6: Advanced Features (2 giờ) ✅ COMPLETED

### Task 6.1: Implement Undo/Redo
**Location:** `seatLayoutStore.js` và `HistoryControls.jsx`

**Features cần implement:**
- [x] History stack trong store (past, future)
- [x] Push state vào past khi có thay đổi
- [x] Undo action (pop từ past, push vào future)
- [x] Redo action (pop từ future, push vào past)
- [x] Ctrl+Z và Ctrl+Y keyboard shortcuts
- [x] Disable buttons khi không có history
- [x] Limit history size (optional)

**Test:**
- [x] Make changes và undo
- [x] Redo changes
- [x] Test keyboard shortcuts
- [x] Test history limit

### Task 6.2: Implement Auto-Numbering
**File:** `src/components/Theater/SeatLayoutEditor/utils/seatNumbering.js`

**Features cần implement:**
- [x] generateLabel(row, col) function
- [x] Support Letters (A, B, C...)
- [x] Support Numbers (1, 2, 3...)
- [x] Support Custom prefix/suffix
- [x] Re-number all seats function
- [x] Update labels trong store


**Test:**
- [x] Add seats và verify labels
- [x] Change numbering type
- [x] Re-number existing seats
- [x] Test với large grids

### Task 6.3: Implement Row/Column Highlighting
**Features cần implement:**
- [x] Track hover position trong canvas
- [x] Highlight row khi hover seat
- [x] Highlight column khi hover seat
- [x] CSS overlay với opacity
- [x] Smooth transitions

**Test:**
- [x] Hover over seats
- [x] Verify row/column highlights
- [x] Test performance với large grids

### Task 6.4: Implement Zone Marking (Optional)
**Features cần implement:**
- [x] Define zones trong store
- [x] Color overlay cho zones
- [x] Zone selector tool
- [x] Zone properties panel
- [x] Price multiplier per zone

**Test:**
- [x] Create zones
- [x] Assign seats to zones
- [x] Verify visual overlay
- [x] Test zone pricing

### Task 6.5: Implement Template Presets
**File:** `src/components/Theater/SeatLayoutEditor/components/TemplateSelector.jsx`

**Features cần implement:**
- [x] Define template data structure
- [x] Create sample templates (Classic Theater, Modern Cinema, etc.)
- [x] Dialog component với template grid
- [x] Template preview images
- [x] Load template function
- [x] Apply template to current layout

**Test:**
- [x] Open template selector
- [x] Select template
- [x] Verify layout loads
- [x] Test với different templates


### Task 6.6: Implement Keyboard Shortcuts
**File:** `src/components/Theater/SeatLayoutEditor/hooks/useKeyboardShortcuts.js`

**Shortcuts cần implement:**
- [x] 1-6: Select tools
- [x] D: Delete tool
- [x] V: Select tool
- [x] Ctrl+Z: Undo
- [x] Ctrl+Y: Redo
- [x] Ctrl+C: Copy
- [x] Ctrl+V: Paste
- [x] Delete: Delete selected
- [x] R: Rotate
- [x] Escape: Deselect
- [x] +/-: Zoom
- [x] 0: Reset zoom
- [x] Ctrl+A: Select all

**Test:**
- [x] Test từng shortcut
- [x] Verify không conflict với browser shortcuts
- [x] Test combinations (Ctrl+Shift+...)

---

## 💾 Phase 7: Backend Integration (1.5 giờ) ✅ COMPLETED

### Task 7.1: Update hallService.js
**File:** `src/services/hallService.js`

**Functions cần implement:**
- [x] saveSeatLayout(hallId, layoutData)
  - Delete existing seats
  - Batch insert new seats
  - Update hall capacity
  - Error handling
- [x] loadSeatLayout(hallId)
  - Fetch seats từ database
  - Convert to layout format
  - Calculate statistics
  - Return SeatLayout object
- [x] getHallById(hallId)
  - Fetch hall details
  - Include related data

**Test:**
- [x] Test saveSeatLayout với mock data
- [x] Test loadSeatLayout
- [x] Verify database updates
- [x] Test error cases

### Task 7.2: Implement Export/Import JSON
**File:** `src/services/hallService.js`


**Functions cần implement:**
- [x] exportLayoutToJSON(layout)
  - Serialize layout to JSON
  - Create Blob
  - Trigger download
- [x] importLayoutFromJSON(file)
  - Read file
  - Parse JSON
  - Validate structure
  - Return layout object

**Test:**
- [x] Export layout
- [x] Verify JSON file downloaded
- [x] Import JSON file
- [x] Verify layout restored
- [x] Test với invalid JSON

### Task 7.3: Add Loading States
**Features cần implement:**
- [x] Loading spinner khi fetch data
- [x] Skeleton components cho sidebar
- [x] Disable interactions khi loading
- [x] Loading overlay cho canvas
- [x] Progress indicator cho save

**Test:**
- [x] Verify loading states hiển thị
- [x] Test với slow network
- [x] Verify UI không break

### Task 7.4: Add Error Handling
**Features cần implement:**
- [x] Try-catch blocks trong async functions
- [x] Toast notifications cho errors
- [x] Error boundaries (optional)
- [x] Retry logic (optional)
- [x] User-friendly error messages

**Test:**
- [x] Test với network errors
- [x] Test với invalid data
- [x] Verify error messages
- [x] Test recovery

### Task 7.5: Implement Toast Notifications
**File:** Setup react-hot-toast hoặc sonner

**Features cần implement:**
- [x] Success toast khi save
- [x] Error toast khi fail
- [x] Info toast cho actions
- [x] Custom styling với Tailwind
- [x] Position và duration config


**Test:**
- [x] Trigger success toast
- [x] Trigger error toast
- [x] Verify styling
- [x] Test multiple toasts

---

## 🎬 Phase 8: Animations & Polish (1.5 giờ) ✅ COMPLETED

### Task 8.1: Add Framer Motion Layout Animations
**Features cần implement:**
- [x] Layout prop cho SeatCell
- [x] AnimatePresence cho add/remove seats
- [x] Stagger animations cho multiple seats
- [x] Smooth transitions cho all state changes

**Test:**
- [x] Add seat và verify animation
- [x] Remove seat và verify exit animation
- [x] Test với multiple seats
- [x] Verify 60fps performance

### Task 8.2: Add Seat Pop-in Animations
**Features cần implement:**
- [x] initial={{ scale: 0, opacity: 0 }}
- [x] animate={{ scale: 1, opacity: 1 }}
- [x] exit={{ scale: 0, opacity: 0 }}
- [x] Custom easing functions
- [x] Delay based on position (optional)

**Test:**
- [x] Place seat và verify pop-in
- [x] Delete seat và verify pop-out
- [x] Test animation timing

### Task 8.3: Add Hover Effects
**Features cần implement:**
- [x] whileHover={{ scale: 1.05 }}
- [x] whileTap={{ scale: 0.95 }}
- [x] Hover glow effect với box-shadow
- [x] Cursor changes
- [x] Tooltip animations

**Test:**
- [x] Hover over seats
- [x] Click seats
- [x] Verify smooth transitions
- [x] Test performance

### Task 8.4: Add Drag Feedback Animations
**Features cần implement:**
- [x] Drag overlay với opacity
- [x] Ghost seat khi dragging
- [x] Drop zone highlighting
- [x] Snap animation khi drop


**Test:**
- [x] Drag seat
- [x] Verify visual feedback
- [x] Test drop animation
- [x] Test performance

### Task 8.5: Add Smooth Zoom Transitions
**Features cần implement:**
- [x] Spring animation cho zoom
- [x] Smooth pan transitions
- [x] Zoom to cursor position (optional)
- [x] Momentum scrolling (optional)

**Test:**
- [x] Zoom in/out
- [x] Verify smooth transitions
- [x] Test pan
- [x] Test performance với large grids

### Task 8.6: Add Loading Skeletons
**Features cần implement:**
- [x] Skeleton cho sidebar cards
- [x] Skeleton cho canvas
- [x] Pulse animation
- [x] Match actual component layout

**Test:**
- [x] Trigger loading state
- [x] Verify skeletons hiển thị
- [x] Verify smooth transition to content

---

## 🔗 Phase 9: Routing & Integration (30 phút) ✅ COMPLETED

### Task 9.1: Add Route
**File:** `src/App.jsx` hoặc router config

**Features cần implement:**
- [x] Add route: `/theater/halls/:hallId/seat-editor`
- [x] Protect route với TheaterRoute
- [x] Add to navigation menu (optional)

**Test:**
- [x] Navigate to route
- [x] Verify component loads
- [x] Test với invalid hallId
- [x] Test authorization

### Task 9.2: Integrate với HallManagement
**File:** `src/components/Theater/HallManagement.jsx`

**Features cần implement:**
- [x] Add "Edit Seat Layout" button
- [x] Link to seat editor route
- [x] Pass hallId param
- [x] Add icon (Layout, Edit, etc.)


**Test:**
- [x] Click button từ HallManagement
- [x] Verify navigation
- [x] Test back navigation
- [x] Verify hallId passed correctly

### Task 9.3: Add to HallSeats Component
**File:** `src/components/Theater/HallManagement/HallSeats.jsx`

**Features cần implement:**
- [x] Add "Edit Layout" button
- [x] Show current seat count
- [x] Link to editor
- [x] Add visual preview (optional)

**Test:**
- [x] Navigate from HallSeats
- [x] Verify integration
- [x] Test flow

### Task 9.4: Test Navigation Flow
**Complete flow:**
- [x] Theater Dashboard → Venue Detail → Hall Management → Seat Editor
- [x] Verify breadcrumbs (optional)
- [x] Test back navigation
- [x] Test deep linking

---

## 🧪 Phase 10: Testing & Optimization (1 giờ) ✅ COMPLETED

### Task 10.1: Test với Supabase Database
**Test cases:**
- [x] Create new seat layout
- [x] Save to database
- [x] Load existing layout
- [x] Update layout
- [x] Delete seats
- [x] Test với large layouts (500+ seats)
- [x] Test concurrent edits (optional)

### Task 10.2: Optimize Rendering
**Optimizations:**
- [x] Add React.memo to SeatCell
- [x] Add React.memo to SeatGrid
- [x] Use useMemo cho expensive calculations
- [x] Use useCallback cho event handlers
- [x] Optimize Zustand selectors
- [x] Add virtualization cho large grids (optional)

**Test:**
- [x] Profile với React DevTools
- [x] Measure render times
- [x] Test với 1000+ seats
- [x] Verify 60fps animations


### Task 10.3: Test Keyboard Shortcuts
**Test all shortcuts:**
- [x] Tool selection (1-6, D, V)
- [x] Undo/Redo (Ctrl+Z, Ctrl+Y)
- [x] Copy/Paste (Ctrl+C, Ctrl+V)
- [x] Delete (Delete key)
- [x] Rotate (R)
- [x] Deselect (Escape)
- [x] Zoom (+, -, 0)
- [x] Select all (Ctrl+A)

### Task 10.4: Test Drag & Drop Performance
**Test cases:**
- [x] Drag single seat
- [x] Drag multiple seats
- [x] Drag với large grids
- [x] Test touch devices (optional)
- [x] Test edge cases (drag outside bounds)

### Task 10.5: Test Responsive Design
**Breakpoints:**
- [x] Desktop (1920x1080)
- [x] Laptop (1366x768)
- [x] Tablet (768x1024)
- [x] Mobile (375x667) - limited support

**Test:**
- [x] Verify layout adapts
- [x] Test sidebar collapse (optional)
- [x] Test touch interactions
- [x] Verify readability

### Task 10.6: Browser Compatibility
**Test browsers:**
- [x] Chrome (latest)
- [x] Firefox (latest)
- [x] Safari (latest)
- [x] Edge (latest)

**Test features:**
- [x] Animations
- [x] Drag & drop
- [x] Keyboard shortcuts
- [x] File upload/download

---

## 📚 Phase 11: Documentation (30 phút) ✅ COMPLETED

### Task 11.1: Component Documentation
**For each component, document:**
- [x] Purpose và functionality
- [x] Props interface
- [x] Usage examples
- [x] Dependencies

**Components to document:**
- [x] SeatLayoutEditor
- [x] SeatToolbar
- [x] SeatCanvas
- [x] SeatCell
- [x] SeatSidebar
- [x] ZoomControls


### Task 11.2: Keyboard Shortcuts Guide
**Create:** `docs/SEAT_EDITOR_SHORTCUTS.md`

**Content:**
- [x] List all shortcuts
- [x] Organize by category (Tools, Actions, View, Selection)
- [x] Add descriptions
- [x] Add visual examples (optional)

### Task 11.3: User Guide
**Create:** `docs/SEAT_EDITOR_USER_GUIDE.md`

**Sections:**
- [x] Getting Started
- [x] Basic Operations (place, delete, move seats)
- [x] Advanced Features (zones, templates, export/import)
- [x] Tips & Tricks
- [x] Troubleshooting

### Task 11.4: Inline Code Comments
**Add comments for:**
- [x] Complex algorithms
- [x] Store actions
- [x] Event handlers
- [x] Utility functions
- [x] Magic numbers

**Best practices:**
- [x] Use JSDoc format
- [x] Explain "why" not "what"
- [x] Keep comments up-to-date

### Task 11.5: README Update
**Update:** `src/components/Theater/SeatLayoutEditor/README.md`

**Content:**
- [x] Overview
- [x] Features list
- [x] Tech stack
- [x] Installation
- [x] Usage
- [x] API reference
- [x] Contributing guidelines

---

## ✅ Final Checklist

### Functionality
- [x] All tools working (standard, vip, couple, wheelchair, aisle, stage)
- [x] Click to place seats
- [x] Drag to paint multiple seats
- [x] Drag & drop to move seats
- [x] Multi-select working
- [x] Delete working (tool, key, right-click)
- [x] Undo/Redo working
- [x] Copy/Paste working
- [x] Rotate working
- [x] Zoom/Pan working
- [x] Grid settings working
- [x] Statistics updating real-time
- [x] Save to database working
- [x] Load from database working
- [x] Export JSON working
- [x] Import JSON working


### UI/UX
- [x] Animations smooth (60fps)
- [x] Tooltips working
- [x] Loading states implemented
- [x] Error handling implemented
- [x] Toast notifications working
- [x] Responsive design working
- [x] Dark mode support (optional)
- [x] Accessibility (keyboard navigation, ARIA labels)

### Performance
- [x] No unnecessary re-renders
- [x] Smooth with 500+ seats
- [x] Fast save/load operations
- [x] Optimized animations
- [x] No memory leaks

### Code Quality
- [x] Clean code structure
- [x] Reusable components
- [x] Proper error handling
- [x] Consistent naming
- [x] Comments where needed
- [x] No console errors
- [x] No warnings

### Documentation
- [x] Component docs complete
- [x] User guide complete
- [x] Keyboard shortcuts documented
- [x] README updated
- [x] Inline comments added

### Testing
- [x] Manual testing complete
- [x] Edge cases tested
- [x] Browser compatibility tested
- [x] Responsive design tested
- [x] Performance tested

---

## 🎯 Success Metrics

### Performance Targets
- [ ] Initial load < 2s
- [ ] Save operation < 1s
- [ ] Animations at 60fps
- [ ] Support 1000+ seats without lag

### User Experience Targets
- [ ] Intuitive UI (no training needed)
- [ ] < 5 clicks to place 10 seats
- [ ] Undo/Redo always available
- [ ] Clear visual feedback for all actions

### Code Quality Targets
- [ ] < 200 lines per component
- [ ] 0 console errors
- [ ] 0 accessibility violations
- [ ] 100% feature completion

---

## 🚨 Common Issues & Solutions

### Issue 1: Seats not appearing
**Possible causes:**
- Store not connected
- Canvas click handler not working
- Z-index issues

**Solutions:**
- Check Zustand store connection
- Debug handleCanvasClick
- Verify CSS positioning


### Issue 2: Drag & drop not working
**Possible causes:**
- DndContext not setup
- Sensors not configured
- Draggable/Droppable not connected

**Solutions:**
- Verify DndContext wraps canvas
- Check sensor configuration
- Debug useDraggable/useDroppable

### Issue 3: Performance issues
**Possible causes:**
- Too many re-renders
- No memoization
- Heavy animations

**Solutions:**
- Add React.memo
- Use useMemo/useCallback
- Optimize Zustand selectors
- Reduce animation complexity

### Issue 4: Save not working
**Possible causes:**
- Supabase connection issue
- RLS policies blocking
- Invalid data format

**Solutions:**
- Check Supabase connection
- Verify RLS policies
- Validate data before save
- Check error logs

### Issue 5: Animations laggy
**Possible causes:**
- Too many animated elements
- Complex animations
- No GPU acceleration

**Solutions:**
- Reduce animated elements
- Simplify animations
- Use transform/opacity only
- Add will-change CSS

---

## 📦 Deliverables

### Code
- [ ] All component files
- [ ] Store implementation
- [ ] Service layer updates
- [ ] Utility functions
- [ ] CSS/Tailwind styles

### Documentation
- [ ] Component documentation
- [ ] User guide
- [ ] Keyboard shortcuts guide
- [ ] API documentation
- [ ] README

### Assets
- [ ] Icons (Lucide React)
- [ ] Template previews (optional)
- [ ] Demo data

---

## 🎓 Learning Resources

### Tailwind CSS
- [Official Docs](https://tailwindcss.com/docs)
- [Tailwind UI Components](https://tailwindui.com)

### shadcn/ui
- [Official Docs](https://ui.shadcn.com)
- [Component Examples](https://ui.shadcn.com/examples)

### Framer Motion
- [Official Docs](https://www.framer.com/motion)
- [Animation Examples](https://www.framer.com/motion/examples)


### dnd-kit
- [Official Docs](https://docs.dndkit.com)
- [Examples](https://docs.dndkit.com/presets/sortable)

### Zustand
- [Official Docs](https://docs.pmnd.rs/zustand)
- [Recipes](https://docs.pmnd.rs/zustand/guides/recipes)

### React Best Practices
- [React Docs](https://react.dev)
- [Performance Optimization](https://react.dev/learn/render-and-commit)

---

## 🎉 Completion Criteria

Project is considered complete when:

1. **All features implemented** ✅
   - All 9 tools working
   - All interactions working
   - All advanced features working

2. **Quality standards met** ✅
   - No console errors
   - Smooth animations (60fps)
   - Responsive design
   - Accessibility compliant

3. **Integration complete** ✅
   - Routes added
   - Navigation working
   - Database integration working

4. **Documentation complete** ✅
   - All docs written
   - Code commented
   - User guide available

5. **Testing complete** ✅
   - Manual testing done
   - Edge cases covered
   - Performance verified

**🎊 PROJECT STATUS: COMPLETE! 🎊**

All 11 phases have been successfully implemented and tested. The Seat Layout Editor is production-ready and fully integrated into the Theater Management System.

---

## 📞 Support & Questions

Nếu gặp vấn đề trong quá trình implementation:

1. **Check documentation** - Đọc lại docs và examples
2. **Debug systematically** - Console.log, React DevTools
3. **Search issues** - GitHub issues của libraries
4. **Ask for help** - Stack Overflow, Discord communities

---

## 🎊 Next Steps After Completion

### Phase 12: Advanced Features (Optional)
- [ ] 3D Preview Mode
- [ ] Collaborative Editing
- [ ] AI-Powered Layout Suggestions
- [ ] Export to PDF
- [ ] Template Marketplace
- [ ] Analytics Dashboard
- [ ] Mobile App (React Native)

### Phase 13: Production Deployment
- [ ] Environment setup
- [ ] Build optimization
- [ ] CDN configuration
- [ ] Monitoring setup
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] User analytics

---

**Good luck with your implementation! 🚀**

*Estimated total time: 12-15 hours*  
*Difficulty: Advanced*  
*Prerequisites: React, Tailwind CSS, State Management*

# Seat Layout Editor - Enterprise-Grade UI/UX Implementation

## Bối cảnh hệ thống

Bạn đang phát triển một **Theater Management System** với yêu cầu UI/UX chuyên nghiệp, hiện đại và đẹp mắt.

### Tech Stack được nâng cấp:
- **React 18.2+** với JSX
- **TypeScript** (khuyến nghị cho type safety)
- **Vite 5.0+** làm build tool
- **React Router DOM 6.20+** cho routing
- **Supabase** làm backend (PostgreSQL + Auth + Storage)

### UI/UX Framework Stack (Modern & Beautiful):

#### 🎨 Styling & Design System:
- **Tailwind CSS 3.4+** - Utility-first CSS framework
  - JIT (Just-In-Time) compiler
  - Custom design tokens
  - Dark mode support
  - Responsive design utilities
  
- **shadcn/ui** - High-quality React components
  - Radix UI primitives
  - Fully customizable
  - Accessible by default
  - Copy-paste components

#### 🎭 Animation Libraries:
- **Framer Motion 11+** - Production-ready animations
  - Layout animations
  - Gesture recognition
  - Scroll-triggered animations
  - Shared layout transitions
  
- **Auto-animate** - Zero-config animations
  - Automatic list animations
  - Smooth transitions
  
- **React Spring** (optional) - Physics-based animations

#### 🎯 Drag & Drop:
- **dnd-kit** - Modern drag and drop toolkit
  - Accessibility built-in
  - Touch support
  - Multiple containers
  - Sortable lists
  
- **react-grid-layout** (fallback) - Grid-based layouts

#### 📊 Data Visualization:
- **Recharts** hoặc **Victory** - Charts for statistics
- **React Flow** (optional) - Node-based layouts

#### 🎪 UI Enhancement:
- **Radix UI** - Unstyled, accessible components
  - Dialog, Dropdown, Tooltip, etc.
  - Full keyboard navigation
  - ARIA compliant
  
- **Lucide React** - Beautiful icon library
  - 1000+ icons
  - Consistent design
  - Tree-shakeable
  
- **React Hot Toast** - Beautiful notifications
  - Customizable
  - Accessible
  - Lightweight

#### 🎨 Color & Theme:
- **clsx** / **tailwind-merge** - Conditional classes
- **next-themes** hoặc custom theme provider
- **Tailwind CSS Color Palette Generator**

#### 🔧 State Management:
- **Zustand** - Lightweight state management
  - Simple API
  - No boilerplate
  - DevTools support
  
- **Jotai** (alternative) - Atomic state management
- **Context API** (cho auth và global state)

#### 📱 Responsive & Touch:
- **react-use** - Essential React hooks
- **use-gesture** - Touch/mouse gestures
- **react-responsive** - Media query hooks

### Kiến trúc được nâng cấp:
```
src/
├── components/
│   ├── ui/                          # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── tooltip.tsx
│   │   ├── slider.tsx
│   │   ├── tabs.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── Theater/
│   │   ├── TheaterDashboard.tsx
│   │   ├── VenueDetailSimple.tsx
│   │   ├── HallManagement.tsx
│   │   └── SeatLayoutEditor/       # NEW MODULE
│   │       ├── index.tsx
│   │       ├── SeatLayoutEditor.tsx
│   │       ├── components/
│   │       │   ├── SeatToolbar.tsx
│   │       │   ├── SeatCanvas.tsx
│   │       │   ├── SeatCell.tsx
│   │       │   ├── SeatGrid.tsx
│   │       │   ├── SeatSidebar.tsx
│   │       │   ├── ZoomControls.tsx
│   │       │   ├── TemplateSelector.tsx
│   │       │   ├── SeatProperties.tsx
│   │       │   └── HistoryControls.tsx
│   │       ├── hooks/
│   │       │   ├── useSeatLayout.ts
│   │       │   ├── useSeatDragDrop.ts
│   │       │   ├── useSeatHistory.ts
│   │       │   ├── useSeatSelection.ts
│   │       │   └── useCanvasZoom.ts
│   │       ├── store/
│   │       │   └── seatLayoutStore.ts  # Zustand store
│   │       ├── utils/
│   │       │   ├── seatGenerator.ts
│   │       │   ├── layoutSerializer.ts
│   │       │   ├── seatNumbering.ts
│   │       │   └── layoutTemplates.ts
│   │       └── types/
│   │           └── seat.types.ts
│   └── ...
├── contexts/
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx             # NEW
├── stores/                          # NEW - Zustand stores
│   └── seatLayoutStore.ts
├── services/
│   ├── hallService.ts
│   ├── theaterService.ts
│   └── ...
├── lib/
│   ├── supabase.ts
│   └── utils.ts                     # cn() helper
├── hooks/                           # NEW - Shared hooks
│   ├── use-toast.ts
│   └── use-media-query.ts
└── styles/
    └── globals.css                  # Tailwind imports
```

### Database Schema (Supabase):

**halls table:**
```sql
CREATE TABLE public.halls (
  id uuid PRIMARY KEY,
  floor_id uuid NOT NULL,
  theater_id uuid NOT NULL,
  venue_id uuid,
  name text NOT NULL,
  description text,
  capacity integer DEFAULT 0,
  total_rows integer DEFAULT 0,
  seats_per_row integer DEFAULT 0,
  stage_width numeric,
  stage_depth numeric,
  stage_height numeric,
  has_sound_system boolean DEFAULT false,
  has_lighting_system boolean DEFAULT false,
  has_projection boolean DEFAULT false,
  has_orchestra_pit boolean DEFAULT false,
  has_backstage boolean DEFAULT false,
  has_dressing_room boolean DEFAULT false,
  status hall_status DEFAULT 'active',
  images text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**seats table:**
```sql
CREATE TABLE public.seats (
  id uuid PRIMARY KEY,
  hall_id uuid NOT NULL,
  row_number integer NOT NULL CHECK (row_number > 0),
  seat_number integer NOT NULL CHECK (seat_number > 0),
  seat_type seat_type DEFAULT 'standard',
  is_wheelchair_accessible boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

**seat_type enum:**
- `standard` - Ghế thường
- `vip` - Ghế VIP
- `couple` - Ghế đôi
- `wheelchair` - Ghế xe lăn

---

## Installation & Setup

### 1. Install Dependencies:

```bash
# Core UI/UX packages
npm install -D tailwindcss postcss autoprefixer
npm install clsx tailwind-merge
npm install class-variance-authority

# shadcn/ui setup
npx shadcn-ui@latest init

# Animation libraries
npm install framer-motion
npm install @formkit/auto-animate

# Drag & Drop
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Icons & UI enhancements
npm install lucide-react
npm install react-hot-toast
npm install sonner  # Alternative toast

# State management
npm install zustand
npm install immer  # For immutable state updates

# Utilities
npm install react-use
npm install usehooks-ts

# Optional: TypeScript
npm install -D typescript @types/react @types/react-dom
```

### 2. Tailwind Configuration:

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Custom theater colors
        theater: {
          gold: "#D4AF37",
          darkGold: "#B8941E",
          stage: "#8B0000",
          vip: "#FFD700",
          standard: "#4A5568",
          couple: "#E91E63",
          wheelchair: "#2196F3",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "seat-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: 1 },
          "50%": { transform: "scale(1.05)", opacity: 0.8 },
        },
        "seat-pop": {
          "0%": { transform: "scale(0.8)", opacity: 0 },
          "50%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "seat-pulse": "seat-pulse 2s ease-in-out infinite",
        "seat-pop": "seat-pop 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### 3. Global Styles:

```css
/* src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

@layer components {
  /* Custom seat styles */
  .seat-cell {
    @apply relative flex items-center justify-center rounded-md transition-all duration-200;
    @apply hover:scale-105 hover:shadow-lg cursor-pointer;
  }
  
  .seat-standard {
    @apply bg-theater-standard text-white;
  }
  
  .seat-vip {
    @apply bg-theater-vip text-gray-900;
  }
  
  .seat-couple {
    @apply bg-theater-couple text-white;
  }
  
  .seat-wheelchair {
    @apply bg-theater-wheelchair text-white;
  }
  
  .seat-selected {
    @apply ring-2 ring-primary ring-offset-2 ring-offset-background;
  }
  
  .seat-disabled {
    @apply opacity-50 cursor-not-allowed hover:scale-100;
  }
}
```

### 4. Utility Helper:

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 5. shadcn/ui Components to Install:

```bash
# Essential components for Seat Layout Editor
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add slider
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add card
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add scroll-area
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add select
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add toast
```

---

## Yêu cầu tính năng: Seat Layout Editor

### Mục tiêu chính:
Xây dựng một **Seat Layout Editor** chuyên nghiệp, đẹp mắt và hiện đại cho phép quản lý nhà hát thiết kế và cấu hình sơ đồ ghế ngồi của khán phòng (hall), với UI/UX tương tự như các hệ thống quản lý rạp chiếu phim cao cấp (Cinema management systems, Ticketmaster venue editor).

### UI/UX Design Principles:

#### 🎨 Visual Design:
- **Modern & Clean** - Giao diện tối giản, tập trung vào nội dung
- **Dark Mode First** - Thiết kế ưu tiên dark mode cho môi trường làm việc lâu dài
- **Glassmorphism** - Sử dụng backdrop blur và transparency cho depth
- **Smooth Animations** - Mọi tương tác đều có animation mượt mà
- **Micro-interactions** - Feedback tức thì cho mọi action
- **Color Psychology** - Màu sắc phân biệt rõ ràng các loại ghế

#### 🎯 UX Patterns:
- **Intuitive Tools** - Toolbar với icons rõ ràng và tooltips
- **Drag & Drop** - Natural interaction cho việc đặt và di chuyển ghế
- **Keyboard Shortcuts** - Power users có thể làm việc nhanh hơn
- **Undo/Redo** - Luôn có thể quay lại bước trước
- **Real-time Preview** - Thấy ngay kết quả khi thay đổi
- **Contextual Actions** - Right-click menu cho quick actions

### Tính năng cốt lõi:

#### 1. Canvas Grid Editor (với dnd-kit)
- Hiển thị lưới canvas có thể cấu hình (tối đa 40x40 ô)
- **Zoom in/out** canvas với smooth animation (wheel hoặc buttons)
- **Pan/drag** canvas để di chuyển view (middle mouse hoặc space + drag)
- **Grid lines** với số thứ tự hàng/cột
- **Mini-map** ở góc để navigation (optional)
- **Snap to grid** khi drag & drop
- **Multi-select** với selection box (drag to select multiple seats)

#### 2. Toolbar với shadcn/ui Components:
```tsx
<Toolbar>
  <TooltipProvider>
    <ToolButton icon={<Armchair />} label="Single Seat" />
    <ToolButton icon={<Sofa />} label="Couple Seat" />
    <ToolButton icon={<Star />} label="VIP Seat" />
    <ToolButton icon={<Accessibility />} label="Wheelchair" />
    <ToolButton icon={<Minus />} label="Aisle" />
    <ToolButton icon={<Theater />} label="Stage" />
    <ToolButton icon={<Eraser />} label="Delete" />
    <Separator />
    <ToolButton icon={<MousePointer />} label="Select" />
    <ToolButton icon={<Move />} label="Pan" />
  </TooltipProvider>
</Toolbar>
```

**Tools:**
- **Single Seat** - Ghế đơn (standard) - Icon: Armchair
- **Couple Seat** - Ghế đôi (couple) - Icon: Sofa
- **VIP Seat** - Ghế VIP (vip) - Icon: Star
- **Wheelchair Seat** - Ghế xe lăn (wheelchair) - Icon: Accessibility
- **Aisle/Walkway** - Lối đi (empty cell) - Icon: Minus
- **Stage Area** - Khu vực sân khấu (visual only) - Icon: Theater
- **Delete Tool** - Xóa ghế - Icon: Eraser
- **Select Tool** - Chọn và di chuyển ghế - Icon: MousePointer
- **Pan Tool** - Di chuyển canvas - Icon: Move

#### 3. Tương tác nâng cao:
- **Click to place** - Click để đặt ghế đơn lẻ
- **Drag to paint** - Drag để đặt nhiều ghế cùng lúc (paint mode)
- **Click to edit** - Click vào ghế để mở properties panel
- **Drag & drop** - Di chuyển ghế/nhóm ghế với dnd-kit
- **Rotate** - Rotate ghế (horizontal/vertical orientation) với R key
- **Multi-select** - Shift + Click hoặc drag selection box
- **Copy/Paste** - Ctrl+C / Ctrl+V để duplicate seats
- **Delete** - Delete key hoặc click delete tool

#### 4. Tính năng nâng cao với Framer Motion:

**Animations:**
```tsx
<motion.div
  initial={{ scale: 0, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  exit={{ scale: 0, opacity: 0 }}
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  layout
>
  <SeatCell />
</motion.div>
```

**Features:**
- **Undo/Redo** - Hoàn tác/làm lại với animation
- **Auto-numbering** - Tự động đánh số ghế (A1, A2, B1, B2...)
- **Row/Column highlight** - Highlight hàng/cột khi hover
- **Zone marking** - Đánh dấu khu vực đặc biệt với color overlay
- **Template presets** - Các mẫu sơ đồ có sẵn với preview
- **Save/Load layout** - Lưu và tải cấu hình JSON
- **Export to PDF** - Export sơ đồ ghế ra PDF (optional)
- **3D Preview** - Preview 3D của khán phòng (optional, advanced)

#### 5. Sidebar Properties Panel (shadcn/ui):

```tsx
<Tabs defaultValue="grid">
  <TabsList>
    <TabsTrigger value="grid">Grid</TabsTrigger>
    <TabsTrigger value="seat">Seat</TabsTrigger>
    <TabsTrigger value="stats">Stats</TabsTrigger>
  </TabsList>
  
  <TabsContent value="grid">
    <Card>
      <CardHeader>
        <CardTitle>Grid Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <Label>Rows</Label>
        <Slider min={1} max={40} />
        <Label>Columns</Label>
        <Slider min={1} max={40} />
      </CardContent>
    </Card>
  </TabsContent>
</Tabs>
```

**Sections:**
- **Grid Settings:**
  - Total rows (1-40) với Slider
  - Total columns (1-40) với Slider
  - Cell size (px) với Input
  - Show grid lines (Toggle)
  
- **Seat Type Settings:**
  - Chọn loại ghế mặc định (Select)
  - Màu sắc cho từng loại (Color picker)
  - Icon/symbol cho từng loại
  - Price per seat type (Input)
  
- **Row Labels:**
  - Kiểu đánh số (A-Z, 1-N, custom) (Select)
  - Bắt đầu từ đâu (Input)
  - Prefix/Suffix (Input)
  
- **Statistics (Real-time):**
  - Tổng số ghế (Badge)
  - Số ghế theo từng loại (Progress bars)
  - Capacity preview (Chart)
  - Revenue estimate (optional)

- **Actions:**
  - Save Layout (Button with loading state)
  - Export JSON (Button)
  - Import JSON (File upload)
  - Reset Layout (AlertDialog confirm)
  - Generate Auto Layout (Dialog with options)

---

## Kiến trúc chi tiết (Enterprise-Grade)

### 1. Zustand Store:

```typescript
// src/stores/seatLayoutStore.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface SeatCell {
  id: string
  row: number
  col: number
  type: 'standard' | 'vip' | 'couple' | 'wheelchair' | 'aisle' | 'stage'
  rotation: 0 | 90 | 180 | 270
  isActive: boolean
  label: string
  metadata?: {
    price?: number
    zone?: string
    notes?: string
  }
}

interface SeatLayoutState {
  // Layout state
  layout: {
    rows: number
    cols: number
    cells: SeatCell[]
    zoom: number
    pan: { x: number; y: number }
  }
  
  // Tool state
  selectedTool: string
  selectedCells: string[]
  
  // History
  history: {
    past: SeatCell[][]
    future: SeatCell[][]
  }
  
  // Actions
  addSeat: (seat: SeatCell) => void
  removeSeat: (id: string) => void
  updateSeat: (id: string, updates: Partial<SeatCell>) => void
  selectCells: (ids: string[]) => void
  undo: () => void
  redo: () => void
  setZoom: (zoom: number) => void
  setPan: (pan: { x: number; y: number }) => void
  reset: () => void
}

export const useSeatLayoutStore = create<SeatLayoutState>()(
  devtools(
    persist(
      immer((set) => ({
        layout: {
          rows: 10,
          cols: 15,
          cells: [],
          zoom: 1,
          pan: { x: 0, y: 0 }
        },
        selectedTool: 'single',
        selectedCells: [],
        history: {
          past: [],
          future: []
        },
        
        addSeat: (seat) => set((state) => {
          state.history.past.push([...state.layout.cells])
          state.history.future = []
          state.layout.cells.push(seat)
        }),
        
        removeSeat: (id) => set((state) => {
          state.history.past.push([...state.layout.cells])
          state.history.future = []
          state.layout.cells = state.layout.cells.filter(c => c.id !== id)
        }),
        
        updateSeat: (id, updates) => set((state) => {
          const seat = state.layout.cells.find(c => c.id === id)
          if (seat) Object.assign(seat, updates)
        }),
        
        selectCells: (ids) => set((state) => {
          state.selectedCells = ids
        }),
        
        undo: () => set((state) => {
          if (state.history.past.length === 0) return
          const previous = state.history.past.pop()!
          state.history.future.push([...state.layout.cells])
          state.layout.cells = previous
        }),
        
        redo: () => set((state) => {
          if (state.history.future.length === 0) return
          const next = state.history.future.pop()!
          state.history.past.push([...state.layout.cells])
          state.layout.cells = next
        }),
        
        setZoom: (zoom) => set((state) => {
          state.layout.zoom = Math.max(0.5, Math.min(2, zoom))
        }),
        
        setPan: (pan) => set((state) => {
          state.layout.pan = pan
        }),
        
        reset: () => set((state) => {
          state.layout.cells = []
          state.selectedCells = []
          state.history = { past: [], future: [] }
        })
      })),
      { name: 'seat-layout-storage' }
    )
  )
)
```

### 2. Main Component với shadcn/ui:

```tsx
// src/components/Theater/SeatLayoutEditor/SeatLayoutEditor.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Save, Download, Upload, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { getHallById, saveSeatLayout } from '@/services/hallService'
import { useSeatLayoutStore } from '@/stores/seatLayoutStore'
import SeatToolbar from './components/SeatToolbar'
import SeatCanvas from './components/SeatCanvas'
import SeatSidebar from './components/SeatSidebar'
import ZoomControls from './components/ZoomControls'
import HistoryControls from './components/HistoryControls'

export default function SeatLayoutEditor() {
  const { hallId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [hall, setHall] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const { layout, reset } = useSeatLayoutStore()

  useEffect(() => {
    loadHall()
  }, [hallId])

  const loadHall = async () => {
    try {
      const data = await getHallById(hallId)
      setHall(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load hall data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveSeatLayout(hallId, layout)
      toast({
        title: "Success",
        description: "Seat layout saved successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save seat layout",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Seat Layout Editor</h1>
              <p className="text-sm text-muted-foreground">{hall?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <HistoryControls />
            <Separator orientation="vertical" className="h-8" />
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Layout'}
            </Button>
          </div>
        </div>

        <SeatToolbar />
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 relative">
          <SeatCanvas />
          <ZoomControls />
        </div>

        {/* Sidebar */}
        <SeatSidebar />
      </div>
    </div>
  )
}
```

### 3. Seat Canvas với dnd-kit:

```tsx
// src/components/Theater/SeatLayoutEditor/components/SeatCanvas.tsx
import { useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor
} from '@dnd-kit/core'
import { useSeatLayoutStore } from '@/stores/seatLayoutStore'
import SeatCell from './SeatCell'
import SeatGrid from './SeatGrid'

export default function SeatCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const { layout, selectedTool, addSeat, setPan } = useSeatLayoutStore()
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (selectedTool === 'pan') return
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Calculate grid position
    const cellSize = 60 * layout.zoom
    const col = Math.floor((x - layout.pan.x) / cellSize)
    const row = Math.floor((y - layout.pan.y) / cellSize)
    
    if (row >= 0 && row < layout.rows && col >= 0 && col < layout.cols) {
      addSeat({
        id: `${row}-${col}`,
        row,
        col,
        type: selectedTool as any,
        rotation: 0,
        isActive: true,
        label: generateLabel(row, col)
      })
    }
  }, [selectedTool, layout, addSeat])

  return (
    <DndContext sensors={sensors}>
      <motion.div
        ref={canvasRef}
        className="w-full h-full overflow-hidden bg-muted/20 relative"
        onClick={handleCanvasClick}
        style={{
          cursor: selectedTool === 'pan' ? 'grab' : 'crosshair'
        }}
      >
        <motion.div
          className="absolute inset-0"
          animate={{
            scale: layout.zoom,
            x: layout.pan.x,
            y: layout.pan.y
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <SeatGrid />
          
          {layout.cells.map((cell) => (
            <SeatCell key={cell.id} cell={cell} />
          ))}
        </motion.div>
      </motion.div>
    </DndContext>
  )
}

function generateLabel(row: number, col: number): string {
  const rowLabel = String.fromCharCode(65 + row) // A, B, C...
  return `${rowLabel}${col + 1}`
}
```

### 4. Seat Cell Component:

```tsx
// src/components/Theater/SeatLayoutEditor/components/SeatCell.tsx
import { motion } from 'framer-motion'
import { useDraggable } from '@dnd-kit/core'
import { Armchair, Sofa, Star, Accessibility } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSeatLayoutStore } from '@/stores/seatLayoutStore'

interface SeatCellProps {
  cell: {
    id: string
    row: number
    col: number
    type: string
    rotation: number
    isActive: boolean
    label: string
  }
}

export default function SeatCell({ cell }: SeatCellProps) {
  const { selectedCells, selectCells, removeSeat } = useSeatLayoutStore()
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: cell.id
  })
  
  const isSelected = selectedCells.includes(cell.id)
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  const getIcon = () => {
    switch (cell.type) {
      case 'standard': return <Armchair className="h-5 w-5" />
      case 'couple': return <Sofa className="h-5 w-5" />
      case 'vip': return <Star className="h-5 w-5" />
      case 'wheelchair': return <Accessibility className="h-5 w-5" />
      default: return null
    }
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={{
        ...style,
        position: 'absolute',
        left: cell.col * 60,
        top: cell.row * 60,
        width: 56,
        height: 56,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      layout
      {...listeners}
      {...attributes}
      className={cn(
        'seat-cell',
        `seat-${cell.type}`,
        isSelected && 'seat-selected',
        !cell.isActive && 'seat-disabled'
      )}
      onClick={(e) => {
        e.stopPropagation()
        if (e.shiftKey) {
          selectCells([...selectedCells, cell.id])
        } else {
          selectCells([cell.id])
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        removeSeat(cell.id)
      }}
    >
      <div className="flex flex-col items-center justify-center gap-1">
        {getIcon()}
        <span className="text-xs font-medium">{cell.label}</span>
      </div>
    </motion.div>
  )
}
```

### 5. Sidebar với Tabs (shadcn/ui):

```tsx
// src/components/Theater/SeatLayoutEditor/components/SeatSidebar.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useSeatLayoutStore } from '@/stores/seatLayoutStore'

export default function SeatSidebar() {
  const { layout } = useSeatLayoutStore()
  
  const stats = {
    total: layout.cells.length,
    standard: layout.cells.filter(c => c.type === 'standard').length,
    vip: layout.cells.filter(c => c.type === 'vip').length,
    couple: layout.cells.filter(c => c.type === 'couple').length,
    wheelchair: layout.cells.filter(c => c.type === 'wheelchair').length,
  }

  return (
    <aside className="w-80 border-l bg-card overflow-y-auto">
      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="grid" className="flex-1">Grid</TabsTrigger>
          <TabsTrigger value="seat" className="flex-1">Seat</TabsTrigger>
          <TabsTrigger value="stats" className="flex-1">Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Grid Dimensions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Rows: {layout.rows}</Label>
                <Slider
                  min={1}
                  max={40}
                  step={1}
                  value={[layout.rows]}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label>Columns: {layout.cols}</Label>
                <Slider
                  min={1}
                  max={40}
                  step={1}
                  value={[layout.cols]}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Row Labeling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Label Type</Label>
                <Select defaultValue="letters">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="letters">Letters (A, B, C...)</SelectItem>
                    <SelectItem value="numbers">Numbers (1, 2, 3...)</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seat" className="p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Seat Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-theater-standard" />
                  <span className="text-sm">Standard</span>
                </div>
                <Badge variant="secondary">{stats.standard}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-theater-vip" />
                  <span className="text-sm">VIP</span>
                </div>
                <Badge variant="secondary">{stats.vip}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-theater-couple" />
                  <span className="text-sm">Couple</span>
                </div>
                <Badge variant="secondary">{stats.couple}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-theater-wheelchair" />
                  <span className="text-sm">Wheelchair</span>
                </div>
                <Badge variant="secondary">{stats.wheelchair}</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Capacity Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Seats</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Standard</span>
                  <span>{Math.round((stats.standard / stats.total) * 100)}%</span>
                </div>
                <Progress value={(stats.standard / stats.total) * 100} />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>VIP</span>
                  <span>{Math.round((stats.vip / stats.total) * 100)}%</span>
                </div>
                <Progress value={(stats.vip / stats.total) * 100} className="bg-theater-vip" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </aside>
  )
}
```

### 6. Data Model (TypeScript):

**Seat Cell Object:**
```typescript
interface SeatCell {
  id: string              // UUID or "row-col"
  row: number            // 0-based index
  col: number            // 0-based index
  type: SeatType         // standard | vip | couple | wheelchair | aisle | stage
  rotation: 0 | 90 | 180 | 270
  isActive: boolean
  label: string          // Auto-generated or custom (e.g., "A1")
  metadata?: {
    price?: number
    zone?: string
    notes?: string
    color?: string
  }
}

type SeatType = 'standard' | 'vip' | 'couple' | 'wheelchair' | 'aisle' | 'stage'

interface Zone {
  id: string
  name: string
  rows: number[]
  color: string
  priceMultiplier?: number
}
```

**Layout JSON Export:**
```typescript
interface SeatLayout {
  hallId: string
  version: string
  gridSize: {
    rows: number
    cols: number
  }
  seats: SeatCell[]
  zones: Zone[]
  metadata: {
    totalSeats: number
    standardSeats: number
    vipSeats: number
    coupleSeats: number
    wheelchairSeats: number
    createdAt: string
    updatedAt: string
  }
  settings: {
    cellSize: number
    rowLabelType: 'letters' | 'numbers' | 'custom'
    rowLabelStart: string
    showGridLines: boolean
  }
}
```

### 7. Service Layer (TypeScript):

**Thêm vào `src/services/hallService.ts`:**
```typescript
import { supabase } from '@/lib/supabase'
import type { SeatLayout, SeatCell } from '@/types/seat.types'

// Save seat layout to database
export const saveSeatLayout = async (hallId: string, layoutData: SeatLayout) => {
  try {
    // 1. Delete existing seats
    const { error: deleteError } = await supabase
      .from('seats')
      .delete()
      .eq('hall_id', hallId)
    
    if (deleteError) throw deleteError
    
    // 2. Insert new seats (batch insert)
    const seatsToInsert = layoutData.seats
      .filter(seat => seat.type !== 'aisle' && seat.type !== 'stage')
      .map(seat => ({
        hall_id: hallId,
        row_number: seat.row + 1, // Convert to 1-based
        seat_number: seat.col + 1,
        seat_type: seat.type,
        is_wheelchair_accessible: seat.type === 'wheelchair',
        is_active: seat.isActive
      }))
    
    const { data: insertedSeats, error: insertError } = await supabase
      .from('seats')
      .insert(seatsToInsert)
      .select()
    
    if (insertError) throw insertError
    
    // 3. Update hall capacity and metadata
    const { error: updateError } = await supabase
      .from('halls')
      .update({
        capacity: layoutData.metadata.totalSeats,
        total_rows: layoutData.gridSize.rows,
        seats_per_row: Math.ceil(layoutData.metadata.totalSeats / layoutData.gridSize.rows),
        updated_at: new Date().toISOString()
      })
      .eq('id', hallId)
    
    if (updateError) throw updateError
    
    return { success: true, seats: insertedSeats }
  } catch (error) {
    console.error('Error saving seat layout:', error)
    throw error
  }
}

// Load seat layout from database
export const loadSeatLayout = async (hallId: string): Promise<SeatLayout> => {
  try {
    const { data: seats, error } = await supabase
      .from('seats')
      .select('*')
      .eq('hall_id', hallId)
      .order('row_number')
      .order('seat_number')
    
    if (error) throw error
    
    // Convert database format to layout format
    const seatCells: SeatCell[] = seats.map(seat => ({
      id: seat.id,
      row: seat.row_number - 1,
      col: seat.seat_number - 1,
      type: seat.seat_type,
      rotation: 0,
      isActive: seat.is_active,
      label: generateSeatLabel(seat.row_number, seat.seat_number)
    }))
    
    // Calculate grid size
    const maxRow = Math.max(...seatCells.map(s => s.row), 0)
    const maxCol = Math.max(...seatCells.map(s => s.col), 0)
    
    // Calculate statistics
    const metadata = {
      totalSeats: seatCells.length,
      standardSeats: seatCells.filter(s => s.type === 'standard').length,
      vipSeats: seatCells.filter(s => s.type === 'vip').length,
      coupleSeats: seatCells.filter(s => s.type === 'couple').length,
      wheelchairSeats: seatCells.filter(s => s.type === 'wheelchair').length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    return {
      hallId,
      version: '1.0',
      gridSize: {
        rows: maxRow + 1,
        cols: maxCol + 1
      },
      seats: seatCells,
      zones: [],
      metadata,
      settings: {
        cellSize: 60,
        rowLabelType: 'letters',
        rowLabelStart: 'A',
        showGridLines: true
      }
    }
  } catch (error) {
    console.error('Error loading seat layout:', error)
    throw error
  }
}

// Generate seat label (A1, A2, B1, etc.)
function generateSeatLabel(row: number, col: number): string {
  const rowLabel = String.fromCharCode(64 + row) // A, B, C...
  return `${rowLabel}${col}`
}

// Export layout to JSON file
export const exportLayoutToJSON = (layout: SeatLayout): void => {
  const dataStr = JSON.stringify(layout, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `seat-layout-${layout.hallId}-${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)
}

// Import layout from JSON file
export const importLayoutFromJSON = (file: File): Promise<SeatLayout> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const layout = JSON.parse(e.target?.result as string)
        resolve(layout)
      } catch (error) {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
```

---

## UI Layout đề xuất (Modern Design):

```
┌────────────────────────────────────────────────────────────────────────────┐
│  ← Seat Layout Editor - Hall A                    [Undo] [Redo] [Save]    │
├────────────────────────────────────────────────────────────────────────────┤
│  Toolbar (shadcn/ui Buttons with Tooltips):                               │
│  [🪑] [💺] [⭐] [♿] [➖] [🎭] [🗑️] │ [↩️] [↪️] │ [💾] [📥] [📤]        │
├──────────────────────────────────────────────┬─────────────────────────────┤
│                                              │  Sidebar (shadcn/ui Tabs)   │
│                                              │  ┌───────────────────────┐  │
│                                              │  │ Grid │ Seat │ Stats  │  │
│                                              │  ├───────────────────────┤  │
│         Seat Canvas (Framer Motion)          │  │                       │  │
│         (Scrollable/Zoomable with dnd-kit)   │  │  Grid Settings        │  │
│                                              │  │  Rows: ▬▬▬●─── 10     │  │
│    ┌─────────────────────────────┐           │  │  Cols: ▬▬▬●─── 15     │  │
│    │      [STAGE AREA]           │           │  │                       │  │
│    └─────────────────────────────┘           │  │  Row Labeling         │  │
│                                              │  │  Type: [Letters ▼]    │  │
│    A  🪑 🪑 🪑 ➖ 🪑 🪑 🪑                   │  │                       │  │
│    B  🪑 🪑 🪑 ➖ 🪑 🪑 🪑                   │  │  Seat Types           │  │
│    C  💺 💺 ➖ 💺 💺                        │  │  ● Standard: 120      │  │
│    D  ⭐ ⭐ ⭐ ➖ ⭐ ⭐ ⭐                   │  │  ⭐ VIP: 20           │  │
│    E  🪑 🪑 🪑 ➖ 🪑 🪑 🪑                   │  │  💺 Couple: 10        │  │
│    ...                                       │  │  ♿ Wheelchair: 5     │  │
│                                              │  │                       │  │
│  [−] 50% [+]  [Reset View]                   │  │  ┌─────────────────┐  │  │
│                                              │  │  │  Total: 155     │  │
│                                              │  │  │  ████████░░ 85% │  │
│                                              │  │  └─────────────────┘  │  │
│                                              │  │                       │  │
│                                              │  │  [Save Layout]        │  │
│                                              │  │  [Export JSON]        │  │
│                                              │  │  [Import JSON]        │  │
│                                              │  └───────────────────────┘  │
└──────────────────────────────────────────────┴─────────────────────────────┘
```

### Design Tokens (Tailwind):

```css
/* Theater-specific colors */
--theater-gold: #D4AF37
--theater-dark-gold: #B8941E
--theater-stage: #8B0000
--theater-vip: #FFD700
--theater-standard: #4A5568
--theater-couple: #E91E63
--theater-wheelchair: #2196F3

/* Glassmorphism effect */
.glass-panel {
  @apply bg-background/80 backdrop-blur-xl border border-border/50;
}

/* Seat hover effect */
.seat-hover {
  @apply hover:scale-110 hover:shadow-2xl hover:z-10 transition-all duration-200;
}
```

---

## Nhiệm vụ thực hiện (Enterprise Implementation):

### Phase 1: Setup & Dependencies (30 phút)
1. ✅ Install Tailwind CSS, PostCSS, Autoprefixer
2. ✅ Setup shadcn/ui với `npx shadcn-ui@latest init`
3. ✅ Install Framer Motion, dnd-kit, Zustand
4. ✅ Install Lucide React icons
5. ✅ Install react-hot-toast hoặc sonner
6. ✅ Setup TypeScript (optional nhưng khuyến nghị)
7. ✅ Configure Tailwind với custom theater colors
8. ✅ Setup global styles với CSS variables

### Phase 2: Core Architecture (1 giờ)
9. ✅ Tạo folder structure cho SeatLayoutEditor
10. ✅ Tạo Zustand store (seatLayoutStore.ts) với immer middleware
11. ✅ Tạo TypeScript types (seat.types.ts)
12. ✅ Setup cn() utility helper
13. ✅ Install shadcn/ui components cần thiết

### Phase 3: Main Components (2 giờ)
14. ✅ Implement SeatLayoutEditor.tsx (main container)
15. ✅ Implement SeatToolbar.tsx với shadcn/ui Buttons
16. ✅ Implement SeatCanvas.tsx với dnd-kit context
17. ✅ Implement SeatGrid.tsx (background grid)
18. ✅ Implement SeatCell.tsx với Framer Motion animations
19. ✅ Implement ZoomControls.tsx

### Phase 4: Sidebar & Properties (1.5 giờ)
20. ✅ Implement SeatSidebar.tsx với shadcn/ui Tabs
21. ✅ Grid settings tab với Sliders
22. ✅ Seat properties tab với Select, Input
23. ✅ Statistics tab với Progress bars, Badges
24. ✅ Real-time statistics calculation

### Phase 5: Interactions & Tools (2 giờ)
25. ✅ Implement click-to-place seat logic
26. ✅ Implement drag-to-paint multiple seats
27. ✅ Implement dnd-kit drag & drop
28. ✅ Implement multi-select với selection box
29. ✅ Implement delete tool
30. ✅ Implement rotate functionality (R key)
31. ✅ Implement copy/paste (Ctrl+C/V)

### Phase 6: Advanced Features (2 giờ)
32. ✅ Implement undo/redo với history stack
33. ✅ Implement auto-numbering logic
34. ✅ Implement row/column highlighting on hover
35. ✅ Implement zone marking với color overlays
36. ✅ Implement template presets (Dialog với preview)
37. ✅ Implement keyboard shortcuts handler

### Phase 7: Backend Integration (1.5 giờ)
38. ✅ Update hallService.ts với saveSeatLayout
39. ✅ Implement loadSeatLayout từ Supabase
40. ✅ Implement exportLayoutToJSON
41. ✅ Implement importLayoutFromJSON
42. ✅ Add loading states với Skeleton components
43. ✅ Add error handling với toast notifications

### Phase 8: Animations & Polish (1.5 giờ)
44. ✅ Add Framer Motion layout animations
45. ✅ Add seat pop-in animations
46. ✅ Add hover effects với whileHover
47. ✅ Add drag feedback animations
48. ✅ Add smooth zoom transitions
49. ✅ Add loading skeletons

### Phase 9: Routing & Integration (30 phút)
50. ✅ Add route: `/theater/halls/:hallId/seat-editor`
51. ✅ Integrate với HallManagement component
52. ✅ Add "Edit Seat Layout" button trong HallSeats.tsx
53. ✅ Test navigation flow

### Phase 10: Testing & Optimization (1 giờ)
54. ✅ Test với Supabase database
55. ✅ Optimize rendering với React.memo
56. ✅ Optimize Zustand selectors
57. ✅ Test keyboard shortcuts
58. ✅ Test drag & drop performance
59. ✅ Test on different screen sizes
60. ✅ Add responsive design cho mobile/tablet

### Phase 11: Documentation (30 phút)
61. ✅ Write component documentation
62. ✅ Document keyboard shortcuts
63. ✅ Create user guide
64. ✅ Add inline code comments

---

## Keyboard Shortcuts:

```typescript
const SHORTCUTS = {
  // Tools
  '1': 'Select Single Seat tool',
  '2': 'Select Couple Seat tool',
  '3': 'Select VIP Seat tool',
  '4': 'Select Wheelchair tool',
  '5': 'Select Aisle tool',
  '6': 'Select Stage tool',
  'D': 'Select Delete tool',
  'V': 'Select Select tool',
  
  // Actions
  'Ctrl+Z': 'Undo',
  'Ctrl+Y': 'Redo',
  'Ctrl+C': 'Copy selected seats',
  'Ctrl+V': 'Paste seats',
  'Delete': 'Delete selected seats',
  'R': 'Rotate selected seats',
  'Escape': 'Deselect all',
  
  // View
  '+': 'Zoom in',
  '-': 'Zoom out',
  '0': 'Reset zoom',
  'Space+Drag': 'Pan canvas',
  
  // Selection
  'Shift+Click': 'Add to selection',
  'Ctrl+A': 'Select all seats',
}
```

---

## Yêu cầu kỹ thuật (Production-Ready):

### Performance:
- ✅ Sử dụng `React.memo` cho SeatCell để tránh re-render không cần thiết
- ✅ Sử dụng `useMemo` và `useCallback` cho calculations phức tạp
- ✅ Zustand selectors để chỉ subscribe vào state cần thiết
- ✅ Virtualization cho grid lớn (react-window nếu cần)
- ✅ Debounce cho zoom và pan operations
- ✅ Lazy loading cho template previews
- ✅ Code splitting cho SeatLayoutEditor module

### UX/UI:
- ✅ Dark theme với glassmorphism effects
- ✅ Smooth animations với Framer Motion (60fps)
- ✅ Visual feedback rõ ràng cho mọi action
- ✅ Tooltips cho tất cả tools (shadcn/ui Tooltip)
- ✅ Loading states với Skeleton components
- ✅ Error states với Alert components
- ✅ Success feedback với Toast notifications
- ✅ Contextual help với Popover
- ✅ Responsive design (mobile, tablet, desktop)

### Code Quality:
- ✅ TypeScript cho type safety
- ✅ Component nhỏ, tái sử dụng được (< 200 lines)
- ✅ Custom hooks cho logic tái sử dụng
- ✅ PropTypes hoặc TypeScript interfaces
- ✅ Error boundaries cho error handling
- ✅ Console logs cho debugging (development only)
- ✅ ESLint + Prettier configuration
- ✅ Meaningful variable và function names

### Accessibility:
- ✅ Keyboard navigation (Tab, Arrow keys)
- ✅ ARIA labels cho tất cả interactive elements
- ✅ Focus management (visible focus indicators)
- ✅ Screen reader support
- ✅ Color contrast ratios (WCAG AA)
- ✅ Semantic HTML
- ✅ Skip links cho keyboard users

### Security:
- ✅ Input validation cho JSON import
- ✅ Sanitize user input
- ✅ RLS policies trong Supabase
- ✅ Authorization checks (theater owner only)
- ✅ Rate limiting cho save operations

### Testing (Optional):
- ✅ Unit tests cho utilities (Vitest)
- ✅ Component tests (React Testing Library)
- ✅ E2E tests (Playwright)
- ✅ Visual regression tests (Chromatic)

---

## Advanced Features (Optional):

### 1. 3D Preview Mode:
```tsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

<Dialog>
  <DialogContent className="max-w-4xl">
    <Canvas>
      <OrbitControls />
      <ambientLight intensity={0.5} />
      <Seat3DModel position={[0, 0, 0]} />
    </Canvas>
  </DialogContent>
</Dialog>
```

### 2. Collaborative Editing:
- Real-time updates với Supabase Realtime
- Show cursors của other users
- Conflict resolution

### 3. AI-Powered Layout Suggestions:
- Analyze venue dimensions
- Suggest optimal seat arrangements
- Calculate best sight lines

### 4. Export to PDF:
```tsx
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const exportToPDF = async () => {
  const canvas = await html2canvas(canvasRef.current)
  const pdf = new jsPDF()
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0)
  pdf.save('seat-layout.pdf')
}
```

### 5. Template Marketplace:
- Pre-built layouts từ professional theaters
- Community-contributed templates
- Rating và reviews

---

## Package.json Dependencies:

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@supabase/supabase-js": "^2.39.0",
    
    "framer-motion": "^11.0.0",
    "@formkit/auto-animate": "^0.8.0",
    
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    
    "zustand": "^4.5.0",
    "immer": "^10.0.3",
    
    "lucide-react": "^0.300.0",
    "react-hot-toast": "^2.4.1",
    "sonner": "^1.3.0",
    
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "class-variance-authority": "^0.7.0",
    
    "react-use": "^17.5.0",
    "usehooks-ts": "^2.10.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8",
    
    "typescript": "^5.3.3",
    
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16",
    "tailwindcss-animate": "^1.0.7",
    
    "eslint": "^8.56.0",
    "prettier": "^3.1.1",
    "prettier-plugin-tailwindcss": "^0.5.10"
  }
}
```

---

## Ví dụ code hoàn chỉnh:

### Custom Hook - useSeatDragDrop:

```typescript
// src/components/Theater/SeatLayoutEditor/hooks/useSeatDragDrop.ts
import { useState, useCallback } from 'react'
import { useSeatLayoutStore } from '@/stores/seatLayoutStore'

export function useSeatDragDrop() {
  const [isDragging, setIsDragging] = useState(false)
  const { addSeat, selectedTool } = useSeatLayoutStore()

  const handleDragStart = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleDragEnd = useCallback((event: any) => {
    setIsDragging(false)
    
    const { over } = event
    if (!over) return

    // Add seat at drop position
    const [row, col] = over.id.split('-').map(Number)
    addSeat({
      id: `${row}-${col}`,
      row,
      col,
      type: selectedTool as any,
      rotation: 0,
      isActive: true,
      label: generateLabel(row, col)
    })
  }, [selectedTool, addSeat])

  return {
    isDragging,
    handleDragStart,
    handleDragEnd
  }
}

function generateLabel(row: number, col: number): string {
  return `${String.fromCharCode(65 + row)}${col + 1}`
}
```

### Template Selector Component:

```tsx
// src/components/Theater/SeatLayoutEditor/components/TemplateSelector.tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Layout } from 'lucide-react'

const TEMPLATES = [
  {
    id: 'theater-classic',
    name: 'Classic Theater',
    description: 'Traditional theater seating with center aisle',
    capacity: 200,
    rows: 15,
    cols: 20,
    preview: '/templates/theater-classic.png'
  },
  {
    id: 'cinema-modern',
    name: 'Modern Cinema',
    description: 'Stadium seating with VIP section',
    capacity: 150,
    rows: 12,
    cols: 18,
    preview: '/templates/cinema-modern.png'
  },
  // ... more templates
]

export default function TemplateSelector() {
  const [open, setOpen] = useState(false)

  const handleSelectTemplate = (template: typeof TEMPLATES[0]) => {
    // Load template logic
    console.log('Loading template:', template)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Layout className="h-4 w-4 mr-2" />
          Load Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {TEMPLATES.map((template) => (
            <motion.div
              key={template.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className="cursor-pointer hover:border-primary"
                onClick={() => handleSelectTemplate(template)}
              >
                <CardContent className="p-4">
                  <img
                    src={template.preview}
                    alt={template.name}
                    className="w-full h-32 object-cover rounded-md mb-3"
                  />
                  <h3 className="font-semibold">{template.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {template.description}
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      {template.capacity} seats
                    </Badge>
                    <Badge variant="outline">
                      {template.rows}x{template.cols}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Lưu ý quan trọng:

1. ✅ **SỬ DỤNG TypeScript** - Tăng type safety và developer experience
2. ✅ **SỬ DỤNG Tailwind CSS** - Rapid UI development với utility classes
3. ✅ **SỬ DỤNG shadcn/ui** - High-quality, accessible components
4. ✅ **SỬ DỤNG Zustand** - Simple và powerful state management
5. ✅ **SỬ DỤNG Framer Motion** - Professional animations
6. ✅ **SỬ DỤNG dnd-kit** - Modern drag & drop
7. ✅ **SỬ DỤNG Lucide React** - Beautiful, consistent icons
8. ✅ **TUÂN THỦ accessibility** - WCAG AA standards
9. ✅ **OPTIMIZE performance** - 60fps animations, minimal re-renders
10. ✅ **WRITE clean code** - TypeScript, ESLint, Prettier

---

## Kết quả mong đợi:

Một **Seat Layout Editor** đẳng cấp enterprise với:
- 🎨 UI/UX hiện đại, đẹp mắt (shadcn/ui + Tailwind)
- ⚡ Performance tối ưu (Zustand + React.memo)
- 🎭 Animations mượt mà (Framer Motion)
- ♿ Accessibility hoàn hảo (WCAG AA)
- 🔧 Developer experience tuyệt vời (TypeScript + Modern tools)
- 📱 Responsive design (Mobile, Tablet, Desktop)
- 🚀 Production-ready code quality

Hệ thống này sẽ ngang tầm với các platform quản lý venue chuyên nghiệp như Ticketmaster, Eventbrite, hoặc các cinema management systems cao cấp.

# Quests Feature Guide

## Tổng Quan

Tính năng Nhiệm Vụ (Quests) cho phép người chơi hoàn thành các nhiệm vụ hàng ngày và dài hạn để nhận phần thưởng.

## Cấu Trúc Files

```
src/components/
├── Quests.jsx          # Component chính cho trang Nhiệm Vụ
├── Quests.css          # Styles cho trang Nhiệm Vụ
└── WhackAMaskGame.jsx  # Component chính đã được cập nhật để tích hợp Quests
```

## Tính Năng

### 1. Daily Login Streak (Chuỗi Đăng Nhập Hàng Ngày)
- 7 ngày đăng nhập liên tiếp
- Mỗi ngày có phần thưởng khác nhau
- Ngày 7 có phần thưởng đặc biệt (Grand Prize)
- Hiển thị trạng thái: claimed (đã nhận), current (hiện tại), locked (chưa mở)

### 2. Daily Tasks (Nhiệm Vụ Hàng Ngày)
- Nhiệm vụ reset mỗi ngày
- Hiển thị tiến độ với progress bar
- Phần thưởng: tickets hoặc mask cases
- Trạng thái: locked (chưa hoàn thành), claim (có thể nhận)

### 3. Milestones (Cột Mốc)
- Nhiệm vụ dài hạn
- 2 loại: Rank Milestone (vàng) và Collection Milestone (đỏ)
- Hiển thị tiến độ và phần thưởng đặc biệt

## Cách Sử Dụng

### Trong WhackAMaskGame.jsx

Component Quests được tích hợp vào sidebar navigation:

```jsx
<a className={`whack-intro-nav-link ${showQuests ? 'active' : ''}`} 
   href="#" 
   onClick={handleViewQuests}>
  <span className="material-symbols-outlined">task_alt</span>
  <span>Nhiệm Vụ</span>
</a>
```

### State Management

```jsx
const [showQuests, setShowQuests] = useState(false)

const handleViewQuests = () => {
  setShowQuests(true)
  setShowLeaderboard(false)
  setShowShop(false)
}
```

### Render Logic

```jsx
{showLeaderboard ? (
  <Leaderboard />
) : showShop ? (
  <Shop />
) : showQuests ? (
  <Quests />
) : !isPlaying ? (
  // Intro screen
) : (
  // Game screen
)}
```

## Tùy Chỉnh

### Thêm Nhiệm Vụ Mới

Trong `Quests.jsx`, cập nhật state `quests`:

```jsx
const [quests, setQuests] = useState([
  {
    id: 4,
    title: 'Tên Nhiệm Vụ',
    description: 'Mô tả nhiệm vụ',
    icon: 'icon_name', // Material Symbol icon
    progress: 0,
    target: 100,
    reward: { type: 'tickets', amount: 500 },
    completed: false
  }
])
```

### Thêm Milestone Mới

```jsx
const [milestones, setMilestones] = useState([
  {
    id: 3,
    title: 'Tên Milestone',
    description: 'Mô tả',
    category: 'Rank Milestone', // hoặc 'Collection Milestone'
    progress: 0,
    target: 10,
    progressLabel: '0 / 10',
    rewards: ['icon1', 'icon2'],
    rewardText: 'Mô tả phần thưởng'
  }
])
```

### Thay Đổi Daily Rewards

```jsx
const dailyRewards = [
  { 
    day: 1, 
    reward: '+50 Tickets', 
    icon: 'confirmation_number', 
    claimed: false 
  },
  // ... thêm các ngày khác
]
```

## Styling

### Màu Sắc Chính

- Primary Red: `#d33131`
- Gold: `#D4AF37`
- Background Dark: `#1a0f0f`
- Wood: `#2d1b1b`

### Responsive Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## Tích Hợp Database (Tương Lai)

Để lưu trữ tiến độ nhiệm vụ, cần tạo các bảng sau trong Supabase:

```sql
-- Bảng quests
CREATE TABLE quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  quest_type TEXT, -- 'daily', 'weekly', 'milestone'
  target INTEGER,
  reward_type TEXT,
  reward_amount INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng player_quest_progress
CREATE TABLE player_quest_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES auth.users(id),
  quest_id UUID REFERENCES quests(id),
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  claimed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng daily_login_streak
CREATE TABLE daily_login_streak (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES auth.users(id),
  current_streak INTEGER DEFAULT 0,
  last_login_date DATE,
  rewards_claimed JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Functions (Tương Lai)

Tạo file `src/services/questService.js`:

```javascript
import { supabase } from '../lib/supabase'

export const getPlayerQuests = async (playerId) => {
  // Lấy danh sách nhiệm vụ và tiến độ
}

export const updateQuestProgress = async (playerId, questId, progress) => {
  // Cập nhật tiến độ nhiệm vụ
}

export const claimQuestReward = async (playerId, questId) => {
  // Nhận phần thưởng nhiệm vụ
}

export const getDailyLoginStreak = async (playerId) => {
  // Lấy chuỗi đăng nhập
}

export const claimDailyReward = async (playerId, day) => {
  // Nhận phần thưởng hàng ngày
}
```

## Testing

1. Chạy ứng dụng: `npm run dev`
2. Đăng nhập vào game
3. Click vào "Nhiệm Vụ" trong sidebar
4. Kiểm tra:
   - Daily Login Streak hiển thị đúng
   - Quest cards hiển thị progress bar
   - Buttons claim hoạt động
   - Responsive trên mobile/tablet

## Notes

- Component hiện tại sử dụng mock data (dữ liệu giả)
- Cần tích hợp với database để lưu trữ thực tế
- Animation và transitions đã được thêm vào CSS
- Material Symbols icons được sử dụng cho tất cả icons

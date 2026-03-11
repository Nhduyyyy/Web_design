# Hướng Dẫn Database Hệ Thống Quests

## Tổng Quan

Hệ thống Quests bao gồm 3 phần chính:
1. **Daily Quests** - Nhiệm vụ hàng ngày
2. **Daily Login Streaks** - Chuỗi đăng nhập hàng ngày (7 ngày)
3. **Milestones** - Cột mốc thành tựu dài hạn

## Cấu Trúc Database

### 1. Quest Templates (Mẫu Nhiệm Vụ)

```sql
quest_templates
├── id (UUID)
├── quest_key (VARCHAR) - Key duy nhất: 'score_10000', 'play_5_games'
├── title (VARCHAR) - Tiêu đề: 'Vai Diễn Chính'
├── description (TEXT) - Mô tả nhiệm vụ
├── icon (VARCHAR) - Icon material: 'sports_score', 'play_circle'
├── quest_type (VARCHAR) - 'daily', 'weekly', 'milestone'
├── target_value (INTEGER) - Giá trị cần đạt: 10000, 5
├── reward_type (VARCHAR) - 'coin', 'item', 'mask'
├── reward_amount (INTEGER) - Số lượng phần thưởng
└── is_active (BOOLEAN)
```

**Dữ liệu mẫu:**
- `score_10000`: Đạt 10,000 điểm → 250 coin
- `play_5_games`: Chơi 5 ván → 150 coin
- `buy_1_item`: Mua 1 vật phẩm → 100 coin

### 2. Player Quests (Nhiệm Vụ Của Người Chơi)

```sql
player_quests
├── id (UUID)
├── user_id (UUID) → auth.users
├── quest_template_id (UUID) → quest_templates
├── current_progress (INTEGER) - Tiến độ hiện tại: 8500/10000
├── target_value (INTEGER) - Mục tiêu: 10000
├── is_completed (BOOLEAN) - Đã hoàn thành?
├── is_claimed (BOOLEAN) - Đã nhận thưởng?
├── completed_at (TIMESTAMPTZ)
├── claimed_at (TIMESTAMPTZ)
└── expires_at (TIMESTAMPTZ) - Hết hạn (cho daily quests)
```

### 3. Daily Login Streaks (Chuỗi Đăng Nhập)

```sql
daily_login_streaks
├── id (UUID)
├── user_id (UUID) → auth.users
├── current_streak (INTEGER) - Chuỗi hiện tại: 3 ngày
├── longest_streak (INTEGER) - Chuỗi dài nhất: 15 ngày
├── last_login_date (DATE) - Ngày đăng nhập cuối
└── streak_rewards_claimed (JSONB) - Các ngày đã claim: [1,2,3]
```

### 4. Daily Reward Config (Cấu Hình Phần Thưởng)

```sql
daily_reward_config
├── id (UUID)
├── day_number (INTEGER) - Ngày 1-7
├── reward_type (VARCHAR) - 'coin'
├── reward_amount (INTEGER) - 50, 100, 150, 200, 300, 500, 1000
├── icon (VARCHAR) - 'toll'
└── is_grand_prize (BOOLEAN) - Ngày 7 = true
```

**Cấu hình 7 ngày:**
- Ngày 1: +50 Coin
- Ngày 2: +100 Coin
- Ngày 3: +150 Coin
- Ngày 4: +200 Coin
- Ngày 5: +300 Coin
- Ngày 6: +500 Coin
- Ngày 7: +1000 Coin (Grand Prize)

### 5. Milestone Templates (Mẫu Cột Mốc)

```sql
milestone_templates
├── id (UUID)
├── milestone_key (VARCHAR) - 'rank_tier_5', 'collect_12_masks'
├── title (VARCHAR) - 'Bậc Thầy Mặt Nạ'
├── description (TEXT)
├── category (VARCHAR) - 'Cột Mốc Hạng', 'Cột Mốc Sưu Tập'
├── target_value (INTEGER) - 5, 12
├── reward_type (VARCHAR) - 'coin'
├── reward_amount (INTEGER) - 1000, 2000
├── reward_description (TEXT) - 'Mở khóa Trang Phục Huyền Thoại'
└── icon_rewards (JSONB) - ["verified", "workspace_premium"]
```

### 6. Player Milestones (Cột Mốc Của Người Chơi)

```sql
player_milestones
├── id (UUID)
├── user_id (UUID) → auth.users
├── milestone_template_id (UUID) → milestone_templates
├── current_progress (INTEGER) - 3/5
├── target_value (INTEGER) - 5
├── is_completed (BOOLEAN)
├── is_claimed (BOOLEAN)
└── completed_at (TIMESTAMPTZ)
```

### 7. Quest Rewards History (Lịch Sử Nhận Thưởng)

```sql
quest_rewards_history
├── id (UUID)
├── user_id (UUID) → auth.users
├── reward_type (VARCHAR) - 'quest', 'daily_login', 'milestone'
├── reward_source_id (UUID) - ID của quest/milestone
├── reward_item_type (VARCHAR) - 'coin', 'item', 'mask'
├── reward_amount (INTEGER)
└── claimed_at (TIMESTAMPTZ)
```

## Functions (Hàm Xử Lý)

### 1. Cập Nhật Daily Login Streak

```sql
SELECT update_daily_login_streak('user-uuid');
```

**Chức năng:**
- Kiểm tra ngày đăng nhập cuối
- Nếu đăng nhập liên tiếp: tăng streak
- Nếu bỏ lỡ 1 ngày: reset streak về 1
- Nếu đã đăng nhập hôm nay: không làm gì

**Trả về:**
```json
{
  "success": true,
  "current_streak": 3,
  "longest_streak": 15,
  "rewards_claimed": [1, 2]
}
```

### 2. Claim Daily Login Reward

```sql
SELECT claim_daily_login_reward('user-uuid', 3);
```

**Tham số:**
- `user_id`: UUID của user
- `day_number`: Ngày muốn claim (1-7)

**Kiểm tra:**
- Streak phải đạt đủ ngày đó
- Chưa claim ngày đó trước đây
- Reward config phải tồn tại

**Xử lý:**
- Cộng coin vào `player_game_stats.total_coins`
- Đánh dấu đã claim trong `streak_rewards_claimed`
- Lưu vào `quest_rewards_history`

**Trả về:**
```json
{
  "success": true,
  "reward_type": "coin",
  "reward_amount": 150
}
```

### 3. Cập Nhật Tiến Độ Quest

```sql
SELECT update_quest_progress('user-uuid', 'score_10000', 1000);
```

**Tham số:**
- `user_id`: UUID của user
- `quest_key`: Key của quest ('score_10000', 'play_5_games')
- `progress_increment`: Số lượng tăng thêm (mặc định = 1)

**Xử lý:**
- Tìm quest template theo `quest_key`
- Tạo player quest nếu chưa có
- Cập nhật `current_progress`
- Đánh dấu `is_completed` nếu đạt target

**Trả về:**
```json
{
  "success": true,
  "quest_id": "quest-uuid",
  "current_progress": 8500,
  "target_value": 10000,
  "is_completed": false
}
```

### 4. Claim Quest Reward

```sql
SELECT claim_quest_reward('user-uuid', 'quest-uuid');
```

**Kiểm tra:**
- Quest phải completed
- Chưa claim trước đây
- User phải là chủ quest

**Xử lý:**
- Cộng coin vào `player_game_stats.total_coins`
- Đánh dấu `is_claimed = true`
- Lưu vào `quest_rewards_history`

**Trả về:**
```json
{
  "success": true,
  "reward_type": "coin",
  "reward_amount": 250
}
```

### 5. Khởi Tạo Daily Quests

```sql
SELECT initialize_daily_quests('user-uuid');
```

**Chức năng:**
- Tạo tất cả daily quests cho user
- Chỉ tạo nếu chưa có trong ngày hôm nay
- Set `expires_at` = cuối ngày hôm nay

**Trả về:**
```json
{
  "success": true,
  "quests_initialized": 3
}
```

## Workflow Sử Dụng

### A. Daily Login Flow

```javascript
// 1. User đăng nhập
const { data: streakData } = await supabase.rpc('update_daily_login_streak', {
  p_user_id: user.id
})

// 2. Hiển thị UI với current_streak
console.log(`Streak hiện tại: ${streakData.current_streak} ngày`)

// 3. User click "NHẬN" ở ngày 3
const { data: rewardData } = await supabase.rpc('claim_daily_login_reward', {
  p_user_id: user.id,
  p_day_number: 3
})

// 4. Hiển thị thông báo nhận thưởng
console.log(`Nhận được ${rewardData.reward_amount} coin!`)
```

### B. Daily Quest Flow

```javascript
// 1. Khởi tạo daily quests khi user vào trang
await supabase.rpc('initialize_daily_quests', {
  p_user_id: user.id
})

// 2. Lấy danh sách quests
const { data: quests } = await supabase
  .from('player_quests')
  .select(`
    *,
    quest_template:quest_templates(*)
  `)
  .eq('user_id', user.id)
  .gte('expires_at', new Date().toISOString())

// 3. Khi user chơi game, cập nhật progress
await supabase.rpc('update_quest_progress', {
  p_user_id: user.id,
  p_quest_key: 'play_5_games',
  p_progress_increment: 1
})

// 4. Khi quest completed, user click "NHẬN"
const { data: reward } = await supabase.rpc('claim_quest_reward', {
  p_user_id: user.id,
  p_quest_id: quest.id
})
```

### C. Milestone Flow

```javascript
// 1. Lấy danh sách milestones
const { data: milestones } = await supabase
  .from('player_milestones')
  .select(`
    *,
    milestone_template:milestone_templates(*)
  `)
  .eq('user_id', user.id)

// 2. Cập nhật progress (tự động từ game logic)
// VD: Khi rank tăng lên
await supabase
  .from('player_milestones')
  .update({
    current_progress: newRankLevel,
    is_completed: newRankLevel >= targetValue
  })
  .eq('user_id', user.id)
  .eq('milestone_template_id', milestoneId)
```

## Queries Thường Dùng

### Lấy Daily Streak Của User

```sql
SELECT * FROM daily_login_streaks WHERE user_id = 'user-uuid';
```

### Lấy Daily Quests Chưa Hoàn Thành

```sql
SELECT pq.*, qt.*
FROM player_quests pq
JOIN quest_templates qt ON qt.id = pq.quest_template_id
WHERE pq.user_id = 'user-uuid'
  AND pq.is_completed = false
  AND pq.expires_at > NOW();
```

### Lấy Quests Đã Hoàn Thành Chưa Claim

```sql
SELECT pq.*, qt.*
FROM player_quests pq
JOIN quest_templates qt ON qt.id = pq.quest_template_id
WHERE pq.user_id = 'user-uuid'
  AND pq.is_completed = true
  AND pq.is_claimed = false;
```

### Lấy Lịch Sử Nhận Thưởng

```sql
SELECT * FROM quest_rewards_history
WHERE user_id = 'user-uuid'
ORDER BY claimed_at DESC
LIMIT 20;
```

### Lấy Tổng Coin Từ Quests

```sql
SELECT 
  SUM(reward_amount) as total_coins_from_quests
FROM quest_rewards_history
WHERE user_id = 'user-uuid'
  AND reward_item_type = 'coin';
```

## Tích Hợp Với Game

### Khi User Chơi Game Xong

```javascript
// Trong hàm handleSaveGameResult
const result = await saveGameResult({
  userId: user.id,
  score: finalScore,
  coinsEarned: finalScore,
  masksHit: finalScore,
  totalRounds: 16,
  gameDurationSeconds: duration
})

// Cập nhật quest progress
await supabase.rpc('update_quest_progress', {
  p_user_id: user.id,
  p_quest_key: 'play_5_games',
  p_progress_increment: 1
})

// Nếu đạt high score
if (finalScore >= 10000) {
  await supabase.rpc('update_quest_progress', {
    p_user_id: user.id,
    p_quest_key: 'score_10000',
    p_progress_increment: finalScore
  })
}
```

### Khi User Mua Item

```javascript
// Trong hàm purchaseItem
await supabase.rpc('update_quest_progress', {
  p_user_id: user.id,
  p_quest_key: 'buy_1_item',
  p_progress_increment: 1
})
```

## Maintenance

### Reset Daily Quests (Chạy Hàng Ngày)

```sql
-- Xóa daily quests đã hết hạn
DELETE FROM player_quests
WHERE expires_at < NOW()
  AND quest_template_id IN (
    SELECT id FROM quest_templates WHERE quest_type = 'daily'
  );
```

### Thống Kê Quest Completion Rate

```sql
SELECT 
  qt.title,
  COUNT(*) as total_assigned,
  SUM(CASE WHEN pq.is_completed THEN 1 ELSE 0 END) as completed,
  ROUND(SUM(CASE WHEN pq.is_completed THEN 1 ELSE 0 END)::DECIMAL / COUNT(*) * 100, 2) as completion_rate
FROM player_quests pq
JOIN quest_templates qt ON qt.id = pq.quest_template_id
GROUP BY qt.id, qt.title
ORDER BY completion_rate DESC;
```

## Lưu Ý Quan Trọng

1. **Daily Quests Reset**: Tự động hết hạn vào cuối ngày (`expires_at`)
2. **Streak Reset**: Nếu bỏ lỡ 1 ngày, streak về 1 và rewards_claimed reset
3. **Claim Once**: Mỗi reward chỉ claim được 1 lần
4. **Coin Update**: Tất cả coin đều cộng vào `player_game_stats.total_coins`
5. **History Tracking**: Mọi reward đều lưu vào `quest_rewards_history`

## Mở Rộng Tương Lai

- [ ] Weekly Quests (nhiệm vụ hàng tuần)
- [ ] Special Events (sự kiện đặc biệt)
- [ ] Quest Chains (chuỗi nhiệm vụ liên tiếp)
- [ ] Guild Quests (nhiệm vụ nhóm)
- [ ] Achievement System (hệ thống thành tựu)

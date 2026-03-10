-- =====================================================
-- WHACK-A-MASK GAME DATABASE SCHEMA
-- =====================================================
-- Tạo các bảng cho game Whack-a-Mask bao gồm:
-- 1. Game Ranks (Cấp bậc)
-- 2. Player Stats (Thống kê người chơi)
-- 3. Game History (Lịch sử chơi game)
-- 4. Leaderboard (Bảng xếp hạng)
-- =====================================================

-- =====================================================
-- 1. BẢNG GAME RANKS (Cấp bậc trong game)
-- =====================================================
CREATE TABLE IF NOT EXISTS game_ranks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rank_name VARCHAR(100) NOT NULL UNIQUE,
  rank_level INTEGER NOT NULL UNIQUE,
  min_coins INTEGER NOT NULL,
  max_coins INTEGER,
  rank_color VARCHAR(50),
  rank_icon VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thêm comment cho bảng
COMMENT ON TABLE game_ranks IS 'Bảng lưu các cấp bậc trong game dựa trên số coin';
COMMENT ON COLUMN game_ranks.rank_name IS 'Tên cấp bậc (VD: Newbie, Bronze, Silver, Gold, Master)';
COMMENT ON COLUMN game_ranks.rank_level IS 'Cấp độ rank (1 = thấp nhất)';
COMMENT ON COLUMN game_ranks.min_coins IS 'Số coin tối thiểu để đạt rank này';
COMMENT ON COLUMN game_ranks.max_coins IS 'Số coin tối đa của rank này (NULL = không giới hạn)';

-- Insert dữ liệu mẫu cho ranks
INSERT INTO game_ranks (rank_name, rank_level, min_coins, max_coins, rank_color, rank_icon) VALUES
  ('Newbie', 1, 0, 999, '#8B4513', 'person'),
  ('Bronze', 2, 1000, 2999, '#CD7F32', 'military_tech'),
  ('Silver', 3, 3000, 5999, '#C0C0C0', 'workspace_premium'),
  ('Gold', 4, 6000, 9999, '#FFD700', 'star'),
  ('Platinum', 5, 10000, 14999, '#E5E4E2', 'diamond'),
  ('Diamond', 6, 15000, 19999, '#B9F2FF', 'auto_awesome'),
  ('Master', 7, 20000, 29999, '#FF6B6B', 'emoji_events'),
  ('Tuồng Master', 8, 30000, NULL, '#D4AF37', 'crown')
ON CONFLICT (rank_name) DO NOTHING;

-- =====================================================
-- 2. BẢNG PLAYER STATS (Thống kê người chơi)
-- =====================================================
CREATE TABLE IF NOT EXISTS player_game_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_coins INTEGER DEFAULT 0,
  total_games_played INTEGER DEFAULT 0,
  total_masks_hit INTEGER DEFAULT 0,
  highest_score INTEGER DEFAULT 0,
  current_rank_id UUID REFERENCES game_ranks(id),
  average_score DECIMAL(10, 2) DEFAULT 0,
  last_played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Thêm comment
COMMENT ON TABLE player_game_stats IS 'Thống kê tổng hợp của người chơi';
COMMENT ON COLUMN player_game_stats.total_coins IS 'Tổng số coin đã kiếm được';
COMMENT ON COLUMN player_game_stats.total_games_played IS 'Tổng số lần chơi';
COMMENT ON COLUMN player_game_stats.total_masks_hit IS 'Tổng số mặt nạ đã đập trúng';
COMMENT ON COLUMN player_game_stats.highest_score IS 'Điểm cao nhất trong 1 lần chơi';
COMMENT ON COLUMN player_game_stats.average_score IS 'Điểm trung bình mỗi lần chơi';

-- Index cho tìm kiếm nhanh
CREATE INDEX idx_player_stats_user_id ON player_game_stats(user_id);
CREATE INDEX idx_player_stats_total_coins ON player_game_stats(total_coins DESC);
CREATE INDEX idx_player_stats_rank ON player_game_stats(current_rank_id);

-- =====================================================
-- 3. BẢNG GAME HISTORY (Lịch sử chơi game)
-- =====================================================
CREATE TABLE IF NOT EXISTS game_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  masks_hit INTEGER NOT NULL DEFAULT 0,
  total_rounds INTEGER DEFAULT 16,
  accuracy_percentage DECIMAL(5, 2),
  game_duration_seconds INTEGER,
  rank_at_time VARCHAR(100),
  played_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thêm comment
COMMENT ON TABLE game_history IS 'Lịch sử từng lần chơi game của người chơi';
COMMENT ON COLUMN game_history.score IS 'Điểm số đạt được trong lần chơi này';
COMMENT ON COLUMN game_history.coins_earned IS 'Số coin kiếm được trong lần chơi này';
COMMENT ON COLUMN game_history.masks_hit IS 'Số mặt nạ đập trúng trong lần chơi này';
COMMENT ON COLUMN game_history.accuracy_percentage IS 'Tỷ lệ chính xác (%)';
COMMENT ON COLUMN game_history.game_duration_seconds IS 'Thời gian chơi (giây)';

-- Index cho tìm kiếm
CREATE INDEX idx_game_history_user_id ON game_history(user_id);
CREATE INDEX idx_game_history_played_at ON game_history(played_at DESC);
CREATE INDEX idx_game_history_score ON game_history(score DESC);

-- =====================================================
-- 4. VIEW LEADERBOARD (Bảng xếp hạng)
-- =====================================================
CREATE OR REPLACE VIEW leaderboard_view AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY pgs.total_coins DESC, pgs.highest_score DESC) as rank,
  p.id as user_id,
  p.full_name,
  p.email,
  p.avatar_url,
  pgs.total_coins,
  pgs.highest_score,
  pgs.total_games_played,
  pgs.average_score,
  gr.rank_name,
  gr.rank_color,
  gr.rank_icon,
  pgs.last_played_at
FROM player_game_stats pgs
JOIN profiles p ON p.id = pgs.user_id
LEFT JOIN game_ranks gr ON gr.id = pgs.current_rank_id
WHERE pgs.total_games_played > 0
ORDER BY pgs.total_coins DESC, pgs.highest_score DESC;

COMMENT ON VIEW leaderboard_view IS 'View bảng xếp hạng người chơi theo tổng coin';

-- =====================================================
-- 5. FUNCTIONS - Cập nhật rank tự động
-- =====================================================
CREATE OR REPLACE FUNCTION update_player_rank()
RETURNS TRIGGER AS $$
DECLARE
  new_rank_id UUID;
BEGIN
  -- Tìm rank phù hợp dựa trên total_coins
  SELECT id INTO new_rank_id
  FROM game_ranks
  WHERE NEW.total_coins >= min_coins 
    AND (max_coins IS NULL OR NEW.total_coins <= max_coins)
  ORDER BY rank_level DESC
  LIMIT 1;
  
  -- Cập nhật rank mới
  NEW.current_rank_id := new_rank_id;
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_player_rank() IS 'Tự động cập nhật rank khi total_coins thay đổi';

-- Trigger để tự động cập nhật rank
DROP TRIGGER IF EXISTS trigger_update_player_rank ON player_game_stats;
CREATE TRIGGER trigger_update_player_rank
  BEFORE INSERT OR UPDATE OF total_coins ON player_game_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_player_rank();

-- =====================================================
-- 6. FUNCTION - Lưu kết quả game và cập nhật stats
-- =====================================================
CREATE OR REPLACE FUNCTION save_game_result(
  p_user_id UUID,
  p_score INTEGER,
  p_coins_earned INTEGER,
  p_masks_hit INTEGER,
  p_total_rounds INTEGER DEFAULT 16,
  p_game_duration_seconds INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_player_stats player_game_stats%ROWTYPE;
  v_accuracy DECIMAL(5, 2);
  v_current_rank VARCHAR(100);
  v_result JSON;
BEGIN
  -- Tính accuracy
  v_accuracy := (p_masks_hit::DECIMAL / p_total_rounds * 100);
  
  -- Lấy hoặc tạo player stats
  INSERT INTO player_game_stats (user_id, total_coins, total_games_played, total_masks_hit, highest_score)
  VALUES (p_user_id, 0, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Cập nhật player stats
  UPDATE player_game_stats
  SET 
    total_coins = total_coins + p_coins_earned,
    total_games_played = total_games_played + 1,
    total_masks_hit = total_masks_hit + p_masks_hit,
    highest_score = GREATEST(highest_score, p_score),
    average_score = ((average_score * total_games_played) + p_score) / (total_games_played + 1),
    last_played_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING * INTO v_player_stats;
  
  -- Lấy rank hiện tại
  SELECT rank_name INTO v_current_rank
  FROM game_ranks
  WHERE id = v_player_stats.current_rank_id;
  
  -- Lưu vào game history
  INSERT INTO game_history (
    user_id, score, coins_earned, masks_hit, total_rounds, 
    accuracy_percentage, game_duration_seconds, rank_at_time
  )
  VALUES (
    p_user_id, p_score, p_coins_earned, p_masks_hit, p_total_rounds,
    v_accuracy, p_game_duration_seconds, v_current_rank
  );
  
  -- Trả về kết quả
  v_result := json_build_object(
    'success', true,
    'total_coins', v_player_stats.total_coins,
    'current_rank', v_current_rank,
    'highest_score', v_player_stats.highest_score,
    'total_games_played', v_player_stats.total_games_played,
    'average_score', v_player_stats.average_score
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION save_game_result IS 'Lưu kết quả game và cập nhật thống kê người chơi';

-- =====================================================
-- 7. RLS POLICIES (Row Level Security)
-- =====================================================

-- Enable RLS
ALTER TABLE player_game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;

-- Policies cho player_game_stats
CREATE POLICY "Users can view their own stats"
  ON player_game_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view all stats for leaderboard"
  ON player_game_stats FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own stats"
  ON player_game_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
  ON player_game_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies cho game_history
CREATE POLICY "Users can view their own history"
  ON game_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own history"
  ON game_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Function lấy top players
CREATE OR REPLACE FUNCTION get_top_players(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  full_name VARCHAR,
  avatar_url TEXT,
  total_coins INTEGER,
  highest_score INTEGER,
  rank_name VARCHAR,
  rank_color VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM leaderboard_view
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function lấy rank của user
CREATE OR REPLACE FUNCTION get_user_rank(p_user_id UUID)
RETURNS TABLE (
  user_rank BIGINT,
  total_players BIGINT,
  percentile DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_players AS (
    SELECT 
      ROW_NUMBER() OVER (ORDER BY total_coins DESC, highest_score DESC) as rank,
      user_id
    FROM player_game_stats
    WHERE total_games_played > 0
  ),
  total_count AS (
    SELECT COUNT(*) as total FROM ranked_players
  )
  SELECT 
    rp.rank,
    tc.total,
    ROUND((rp.rank::DECIMAL / tc.total * 100), 2) as percentile
  FROM ranked_players rp, total_count tc
  WHERE rp.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. INDEXES cho performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_game_ranks_level ON game_ranks(rank_level);
CREATE INDEX IF NOT EXISTS idx_game_ranks_coins ON game_ranks(min_coins, max_coins);

-- =====================================================
-- HOÀN THÀNH
-- =====================================================

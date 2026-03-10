-- =====================================================
-- FIX LEADERBOARD RLS POLICIES
-- =====================================================
-- Sửa lại policies để cho phép mọi người xem leaderboard
-- =====================================================

-- Drop các policies cũ
DROP POLICY IF EXISTS "Users can view their own stats" ON player_game_stats;
DROP POLICY IF EXISTS "Users can view all stats for leaderboard" ON player_game_stats;
DROP POLICY IF EXISTS "Users can insert their own stats" ON player_game_stats;
DROP POLICY IF EXISTS "Users can update their own stats" ON player_game_stats;

-- Tạo lại policies với tên rõ ràng hơn
CREATE POLICY "player_stats_select_own"
  ON player_game_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "player_stats_select_all"
  ON player_game_stats FOR SELECT
  USING (true);

CREATE POLICY "player_stats_insert_own"
  ON player_game_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "player_stats_update_own"
  ON player_game_stats FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Đảm bảo game_ranks có thể được đọc bởi mọi người
ALTER TABLE game_ranks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "game_ranks_select_all" ON game_ranks;
CREATE POLICY "game_ranks_select_all"
  ON game_ranks FOR SELECT
  USING (true);

-- Kiểm tra và sửa function permissions
ALTER FUNCTION get_top_players(INTEGER) SECURITY DEFINER;
ALTER FUNCTION get_user_rank(UUID) SECURITY DEFINER;
ALTER FUNCTION save_game_result(UUID, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) SECURITY DEFINER;

-- Grant permissions cho authenticated users
GRANT EXECUTE ON FUNCTION get_top_players(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_rank(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION save_game_result(UUID, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) TO authenticated;

-- Grant permissions cho anon users (để xem leaderboard khi chưa đăng nhập)
GRANT EXECUTE ON FUNCTION get_top_players(INTEGER) TO anon;

-- Kiểm tra view permissions
GRANT SELECT ON leaderboard_view TO authenticated;
GRANT SELECT ON leaderboard_view TO anon;

-- Test query để kiểm tra
-- SELECT * FROM get_top_players(10);

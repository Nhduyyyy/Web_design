-- Migration: purchase_shop_item RPC with stock_quantity update
-- Buys from shop_items, decrements stock_quantity, updates user_inventory and player_game_stats

-- Ensure we can upsert user_inventory by (user_id, item_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_inventory_user_id_item_id_key'
  ) THEN
    ALTER TABLE public.user_inventory
    ADD CONSTRAINT user_inventory_user_id_item_id_key UNIQUE (user_id, item_id);
  END IF;
END $$;

-- Create or replace purchase_shop_item function
CREATE OR REPLACE FUNCTION public.purchase_shop_item(
  p_user_id uuid,
  p_item_id uuid,
  p_quantity integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
  v_coins integer;
  v_total_cost integer;
  v_user_owned integer;
  v_new_coins integer;
BEGIN
  IF p_quantity IS NULL OR p_quantity < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số lượng mua phải >= 1');
  END IF;

  -- 1. Get item
  SELECT id, price, stock_quantity, is_active, max_purchase_per_user
  INTO v_item
  FROM shop_items
  WHERE id = p_item_id;

  IF v_item.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy vật phẩm');
  END IF;

  IF NOT COALESCE(v_item.is_active, true) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vật phẩm không còn bán');
  END IF;

  v_total_cost := v_item.price * p_quantity;

  -- 2. Get or init player coins (player_game_stats)
  SELECT total_coins INTO v_coins
  FROM player_game_stats
  WHERE user_id = p_user_id;

  IF v_coins IS NULL THEN
    INSERT INTO player_game_stats (user_id, total_coins)
    VALUES (p_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;
    v_coins := 0;
  END IF;

  IF v_coins < v_total_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không đủ coin');
  END IF;

  -- 3. Check stock (if limited)
  IF v_item.stock_quantity IS NOT NULL AND v_item.stock_quantity < p_quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'Hết hàng hoặc không đủ số lượng');
  END IF;

  -- 4. Check max_purchase_per_user
  IF v_item.max_purchase_per_user IS NOT NULL THEN
    SELECT COALESCE(SUM(quantity), 0) INTO v_user_owned
    FROM user_inventory
    WHERE user_id = p_user_id AND item_id = p_item_id;

    IF v_user_owned + p_quantity > v_item.max_purchase_per_user THEN
      RETURN jsonb_build_object('success', false, 'error', 'Bạn đã mua tối đa số lượng cho phép');
    END IF;
  END IF;

  -- 5. Deduct coins
  UPDATE player_game_stats
  SET total_coins = total_coins - v_total_cost,
      updated_at = now()
  WHERE user_id = p_user_id;

  SELECT total_coins INTO v_new_coins FROM player_game_stats WHERE user_id = p_user_id;

  -- 6. Decrement stock_quantity (only when not null)
  IF v_item.stock_quantity IS NOT NULL THEN
    UPDATE shop_items
    SET stock_quantity = stock_quantity - p_quantity,
        updated_at = now()
    WHERE id = p_item_id;
  END IF;

  -- 7. Add to user_inventory (upsert)
  INSERT INTO user_inventory (user_id, item_id, quantity)
  VALUES (p_user_id, p_item_id, p_quantity)
  ON CONFLICT (user_id, item_id)
  DO UPDATE SET
    quantity = user_inventory.quantity + p_quantity,
    updated_at = now();

  -- 8. Record transaction
  INSERT INTO shop_transactions (user_id, item_id, quantity, price_paid)
  VALUES (p_user_id, p_item_id, p_quantity, v_total_cost);

  RETURN jsonb_build_object(
    'success', true,
    'remaining_coins', v_new_coins
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.purchase_shop_item(uuid, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_shop_item(uuid, uuid, integer) TO service_role;

COMMENT ON FUNCTION public.purchase_shop_item(uuid, uuid, integer) IS
  'Mua vật phẩm từ shop: trừ coin (player_game_stats), giảm stock_quantity (shop_items), thêm user_inventory, ghi shop_transactions.';

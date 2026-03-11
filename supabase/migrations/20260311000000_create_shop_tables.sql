-- =============================================
-- WHACK-A-MASK SHOP SYSTEM
-- Migration: Create shop tables
-- Created: 2026-03-11
-- =============================================

-- =============================================
-- 1. SHOP CATEGORIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.shop_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.shop_categories IS 'Categories for shop items (Vouchers, Collectibles, Digital Assets, etc.)';

-- =============================================
-- 2. SHOP ITEMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.shop_categories(id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  description TEXT,
  price INTEGER NOT NULL CHECK (price >= 0),
  image_url TEXT,
  badge VARCHAR(50), -- 'Limited', 'Rare', 'Epic', etc.
  badge_color VARCHAR(50), -- 'primary', 'yellow', 'blue', etc.
  item_type VARCHAR(50) NOT NULL, -- 'mask', 'emote', 'theme', 'booster', 'voucher', etc.
  is_limited BOOLEAN DEFAULT false,
  stock_quantity INTEGER, -- NULL = unlimited
  max_purchase_per_user INTEGER, -- NULL = unlimited
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}', -- Additional item properties
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.shop_items IS 'Shop items available for purchase';
COMMENT ON COLUMN public.shop_items.metadata IS 'Additional properties like duration for boosters, rarity level, etc.';

-- =============================================
-- 3. USER INVENTORY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1 CHECK (quantity >= 0),
  is_equipped BOOLEAN DEFAULT false,
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- For time-limited items
  metadata JSONB DEFAULT '{}', -- Item-specific data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

COMMENT ON TABLE public.user_inventory IS 'Items owned by users';
COMMENT ON COLUMN public.user_inventory.expires_at IS 'Expiration date for time-limited items like boosters';

-- =============================================
-- 4. SHOP TRANSACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.shop_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.shop_items(id) ON DELETE SET NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  price_paid INTEGER NOT NULL CHECK (price_paid >= 0),
  transaction_type VARCHAR(50) DEFAULT 'purchase', -- 'purchase', 'gift', 'refund'
  status VARCHAR(50) DEFAULT 'completed', -- 'pending', 'completed', 'failed', 'refunded'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.shop_transactions IS 'Transaction history for shop purchases';

-- =============================================
-- 5. INDEXES
-- =============================================

-- Shop Categories
CREATE INDEX idx_shop_categories_slug ON public.shop_categories(slug);
CREATE INDEX idx_shop_categories_active ON public.shop_categories(is_active);

-- Shop Items
CREATE INDEX idx_shop_items_category ON public.shop_items(category_id);
CREATE INDEX idx_shop_items_slug ON public.shop_items(slug);
CREATE INDEX idx_shop_items_type ON public.shop_items(item_type);
CREATE INDEX idx_shop_items_active ON public.shop_items(is_active);
CREATE INDEX idx_shop_items_price ON public.shop_items(price);

-- User Inventory
CREATE INDEX idx_user_inventory_user ON public.user_inventory(user_id);
CREATE INDEX idx_user_inventory_item ON public.user_inventory(item_id);
CREATE INDEX idx_user_inventory_equipped ON public.user_inventory(user_id, is_equipped);
CREATE INDEX idx_user_inventory_expires ON public.user_inventory(expires_at) WHERE expires_at IS NOT NULL;

-- Shop Transactions
CREATE INDEX idx_shop_transactions_user ON public.shop_transactions(user_id);
CREATE INDEX idx_shop_transactions_item ON public.shop_transactions(item_id);
CREATE INDEX idx_shop_transactions_created ON public.shop_transactions(created_at DESC);
CREATE INDEX idx_shop_transactions_status ON public.shop_transactions(status);

-- =============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE public.shop_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_transactions ENABLE ROW LEVEL SECURITY;

-- Shop Categories Policies (Public Read)
CREATE POLICY "Anyone can view active categories"
  ON public.shop_categories FOR SELECT
  USING (is_active = true);

-- Shop Items Policies (Public Read)
CREATE POLICY "Anyone can view active shop items"
  ON public.shop_items FOR SELECT
  USING (is_active = true);

-- User Inventory Policies
CREATE POLICY "Users can view their own inventory"
  ON public.user_inventory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory"
  ON public.user_inventory FOR UPDATE
  USING (auth.uid() = user_id);

-- Shop Transactions Policies
CREATE POLICY "Users can view their own transactions"
  ON public.shop_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
  ON public.shop_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 7. FUNCTIONS
-- =============================================

-- Function: Purchase Item
CREATE OR REPLACE FUNCTION public.purchase_shop_item(
  p_user_id UUID,
  p_item_id UUID,
  p_quantity INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item RECORD;
  v_user_coins INTEGER;
  v_total_cost INTEGER;
  v_current_quantity INTEGER;
  v_transaction_id UUID;
  v_inventory_id UUID;
BEGIN
  -- Get item details
  SELECT * INTO v_item
  FROM public.shop_items
  WHERE id = p_item_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Item not found or not available'
    );
  END IF;

  -- Calculate total cost
  v_total_cost := v_item.price * p_quantity;

  -- Get user's current coins
  SELECT total_coins INTO v_user_coins
  FROM public.player_stats
  WHERE user_id = p_user_id;

  IF v_user_coins IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User stats not found'
    );
  END IF;

  -- Check if user has enough coins
  IF v_user_coins < v_total_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient coins',
      'required', v_total_cost,
      'available', v_user_coins
    );
  END IF;

  -- Check stock if limited
  IF v_item.stock_quantity IS NOT NULL AND v_item.stock_quantity < p_quantity THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient stock',
      'available', v_item.stock_quantity
    );
  END IF;

  -- Check max purchase per user
  IF v_item.max_purchase_per_user IS NOT NULL THEN
    SELECT COALESCE(SUM(quantity), 0) INTO v_current_quantity
    FROM public.user_inventory
    WHERE user_id = p_user_id AND item_id = p_item_id;

    IF v_current_quantity + p_quantity > v_item.max_purchase_per_user THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Maximum purchase limit reached',
        'max_allowed', v_item.max_purchase_per_user,
        'current', v_current_quantity
      );
    END IF;
  END IF;

  -- Deduct coins from user
  UPDATE public.player_stats
  SET total_coins = total_coins - v_total_cost,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Update stock if limited
  IF v_item.stock_quantity IS NOT NULL THEN
    UPDATE public.shop_items
    SET stock_quantity = stock_quantity - p_quantity,
        updated_at = NOW()
    WHERE id = p_item_id;
  END IF;

  -- Add to user inventory
  INSERT INTO public.user_inventory (user_id, item_id, quantity)
  VALUES (p_user_id, p_item_id, p_quantity)
  ON CONFLICT (user_id, item_id)
  DO UPDATE SET
    quantity = user_inventory.quantity + p_quantity,
    updated_at = NOW()
  RETURNING id INTO v_inventory_id;

  -- Create transaction record
  INSERT INTO public.shop_transactions (
    user_id,
    item_id,
    quantity,
    price_paid,
    transaction_type,
    status
  )
  VALUES (
    p_user_id,
    p_item_id,
    p_quantity,
    v_total_cost,
    'purchase',
    'completed'
  )
  RETURNING id INTO v_transaction_id;

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'inventory_id', v_inventory_id,
    'coins_spent', v_total_cost,
    'remaining_coins', v_user_coins - v_total_cost
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION public.purchase_shop_item IS 'Purchase an item from the shop';

-- Function: Get User Inventory
CREATE OR REPLACE FUNCTION public.get_user_inventory(p_user_id UUID)
RETURNS TABLE (
  inventory_id UUID,
  item_id UUID,
  item_name VARCHAR,
  item_type VARCHAR,
  quantity INTEGER,
  is_equipped BOOLEAN,
  image_url TEXT,
  acquired_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ui.id,
    si.id,
    si.name,
    si.item_type,
    ui.quantity,
    ui.is_equipped,
    si.image_url,
    ui.acquired_at,
    ui.expires_at
  FROM public.user_inventory ui
  JOIN public.shop_items si ON ui.item_id = si.id
  WHERE ui.user_id = p_user_id
    AND ui.quantity > 0
    AND (ui.expires_at IS NULL OR ui.expires_at > NOW())
  ORDER BY ui.acquired_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_user_inventory IS 'Get all items in user inventory';

-- =============================================
-- 8. TRIGGERS
-- =============================================

-- Update timestamp trigger for shop_categories
CREATE TRIGGER update_shop_categories_timestamp
  BEFORE UPDATE ON public.shop_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update timestamp trigger for shop_items
CREATE TRIGGER update_shop_items_timestamp
  BEFORE UPDATE ON public.shop_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update timestamp trigger for user_inventory
CREATE TRIGGER update_user_inventory_timestamp
  BEFORE UPDATE ON public.user_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 9. SAMPLE DATA
-- =============================================

-- Insert Categories
INSERT INTO public.shop_categories (name, slug, description, icon, display_order) VALUES
  ('All Rewards', 'all', 'All available items in the shop', 'grid_view', 0),
  ('Vouchers', 'vouchers', 'Redeemable vouchers and packs', 'local_activity', 1),
  ('Collectibles', 'collectibles', 'Rare masks and collectible items', 'auto_awesome', 2),
  ('Digital Assets', 'digital', 'Themes, emotes, and digital content', 'devices', 3)
ON CONFLICT (slug) DO NOTHING;

-- Insert Shop Items
INSERT INTO public.shop_items (
  category_id,
  name,
  slug,
  description,
  price,
  image_url,
  badge,
  badge_color,
  item_type,
  is_limited,
  display_order
) VALUES
  (
    (SELECT id FROM public.shop_categories WHERE slug = 'collectibles'),
    'Imperial Dragon Mask',
    'imperial-dragon-mask',
    'Exclusive traditional theater cosmetic item for master players.',
    2500,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAqNSmL4qBJSQgm59dkVrpRBEbzbXNked5H7f0UDU2a3Qh8MUE_V449T-9mA5zdJLs8q2ocNEBfBw12YuHcSWUmAgTkj-Ovy7wfcuWTXPlP5ArPtONwxgQ9rRQ7ZuovtfCDCdGcPBFOWRBkb9vHSC6mZBaCaqaf20phZdvEoVKFAuCxEZK-_p3787RGKxZQPziSEtJyEHlePDJkqCwWSFe0CnyZSm7FiKfT1Qy_ALaFu9nL5no27UHxv1qxsTjFPah0qsCsxjmK',
    'Limited',
    'primary',
    'mask',
    true,
    1
  ),
  (
    (SELECT id FROM public.shop_categories WHERE slug = 'vouchers'),
    'Premium Pack Voucher',
    'premium-pack-voucher',
    'Redeem for 5 mystery cosmetic crates.',
    800,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAwc5WfMMmwkG7MT_k7r_d1uIGqWx9enyF9416qecda2e5vzPBqO-4XC0UpgNJrhG4Ubp1fa0grxJvFXeFOfVzfA9-r9WoWzxXuQXabP672fUXjxXVtuQDUxLP0Ubhd4piVhG8D5OwzlTXHHxRgw9Nez7xJPxwFPATFeREuUzuvKnqk7vePfAhAP2JYomNL1hcbbJYcGFUKQbTxosKagvi7Y42k4HK49FnzC-hjzaYW8MxqAmchjtgaA9xJCmuKhazQ32yEHklJ',
    NULL,
    NULL,
    'voucher',
    false,
    2
  ),
  (
    (SELECT id FROM public.shop_categories WHERE slug = 'digital'),
    'Golden Fan Emote',
    'golden-fan-emote',
    'A unique victory dance animation.',
    4500,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBHs9V3EIFK416-xM7bJp67TCJajeHloywh4uL9J1eVe_zQXNCtUmj3Qk3_MvQdYZTmO0ln3v8OlbhU5aQDfpQBOg1M-hOsSccrIqViLgrxITGxVJWwxtt1CXFGo8hMj0B3T1IIsUKBru0D9kzFsiPuhx9L66g2CsC73T_6cZQAbXVBxDKulgKvQHKv7WyhA2JXNd-f02JHSfdJaffp8699aJHuSLuiZ0lLfaUFtTDivvPo6QLfygxLV9esFKj2jf6plDQFFScD',
    'Rare',
    'yellow',
    'emote',
    false,
    3
  )
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

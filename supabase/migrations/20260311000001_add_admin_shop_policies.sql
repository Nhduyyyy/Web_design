-- =============================================
-- ADD ADMIN POLICIES FOR SHOP MANAGEMENT
-- Migration: Add admin policies for shop tables
-- Created: 2026-03-11
-- =============================================

-- =============================================
-- SHOP CATEGORIES - ADMIN POLICIES
-- =============================================

-- Admin can view all categories (including inactive)
CREATE POLICY "Admins can view all categories"
  ON public.shop_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can insert categories
CREATE POLICY "Admins can insert categories"
  ON public.shop_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can update categories
CREATE POLICY "Admins can update categories"
  ON public.shop_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can delete categories
CREATE POLICY "Admins can delete categories"
  ON public.shop_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =============================================
-- SHOP ITEMS - ADMIN POLICIES
-- =============================================

-- Admin can view all items (including inactive)
CREATE POLICY "Admins can view all shop items"
  ON public.shop_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can insert items
CREATE POLICY "Admins can insert shop items"
  ON public.shop_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can update items
CREATE POLICY "Admins can update shop items"
  ON public.shop_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can delete items
CREATE POLICY "Admins can delete shop items"
  ON public.shop_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =============================================
-- SHOP TRANSACTIONS - ADMIN POLICIES
-- =============================================

-- Admin can view all transactions
CREATE POLICY "Admins can view all transactions"
  ON public.shop_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =============================================
-- USER INVENTORY - ADMIN POLICIES
-- =============================================

-- Admin can view all inventories
CREATE POLICY "Admins can view all inventories"
  ON public.user_inventory FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can update any inventory
CREATE POLICY "Admins can update any inventory"
  ON public.user_inventory FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

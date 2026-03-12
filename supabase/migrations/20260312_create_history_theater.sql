-- ============================================================
-- MIGRATION: Create history_theater table
-- Tracks all actions performed by theater owners on their theater
-- ============================================================

BEGIN;

-- Create the history_theater table
CREATE TABLE IF NOT EXISTS public.history_theater (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  theater_id  UUID        NOT NULL REFERENCES public.theaters(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  action_type TEXT        NOT NULL CHECK (action_type IN ('add', 'edit', 'delete')),
  entity_type TEXT        NOT NULL CHECK (entity_type IN (
    'venue', 'theater', 'logo', 'cover',
    'schedule', 'play', 'performance',
    'event', 'livestream'
  )),
  update_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  update_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for fast dashboard queries
CREATE INDEX IF NOT EXISTS idx_history_theater_theater_id
  ON public.history_theater(theater_id);

CREATE INDEX IF NOT EXISTS idx_history_theater_update_time
  ON public.history_theater(update_time DESC);

CREATE INDEX IF NOT EXISTS idx_history_theater_theater_time
  ON public.history_theater(theater_id, update_time DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.history_theater ENABLE ROW LEVEL SECURITY;

-- Theater owners can view their own history
DROP POLICY IF EXISTS "history_theater: select own" ON public.history_theater;
CREATE POLICY "history_theater: select own"
  ON public.history_theater
  FOR SELECT
  USING (
    theater_id IN (
      SELECT id FROM public.theaters WHERE owner_id = auth.uid()
    )
  );

-- Theater owners can insert history for their own theater
DROP POLICY IF EXISTS "history_theater: insert own" ON public.history_theater;
CREATE POLICY "history_theater: insert own"
  ON public.history_theater
  FOR INSERT
  WITH CHECK (
    theater_id IN (
      SELECT id FROM public.theaters WHERE owner_id = auth.uid()
    )
  );

-- Admins (role = 'admin' in profiles) can view all history
DROP POLICY IF EXISTS "history_theater: admin select all" ON public.history_theater;
CREATE POLICY "history_theater: admin select all"
  ON public.history_theater
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

COMMIT;

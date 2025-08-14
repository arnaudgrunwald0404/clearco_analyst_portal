-- Event sync sources table for configurable event URLs
-- Safe to apply multiple times due to IF NOT EXISTS usage

CREATE TABLE IF NOT EXISTS public.event_sync_sources (
  id text PRIMARY KEY,
  url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Basic index to help ordering/filtering
CREATE INDEX IF NOT EXISTS idx_event_sync_sources_created_at ON public.event_sync_sources(created_at);
CREATE INDEX IF NOT EXISTS idx_event_sync_sources_active ON public.event_sync_sources(is_active);


ALTER TABLE public.event_sync_sources
  ADD COLUMN IF NOT EXISTS selected_tabs jsonb;


-- Cache column mappings per source/sheet-header signature
CREATE TABLE IF NOT EXISTS public.event_source_mappings (
  id text PRIMARY KEY,
  source_url text NOT NULL,
  sheet_title text,
  header_signature text NOT NULL,
  mapping jsonb NOT NULL,
  confidence numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_source_mappings_source ON public.event_source_mappings(source_url);
CREATE INDEX IF NOT EXISTS idx_event_source_mappings_sig ON public.event_source_mappings(header_signature);


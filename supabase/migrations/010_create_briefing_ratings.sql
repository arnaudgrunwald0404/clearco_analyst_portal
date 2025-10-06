-- Create table for analyst briefing ratings
BEGIN;

CREATE TABLE IF NOT EXISTS public.briefing_ratings (
  id TEXT PRIMARY KEY,
  "briefingId" TEXT NOT NULL REFERENCES public.briefings(id) ON DELETE CASCADE,
  "analystId" TEXT NOT NULL REFERENCES public.analysts(id) ON DELETE CASCADE,
  vendor_domain_id TEXT,
  "overallScore" INTEGER NOT NULL CHECK ("overallScore" BETWEEN 1 AND 5),
  "strategyScore" INTEGER CHECK ("strategyScore" BETWEEN 1 AND 5), -- Company & Product Strategy
  "materialsClarityScore" INTEGER CHECK ("materialsClarityScore" BETWEEN 1 AND 5), -- Clarity of Materials
  "featuresDesignScore" INTEGER CHECK ("featuresDesignScore" BETWEEN 1 AND 5), -- Product Features/Design
  "valueScore" INTEGER CHECK ("valueScore" BETWEEN 1 AND 5), -- Value to Customer
  "engagementScore" INTEGER CHECK ("engagementScore" BETWEEN 1 AND 5), -- Conversation & Engagement
  comments TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  UNIQUE("briefingId", "analystId")
);

CREATE INDEX IF NOT EXISTS idx_briefing_ratings_briefing ON public.briefing_ratings("briefingId");
CREATE INDEX IF NOT EXISTS idx_briefing_ratings_analyst ON public.briefing_ratings("analystId");
CREATE INDEX IF NOT EXISTS idx_briefing_ratings_vendor ON public.briefing_ratings(vendor_domain_id);

-- Optional RLS policies similar to other tables
ALTER TABLE public.briefing_ratings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='briefing_ratings' AND policyname='Authenticated users can manage briefing ratings'
  ) THEN
    CREATE POLICY "Authenticated users can manage briefing ratings" ON public.briefing_ratings
      FOR ALL USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

COMMIT;

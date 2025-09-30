-- Migration: Create briefings table with all required columns
-- This script creates the briefings table that was missing from the initial schema

BEGIN;

-- Create briefings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.briefings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  "scheduledAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "completedAt" TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'SCHEDULED',
  agenda TEXT,
  notes TEXT,
  outcomes TEXT,
  "followUpActions" TEXT,
  "contentUrl" TEXT,
  "contenturl" TEXT,
  transcript TEXT,
  ai_summary JSONB,
  attendees JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

COMMENT ON TABLE public.briefings IS 'Briefings and meetings with analysts';
COMMENT ON COLUMN public.briefings.transcript IS 'Full transcript text for the briefing';
COMMENT ON COLUMN public.briefings.notes IS 'Additional notes and observations';
COMMENT ON COLUMN public.briefings.ai_summary IS 'AI summary JSON. Structure: [ key_topics: string[], highlights: {name: string, timestamp: string, follow_ups: string[]}[], quotes: {name: string, timestamp: string, interesting_quotes: string[]}[] ]';
COMMENT ON COLUMN public.briefings.attendees IS 'Array of arrays: [[attendee_email, attendee_name, attendee_status], ...]';

-- Create briefing_analysts junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.briefing_analysts (
  id TEXT PRIMARY KEY,
  "briefingId" TEXT REFERENCES public.briefings(id) ON DELETE CASCADE NOT NULL,
  "analystId" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  UNIQUE("briefingId", "analystId")
);

COMMENT ON TABLE public.briefing_analysts IS 'Many-to-many relationship between briefings and analysts';

-- Enable Row Level Security
ALTER TABLE public.briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefing_analysts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for briefings (guard creation to avoid redefinition errors)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='briefings' AND policyname='Authenticated users can manage briefings'
  ) THEN
    CREATE POLICY "Authenticated users can manage briefings" ON public.briefings
      FOR ALL USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- Create RLS policies for briefing_analysts (guarded)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='briefing_analysts' AND policyname='Authenticated users can manage briefing analysts'
  ) THEN
    CREATE POLICY "Authenticated users can manage briefing analysts" ON public.briefing_analysts
      FOR ALL USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_briefings_status ON public.briefings(status);
CREATE INDEX IF NOT EXISTS idx_briefings_scheduled_at ON public.briefings("scheduledAt");
CREATE INDEX IF NOT EXISTS idx_briefings_completed_at ON public.briefings("completedAt");
CREATE INDEX IF NOT EXISTS idx_briefing_analysts_briefing_id ON public.briefing_analysts("briefingId");
CREATE INDEX IF NOT EXISTS idx_briefing_analysts_analyst_id ON public.briefing_analysts("analystId");

COMMIT;


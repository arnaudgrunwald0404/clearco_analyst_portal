-- Create Event table for event management
-- This table stores events/conferences that the company tracks for participation

CREATE TABLE IF NOT EXISTS public."Event" (
  id text PRIMARY KEY,
  "eventName" text NOT NULL,
  link text,
  type text DEFAULT 'CONFERENCE',
  "audienceGroups" text, -- JSON string
  "startDate" timestamptz NOT NULL,
  "participationStatus" text, -- JSON string
  owner text,
  location text,
  status text DEFAULT 'EVALUATING',
  notes text,
  "participationStatus" text CHECK (
    "participationStatus" IS NULL OR 
    "participationStatus" IN ('SPONSORING','ATTENDING','CONSIDERING')
  ),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_start_date ON public."Event"("startDate");
CREATE INDEX IF NOT EXISTS idx_event_participation_status ON public."Event"("participationStatus");
CREATE INDEX IF NOT EXISTS idx_event_status ON public."Event"(status);

-- Enable Row Level Security
ALTER TABLE public."Event" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to view events"
  ON public."Event" FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert events"
  ON public."Event" FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update events"
  ON public."Event" FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete events"
  ON public."Event" FOR DELETE
  TO authenticated
  USING (true);














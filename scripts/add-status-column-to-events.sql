-- =====================================================
-- ADD STATUS COLUMN TO EVENT_SYNC_SOURCES TABLE
-- =====================================================
-- This script adds a status column to track event participation status

-- Add status column to event_sync_sources table
ALTER TABLE public.event_sync_sources 
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('Sponsoring', 'Attending', 'Considering', 'Not Attending') OR status IS NULL);

-- Add comment to document the column
COMMENT ON COLUMN public.event_sync_sources.status IS 'Event participation status: Sponsoring, Attending, Considering, Not Attending, or null';

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'event_sync_sources' 
  AND column_name = 'status';

-- Show current table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'event_sync_sources'
ORDER BY ordinal_position;

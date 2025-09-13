-- =====================================================
-- ADD FILE NAME AND AUTHOR COLUMNS TO EVENT_SYNC_SOURCES TABLE
-- =====================================================
-- This script adds file_name and author columns to track file metadata

-- Add file_name column to event_sync_sources table
ALTER TABLE public.event_sync_sources
ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Add author column to event_sync_sources table
ALTER TABLE public.event_sync_sources
ADD COLUMN IF NOT EXISTS author TEXT;

-- Add comments to document the columns
COMMENT ON COLUMN public.event_sync_sources.file_name IS 'Name of the file/document being synced';
COMMENT ON COLUMN public.event_sync_sources.author IS 'Author/owner of the file/document';

-- Verify the columns were added
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'event_sync_sources'
  AND column_name IN ('file_name', 'author');

-- Show current table structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'event_sync_sources'
ORDER BY ordinal_position;

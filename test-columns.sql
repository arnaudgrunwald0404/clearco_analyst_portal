-- Test script to verify column names before applying indexes
-- Run this first to make sure we have the right column names

-- Check briefings table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'briefings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check analysts table columns  
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'analysts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check briefing_analysts table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'briefing_analysts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check Publication table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Publication' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check calendar_meetings table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'calendar_meetings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

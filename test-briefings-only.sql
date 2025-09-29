-- Test just the briefings table to see what columns exist
-- Run this first to see the actual column names

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'briefings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Try to select a few rows to see the actual data structure
SELECT * FROM briefings LIMIT 1;

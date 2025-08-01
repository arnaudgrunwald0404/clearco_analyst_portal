-- Check the actual column structure of influence_tiers table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'influence_tiers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also show any data that exists
SELECT * FROM influence_tiers LIMIT 5; 
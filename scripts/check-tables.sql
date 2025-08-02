-- Check existing tables and their structure
SELECT 
    table_name,
    string_agg(column_name || ' ' || data_type, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_schema = 'public'
    AND table_name NOT LIKE '_prisma%'
    AND table_name NOT LIKE 'pg_%'
GROUP BY table_name
ORDER BY table_name;
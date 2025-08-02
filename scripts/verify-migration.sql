-- Verify table consolidation
WITH table_info AS (
    SELECT 
        table_name,
        COUNT(*) as row_count,
        string_agg(column_name || ' ' || data_type, ', ' ORDER BY ordinal_position) as columns
    FROM information_schema.columns 
    WHERE table_schema = 'public'
        AND table_name NOT LIKE '_prisma%'
        AND table_name NOT LIKE 'pg_%'
    GROUP BY table_name
)
SELECT 
    table_name,
    row_count,
    columns,
    CASE 
        WHEN table_name ~ '^[A-Z]' THEN 'WARNING: Uses PascalCase'
        WHEN table_name ~ '^[a-z_]+$' THEN 'OK: Uses snake_case'
        ELSE 'WARNING: Invalid naming convention'
    END as naming_convention
FROM table_info
ORDER BY table_name;

-- Verify foreign key relationships
SELECT
    tc.table_name as table_name,
    kcu.column_name as column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;
-- Check existing tables and their columns
SELECT 
    table_name,
    array_agg(column_name ORDER BY ordinal_position) as columns,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'public'
    AND table_name NOT LIKE '_prisma%'  -- Exclude Prisma internal tables
    AND table_name NOT LIKE 'pg_%'      -- Exclude PostgreSQL internal tables
GROUP BY table_name
ORDER BY table_name;

-- Check for potential duplicate tables (similar column structure)
WITH table_columns AS (
    SELECT 
        table_name,
        array_agg(column_name ORDER BY ordinal_position) as columns,
        COUNT(*) as column_count
    FROM information_schema.columns 
    WHERE table_schema = 'public'
        AND table_name NOT LIKE '_prisma%'
        AND table_name NOT LIKE 'pg_%'
    GROUP BY table_name
)
SELECT 
    a.table_name as table1,
    b.table_name as table2,
    a.column_count,
    similarity(array_to_string(a.columns, ','), array_to_string(b.columns, ',')) as column_similarity
FROM table_columns a
JOIN table_columns b ON a.table_name < b.table_name
WHERE similarity(array_to_string(a.columns, ','), array_to_string(b.columns, ',')) > 0.5
ORDER BY column_similarity DESC;

-- Check tables with inconsistent naming conventions
SELECT table_name,
    CASE 
        WHEN table_name ~ '^[A-Z]' THEN 'PascalCase'
        WHEN table_name ~ '^[a-z_]+$' THEN 'snake_case'
        ELSE 'Other'
    END as naming_convention
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND table_name NOT LIKE '_prisma%'
    AND table_name NOT LIKE 'pg_%'
ORDER BY naming_convention, table_name;
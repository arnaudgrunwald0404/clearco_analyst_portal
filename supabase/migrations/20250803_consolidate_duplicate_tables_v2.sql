-- Pre-migration checks and data validation
DO $$ 
DECLARE
    source_counts JSONB := '{}'::JSONB;
    target_counts JSONB := '{}'::JSONB;
    table_pair RECORD;
    source_count INT;
    target_count INT;
    column_mismatch TEXT[];
BEGIN
    -- First, let's check if tables exist and get their column names
    FOR table_pair IN (
        SELECT 
            t.table_name,
            array_agg(c.column_name ORDER BY c.ordinal_position) as columns
        FROM information_schema.tables t
        JOIN information_schema.columns c 
            ON c.table_name = t.table_name 
            AND c.table_schema = t.table_schema
        WHERE t.table_schema = 'public'
            AND t.table_name ~ '^[A-Z]'
            AND t.table_type = 'BASE TABLE'
        GROUP BY t.table_name
    ) LOOP
        RAISE NOTICE 'Table % columns: %', table_pair.table_name, table_pair.columns;
    END LOOP;

    -- Now check source tables
    FOR table_pair IN (
        SELECT 
            t.table_name,
            array_agg(c.column_name ORDER BY c.ordinal_position) as columns
        FROM information_schema.tables t
        JOIN information_schema.columns c 
            ON c.table_name = t.table_name 
            AND c.table_schema = t.table_schema
        WHERE t.table_schema = 'public'
            AND t.table_name ~ '^[a-z]'
            AND t.table_type = 'BASE TABLE'
        GROUP BY t.table_name
    ) LOOP
        RAISE NOTICE 'Source table % columns: %', table_pair.table_name, table_pair.columns;
    END LOOP;
END $$;

-- Let's pause here to check the column names before proceeding with the migration
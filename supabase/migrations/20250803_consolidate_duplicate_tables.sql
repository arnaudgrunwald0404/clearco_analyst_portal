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
    -- Store initial row counts for verification
    FOR table_pair IN (
        SELECT 
            lower_table.table_name as source_table,
            upper_table.table_name as target_table
        FROM information_schema.tables lower_table
        JOIN information_schema.tables upper_table 
            ON upper_table.table_name = initcap(replace(lower_table.table_name, '_', ''))
        WHERE lower_table.table_schema = 'public' 
            AND upper_table.table_schema = 'public'
            AND lower_table.table_name ~ '^[a-z]'
            AND upper_table.table_name ~ '^[A-Z]'
    ) LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', table_pair.source_table) INTO source_count;
        source_counts := source_counts || jsonb_build_object(table_pair.source_table, source_count);
        
        EXECUTE format('SELECT COUNT(*) FROM %I', table_pair.target_table) INTO target_count;
        target_counts := target_counts || jsonb_build_object(table_pair.target_table, target_count);
    END LOOP;

    -- Create temporary table to store counts for validation
    CREATE TEMPORARY TABLE migration_validation (
        source_table TEXT,
        target_table TEXT,
        initial_source_count INT,
        initial_target_count INT,
        final_target_count INT
    );

    -- Store initial counts
    INSERT INTO migration_validation (source_table, target_table, initial_source_count, initial_target_count)
    SELECT 
        source_table,
        target_table,
        (source_counts->source_table)::INT,
        (target_counts->target_table)::INT
    FROM (
        SELECT 
            lower_table.table_name as source_table,
            upper_table.table_name as target_table
        FROM information_schema.tables lower_table
        JOIN information_schema.tables upper_table 
            ON upper_table.table_name = initcap(replace(lower_table.table_name, '_', ''))
        WHERE lower_table.table_schema = 'public' 
            AND upper_table.table_schema = 'public'
            AND lower_table.table_name ~ '^[a-z]'
            AND upper_table.table_name ~ '^[A-Z]'
    ) t;

    -- Verify column mapping for each table pair
    FOR table_pair IN (
        SELECT * FROM migration_validation
    ) LOOP
        WITH source_columns AS (
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' 
                AND table_name = table_pair.source_table
        ),
        target_columns AS (
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' 
                AND table_name = table_pair.target_table
        )
        SELECT array_agg(sc.column_name)
        INTO column_mismatch
        FROM source_columns sc
        WHERE NOT EXISTS (
            SELECT 1 
            FROM target_columns tc 
            WHERE tc.column_name = initcap(replace(sc.column_name, '_', ''))
        );

        IF column_mismatch IS NOT NULL AND array_length(column_mismatch, 1) > 0 THEN
            RAISE EXCEPTION 'Column mapping mismatch in table pair %/%. Unmapped columns: %',
                table_pair.source_table, table_pair.target_table, column_mismatch;
        END IF;
    END LOOP;
END $$;

-- Main migration (previous migration code here)
-- 1. action_items -> ActionItem
BEGIN;
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM "action_items") THEN
        INSERT INTO "ActionItem" (
            id,
            "userId",
            "analystId",
            "actionType",
            "actionStatus",
            description,
            "dueDate",
            "completedAt",
            "createdAt",
            "updatedAt"
        )
        SELECT 
            id,
            user_id,
            analyst_id,
            action_type,
            action_status,
            description,
            due_date,
            completed_at,
            created_at,
            updated_at
        FROM action_items
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;
DROP TABLE IF EXISTS action_items CASCADE;
COMMIT;

-- (... rest of the table migrations ...)

-- Post-migration validation
DO $$ 
DECLARE
    validation_record RECORD;
    final_count INT;
    missing_records INT;
BEGIN
    -- Update final counts
    FOR validation_record IN SELECT * FROM migration_validation LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', validation_record.target_table) 
        INTO final_count;
        
        UPDATE migration_validation 
        SET final_target_count = final_count 
        WHERE target_table = validation_record.target_table;
        
        -- Calculate if we're missing any records
        missing_records := (validation_record.initial_source_count + validation_record.initial_target_count) - final_count;
        
        IF missing_records > 0 THEN
            RAISE EXCEPTION 'Data loss detected in table %. Missing % records after migration.', 
                validation_record.target_table, missing_records;
        END IF;
    END LOOP;

    -- Verify RLS is enabled for all PascalCase tables
    FOR validation_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename ~ '^[A-Z]'
    LOOP
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_tables t
            JOIN pg_policies p ON p.tablename = t.tablename
            WHERE t.tablename = validation_record.tablename
        ) THEN
            RAISE EXCEPTION 'Missing RLS policies for table %', validation_record.tablename;
        END IF;
    END LOOP;

    -- Log successful migration
    RAISE NOTICE 'Migration completed successfully. Validation summary:';
    FOR validation_record IN 
        SELECT * FROM migration_validation 
        ORDER BY source_table
    LOOP
        RAISE NOTICE '% -> %: Initial (% + %), Final: %', 
            validation_record.source_table,
            validation_record.target_table,
            validation_record.initial_source_count,
            validation_record.initial_target_count,
            validation_record.final_target_count;
    END LOOP;
END $$;

-- Cleanup
DROP TABLE IF EXISTS migration_validation;
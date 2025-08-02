-- Clean up duplicate columns in ActionItem table
BEGIN;

-- Drop the old snake_case columns since we now have camelCase versions
ALTER TABLE "ActionItem" 
    DROP COLUMN IF EXISTS "user_id",
    DROP COLUMN IF EXISTS "analyst_id", 
    DROP COLUMN IF EXISTS "action_type",
    DROP COLUMN IF EXISTS "action_status",
    DROP COLUMN IF EXISTS "due_date",
    DROP COLUMN IF EXISTS "completed_at",
    DROP COLUMN IF EXISTS "created_at",
    DROP COLUMN IF EXISTS "updated_at";

-- Verify the cleanup
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ActionItem';
    
    RAISE NOTICE 'ActionItem table now has % columns', col_count;
    
    -- List remaining columns
    RAISE NOTICE 'Remaining columns:';
    FOR r IN (
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ActionItem'
        ORDER BY ordinal_position
    ) LOOP
        RAISE NOTICE '  %: %', r.column_name, r.data_type;
    END LOOP;
END $$;

COMMIT;

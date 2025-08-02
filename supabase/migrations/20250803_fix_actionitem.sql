-- First, let's add any missing columns to ActionItem
DO $$ 
BEGIN
    -- Add columns if they don't exist
    BEGIN
        ALTER TABLE "ActionItem" ADD COLUMN IF NOT EXISTS "user_id" TEXT;
        RAISE NOTICE 'Added user_id column';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add user_id column: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE "ActionItem" ADD COLUMN IF NOT EXISTS "analyst_id" TEXT;
        RAISE NOTICE 'Added analyst_id column';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add analyst_id column: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE "ActionItem" ADD COLUMN IF NOT EXISTS "action_type" TEXT;
        RAISE NOTICE 'Added action_type column';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add action_type column: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE "ActionItem" ADD COLUMN IF NOT EXISTS "action_status" TEXT;
        RAISE NOTICE 'Added action_status column';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add action_status column: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE "ActionItem" ADD COLUMN IF NOT EXISTS "description" TEXT;
        RAISE NOTICE 'Added description column';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add description column: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE "ActionItem" ADD COLUMN IF NOT EXISTS "due_date" TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added due_date column';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add due_date column: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE "ActionItem" ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added completed_at column';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add completed_at column: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE "ActionItem" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add created_at column: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE "ActionItem" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add updated_at column: %', SQLERRM;
    END;
END $$;

-- Now show the current structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'ActionItem'
ORDER BY ordinal_position;
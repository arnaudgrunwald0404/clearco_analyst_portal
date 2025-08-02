-- Clean up duplicate columns and standardize on camelCase
BEGIN;

-- First, add any missing columns to ActionItem that we need
ALTER TABLE "ActionItem"
    ADD COLUMN IF NOT EXISTS "title" text,
    ADD COLUMN IF NOT EXISTS "tags" text[],
    ADD COLUMN IF NOT EXISTS "userId" text,
    ADD COLUMN IF NOT EXISTS "analystId" text,
    ADD COLUMN IF NOT EXISTS "actionType" text,
    ADD COLUMN IF NOT EXISTS "actionStatus" text;

-- Now migrate data from action_items with proper camelCase mapping
INSERT INTO "ActionItem" (
    "id",
    "title",
    "description",
    "assignedTo",
    "assignedBy",
    "dueDate",
    "isCompleted",
    "completedAt",
    "completedBy",
    "priority",
    "category",
    "notes",
    "createdAt",
    "updatedAt",
    "userId",
    "analystId",
    "actionType",
    "actionStatus",
    "briefingId",
    "tags"
)
SELECT 
    id,
    title,
    description,
    "assignedTo",
    "assignedTo" as "assignedBy",
    "dueDate",
    (status = 'COMPLETED') as "isCompleted",
    "completedAt",
    CASE 
        WHEN status = 'COMPLETED' THEN "assignedTo"
        ELSE NULL
    END as "completedBy",
    priority::text,
    NULL as category,
    NULL as notes,
    "createdAt",
    "updatedAt",
    "assignedTo" as "userId",
    "analystId",
    'TASK' as "actionType",
    status::text as "actionStatus",
    "briefingId",
    tags
FROM action_items
ON CONFLICT (id) DO UPDATE SET
    "title" = EXCLUDED."title",
    "description" = EXCLUDED."description",
    "assignedTo" = EXCLUDED."assignedTo",
    "assignedBy" = EXCLUDED."assignedBy",
    "dueDate" = EXCLUDED."dueDate",
    "isCompleted" = EXCLUDED."isCompleted",
    "completedAt" = EXCLUDED."completedAt",
    "completedBy" = EXCLUDED."completedBy",
    "priority" = EXCLUDED."priority",
    "category" = EXCLUDED."category",
    "notes" = EXCLUDED."notes",
    "updatedAt" = EXCLUDED."updatedAt",
    "userId" = EXCLUDED."userId",
    "analystId" = EXCLUDED."analystId",
    "actionType" = EXCLUDED."actionType",
    "actionStatus" = EXCLUDED."actionStatus",
    "briefingId" = EXCLUDED."briefingId",
    "tags" = EXCLUDED."tags";

-- Verify the migration
DO $$
DECLARE
    source_count INTEGER;
    target_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO source_count FROM action_items;
    SELECT COUNT(*) INTO target_count FROM "ActionItem";
    
    RAISE NOTICE 'Migration summary:';
    RAISE NOTICE 'Source records (action_items): %', source_count;
    RAISE NOTICE 'Target records (ActionItem): %', target_count;
    
    IF target_count < source_count THEN
        RAISE WARNING 'Possible data loss! Target has fewer records than source.';
    ELSE
        RAISE NOTICE 'Migration successful! All records transferred.';
    END IF;

    -- Show sample of migrated data
    RAISE NOTICE 'Sample of migrated data:';
    FOR r IN (
        SELECT 
            ai.id,
            ai.title,
            ai."actionStatus",
            ai."isCompleted",
            ai."assignedTo",
            ai."userId"
        FROM "ActionItem" ai
        LIMIT 3
    ) LOOP
        RAISE NOTICE 'ID: %, Title: %, Status: %, Completed: %, AssignedTo: %, UserId: %',
            r.id, r.title, r."actionStatus", r."isCompleted", r."assignedTo", r."userId";
    END LOOP;
END $$;

-- If everything looks good, drop the old table
DROP TABLE IF EXISTS action_items CASCADE;

COMMIT;
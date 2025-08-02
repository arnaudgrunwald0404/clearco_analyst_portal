-- Clean up duplicate columns and standardize on camelCase
BEGIN;

-- First, add the new camelCase columns
ALTER TABLE "ActionItem"
    ADD COLUMN IF NOT EXISTS "userId" text,
    ADD COLUMN IF NOT EXISTS "analystId" text,
    ADD COLUMN IF NOT EXISTS "actionType" text,
    ADD COLUMN IF NOT EXISTS "actionStatus" text;

-- Copy data from snake_case to camelCase columns
UPDATE "ActionItem" SET
    "userId" = user_id,
    "analystId" = analyst_id,
    "actionType" = action_type,
    "actionStatus" = action_status;

-- Drop the snake_case columns
ALTER TABLE "ActionItem"
    DROP COLUMN IF EXISTS user_id,
    DROP COLUMN IF EXISTS analyst_id,
    DROP COLUMN IF EXISTS action_type,
    DROP COLUMN IF EXISTS action_status,
    DROP COLUMN IF EXISTS due_date,
    DROP COLUMN IF EXISTS completed_at,
    DROP COLUMN IF EXISTS created_at,
    DROP COLUMN IF EXISTS updated_at;

-- Now migrate data from action_items with proper camelCase mapping
INSERT INTO "ActionItem" (
    "id",
    "briefingId",
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
    "actionStatus"
)
SELECT 
    id,
    briefingId,
    description,
    assignedTo,
    NULL as assignedBy,
    dueDate,
    (status = 'COMPLETED') as isCompleted,
    completedAt,
    CASE 
        WHEN status = 'COMPLETED' THEN assignedTo
        ELSE NULL
    END as completedBy,
    priority::text,
    NULL as category,
    NULL as notes,
    createdAt,
    updatedAt,
    assignedTo as userId,
    analystId,
    'TASK' as actionType,
    status as actionStatus
FROM action_items
ON CONFLICT (id) DO UPDATE SET
    "description" = EXCLUDED.description,
    "assignedTo" = EXCLUDED.assignedTo,
    "dueDate" = EXCLUDED.dueDate,
    "isCompleted" = EXCLUDED.isCompleted,
    "completedAt" = EXCLUDED.completedAt,
    "completedBy" = EXCLUDED.completedBy,
    "priority" = EXCLUDED.priority,
    "updatedAt" = EXCLUDED.updatedAt,
    "userId" = EXCLUDED.userId,
    "analystId" = EXCLUDED.analystId,
    "actionType" = EXCLUDED.actionType,
    "actionStatus" = EXCLUDED.actionStatus;

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
    END IF;
END $$;

-- If everything looks good, drop the old table
DROP TABLE IF EXISTS action_items CASCADE;

COMMIT;
-- Clean up duplicate columns and standardize on camelCase
BEGIN;

-- First, copy data from snake_case to camelCase columns where needed
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
    NULL as assignedBy, -- New column in target
    dueDate,
    (status = 'COMPLETED') as isCompleted,
    completedAt,
    CASE 
        WHEN status = 'COMPLETED' THEN assignedTo
        ELSE NULL
    END as completedBy,
    priority::text,
    NULL as category, -- New column in target
    NULL as notes, -- New column in target
    createdAt,
    updatedAt,
    assignedTo as userId, -- Using assignedTo as userId since that's what we have
    analystId,
    'TASK' as actionType, -- Default value
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
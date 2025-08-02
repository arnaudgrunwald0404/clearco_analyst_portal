-- Clean up duplicate columns and standardize on camelCase
BEGIN;

-- First, make briefingId nullable since some action items might not have a briefing
ALTER TABLE "ActionItem" 
    ALTER COLUMN "briefingId" DROP NOT NULL;

-- Add any missing columns to ActionItem that we need
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
    status as "actionStatus",
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

-- If everything looks good, drop the old table
DROP TABLE IF EXISTS action_items CASCADE;

COMMIT;

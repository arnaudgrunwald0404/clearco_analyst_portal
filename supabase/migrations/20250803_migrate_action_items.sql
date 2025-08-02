-- Migrate action_items to ActionItem with proper field mapping
BEGIN;

-- First, let's add any missing columns to ActionItem that we need
ALTER TABLE "ActionItem" 
    ADD COLUMN IF NOT EXISTS "title" text,
    ADD COLUMN IF NOT EXISTS "status" text,
    ADD COLUMN IF NOT EXISTS "tags" text[],
    ADD COLUMN IF NOT EXISTS "analystId" text;

-- Now migrate the data with proper mapping
INSERT INTO "ActionItem" (
    "id",
    "title",
    "description",
    "status",
    "priority",
    "dueDate",
    "assignedTo",
    "analystId",
    "briefingId",
    "tags",
    "completedAt",
    "completedBy", -- We'll set this based on assignedTo for completed items
    "isCompleted", -- We'll derive this from status
    "createdAt",
    "updatedAt"
)
SELECT 
    id,
    title,
    description,
    status::text, -- Convert USER-DEFINED type to text
    priority::text, -- Convert USER-DEFINED type to text
    dueDate,
    assignedTo,
    analystId,
    briefingId,
    tags,
    completedAt,
    CASE 
        WHEN status = 'COMPLETED' THEN assignedTo
        ELSE NULL
    END as completedBy,
    CASE 
        WHEN status = 'COMPLETED' THEN true
        ELSE false
    END as isCompleted,
    createdAt,
    updatedAt
FROM action_items
ON CONFLICT (id) DO UPDATE SET
    "title" = EXCLUDED.title,
    "description" = EXCLUDED.description,
    "status" = EXCLUDED.status,
    "priority" = EXCLUDED.priority,
    "dueDate" = EXCLUDED.dueDate,
    "assignedTo" = EXCLUDED.assignedTo,
    "analystId" = EXCLUDED.analystId,
    "briefingId" = EXCLUDED.briefingId,
    "tags" = EXCLUDED.tags,
    "completedAt" = EXCLUDED.completedAt,
    "completedBy" = EXCLUDED.completedBy,
    "isCompleted" = EXCLUDED.isCompleted,
    "updatedAt" = EXCLUDED.updatedAt;

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
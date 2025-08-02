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

COMMIT;

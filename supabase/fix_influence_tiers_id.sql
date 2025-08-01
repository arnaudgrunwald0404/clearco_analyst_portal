-- Fix the ID column to have proper default value generation

-- First, let's see the current table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'influence_tiers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Set up proper ID generation (using gen_random_uuid for UUID or a custom function for CUID)
-- If the ID column is text (for CUID), we'll create a simple function
-- If it's UUID, we'll use gen_random_uuid()

-- Option 1: If using UUID type
-- ALTER TABLE influence_tiers ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Option 2: If using text/varchar for CUID-like IDs, set a simple default
ALTER TABLE influence_tiers ALTER COLUMN id SET DEFAULT 'cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 8);

-- Make frequency columns nullable
ALTER TABLE influence_tiers ALTER COLUMN "briefingFrequency" DROP NOT NULL;
ALTER TABLE influence_tiers ALTER COLUMN "touchpointFrequency" DROP NOT NULL;

-- Clear existing data
DELETE FROM influence_tiers;

-- Now insert without specifying ID - it should auto-generate
INSERT INTO influence_tiers (name, color, "briefingFrequency", "touchpointFrequency", "order", "isActive")
VALUES 
    ('VERY_HIGH', '#dc2626', 60, 30, 1, true),
    ('HIGH', '#ea580c', 90, 45, 2, true),
    ('MEDIUM', '#ca8a04', 120, 60, 3, true),
    ('LOW', '#16a34a', null, null, 4, true);

-- Verify the results
SELECT * FROM influence_tiers ORDER BY "order"; 
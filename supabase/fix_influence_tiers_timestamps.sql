-- Fix the timestamp columns to have proper default values

-- Set up default values for timestamp columns
ALTER TABLE influence_tiers ALTER COLUMN "createdAt" SET DEFAULT NOW();
ALTER TABLE influence_tiers ALTER COLUMN "updatedAt" SET DEFAULT NOW();

-- Clear existing data
DELETE FROM influence_tiers;

-- Insert sample data (timestamps will auto-generate)
INSERT INTO influence_tiers (name, color, "briefingFrequency", "touchpointFrequency", "order", "isActive")
VALUES 
    ('VERY_HIGH', '#dc2626', 60, 30, 1, true),
    ('HIGH', '#ea580c', 90, 45, 2, true),
    ('MEDIUM', '#ca8a04', 120, 60, 3, true),
    ('LOW', '#16a34a', null, null, 4, true);

-- Verify the results
SELECT * FROM influence_tiers ORDER BY "order";

-- Show the final table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'influence_tiers' 
AND table_schema = 'public'
ORDER BY ordinal_position; 
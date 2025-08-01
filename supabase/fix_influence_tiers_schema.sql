-- Fix influence_tiers table schema for Supabase
-- This ensures the table has the correct structure and nullable frequency columns

-- Make sure the frequency columns are nullable (using camelCase column names)
ALTER TABLE influence_tiers 
ALTER COLUMN "briefingFrequency" DROP NOT NULL;

ALTER TABLE influence_tiers 
ALTER COLUMN "touchpointFrequency" DROP NOT NULL;

-- Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'influence_tiers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Clear existing data and add sample data with proper IDs
DELETE FROM influence_tiers;

-- Use gen_random_uuid() or generate cuid-like IDs
INSERT INTO influence_tiers (id, name, color, "briefingFrequency", "touchpointFrequency", "order", "isActive", "createdAt", "updatedAt")
VALUES 
    ('cldefghij001', 'VERY_HIGH', '#dc2626', 60, 30, 1, true, NOW(), NOW()),
    ('cldefghij002', 'HIGH', '#ea580c', 90, 45, 2, true, NOW(), NOW()),
    ('cldefghij003', 'MEDIUM', '#ca8a04', 120, 60, 3, true, NOW(), NOW()),
    ('cldefghij004', 'LOW', '#16a34a', null, null, 4, true, NOW(), NOW());

-- Show final table structure
SELECT * FROM influence_tiers ORDER BY "order"; 
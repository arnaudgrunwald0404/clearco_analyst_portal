-- Fix permissions for influence_tiers table (simplified)

-- Check if RLS is enabled (without forcerowsecurity column)
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'influence_tiers';

-- Disable RLS for this table
ALTER TABLE influence_tiers DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON influence_tiers TO authenticated;
GRANT ALL ON influence_tiers TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Clear and insert sample data
DELETE FROM influence_tiers;

INSERT INTO influence_tiers (id, name, color, "briefingFrequency", "touchpointFrequency", "order", "isActive", "createdAt", "updatedAt")
VALUES 
    ('clsample001', 'VERY_HIGH', '#dc2626', 60, 30, 1, true, NOW(), NOW()),
    ('clsample002', 'HIGH', '#ea580c', 90, 45, 2, true, NOW(), NOW()),
    ('clsample003', 'MEDIUM', '#ca8a04', 120, 60, 3, true, NOW(), NOW()),
    ('clsample004', 'LOW', '#16a34a', null, null, 4, true, NOW(), NOW());

-- Verify it works
SELECT * FROM influence_tiers ORDER BY "order"; 
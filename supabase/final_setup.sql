-- Final setup for influence_tiers table

-- Ensure proper defaults for all columns
ALTER TABLE influence_tiers ALTER COLUMN "createdAt" SET DEFAULT NOW();
ALTER TABLE influence_tiers ALTER COLUMN "updatedAt" SET DEFAULT NOW();

-- Make sure frequency columns are nullable
ALTER TABLE influence_tiers ALTER COLUMN "briefingFrequency" DROP NOT NULL;
ALTER TABLE influence_tiers ALTER COLUMN "touchpointFrequency" DROP NOT NULL;

-- Verify table structure
\d influence_tiers;

-- Clear existing data and test insert with defaults
DELETE FROM influence_tiers;

-- Test insert without timestamps (should use defaults)
INSERT INTO influence_tiers (id, name, color, "briefingFrequency", "touchpointFrequency", "order", "isActive")
VALUES ('test123', 'TEST', '#ff0000', 30, 15, 1, true);

-- Verify the insert worked with defaults
SELECT * FROM influence_tiers;

-- Clean up test data and insert real sample data
DELETE FROM influence_tiers;

INSERT INTO influence_tiers (id, name, color, "briefingFrequency", "touchpointFrequency", "order", "isActive")
VALUES 
    ('clsample001', 'VERY_HIGH', '#dc2626', 60, 30, 1, true),
    ('clsample002', 'HIGH', '#ea580c', 90, 45, 2, true),
    ('clsample003', 'MEDIUM', '#ca8a04', 120, 60, 3, true),
    ('clsample004', 'LOW', '#16a34a', null, null, 4, true);

-- Final verification
SELECT * FROM influence_tiers ORDER BY "order"; 
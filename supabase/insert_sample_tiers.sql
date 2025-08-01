-- Clear existing data and insert sample tiers with explicit values
DELETE FROM influence_tiers;

-- Insert sample data with explicit IDs and timestamps
INSERT INTO influence_tiers (id, name, color, "briefingFrequency", "touchpointFrequency", "order", "isActive", "createdAt", "updatedAt")
VALUES 
    ('clsample001', 'VERY_HIGH', '#dc2626', 60, 30, 1, true, NOW(), NOW()),
    ('clsample002', 'HIGH', '#ea580c', 90, 45, 2, true, NOW(), NOW()),
    ('clsample003', 'MEDIUM', '#ca8a04', 120, 60, 3, true, NOW(), NOW()),
    ('clsample004', 'LOW', '#16a34a', null, null, 4, true, NOW(), NOW());

-- Verify the results
SELECT * FROM influence_tiers ORDER BY "order"; 
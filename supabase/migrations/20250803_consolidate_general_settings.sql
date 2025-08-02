-- Consolidate general_settings into GeneralSettings
BEGIN;

-- First, ensure GeneralSettings has the most complete data
-- Update GeneralSettings with any non-empty values from general_settings
UPDATE "GeneralSettings" 
SET 
    "companyName" = CASE 
        WHEN "GeneralSettings"."companyName" = '' OR "GeneralSettings"."companyName" IS NULL 
        THEN general_settings.companyName 
        ELSE "GeneralSettings"."companyName" 
    END,
    "protectedDomain" = CASE 
        WHEN "GeneralSettings"."protectedDomain" = '' OR "GeneralSettings"."protectedDomain" IS NULL 
        THEN general_settings.protectedDomain 
        ELSE "GeneralSettings"."protectedDomain" 
    END,
    "logoUrl" = CASE 
        WHEN "GeneralSettings"."logoUrl" = '' OR "GeneralSettings"."logoUrl" IS NULL 
        THEN general_settings.logoUrl 
        ELSE "GeneralSettings"."logoUrl" 
    END,
    "industryName" = CASE 
        WHEN "GeneralSettings"."industryName" = '' OR "GeneralSettings"."industryName" IS NULL 
        THEN general_settings.industryName 
        ELSE "GeneralSettings"."industryName" 
    END,
    "updatedAt" = NOW()
FROM general_settings
WHERE "GeneralSettings".id = general_settings.id;

-- Insert any records from general_settings that don't exist in GeneralSettings
INSERT INTO "GeneralSettings" (
    id,
    "companyName",
    "protectedDomain", 
    "logoUrl",
    "industryName",
    "createdAt",
    "updatedAt"
)
SELECT 
    id,
    "companyName",
    "protectedDomain",
    "logoUrl", 
    "industryName",
    "createdAt",
    NOW() as "updatedAt"
FROM general_settings
WHERE id NOT IN (SELECT id FROM "GeneralSettings")
ON CONFLICT (id) DO NOTHING;

-- Drop the old table
DROP TABLE IF EXISTS general_settings CASCADE;

COMMIT;

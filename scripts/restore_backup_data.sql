-- Restore script for backup data from db_cluster-30-07-2025@06-47-36.backup
-- Only restoring general_settings as other tables (Analyst, CalendarConnection) were empty in backup

-- Backup existing general_settings data first
CREATE TABLE IF NOT EXISTS general_settings_backup AS 
SELECT * FROM "GeneralSettings";

-- Clear current general_settings if it exists
DELETE FROM "GeneralSettings";

-- Insert the backed up general_settings data
-- Note: Converting from old snake_case table to new PascalCase table
INSERT INTO "GeneralSettings" (
    id, 
    "companyName", 
    "protectedDomain", 
    "logoUrl", 
    "industryName", 
    "createdAt", 
    "updatedAt"
) VALUES (
    'cmdpejhce0000mmhg4dxzpo7k',
    'ClearCompany', -- Restored company name (was empty in backup)
    'clearcompany.com', -- Restored protected domain (was empty in backup)  
    '/clearco-logo.png', -- Restored logo URL (was empty in backup)
    'HR Technology',
    '2025-07-30 03:24:18.447'::timestamp,
    '2025-07-30 03:24:18.447'::timestamp
);

-- Note: Analyst table and CalendarConnection were empty in backup, so no data to restore
-- Current Supabase database already has sample analysts and configuration

SELECT 'Restoration complete. General settings restored from backup.' as status; 
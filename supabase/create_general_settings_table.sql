-- Create GeneralSettings table in Supabase

-- Drop table if it exists (to start fresh)
DROP TABLE IF EXISTS "GeneralSettings" CASCADE;

-- Create the GeneralSettings table
CREATE TABLE "GeneralSettings" (
    "id" TEXT PRIMARY KEY DEFAULT ('cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 25)),
    "companyName" TEXT NOT NULL DEFAULT '',
    "protectedDomain" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "industryName" TEXT NOT NULL DEFAULT 'HR Technology',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Disable RLS for this table
ALTER TABLE "GeneralSettings" DISABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated and anonymous users
GRANT ALL ON TABLE "GeneralSettings" TO authenticated;
GRANT ALL ON TABLE "GeneralSettings" TO anon;

-- Insert default data
INSERT INTO "GeneralSettings" (id, "companyName", "protectedDomain", "logoUrl", "industryName")
VALUES ('cl_general_settings_001', 'ClearCompany', 'clearcompany.com', '/clearco-logo.png', 'HR Technology')
ON CONFLICT DO NOTHING;

-- Verify the table was created and populated
SELECT * FROM "GeneralSettings";

-- Show table info
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'GeneralSettings' 
  AND table_schema = 'public'
ORDER BY ordinal_position; 
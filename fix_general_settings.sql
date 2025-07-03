-- Fix General Settings Table and RLS Policies
-- This script ensures the general_settings table exists and has proper RLS policies

-- Create the general_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS general_settings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "companyName" TEXT NOT NULL DEFAULT '',
    "protectedDomain" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "industryName" TEXT NOT NULL DEFAULT 'HR Technology',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create the PredefinedTopic table if it doesn't exist
-- Create enum type for TopicCategory (only if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE "TopicCategory" AS ENUM ('CORE', 'ADDITIONAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "PredefinedTopic" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT UNIQUE NOT NULL,
    category "TopicCategory" NOT NULL,
    description TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on general_settings table
ALTER TABLE general_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "general_settings_select_policy" ON general_settings;
DROP POLICY IF EXISTS "general_settings_insert_policy" ON general_settings;
DROP POLICY IF EXISTS "general_settings_update_policy" ON general_settings;
DROP POLICY IF EXISTS "general_settings_delete_policy" ON general_settings;

-- Create RLS policies for general_settings that allow all authenticated users to read/write
-- Since this is a single-record settings table, we allow all authenticated users to access it

-- Allow all authenticated users to read general settings
CREATE POLICY "general_settings_select_policy" ON general_settings
    FOR SELECT 
    USING (true); -- Allow all users to read

-- Allow all authenticated users to insert general settings
CREATE POLICY "general_settings_insert_policy" ON general_settings
    FOR INSERT 
    WITH CHECK (true); -- Allow all users to insert

-- Allow all authenticated users to update general settings
CREATE POLICY "general_settings_update_policy" ON general_settings
    FOR UPDATE 
    USING (true)
    WITH CHECK (true); -- Allow all users to update

-- Allow all authenticated users to delete general settings
CREATE POLICY "general_settings_delete_policy" ON general_settings
    FOR DELETE 
    USING (true); -- Allow all users to delete

-- Enable RLS on PredefinedTopic table
ALTER TABLE "PredefinedTopic" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "topics_select_policy" ON "PredefinedTopic";
DROP POLICY IF EXISTS "topics_insert_policy" ON "PredefinedTopic";
DROP POLICY IF EXISTS "topics_update_policy" ON "PredefinedTopic";
DROP POLICY IF EXISTS "topics_delete_policy" ON "PredefinedTopic";

-- Create RLS policies for PredefinedTopic
CREATE POLICY "topics_select_policy" ON "PredefinedTopic"
    FOR SELECT 
    USING (true);

CREATE POLICY "topics_insert_policy" ON "PredefinedTopic"
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "topics_update_policy" ON "PredefinedTopic"
    FOR UPDATE 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "topics_delete_policy" ON "PredefinedTopic"
    FOR DELETE 
    USING (true);

-- Insert default general settings record if none exists
INSERT INTO general_settings (
    "companyName",
    "protectedDomain", 
    "logoUrl",
    "industryName"
) 
SELECT '', '', '', 'HR Technology'
WHERE NOT EXISTS (SELECT 1 FROM general_settings);

-- Insert some default topics if none exist
INSERT INTO "PredefinedTopic" (name, category, description, "order")
VALUES 
    ('HR Technology', 'CORE', 'Human Resources Technology and Software', 1),
    ('Talent Acquisition', 'CORE', 'Recruiting and Hiring Technologies', 2),
    ('Performance Management', 'CORE', 'Employee Performance and Review Systems', 3),
    ('Learning & Development', 'ADDITIONAL', 'Training and Development Platforms', 4),
    ('Employee Engagement', 'ADDITIONAL', 'Employee Survey and Engagement Tools', 5)
ON CONFLICT (name) DO NOTHING;

-- Update the updatedAt timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic updatedAt updates
DROP TRIGGER IF EXISTS update_general_settings_updated_at ON general_settings;
CREATE TRIGGER update_general_settings_updated_at
    BEFORE UPDATE ON general_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_topics_updated_at ON "PredefinedTopic";
CREATE TRIGGER update_topics_updated_at
    BEFORE UPDATE ON "PredefinedTopic"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

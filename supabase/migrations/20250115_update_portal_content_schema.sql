-- Update portal_content table to merge type and category into single category field
-- This migration updates the schema to match the new simplified content structure

-- First, let's check if the table exists and what its current structure is
-- If the table doesn't exist, create it with the new structure
CREATE TABLE IF NOT EXISTS portal_content (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL CHECK (category IN ('VIDEO', 'REPORT', 'DEMO', 'CASE_STUDY', 'WEBINAR', 'BRAND_KIT', 'PRODUCT', 'MISCELLANEOUS')),
  url text NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- If the table exists with the old structure, we need to migrate the data
-- First, let's create a backup of existing data
DO $$
BEGIN
  -- Check if old columns exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'portal_content' 
    AND column_name = 'type'
  ) THEN
    -- Create temporary table with new structure
    CREATE TEMP TABLE portal_content_new AS
    SELECT 
      id,
      title,
      description,
      CASE 
        WHEN type = 'VIDEO' THEN 'VIDEO'
        WHEN type = 'REPORT' THEN 'REPORT'
        WHEN type = 'DEMO' THEN 'DEMO'
        WHEN type = 'CASE_STUDY' THEN 'CASE_STUDY'
        WHEN type = 'WEBINAR' THEN 'WEBINAR'
        WHEN category = 'brand' THEN 'BRAND_KIT'
        WHEN category = 'product' THEN 'PRODUCT'
        WHEN category = 'misc' THEN 'MISCELLANEOUS'
        ELSE 'MISCELLANEOUS'
      END as category,
      url,
      "createdAt",
      "updatedAt"
    FROM portal_content;
    
    -- Drop the old table
    DROP TABLE portal_content;
    
    -- Create new table with correct structure
    CREATE TABLE portal_content (
      id text PRIMARY KEY,
      title text NOT NULL,
      description text DEFAULT '',
      category text NOT NULL CHECK (category IN ('VIDEO', 'REPORT', 'DEMO', 'CASE_STUDY', 'WEBINAR', 'BRAND_KIT', 'PRODUCT', 'MISCELLANEOUS')),
      url text NOT NULL,
      "createdAt" timestamp with time zone DEFAULT now(),
      "updatedAt" timestamp with time zone DEFAULT now()
    );
    
    -- Insert migrated data
    INSERT INTO portal_content SELECT * FROM portal_content_new;
    
    -- Clean up temp table
    DROP TABLE portal_content_new;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_portal_content_category ON portal_content(category);
CREATE INDEX IF NOT EXISTS idx_portal_content_created_at ON portal_content("createdAt");

-- Disable RLS for now (can be enabled later if needed)
ALTER TABLE portal_content DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON portal_content TO authenticated;
GRANT ALL ON portal_content TO anon;

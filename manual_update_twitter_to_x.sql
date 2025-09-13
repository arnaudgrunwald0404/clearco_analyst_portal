-- Manual SQL Script: Update Twitter to X
-- Run this in the Supabase SQL Editor

-- Step 1: Add the new 'X' value to the enum
ALTER TYPE social_platform ADD VALUE IF NOT EXISTS 'X';

-- Step 2: Update existing data from TWITTER to X
UPDATE social_posts SET platform = 'X' WHERE platform = 'TWITTER';
UPDATE social_media_posts SET platform = 'X' WHERE platform = 'TWITTER';

-- Step 3: Create a new enum without TWITTER
CREATE TYPE social_platform_new AS ENUM ('LINKEDIN', 'X', 'YOUTUBE', 'MEDIUM', 'BLOG');

-- Step 4: Update the tables to use the new enum
-- For social_posts table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'social_posts') THEN
    ALTER TABLE social_posts ALTER COLUMN platform TYPE social_platform_new USING platform::text::social_platform_new;
  END IF;
END $$;

-- For social_media_posts table (if it exists)  
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'social_media_posts') THEN
    ALTER TABLE social_media_posts ALTER COLUMN platform TYPE social_platform_new USING platform::text::social_platform_new;
  END IF;
END $$;

-- Step 5: Drop the old enum and rename the new one
DROP TYPE social_platform;
ALTER TYPE social_platform_new RENAME TO social_platform;

-- Add a comment to document the change
COMMENT ON TYPE social_platform IS 'Social media platforms enum - updated to use X instead of TWITTER';

-- Verify the changes
SELECT 'social_posts' as table_name, platform, COUNT(*) as count FROM social_posts GROUP BY platform
UNION ALL
SELECT 'social_media_posts' as table_name, platform, COUNT(*) as count FROM social_media_posts GROUP BY platform;

-- Update social platform enum from TWITTER to X
-- This migration updates the social_platform enum to use 'X' instead of 'TWITTER'

-- Step 1: Add the new 'X' value to the enum
ALTER TYPE social_platform ADD VALUE 'X';

-- Step 2: Update existing data from TWITTER to X
UPDATE social_posts SET platform = 'X' WHERE platform = 'TWITTER';
UPDATE social_media_posts SET platform = 'X' WHERE platform = 'TWITTER';

-- Step 3: Remove the old 'TWITTER' value from the enum
-- Note: PostgreSQL doesn't support removing enum values directly in older versions
-- So we'll create a new enum and replace it

-- Create the new enum
CREATE TYPE social_platform_new AS ENUM ('LINKEDIN', 'X', 'YOUTUBE', 'MEDIUM', 'BLOG');

-- Update the tables to use the new enum
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

-- Drop the old enum and rename the new one
DROP TYPE social_platform;
ALTER TYPE social_platform_new RENAME TO social_platform;

-- Add a comment to document the change
COMMENT ON TYPE social_platform IS 'Social media platforms enum - updated to use X instead of TWITTER';

-- Fix missing company column in user_profiles table
-- This resolves authentication issues that make sign out appear broken

-- Add company column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'company'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN company TEXT;
    RAISE NOTICE 'Added company column to user_profiles table';
  ELSE
    RAISE NOTICE 'Company column already exists in user_profiles table';
  END IF;
END $$;

-- Verify the change
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;
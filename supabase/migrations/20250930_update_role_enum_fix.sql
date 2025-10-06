-- Migration to update the Role enum (with capital R) used by user_profiles table
-- Step 1: Add new values to the existing Role enum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'VENDOR_ADMIN';  
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'VENDOR_USER';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ANALYST';

-- Step 2: Update existing data to use new role names
UPDATE user_profiles SET role = 'VENDOR_ADMIN' WHERE role = 'ADMIN';
UPDATE user_profiles SET role = 'VENDOR_USER' WHERE role = 'EDITOR';

-- Step 3: Update the default value
ALTER TABLE user_profiles ALTER COLUMN role SET DEFAULT 'VENDOR_USER';

-- Step 4: Remove old values from enum (this requires recreating the enum)
-- Create a temporary enum with only the new values
CREATE TYPE "Role_new" AS ENUM ('SUPER_ADMIN', 'VENDOR_ADMIN', 'VENDOR_USER', 'ANALYST');

-- Update the table to use the new enum
ALTER TABLE user_profiles ALTER COLUMN role TYPE "Role_new" USING role::text::"Role_new";

-- Drop the old enum and rename the new one
DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";

-- Verify the changes
SELECT DISTINCT role FROM user_profiles ORDER BY role;








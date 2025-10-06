-- Migration to update user_role enum from ADMIN/EDITOR to VENDOR_ADMIN/VENDOR_USER
-- and add SUPER_ADMIN role

-- Step 1: Update existing role values to new names
UPDATE user_profiles SET role = 'VENDOR_ADMIN' WHERE role = 'ADMIN';
UPDATE user_profiles SET role = 'VENDOR_USER' WHERE role = 'EDITOR';

-- Step 2: Update any other tables that might reference these roles
-- (Add similar updates for other tables as needed)

-- Step 3: Drop and recreate the enum with new values
-- Note: This approach requires careful handling in production
-- Alternative approach would be to add new values, migrate data, then remove old values

-- First, create a new temporary enum
CREATE TYPE user_role_new AS ENUM ('SUPER_ADMIN', 'VENDOR_ADMIN', 'VENDOR_USER', 'ANALYST');

-- Update the user_profiles table to use the new enum
ALTER TABLE user_profiles ALTER COLUMN role TYPE user_role_new USING role::text::user_role_new;

-- Update the default value
ALTER TABLE user_profiles ALTER COLUMN role SET DEFAULT 'VENDOR_USER';

-- Drop the old enum and rename the new one
DROP TYPE user_role;
ALTER TYPE user_role_new RENAME TO user_role;

-- Update any functions or triggers that might reference the old role names
-- (Add specific updates as needed)

-- Verify the changes
SELECT DISTINCT role FROM user_profiles ORDER BY role;







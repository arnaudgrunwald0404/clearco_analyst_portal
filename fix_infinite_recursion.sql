-- Fix infinite recursion in RLS policies for user_profiles
-- Run this in your Supabase SQL Editor

-- First, drop the problematic admin policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;

-- Recreate admin policies without circular references
-- Option 1: Use JWT metadata (requires setting role in JWT claims)
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT 
    USING (
        auth.jwt() ->> 'role' = 'ADMIN'
    );

CREATE POLICY "Admins can update all profiles" ON user_profiles
    FOR UPDATE 
    USING (
        auth.jwt() ->> 'role' = 'ADMIN'
    );

-- Option 2: If you prefer to use a separate admin table (recommended)
-- You would first create an admin_users table and reference that instead

-- Alternative: Temporary bypass for specific admin emails
-- Replace 'your-admin-email@domain.com' with your actual admin email
/*
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT 
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE email = 'your-admin-email@domain.com'
        )
    );

CREATE POLICY "Admins can update all profiles" ON user_profiles
    FOR UPDATE 
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE email = 'your-admin-email@domain.com'
        )
    );
*/

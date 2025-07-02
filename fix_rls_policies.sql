-- RLS Policies for user_profiles table
-- Run this directly in your Supabase SQL Editor to fix the 406 error

-- Enable RLS on User table
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- First, let's check if the policies already exist and drop them if they do
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;

-- Now create the policies with the correct types
CREATE POLICY "Users can view own profile" ON "User"
    FOR SELECT 
    USING (auth.uid()::text = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON "User"
    FOR UPDATE 
    USING (auth.uid()::text = id)
    WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Admins can view all profiles" ON "User"
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::text 
            AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can update all profiles" ON "User"
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::text 
            AND role = 'ADMIN'
        )
    );

-- Policy: Allow insert for new registrations
CREATE POLICY "Allow insert for new registrations" ON "User"
    FOR INSERT 
    WITH CHECK (true);

-- Enable RLS on other sensitive tables
ALTER TABLE "Analyst" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Newsletter" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Interaction" ENABLE ROW LEVEL SECURITY;

-- Basic read policies for authenticated users
CREATE POLICY "Allow authenticated read" ON "Analyst"
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read" ON "Newsletter"
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read" ON "Interaction"
    FOR SELECT
    USING (auth.role() = 'authenticated');

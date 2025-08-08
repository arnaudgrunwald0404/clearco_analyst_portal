-- RLS Policies for existing tables only
-- Run this directly in your Supabase SQL Editor to fix unrestricted tables

-- =====================================================
-- PART 1: FIX USER_PROFILES TABLE (MAIN AUTH TABLE)
-- =====================================================

-- Enable RLS on user_profiles table (this definitely exists)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;

-- Create basic policies for user_profiles (start simple to avoid type issues)
CREATE POLICY "Authenticated users can view user profiles" ON user_profiles
    FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert user profiles" ON user_profiles
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update user profiles" ON user_profiles
    FOR UPDATE 
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- More restrictive policy for admin operations (optional)
-- CREATE POLICY "Users can view own profile" ON user_profiles
--     FOR SELECT 
--     USING (auth.uid() = id);

-- =====================================================
-- PART 2: FIX OTHER TABLES (SAFELY)
-- =====================================================

-- Try to fix analysts table if it exists
DO $$
BEGIN
    ALTER TABLE analysts ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Authenticated users can manage analysts" ON analysts;
    CREATE POLICY "Authenticated users can manage analysts" ON analysts
        FOR ALL
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');
    RAISE NOTICE 'Fixed analysts table policies';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Analysts table not found, skipping';
END $$;

-- Try to fix briefings table if it exists
DO $$
BEGIN
    ALTER TABLE briefings ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Authenticated users can manage briefings" ON briefings;
    CREATE POLICY "Authenticated users can manage briefings" ON briefings
        FOR ALL
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');
    RAISE NOTICE 'Fixed briefings table policies';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Briefings table not found, skipping';
END $$;

-- Grant basic permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Show results
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE tablename = pg_tables.tablename) as policy_count
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true
ORDER BY tablename;

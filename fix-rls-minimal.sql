-- Minimal RLS Fix - Only Core Tables That Exist
-- This will fix the most important "unrestricted" tables safely

-- =====================================================
-- STEP 1: FIX USER_PROFILES (MAIN AUTH TABLE)
-- =====================================================

-- user_profiles table (definitely exists, UUID based)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- Create new policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'ADMIN'
        )
    );

-- =====================================================
-- STEP 2: FIX ANALYSTS TABLE
-- =====================================================

-- Check if analysts table exists and apply policies
DO $$
BEGIN
    -- Enable RLS
    EXECUTE 'ALTER TABLE analysts ENABLE ROW LEVEL SECURITY';
    
    -- Drop existing policies
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can manage analysts" ON analysts';
    
    -- Create simple policy for authenticated users
    EXECUTE 'CREATE POLICY "Authenticated users can manage analysts" ON analysts FOR ALL USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')';
    
    RAISE NOTICE 'Fixed analysts table RLS policies';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Analysts table does not exist, skipping';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with analysts table: %', SQLERRM;
END $$;

-- =====================================================
-- STEP 3: FIX BRIEFINGS TABLE
-- =====================================================

DO $$
BEGIN
    EXECUTE 'ALTER TABLE briefings ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can manage briefings" ON briefings';
    EXECUTE 'CREATE POLICY "Authenticated users can manage briefings" ON briefings FOR ALL USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')';
    RAISE NOTICE 'Fixed briefings table RLS policies';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Briefings table does not exist, skipping';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with briefings table: %', SQLERRM;
END $$;

-- =====================================================
-- STEP 4: FIX BRIEFING_ANALYSTS JUNCTION TABLE
-- =====================================================

DO $$
BEGIN
    EXECUTE 'ALTER TABLE briefing_analysts ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can manage briefing_analysts" ON briefing_analysts';
    EXECUTE 'CREATE POLICY "Authenticated users can manage briefing_analysts" ON briefing_analysts FOR ALL USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')';
    RAISE NOTICE 'Fixed briefing_analysts table RLS policies';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Briefing_analysts table does not exist, skipping';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with briefing_analysts table: %', SQLERRM;
END $$;

-- =====================================================
-- STEP 5: FIX INFLUENCE_TIERS (REFERENCE TABLE)
-- =====================================================

DO $$
BEGIN
    EXECUTE 'ALTER TABLE influence_tiers ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Everyone can view influence tiers" ON influence_tiers';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can manage influence tiers" ON influence_tiers';
    
    -- Allow public read access
    EXECUTE 'CREATE POLICY "Everyone can view influence tiers" ON influence_tiers FOR SELECT USING (true)';
    
    -- Allow authenticated users to manage
    EXECUTE 'CREATE POLICY "Authenticated users can manage influence tiers" ON influence_tiers FOR INSERT WITH CHECK (auth.role() = ''authenticated'')';
    EXECUTE 'CREATE POLICY "Authenticated users can update influence tiers" ON influence_tiers FOR UPDATE USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')';
    EXECUTE 'CREATE POLICY "Authenticated users can delete influence tiers" ON influence_tiers FOR DELETE USING (auth.role() = ''authenticated'')';
    
    RAISE NOTICE 'Fixed influence_tiers table RLS policies';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Influence_tiers table does not exist, skipping';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with influence_tiers table: %', SQLERRM;
END $$;

-- =====================================================
-- STEP 6: FIX ACTION_ITEMS TABLE
-- =====================================================

DO $$
BEGIN
    EXECUTE 'ALTER TABLE action_items ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can manage action_items" ON action_items';
    EXECUTE 'CREATE POLICY "Authenticated users can manage action_items" ON action_items FOR ALL USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')';
    RAISE NOTICE 'Fixed action_items table RLS policies';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Action_items table does not exist, skipping';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with action_items table: %', SQLERRM;
END $$;

-- =====================================================
-- STEP 7: FIX SOCIAL_POSTS TABLE
-- =====================================================

DO $$
BEGIN
    EXECUTE 'ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can manage social_posts" ON social_posts';
    EXECUTE 'CREATE POLICY "Authenticated users can manage social_posts" ON social_posts FOR ALL USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')';
    RAISE NOTICE 'Fixed social_posts table RLS policies';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Social_posts table does not exist, skipping';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with social_posts table: %', SQLERRM;
END $$;

-- =====================================================
-- STEP 8: GRANT BASIC PERMISSIONS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant sequence permissions for ID generation  
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =====================================================
-- STEP 9: SHOW RESULTS
-- =====================================================

-- Show which tables now have RLS enabled and policies
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    (SELECT count(*) 
     FROM pg_policies 
     WHERE schemaname = 'public' 
     AND tablename = pg_tables.tablename) as policy_count
FROM pg_tables 
WHERE schemaname = 'public'
  AND rowsecurity = true
ORDER BY tablename;

-- Show success message
DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies have been applied successfully!';
    RAISE NOTICE '📊 Check the results above to see which tables now have policies.';
    RAISE NOTICE '🔄 Refresh your Supabase dashboard - the unrestricted pills should be gone!';
END $$;
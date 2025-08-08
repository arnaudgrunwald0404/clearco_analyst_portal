-- Comprehensive RLS Policy Fix for Analyst Portal
-- This fixes all "unrestricted" tables in Supabase
-- Run this in your Supabase SQL Editor

-- =====================================================
-- PART 1: CORE TABLES WITH PROPER ACCESS CONTROL
-- =====================================================

-- Handle both user table schemas (user_profiles and "User")
-- First try user_profiles (main Supabase auth table)
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

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

-- Now handle the custom "User" table if it exists
DO $$
BEGIN
    -- Try to create policies for the custom User table
    DROP POLICY IF EXISTS "Users can view own profile" ON "User";
    DROP POLICY IF EXISTS "Users can insert own profile" ON "User";
    DROP POLICY IF EXISTS "Users can update own profile" ON "User";
    DROP POLICY IF EXISTS "Admins can view all profiles" ON "User";
    DROP POLICY IF EXISTS "Allow insert for new registrations" ON "User";

    ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can view own profile" ON "User"
        FOR SELECT 
        USING (auth.uid()::text = id);

    CREATE POLICY "Users can update own profile" ON "User"
        FOR UPDATE 
        USING (auth.uid()::text = id)
        WITH CHECK (auth.uid()::text = id);

    CREATE POLICY "Allow insert for new registrations" ON "User"
        FOR INSERT 
        WITH CHECK (true);

    CREATE POLICY "Admins can view all profiles" ON "User"
        FOR SELECT 
        USING (
            EXISTS (
                SELECT 1 FROM "User" 
                WHERE id = auth.uid()::text 
                AND role = 'ADMIN'
            )
        );
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Custom User table not found, using user_profiles only';
END $$;

-- =====================================================
-- PART 2: ANALYST TABLES - READ ACCESS FOR AUTHENTICATED
-- =====================================================

-- Analysts table
DO $$
BEGIN
    ALTER TABLE analysts ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Authenticated users can view analysts" ON analysts
        FOR SELECT
        USING (auth.role() = 'authenticated');

    CREATE POLICY "Authenticated users can insert analysts" ON analysts
        FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');

    CREATE POLICY "Authenticated users can update analysts" ON analysts
        FOR UPDATE
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');

    CREATE POLICY "Authenticated users can delete analysts" ON analysts
        FOR DELETE
        USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Analysts table not found';
END $$;

-- =====================================================
-- PART 3: BRIEFINGS AND RELATED TABLES
-- =====================================================

-- Briefings table
DO $$
BEGIN
    ALTER TABLE briefings ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Authenticated users can view briefings" ON briefings
        FOR SELECT
        USING (auth.role() = 'authenticated');

    CREATE POLICY "Authenticated users can insert briefings" ON briefings
        FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');

    CREATE POLICY "Authenticated users can update briefings" ON briefings
        FOR UPDATE
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');

    CREATE POLICY "Authenticated users can delete briefings" ON briefings
        FOR DELETE
        USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Briefings table not found';
END $$;

-- Briefing analysts junction table
ALTER TABLE briefing_analysts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage briefing analysts" ON briefing_analysts
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- PART 4: SOCIAL MEDIA AND CONTENT TABLES
-- =====================================================

-- Social posts table
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage social posts" ON social_posts
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Publications table (handle both cases)
DO $$
BEGIN
    -- Try Publication (PascalCase)
    ALTER TABLE "Publication" ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Authenticated users can view publications" ON "Publication"
        FOR SELECT
        USING (auth.role() = 'authenticated');
        
    CREATE POLICY "Authenticated users can insert publications" ON "Publication"
        FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');
        
    CREATE POLICY "Authenticated users can update publications" ON "Publication"
        FOR UPDATE
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');
        
    CREATE POLICY "Authenticated users can delete publications" ON "Publication"
        FOR DELETE
        USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN undefined_table THEN
        -- Try publication (lowercase)
        BEGIN
            ALTER TABLE publication ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY "Authenticated users can view publications" ON publication
                FOR SELECT
                USING (auth.role() = 'authenticated');
                
            CREATE POLICY "Authenticated users can insert publications" ON publication
                FOR INSERT
                WITH CHECK (auth.role() = 'authenticated');
                
            CREATE POLICY "Authenticated users can update publications" ON publication
                FOR UPDATE
                USING (auth.role() = 'authenticated')
                WITH CHECK (auth.role() = 'authenticated');
                
            CREATE POLICY "Authenticated users can delete publications" ON publication
                FOR DELETE
                USING (auth.role() = 'authenticated');
        EXCEPTION
            WHEN undefined_table THEN
                RAISE NOTICE 'Publication table not found in either case';
        END;
END $$;

-- =====================================================
-- PART 5: OPERATIONAL TABLES
-- =====================================================

-- Action items table
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage action items" ON action_items
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Calendar connections table
DO $$
BEGIN
    ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;

    -- Try different possible column names for user reference
    BEGIN
        CREATE POLICY "Users can manage own calendar connections" ON calendar_connections
            FOR ALL
            USING (auth.uid()::text = "userId")
            WITH CHECK (auth.uid()::text = "userId");
    EXCEPTION
        WHEN undefined_column THEN
            -- Try with different column name
            BEGIN
                CREATE POLICY "Users can manage own calendar connections" ON calendar_connections
                    FOR ALL
                    USING (auth.uid()::text = user_id)
                    WITH CHECK (auth.uid()::text = user_id);
            EXCEPTION
                WHEN undefined_column THEN
                    -- Fall back to allowing all authenticated users
                    CREATE POLICY "Authenticated users can manage calendar connections" ON calendar_connections
                        FOR ALL
                        USING (auth.role() = 'authenticated')
                        WITH CHECK (auth.role() = 'authenticated');
            END;
    END;
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Calendar connections table not found';
END $$;

-- Calendar meetings table
DO $$
BEGIN
    ALTER TABLE calendar_meetings ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Authenticated users can view calendar meetings" ON calendar_meetings
        FOR SELECT
        USING (auth.role() = 'authenticated');

    CREATE POLICY "Authenticated users can manage calendar meetings" ON calendar_meetings
        FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');

    CREATE POLICY "Authenticated users can update calendar meetings" ON calendar_meetings
        FOR UPDATE
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Calendar meetings table not found';
END $$;

-- =====================================================
-- PART 6: REFERENCE TABLES (OFTEN NEED PUBLIC ACCESS)
-- =====================================================

-- Influence tiers table
ALTER TABLE influence_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view influence tiers" ON influence_tiers
    FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can manage influence tiers" ON influence_tiers
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Awards table (if it exists)
DO $$
BEGIN
    ALTER TABLE awards ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Authenticated users can view awards" ON awards
        FOR SELECT
        USING (auth.role() = 'authenticated');
        
    CREATE POLICY "Authenticated users can manage awards" ON awards
        FOR ALL
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Awards table not found';
END $$;

-- =====================================================
-- PART 7: GRANT BASIC PERMISSIONS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant sequence permissions for ID generation
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =====================================================
-- PART 8: VERIFICATION
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

-- Show all policies created
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
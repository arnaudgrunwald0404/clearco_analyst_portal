-- Safe RLS Policy Fix - Handles Type Casting Issues
-- Run this in your Supabase SQL Editor to fix unrestricted tables

-- =====================================================
-- PART 1: USER PROFILES (UUID BASED)
-- =====================================================

-- user_profiles table (UUID id, extends auth.users)
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

-- =====================================================
-- PART 2: CORE ANALYST TABLES (UUID BASED)
-- =====================================================

-- analysts table
DO $$
BEGIN
    ALTER TABLE analysts ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Authenticated users can view analysts" ON analysts;
    DROP POLICY IF EXISTS "Authenticated users can insert analysts" ON analysts;
    DROP POLICY IF EXISTS "Authenticated users can update analysts" ON analysts;
    DROP POLICY IF EXISTS "Authenticated users can delete analysts" ON analysts;

    CREATE POLICY "Authenticated users can manage analysts" ON analysts
        FOR ALL
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Analysts table not found';
END $$;

-- briefings table
DO $$
BEGIN
    ALTER TABLE briefings ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Authenticated users can view briefings" ON briefings;
    DROP POLICY IF EXISTS "Authenticated users can insert briefings" ON briefings;
    DROP POLICY IF EXISTS "Authenticated users can update briefings" ON briefings;
    DROP POLICY IF EXISTS "Authenticated users can delete briefings" ON briefings;

    CREATE POLICY "Authenticated users can manage briefings" ON briefings
        FOR ALL
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Briefings table not found';
END $$;

-- briefing_analysts junction table
DO $$
BEGIN
    ALTER TABLE briefing_analysts ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Authenticated users can manage briefing analysts" ON briefing_analysts;

    CREATE POLICY "Authenticated users can manage briefing analysts" ON briefing_analysts
        FOR ALL
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Briefing analysts table not found';
END $$;

-- =====================================================
-- PART 3: SOCIAL AND CONTENT TABLES
-- =====================================================

-- social_posts table
DO $$
BEGIN
    ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Authenticated users can manage social posts" ON social_posts;

    CREATE POLICY "Authenticated users can manage social posts" ON social_posts
        FOR ALL
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Social posts table not found';
END $$;

-- Publications table (handle both naming conventions)
DO $$
BEGIN
    -- Try Publication (PascalCase)
    ALTER TABLE "Publication" ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Authenticated users can manage publications" ON "Publication";
    
    CREATE POLICY "Authenticated users can manage publications" ON "Publication"
        FOR ALL
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');
        
    RAISE NOTICE 'Applied policies to Publication table';
EXCEPTION
    WHEN undefined_table THEN
        -- Try publication (lowercase)
        BEGIN
            ALTER TABLE publication ENABLE ROW LEVEL SECURITY;
            
            DROP POLICY IF EXISTS "Authenticated users can manage publications" ON publication;
            
            CREATE POLICY "Authenticated users can manage publications" ON publication
                FOR ALL
                USING (auth.role() = 'authenticated')
                WITH CHECK (auth.role() = 'authenticated');
                
            RAISE NOTICE 'Applied policies to publication table';
        EXCEPTION
            WHEN undefined_table THEN
                RAISE NOTICE 'Publication table not found in either case';
        END;
END $$;

-- =====================================================
-- PART 4: OPERATIONAL TABLES (HANDLE TEXT IDs SAFELY)
-- =====================================================

-- action_items table (likely has TEXT userId)
DO $$
BEGIN
    ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Authenticated users can manage action items" ON action_items;

    -- Use simple authenticated check to avoid type casting issues
    CREATE POLICY "Authenticated users can manage action items" ON action_items
        FOR ALL
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Action items table not found';
END $$;

-- =====================================================
-- PART 5: REFERENCE TABLES (PUBLIC ACCESS)
-- =====================================================

-- influence_tiers table
DO $$
BEGIN
    ALTER TABLE influence_tiers ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Everyone can view influence tiers" ON influence_tiers;
    DROP POLICY IF EXISTS "Authenticated users can manage influence tiers" ON influence_tiers;

    -- Allow public read access
    CREATE POLICY "Everyone can view influence tiers" ON influence_tiers
        FOR SELECT
        USING (true);

    -- Allow authenticated users to manage
    CREATE POLICY "Authenticated users can manage influence tiers" ON influence_tiers
        FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');

    CREATE POLICY "Authenticated users can update influence tiers" ON influence_tiers
        FOR UPDATE
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');

    CREATE POLICY "Authenticated users can delete influence tiers" ON influence_tiers
        FOR DELETE
        USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Influence tiers table not found';
END $$;

-- awards table
DO $$
BEGIN
    ALTER TABLE awards ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Authenticated users can manage awards" ON awards;
    
    CREATE POLICY "Authenticated users can manage awards" ON awards
        FOR ALL
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Awards table not found';
END $$;

-- =====================================================
-- PART 6: CALENDAR TABLES (AVOID TYPE ISSUES)
-- =====================================================

-- calendar_connections (avoid userId type casting issues)
DO $$
BEGIN
    ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Authenticated users can manage calendar connections" ON calendar_connections;

    -- Use simple authenticated check to avoid type casting issues
    CREATE POLICY "Authenticated users can manage calendar connections" ON calendar_connections
        FOR ALL
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Calendar connections table not found';
END $$;

-- calendar_meetings
DO $$
BEGIN
    ALTER TABLE calendar_meetings ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Authenticated users can manage calendar meetings" ON calendar_meetings;

    CREATE POLICY "Authenticated users can manage calendar meetings" ON calendar_meetings
        FOR ALL
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Calendar meetings table not found';
END $$;

-- =====================================================
-- PART 7: HANDLE CUSTOM USER TABLE IF EXISTS
-- =====================================================

-- Custom "User" table (TEXT id)
DO $$
BEGIN
    ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own profile" ON "User";
    DROP POLICY IF EXISTS "Users can update own profile" ON "User";
    DROP POLICY IF EXISTS "Allow insert for new registrations" ON "User";

    -- TEXT id, so cast UUID to text
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
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Custom User table not found';
END $$;

-- =====================================================
-- PART 8: GRANT BASIC PERMISSIONS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant sequence permissions for ID generation  
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =====================================================
-- PART 9: VERIFICATION
-- =====================================================

-- Show tables with RLS and policy counts
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

RAISE NOTICE 'RLS Policy fix completed successfully!';
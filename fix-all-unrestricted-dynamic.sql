-- COMPREHENSIVE DYNAMIC RLS FIX
-- This will automatically find and fix ALL unrestricted tables in your database
-- No matter what they're called or how many there are!

-- =====================================================
-- PART 1: FIND ALL UNRESTRICTED TABLES
-- =====================================================

-- This query will show us all tables with RLS enabled but no policies
DO $$
DECLARE
    table_record RECORD;
    policy_count INTEGER;
    tables_fixed INTEGER := 0;
    tables_skipped INTEGER := 0;
BEGIN
    RAISE NOTICE '🔍 Starting comprehensive RLS policy fix...';
    RAISE NOTICE '📊 Scanning for unrestricted tables...';
    
    -- Loop through all tables with RLS enabled
    FOR table_record IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND rowsecurity = true
        ORDER BY tablename
    LOOP
        -- Count existing policies for this table
        SELECT COUNT(*) INTO policy_count
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = table_record.tablename;
        
        -- If no policies exist, create them
        IF policy_count = 0 THEN
            BEGIN
                -- Drop any existing policies (just in case)
                EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can manage %I" ON %I', 
                    table_record.tablename, table_record.tablename);
                
                -- Create a comprehensive policy that allows all operations for authenticated users
                EXECUTE format('CREATE POLICY "Authenticated users can manage %I" ON %I FOR ALL USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')', 
                    table_record.tablename, table_record.tablename);
                
                tables_fixed := tables_fixed + 1;
                RAISE NOTICE '✅ Fixed table: % (policy created)', table_record.tablename;
                
            EXCEPTION
                WHEN OTHERS THEN
                    tables_skipped := tables_skipped + 1;
                    RAISE NOTICE '⚠️  Skipped table: % (error: %)', table_record.tablename, SQLERRM;
            END;
        ELSE
            RAISE NOTICE '📋 Table: % already has % policies', table_record.tablename, policy_count;
        END IF;
    END LOOP;
    
    RAISE NOTICE '🎉 COMPLETE! Fixed % tables, skipped % tables', tables_fixed, tables_skipped;
END $$;

-- =====================================================
-- PART 2: SPECIAL CASES FOR COMMON REFERENCE TABLES
-- =====================================================

-- Handle common reference tables that might need public read access
DO $$
DECLARE
    ref_tables TEXT[] := ARRAY[
        'influence_tiers', 'topics', 'predefined_topics', 'covered_topics',
        'email_templates', 'newsletter_templates', 'scheduling_templates'
    ];
    table_name TEXT;
BEGIN
    RAISE NOTICE '🔧 Applying special policies for reference tables...';
    
    FOREACH table_name IN ARRAY ref_tables
    LOOP
        BEGIN
            -- Check if table exists
            PERFORM 1 FROM pg_tables WHERE tablename = table_name AND schemaname = 'public';
            
            IF FOUND THEN
                -- Enable RLS
                EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
                
                -- Drop existing policies
                EXECUTE format('DROP POLICY IF EXISTS "Public read access for %I" ON %I', table_name, table_name);
                EXECUTE format('DROP POLICY IF EXISTS "Authenticated write access for %I" ON %I', table_name, table_name);
                
                -- Create public read policy
                EXECUTE format('CREATE POLICY "Public read access for %I" ON %I FOR SELECT USING (true)', table_name, table_name);
                
                -- Create authenticated write policy
                EXECUTE format('CREATE POLICY "Authenticated write access for %I" ON %I FOR INSERT WITH CHECK (auth.role() = ''authenticated'')', table_name, table_name);
                EXECUTE format('CREATE POLICY "Authenticated update access for %I" ON %I FOR UPDATE USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')', table_name, table_name);
                EXECUTE format('CREATE POLICY "Authenticated delete access for %I" ON %I FOR DELETE USING (auth.role() = ''authenticated'')', table_name, table_name);
                
                RAISE NOTICE '✅ Applied special policies to reference table: %', table_name;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '⚠️  Could not apply special policies to: % (error: %)', table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- =====================================================
-- PART 3: HANDLE SYSTEM TABLES
-- =====================================================

-- Some system tables might need different treatment
DO $$
DECLARE
    system_tables TEXT[] := ARRAY['_prisma_migrations'];
    table_name TEXT;
BEGIN
    RAISE NOTICE '🛠️  Handling system tables...';
    
    FOREACH table_name IN ARRAY system_tables
    LOOP
        BEGIN
            -- Check if table exists and has RLS
            PERFORM 1 FROM pg_tables WHERE tablename = table_name AND schemaname = 'public' AND rowsecurity = true;
            
            IF FOUND THEN
                -- For system tables, we might want to disable RLS entirely
                EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', table_name);
                RAISE NOTICE '🔓 Disabled RLS for system table: %', table_name;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '⚠️  Could not handle system table: % (error: %)', table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- =====================================================
-- PART 4: GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Ensure proper schema and sequence permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =====================================================
-- PART 5: FINAL VERIFICATION
-- =====================================================

-- Show comprehensive results
RAISE NOTICE '📊 FINAL VERIFICATION REPORT:';

SELECT 
    '📋 SUMMARY' as report_section,
    COUNT(*) as total_rls_tables,
    COUNT(*) FILTER (WHERE policy_count > 0) as protected_tables,
    COUNT(*) FILTER (WHERE policy_count = 0) as unrestricted_tables
FROM (
    SELECT 
        tablename,
        (SELECT count(*) FROM pg_policies WHERE tablename = pg_tables.tablename) as policy_count
    FROM pg_tables 
    WHERE schemaname = 'public' AND rowsecurity = true
) t;

-- Show detailed table status
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE tablename = pg_tables.tablename) as policy_count,
    CASE 
        WHEN (SELECT count(*) FROM pg_policies WHERE tablename = pg_tables.tablename) > 0 
        THEN '✅ PROTECTED' 
        ELSE '❌ UNRESTRICTED' 
    END as status
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true
ORDER BY 
    CASE WHEN (SELECT count(*) FROM pg_policies WHERE tablename = pg_tables.tablename) = 0 THEN 0 ELSE 1 END,
    tablename;

-- Final success message
DO $$
DECLARE
    unrestricted_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unrestricted_count
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND rowsecurity = true 
    AND (SELECT count(*) FROM pg_policies WHERE tablename = pg_tables.tablename) = 0;
    
    IF unrestricted_count = 0 THEN
        RAISE NOTICE '🎉 SUCCESS! All tables are now protected with RLS policies!';
        RAISE NOTICE '🔄 Refresh your Supabase dashboard - all unrestricted pills should be gone!';
    ELSE
        RAISE NOTICE '⚠️  Still have % unrestricted tables. Check the detailed report above.', unrestricted_count;
    END IF;
END $$;
-- Fix the remaining unrestricted tables
-- Run this to complete the RLS policy setup

-- =====================================================
-- FIX CALENDAR_CONNECTIONS TABLE
-- =====================================================

ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage calendar connections" ON calendar_connections;

CREATE POLICY "Authenticated users can manage calendar connections" ON calendar_connections
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- FIX CALENDAR_MEETINGS TABLE
-- =====================================================

ALTER TABLE calendar_meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage calendar meetings" ON calendar_meetings;

CREATE POLICY "Authenticated users can manage calendar meetings" ON calendar_meetings
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- FIX GENERAL_SETTINGS TABLE
-- =====================================================

ALTER TABLE general_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage general settings" ON general_settings;

CREATE POLICY "Authenticated users can manage general settings" ON general_settings
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Show final results
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE tablename = pg_tables.tablename) as policy_count
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true
ORDER BY tablename;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ All remaining tables now have RLS policies!';
    RAISE NOTICE '🔄 Refresh your Supabase dashboard - all unrestricted pills should be gone!';
END $$;
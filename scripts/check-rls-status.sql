-- =====================================================
-- RLS STATUS CHECK SCRIPT
-- =====================================================
-- Run this to check the current state of RLS on your tables
-- Use this before and after running the fix scripts

-- =====================================================
-- CHECK WHICH TABLES HAVE RLS ENABLED
-- =====================================================

SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename NOT LIKE '_prisma_%'
  AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;

-- =====================================================
-- CHECK WHICH TABLES HAVE RLS POLICIES
-- =====================================================

SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ HAS POLICIES'
    ELSE '❌ NO POLICIES'
  END as policy_status
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- =====================================================
-- DETAILED POLICY INFORMATION
-- =====================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- TABLES THAT NEED ATTENTION
-- =====================================================

-- Tables with policies but RLS disabled
SELECT 
  t.schemaname,
  t.tablename,
  '❌ HAS POLICIES BUT RLS DISABLED' as issue
FROM pg_tables t
JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public' 
  AND t.rowsecurity = false
  AND t.tablename NOT LIKE '_prisma_%'
GROUP BY t.schemaname, t.tablename
ORDER BY t.tablename;

-- Tables with RLS enabled but no policies
SELECT 
  t.schemaname,
  t.tablename,
  '⚠️  RLS ENABLED BUT NO POLICIES' as issue
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public' 
  AND t.rowsecurity = true
  AND p.tablename IS NULL
  AND t.tablename NOT LIKE '_prisma_%'
ORDER BY t.tablename;

-- Tables with neither RLS nor policies
SELECT 
  t.schemaname,
  t.tablename,
  '❌ NO RLS, NO POLICIES' as issue
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public' 
  AND t.rowsecurity = false
  AND p.tablename IS NULL
  AND t.tablename NOT LIKE '_prisma_%'
  AND t.tablename NOT IN (
    'user_profiles',  -- Handled by Supabase Auth
    '_prisma_migrations'  -- System table
  )
ORDER BY t.tablename;

-- =====================================================
-- SUMMARY COUNT
-- =====================================================

SELECT 
  COUNT(*) as total_tables,
  COUNT(CASE WHEN rowsecurity THEN 1 END) as rls_enabled,
  COUNT(CASE WHEN NOT rowsecurity THEN 1 END) as rls_disabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename NOT LIKE '_prisma_%'
  AND tablename NOT LIKE 'pg_%';

-- =====================================================
-- NOTES
-- =====================================================

/*
EXPECTED RESULTS AFTER FIXING:

✅ All business tables should have RLS enabled
✅ All business tables should have appropriate policies
❌ System tables (_prisma_migrations) should NOT have RLS
❌ Auth tables (user_profiles) should NOT have RLS

TABLES THAT SHOULD NOT HAVE RLS:
- _prisma_migrations (system table)
- user_profiles (handled by Supabase Auth)

TABLES THAT SHOULD HAVE RLS:
- All other business tables in your schema
*/

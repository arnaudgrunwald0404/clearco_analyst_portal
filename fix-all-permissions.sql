-- Comprehensive permission fix for all tables
-- Run this in your Supabase SQL editor

-- Fix Publication table permissions (with proper case handling)
ALTER TABLE public."Publication" DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to authenticated users
GRANT ALL PRIVILEGES ON TABLE public."Publication" TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public."Publication" TO anon;

-- Also try with lowercase table name
DO $$
BEGIN
    -- Try to disable RLS on publication (lowercase)
    ALTER TABLE public.publication DISABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN undefined_table THEN
        -- Table doesn't exist with lowercase name, that's fine
        NULL;
END $$;

-- Grant permissions on analysts table as well (in case that's the issue)
GRANT ALL PRIVILEGES ON TABLE public.analysts TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.analysts TO anon;

-- Grant permissions on user_profiles table
GRANT ALL PRIVILEGES ON TABLE public.user_profiles TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.user_profiles TO anon;

-- Verify the permissions
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('Publication', 'publication', 'analysts', 'user_profiles');

-- Check if the grants were applied
SELECT 
  table_name,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants 
WHERE table_name IN ('Publication', 'publication', 'analysts', 'user_profiles')
ORDER BY table_name, grantee, privilege_type; 
-- Fix Publication table permissions
-- Run this in your Supabase SQL editor

-- First, let's disable RLS temporarily to avoid permission issues
ALTER TABLE public."Publication" DISABLE ROW LEVEL SECURITY;

-- Grant direct permissions (this is the simplest approach for now)
GRANT SELECT ON TABLE public."Publication" TO authenticated;
GRANT SELECT ON TABLE public."Publication" TO anon;
GRANT INSERT ON TABLE public."Publication" TO authenticated;
GRANT UPDATE ON TABLE public."Publication" TO authenticated;
GRANT DELETE ON TABLE public."Publication" TO authenticated;

-- If you want to re-enable RLS later with proper policies, uncomment these lines:
-- ALTER TABLE public."Publication" ENABLE ROW LEVEL SECURITY;
-- 
-- -- Drop existing policies if they exist
-- DROP POLICY IF EXISTS "Allow authenticated read access" ON public."Publication";
-- DROP POLICY IF EXISTS "Allow authenticated write access" ON public."Publication";
-- 
-- -- Create policies that allow all authenticated users to read and write
-- CREATE POLICY "Allow authenticated read access" ON public."Publication"
--   FOR SELECT
--   TO authenticated
--   USING (true);
-- 
-- CREATE POLICY "Allow authenticated write access" ON public."Publication"
--   FOR ALL
--   TO authenticated
--   USING (true)
--   WITH CHECK (true);

-- Verify the permissions
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'Publication';

-- Check if the grants were applied
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'Publication'; 
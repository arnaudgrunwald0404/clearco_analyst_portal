-- Fix RLS policies for analysts table to allow service role access
-- This script should be run in the Supabase SQL Editor

-- Option 1: Disable RLS on analysts table (temporary solution)
ALTER TABLE analysts DISABLE ROW LEVEL SECURITY;

-- Option 2: Add policy to allow service role access (better long-term solution)
-- CREATE POLICY "Service role can access all analysts" ON analysts
--     FOR ALL
--     USING (auth.role() = 'service_role');

-- Option 3: Add policy to allow authenticated users to read analysts
-- CREATE POLICY "Authenticated users can read analysts" ON analysts
--     FOR SELECT
--     USING (auth.role() = 'authenticated');

-- Option 4: Add policy to allow authenticated users to update analysts
-- CREATE POLICY "Authenticated users can update analysts" ON analysts
--     FOR UPDATE
--     USING (auth.role() = 'authenticated'); 
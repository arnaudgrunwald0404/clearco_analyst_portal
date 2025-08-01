-- Fix permissions and RLS policies for influence_tiers table

-- First, check if RLS is enabled
SELECT schemaname, tablename, rowsecurity, forcerowsecurity 
FROM pg_tables 
WHERE tablename = 'influence_tiers';

-- Disable RLS temporarily or create proper policies
-- Option 1: Disable RLS for this table (simpler for now)
ALTER TABLE influence_tiers DISABLE ROW LEVEL SECURITY;

-- Option 2: If you want to keep RLS enabled, create policies for authenticated users
-- ALTER TABLE influence_tiers ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can view influence tiers" ON influence_tiers
--   FOR SELECT USING (true);

-- CREATE POLICY "Users can insert influence tiers" ON influence_tiers
--   FOR INSERT WITH CHECK (true);

-- CREATE POLICY "Users can update influence tiers" ON influence_tiers
--   FOR UPDATE USING (true);

-- CREATE POLICY "Users can delete influence tiers" ON influence_tiers
--   FOR DELETE USING (true);

-- Grant necessary permissions to authenticated role
GRANT ALL ON influence_tiers TO authenticated;
GRANT ALL ON influence_tiers TO anon;

-- Also grant usage on the schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on the sequence if it exists (for ID generation)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Verify the table is accessible
SELECT * FROM influence_tiers LIMIT 1; 
-- Fix RLS policies for analysts table to allow service role operations
-- This allows the service client to read analyst data during OAuth flows

-- Enable RLS on analysts table
ALTER TABLE analysts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Service role can manage analysts" ON analysts;

-- Create policy to allow service role (bypass RLS) operations
-- This is needed for OAuth flows and system operations
CREATE POLICY "Service role can manage analysts" ON analysts
    FOR ALL 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Keep existing user policies for regular authenticated users
-- (These should already exist, but we'll ensure they're there)

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view analysts" ON analysts;
DROP POLICY IF EXISTS "Users can update analysts" ON analysts;
DROP POLICY IF EXISTS "Admins can view all analysts" ON analysts;
DROP POLICY IF EXISTS "Admins can update all analysts" ON analysts;

-- Policy: Users can read analysts
CREATE POLICY "Users can view analysts" ON analysts
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Policy: Users can update analysts
CREATE POLICY "Users can update analysts" ON analysts
    FOR UPDATE 
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Policy: Admin users can read all analysts
CREATE POLICY "Admins can view all analysts" ON analysts
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id::text = auth.uid()::text 
            AND role IN ('SUPER_ADMIN', 'VENDOR_ADMIN')
        )
    );

-- Policy: Admin users can update all analysts
CREATE POLICY "Admins can update all analysts" ON analysts
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id::text = auth.uid()::text 
            AND role IN ('SUPER_ADMIN', 'VENDOR_ADMIN')
        )
    );

-- Verify the policies are working
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
WHERE tablename = 'analysts'
ORDER BY policyname;


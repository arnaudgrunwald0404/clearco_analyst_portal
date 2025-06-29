-- RLS Policies for user_profiles table
-- Run this directly in your Supabase SQL Editor to fix the 406 error

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT 
    USING (auth.uid() = id);

-- Policy: Users can insert their own profile (for new registrations)
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: Users can delete their own profile
CREATE POLICY "Users can delete own profile" ON user_profiles
    FOR DELETE 
    USING (auth.uid() = id);

-- Policy: Admin users can read all profiles
-- Note: This assumes admin role is stored in auth.jwt() metadata
-- If you need to check the user_profiles table, you'll need a different approach
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT 
    USING (
        auth.jwt() ->> 'role' = 'ADMIN'
        OR auth.uid() IN (
            -- Allow superusers (you can replace with specific UUIDs)
            SELECT id FROM auth.users WHERE email IN ('admin@yourdomain.com')
        )
    );

-- Policy: Admin users can update all profiles
CREATE POLICY "Admins can update all profiles" ON user_profiles
    FOR UPDATE 
    USING (
        auth.jwt() ->> 'role' = 'ADMIN'
        OR auth.uid() IN (
            -- Allow superusers (you can replace with specific UUIDs)
            SELECT id FROM auth.users WHERE email IN ('admin@yourdomain.com')
        )
    );

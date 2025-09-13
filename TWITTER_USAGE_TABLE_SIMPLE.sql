-- Simple Twitter API Usage Table Creation
-- Run this directly in your Supabase SQL Editor
-- No foreign keys, no constraints, just basic tracking

-- Drop table if it exists (to start fresh)
DROP TABLE IF EXISTS twitter_api_usage CASCADE;

-- Create the table with minimal constraints
CREATE TABLE twitter_api_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    requests_used INTEGER NOT NULL DEFAULT 1,
    endpoint TEXT NOT NULL,
    user_id TEXT,
    analyst_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Basic indexes only
CREATE INDEX idx_twitter_usage_date ON twitter_api_usage(date);
CREATE INDEX idx_twitter_usage_endpoint ON twitter_api_usage(endpoint);

-- Enable RLS
ALTER TABLE twitter_api_usage ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies
CREATE POLICY "Allow all for service role" ON twitter_api_usage
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow select for authenticated" ON twitter_api_usage
    FOR SELECT USING (auth.role() = 'authenticated');

-- Verify creation
SELECT 'Twitter usage table created successfully!' as result;
SELECT COUNT(*) as initial_count FROM twitter_api_usage;

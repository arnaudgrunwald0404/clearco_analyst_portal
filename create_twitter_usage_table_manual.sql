-- Manual SQL to create Twitter API usage tracking table
-- Run this directly in your Supabase SQL editor or psql

-- Create table for tracking Twitter API usage
-- This helps us stay within the 500 requests/month limit
CREATE TABLE IF NOT EXISTS twitter_api_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    requests_used INTEGER NOT NULL DEFAULT 1,
    endpoint TEXT NOT NULL,
    user_id TEXT, -- Twitter user ID that was queried
    analyst_id TEXT, -- Associated analyst ID (using TEXT to avoid type conflicts)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_twitter_usage_date ON twitter_api_usage(date);
CREATE INDEX IF NOT EXISTS idx_twitter_usage_endpoint ON twitter_api_usage(endpoint);
CREATE INDEX IF NOT EXISTS idx_twitter_usage_analyst ON twitter_api_usage(analyst_id);

-- Create a unique constraint to prevent duplicate entries for same day/endpoint/user
CREATE UNIQUE INDEX IF NOT EXISTS idx_twitter_usage_unique 
ON twitter_api_usage(date, endpoint, COALESCE(user_id, ''), COALESCE(analyst_id, ''));

-- Add RLS policy
ALTER TABLE twitter_api_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read usage data
CREATE POLICY "Allow authenticated users to read Twitter usage" ON twitter_api_usage
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Allow service role to insert/update usage data
CREATE POLICY "Allow service role to manage Twitter usage" ON twitter_api_usage
    FOR ALL USING (auth.role() = 'service_role');

-- Add helpful comments
COMMENT ON TABLE twitter_api_usage IS 'Tracks Twitter API usage to stay within rate limits (500 requests/month)';
COMMENT ON COLUMN twitter_api_usage.date IS 'Date of API usage (YYYY-MM-DD)';
COMMENT ON COLUMN twitter_api_usage.requests_used IS 'Number of API requests made';
COMMENT ON COLUMN twitter_api_usage.endpoint IS 'API endpoint used (e.g., user-tweets, batch-fetch)';
COMMENT ON COLUMN twitter_api_usage.user_id IS 'Twitter user ID that was queried';
COMMENT ON COLUMN twitter_api_usage.analyst_id IS 'Associated analyst ID if applicable';

-- Verify the table was created
SELECT 'Twitter API usage tracking table created successfully!' as status;

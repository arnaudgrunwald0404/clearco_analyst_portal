-- Twitter API Usage Tracking Table
-- Tracks API requests to stay within 500/month limit
-- No foreign key constraints to avoid type conflicts

CREATE TABLE IF NOT EXISTS twitter_api_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    requests_used INTEGER NOT NULL DEFAULT 1,
    endpoint TEXT NOT NULL,
    user_id TEXT,
    analyst_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_twitter_usage_date ON twitter_api_usage(date);
CREATE INDEX IF NOT EXISTS idx_twitter_usage_endpoint ON twitter_api_usage(endpoint);
CREATE INDEX IF NOT EXISTS idx_twitter_usage_analyst ON twitter_api_usage(analyst_id);

-- Unique constraint to prevent duplicate entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_twitter_usage_unique 
ON twitter_api_usage(date, endpoint, COALESCE(user_id, ''), COALESCE(analyst_id, ''));

-- Enable RLS
ALTER TABLE twitter_api_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "twitter_usage_select" ON twitter_api_usage
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "twitter_usage_all" ON twitter_api_usage
    FOR ALL USING (auth.role() = 'service_role');

-- Table comments
COMMENT ON TABLE twitter_api_usage IS 'Tracks Twitter API usage (500 requests/month limit)';
COMMENT ON COLUMN twitter_api_usage.date IS 'Date of API usage (YYYY-MM-DD)';
COMMENT ON COLUMN twitter_api_usage.requests_used IS 'Number of requests made';
COMMENT ON COLUMN twitter_api_usage.endpoint IS 'API endpoint used';
COMMENT ON COLUMN twitter_api_usage.user_id IS 'Twitter user ID queried';
COMMENT ON COLUMN twitter_api_usage.analyst_id IS 'Associated analyst ID';

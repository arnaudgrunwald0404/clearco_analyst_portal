-- Create CalendarConnection table if it doesn't exist
CREATE TABLE IF NOT EXISTS "CalendarConnection" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'google',
    title TEXT,
    email TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expiry TIMESTAMPTZ,
    calendar_id TEXT,
    calendar_name TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_sync TIMESTAMPTZ,
    sync_in_progress BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_connection_user_id ON "CalendarConnection"(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_connection_status ON "CalendarConnection"(status);
CREATE INDEX IF NOT EXISTS idx_calendar_connection_is_active ON "CalendarConnection"(is_active);

-- Enable Row Level Security
ALTER TABLE "CalendarConnection" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own calendar connections" ON "CalendarConnection";
DROP POLICY IF EXISTS "Users can insert their own calendar connections" ON "CalendarConnection";
DROP POLICY IF EXISTS "Users can update their own calendar connections" ON "CalendarConnection";
DROP POLICY IF EXISTS "Users can delete their own calendar connections" ON "CalendarConnection";

CREATE POLICY "Users can view their own calendar connections"
    ON "CalendarConnection" FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar connections"
    ON "CalendarConnection" FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar connections"
    ON "CalendarConnection" FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar connections"
    ON "CalendarConnection" FOR DELETE
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON "CalendarConnection" TO authenticated;
GRANT ALL ON "CalendarConnection" TO service_role;

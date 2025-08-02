-- Drop existing CalendarConnection table
DROP TABLE IF EXISTS "CalendarConnection";

-- Recreate CalendarConnection table with correct schema
CREATE TABLE "CalendarConnection" (
    id TEXT PRIMARY KEY DEFAULT ('cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 25)),
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'google',
    email TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expiry TIMESTAMP WITH TIME ZONE,
    calendar_id TEXT,
    calendar_name TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING_NAME',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_in_progress BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_calendar_connection_user_id ON "CalendarConnection"(user_id);
CREATE INDEX idx_calendar_connection_status ON "CalendarConnection"(status);
CREATE INDEX idx_calendar_connection_is_active ON "CalendarConnection"(is_active);

-- Add RLS policies
ALTER TABLE "CalendarConnection" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calendar connections"
    ON "CalendarConnection" FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar connections"
    ON "CalendarConnection" FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar connections"
    ON "CalendarConnection" FOR UPDATE
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON "CalendarConnection" TO authenticated;
GRANT ALL ON "CalendarConnection" TO service_role;
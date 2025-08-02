-- First, migrate any existing data from calendar_connections to CalendarConnection
INSERT INTO "CalendarConnection" (
    user_id,
    provider,
    email,
    access_token,
    refresh_token,
    token_expiry,
    calendar_id,
    calendar_name,
    status,
    is_active,
    last_sync,
    sync_in_progress,
    created_at,
    updated_at
)
SELECT 
    user_id,
    provider,
    email,
    access_token,
    refresh_token,
    token_expiry,
    calendar_id,
    calendar_name,
    COALESCE(status, 'PENDING_NAME'),
    COALESCE(is_active, true),
    last_sync,
    COALESCE(sync_in_progress, false),
    created_at,
    updated_at
FROM calendar_connections
ON CONFLICT (id) DO NOTHING;

-- Then drop the old table
DROP TABLE IF EXISTS calendar_connections;

-- Make sure the CalendarConnection table has all the correct columns and constraints
ALTER TABLE "CalendarConnection" 
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN provider SET NOT NULL,
    ALTER COLUMN provider SET DEFAULT 'google',
    ALTER COLUMN email SET NOT NULL,
    ALTER COLUMN access_token SET NOT NULL,
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN status SET DEFAULT 'PENDING_NAME',
    ALTER COLUMN is_active SET NOT NULL,
    ALTER COLUMN is_active SET DEFAULT true,
    ALTER COLUMN sync_in_progress SET NOT NULL,
    ALTER COLUMN sync_in_progress SET DEFAULT false;

-- Recreate indexes (in case they're missing)
CREATE INDEX IF NOT EXISTS idx_calendar_connection_user_id ON "CalendarConnection"(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_connection_status ON "CalendarConnection"(status);
CREATE INDEX IF NOT EXISTS idx_calendar_connection_is_active ON "CalendarConnection"(is_active);

-- Make sure RLS is enabled and policies are in place
ALTER TABLE "CalendarConnection" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own calendar connections" ON "CalendarConnection";
DROP POLICY IF EXISTS "Users can insert their own calendar connections" ON "CalendarConnection";
DROP POLICY IF EXISTS "Users can update their own calendar connections" ON "CalendarConnection";

CREATE POLICY "Users can view their own calendar connections"
    ON "CalendarConnection" FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar connections"
    ON "CalendarConnection" FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar connections"
    ON "CalendarConnection" FOR UPDATE
    USING (auth.uid() = user_id);

-- Make sure permissions are correct
GRANT ALL ON "CalendarConnection" TO authenticated;
GRANT ALL ON "CalendarConnection" TO service_role;
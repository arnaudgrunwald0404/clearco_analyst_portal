-- First, check if we need to migrate data
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM "calendar_connections") THEN
        -- Migrate data from old table if it exists
        INSERT INTO "CalendarConnection" (
            "userId",
            provider,
            email,
            "accessToken",
            "refreshToken",
            "expiresAt",
            "calendarId",
            "calendarName",
            status,
            "isActive",
            "lastSync",
            "syncInProgress",
            "createdAt",
            "updatedAt"
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

        -- Drop the old table
        DROP TABLE IF EXISTS calendar_connections;
    END IF;
END $$;

-- Make sure the CalendarConnection table has all the correct columns and constraints
ALTER TABLE "CalendarConnection" 
    ALTER COLUMN "userId" SET NOT NULL,
    ALTER COLUMN provider SET NOT NULL,
    ALTER COLUMN provider SET DEFAULT 'google',
    ALTER COLUMN email SET NOT NULL,
    ALTER COLUMN "accessToken" SET NOT NULL,
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN status SET DEFAULT 'PENDING_NAME',
    ALTER COLUMN "isActive" SET NOT NULL,
    ALTER COLUMN "isActive" SET DEFAULT true,
    ALTER COLUMN "syncInProgress" SET NOT NULL,
    ALTER COLUMN "syncInProgress" SET DEFAULT false;

-- Recreate indexes (in case they're missing)
CREATE INDEX IF NOT EXISTS idx_calendar_connection_user_id ON "CalendarConnection"("userId");
CREATE INDEX IF NOT EXISTS idx_calendar_connection_status ON "CalendarConnection"(status);
CREATE INDEX IF NOT EXISTS idx_calendar_connection_is_active ON "CalendarConnection"("isActive");

-- Make sure RLS is enabled and policies are in place
ALTER TABLE "CalendarConnection" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own calendar connections" ON "CalendarConnection";
DROP POLICY IF EXISTS "Users can insert their own calendar connections" ON "CalendarConnection";
DROP POLICY IF EXISTS "Users can update their own calendar connections" ON "CalendarConnection";

CREATE POLICY "Users can view their own calendar connections"
    ON "CalendarConnection" FOR SELECT
    USING (auth.uid() = "userId");

CREATE POLICY "Users can insert their own calendar connections"
    ON "CalendarConnection" FOR INSERT
    WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update their own calendar connections"
    ON "CalendarConnection" FOR UPDATE
    USING (auth.uid() = "userId");

-- Make sure permissions are correct
GRANT ALL ON "CalendarConnection" TO authenticated;
GRANT ALL ON "CalendarConnection" TO service_role;
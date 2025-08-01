-- Add calendar_connections table to Supabase schema
CREATE TABLE IF NOT EXISTS calendar_connections (
  id text PRIMARY KEY DEFAULT 'cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  "userId" text NOT NULL,
  title text,
  email text,
  "accessToken" text,
  "refreshToken" text,
  "expiresAt" timestamp with time zone,
  "calendarId" text,
  "calendarName" text,
  "isActive" boolean DEFAULT true,
  "lastSyncAt" timestamp with time zone,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Add index for userId lookups
CREATE INDEX IF NOT EXISTS idx_calendar_connections_user_id ON calendar_connections("userId");

-- Add index for active connections
CREATE INDEX IF NOT EXISTS idx_calendar_connections_active ON calendar_connections("isActive");

-- Disable RLS and grant permissions
ALTER TABLE calendar_connections DISABLE ROW LEVEL SECURITY;
GRANT ALL ON calendar_connections TO authenticated;
GRANT ALL ON calendar_connections TO anon;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon; 
-- Add analyst_portal_settings table to Supabase schema
CREATE TABLE IF NOT EXISTS analyst_portal_settings (
  id text PRIMARY KEY DEFAULT 'cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  "welcomeQuote" text DEFAULT '',
  "quoteAuthor" text DEFAULT '',
  "authorImageUrl" text DEFAULT '',
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Disable RLS and grant permissions
ALTER TABLE analyst_portal_settings DISABLE ROW LEVEL SECURITY;
GRANT ALL ON analyst_portal_settings TO authenticated;
GRANT ALL ON analyst_portal_settings TO anon;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon; 
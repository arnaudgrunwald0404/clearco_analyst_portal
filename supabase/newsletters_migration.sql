-- Add newsletters table to Supabase schema
CREATE TABLE IF NOT EXISTS newsletters (
  id text PRIMARY KEY DEFAULT 'cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  title text NOT NULL,
  subject text,
  content text,
  status text DEFAULT 'DRAFT',
  "templateId" text,
  "recipientCount" integer DEFAULT 0,
  "openCount" integer DEFAULT 0,
  "clickCount" integer DEFAULT 0,
  "scheduledAt" timestamp with time zone,
  "sentAt" timestamp with time zone,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now(),
  "createdBy" text,
  tags text[]
);

-- Newsletter subscriptions/recipients table
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id text PRIMARY KEY DEFAULT 'cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  "newsletterId" text NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
  "analystId" text NOT NULL REFERENCES analysts(id) ON DELETE CASCADE,
  email text NOT NULL,
  "subscribedAt" timestamp with time zone DEFAULT now(),
  "unsubscribedAt" timestamp with time zone,
  opened boolean DEFAULT false,
  "openedAt" timestamp with time zone,
  clicked boolean DEFAULT false,
  "clickedAt" timestamp with time zone,
  "createdAt" timestamp with time zone DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_newsletters_status ON newsletters(status);
CREATE INDEX IF NOT EXISTS idx_newsletters_sent_at ON newsletters("sentAt");
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_newsletter_id ON newsletter_subscriptions("newsletterId");
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_analyst_id ON newsletter_subscriptions("analystId");

-- Disable RLS and grant permissions
ALTER TABLE newsletters DISABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions DISABLE ROW LEVEL SECURITY;

GRANT ALL ON newsletters TO authenticated;
GRANT ALL ON newsletters TO anon;
GRANT ALL ON newsletter_subscriptions TO authenticated;
GRANT ALL ON newsletter_subscriptions TO anon;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon; 
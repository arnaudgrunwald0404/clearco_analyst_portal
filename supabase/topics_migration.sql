-- Add topics and covered_topics tables to Supabase schema

-- Topics table
CREATE TABLE IF NOT EXISTS topics (
  id text PRIMARY KEY DEFAULT 'cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  name text NOT NULL UNIQUE,
  description text,
  category text DEFAULT 'ADDITIONAL',
  "order" integer DEFAULT 0,
  "isActive" boolean DEFAULT true,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Covered Topics (analyst-topic relationships)
CREATE TABLE IF NOT EXISTS covered_topics (
  id text PRIMARY KEY DEFAULT 'cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  "analystId" text NOT NULL REFERENCES analysts(id) ON DELETE CASCADE,
  topic text NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_topics_name ON topics(name);
CREATE INDEX IF NOT EXISTS idx_topics_category ON topics(category);
CREATE INDEX IF NOT EXISTS idx_topics_active ON topics("isActive");
CREATE INDEX IF NOT EXISTS idx_covered_topics_analyst_id ON covered_topics("analystId");
CREATE INDEX IF NOT EXISTS idx_covered_topics_topic ON covered_topics(topic);

-- Disable RLS and grant permissions
ALTER TABLE topics DISABLE ROW LEVEL SECURITY;
ALTER TABLE covered_topics DISABLE ROW LEVEL SECURITY;

GRANT ALL ON topics TO authenticated;
GRANT ALL ON topics TO anon;
GRANT ALL ON covered_topics TO authenticated;
GRANT ALL ON covered_topics TO anon;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon; 
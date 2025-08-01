-- Set up permissions for all migrated tables

-- Disable RLS for all tables (simplest approach for now)
ALTER TABLE analysts DISABLE ROW LEVEL SECURITY;
ALTER TABLE briefings DISABLE ROW LEVEL SECURITY;
ALTER TABLE briefing_analysts DISABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE action_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_meetings DISABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated and anonymous users
GRANT ALL ON analysts TO authenticated;
GRANT ALL ON analysts TO anon;

GRANT ALL ON briefings TO authenticated;
GRANT ALL ON briefings TO anon;

GRANT ALL ON briefing_analysts TO authenticated;
GRANT ALL ON briefing_analysts TO anon;

GRANT ALL ON social_posts TO authenticated;
GRANT ALL ON social_posts TO anon;

GRANT ALL ON action_items TO authenticated;
GRANT ALL ON action_items TO anon;

GRANT ALL ON calendar_connections TO authenticated;
GRANT ALL ON calendar_connections TO anon;

GRANT ALL ON calendar_meetings TO authenticated;
GRANT ALL ON calendar_meetings TO anon;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Set up default values for timestamps on all tables
ALTER TABLE analysts ALTER COLUMN "createdAt" SET DEFAULT NOW();
ALTER TABLE analysts ALTER COLUMN "updatedAt" SET DEFAULT NOW();

ALTER TABLE briefings ALTER COLUMN "createdAt" SET DEFAULT NOW();
ALTER TABLE briefings ALTER COLUMN "updatedAt" SET DEFAULT NOW();

ALTER TABLE briefing_analysts ALTER COLUMN "createdAt" SET DEFAULT NOW();

ALTER TABLE social_posts ALTER COLUMN "createdAt" SET DEFAULT NOW();

ALTER TABLE action_items ALTER COLUMN "createdAt" SET DEFAULT NOW();
ALTER TABLE action_items ALTER COLUMN "updatedAt" SET DEFAULT NOW();

ALTER TABLE calendar_connections ALTER COLUMN "createdAt" SET DEFAULT NOW();
ALTER TABLE calendar_connections ALTER COLUMN "updatedAt" SET DEFAULT NOW();

ALTER TABLE calendar_meetings ALTER COLUMN "createdAt" SET DEFAULT NOW();
ALTER TABLE calendar_meetings ALTER COLUMN "updatedAt" SET DEFAULT NOW();

-- Verify tables are accessible
SELECT 'analysts' as table_name, count(*) as row_count FROM analysts
UNION ALL
SELECT 'briefings', count(*) FROM briefings
UNION ALL
SELECT 'briefing_analysts', count(*) FROM briefing_analysts
UNION ALL
SELECT 'social_posts', count(*) FROM social_posts
UNION ALL
SELECT 'action_items', count(*) FROM action_items
UNION ALL
SELECT 'calendar_connections', count(*) FROM calendar_connections
UNION ALL
SELECT 'calendar_meetings', count(*) FROM calendar_meetings
ORDER BY table_name; 
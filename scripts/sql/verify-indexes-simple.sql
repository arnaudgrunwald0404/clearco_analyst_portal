-- Simple verification of created indexes
-- This will show all indexes for your tables

-- Check what indexes exist for your main tables
SELECT 
    indexname,
    tablename
FROM pg_indexes 
WHERE tablename IN (
    'Analyst', 'Briefing', 'SocialPost', 'CalendarMeeting', 
    'Newsletter', 'NewsletterSubscription', 'Interaction', 
    'Alert', 'Content', 'BriefingAnalyst'
)
ORDER BY tablename, indexname;

-- Alternative: Check all indexes in your schema
SELECT 
    indexname,
    tablename
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Count how many performance indexes were created
SELECT 
    COUNT(*) as total_performance_indexes
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'; 
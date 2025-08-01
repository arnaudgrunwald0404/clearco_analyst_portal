-- Test Performance Improvement After Adding Indexes
-- Run this to see the performance difference

-- Test 1: Analyst queries (most critical)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) FROM "Analyst" WHERE status = 'ACTIVE';

EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) FROM "Analyst" WHERE "createdAt" >= NOW() - INTERVAL '90 days';

-- Test 2: Briefing queries
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) FROM "Briefing" WHERE "scheduledAt" >= NOW() - INTERVAL '90 days';

EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) FROM "Briefing" WHERE status = 'COMPLETED';

-- Test 3: Social Post queries
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) FROM "SocialPost" WHERE "postedAt" >= NOW() - INTERVAL '7 days';

EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) FROM "SocialPost" WHERE "analystId" = 'test' AND "isRelevant" = true;

-- Test 4: Calendar Meeting queries
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) FROM "CalendarMeeting" WHERE "startTime" >= NOW() - INTERVAL '30 days';

EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) FROM "CalendarMeeting" WHERE "isAnalystMeeting" = true;

-- Test 5: Newsletter queries
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) FROM "Newsletter" WHERE "sentAt" >= NOW() - INTERVAL '90 days';

-- Test 6: Complex dashboard query (simulating your actual dashboard)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT 
    (SELECT COUNT(*) FROM "Analyst" WHERE status = 'ACTIVE') as active_analysts,
    (SELECT COUNT(*) FROM "Briefing" WHERE "scheduledAt" >= NOW() - INTERVAL '90 days') as recent_briefings,
    (SELECT COUNT(*) FROM "SocialPost" WHERE "postedAt" >= NOW() - INTERVAL '7 days' AND "isRelevant" = true) as recent_social_posts,
    (SELECT COUNT(*) FROM "Newsletter" WHERE "sentAt" >= NOW() - INTERVAL '90 days') as recent_newsletters;

-- Check index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY idx_scan DESC; 
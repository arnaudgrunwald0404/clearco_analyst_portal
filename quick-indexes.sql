-- Quick Critical Indexes for Immediate Performance Improvement
-- Apply these first for maximum impact

-- =====================================================
-- CRITICAL INDEXES - APPLY THESE FIRST
-- =====================================================

-- 1. BRIEFINGS TABLE - Most heavily queried
CREATE INDEX IF NOT EXISTS idx_briefings_status_scheduled_at ON briefings(status, "scheduledAt");
CREATE INDEX IF NOT EXISTS idx_briefings_status_created_at ON briefings(status, "createdAt");
CREATE INDEX IF NOT EXISTS idx_briefings_scheduled_at_asc ON briefings("scheduledAt" ASC);

-- 2. ANALYSTS TABLE - Second most queried
CREATE INDEX IF NOT EXISTS idx_analysts_status_influence ON analysts(status, influence);
CREATE INDEX IF NOT EXISTS idx_analysts_updated_at ON analysts("updatedAt");

-- 3. BRIEFING_ANALYSTS JUNCTION - Critical for N+1 query elimination
CREATE INDEX IF NOT EXISTS idx_briefing_analysts_analyst_briefing ON briefing_analysts("analystId", "briefingId");

-- 4. PUBLICATIONS TABLE - Dashboard queries
CREATE INDEX IF NOT EXISTS idx_publications_published_at_desc ON "Publication"("publishedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_publications_analyst_published_at ON "Publication"("analystId", "publishedAt");

-- 5. CALENDAR_MEETINGS - Recent activity queries
CREATE INDEX IF NOT EXISTS idx_calendar_meetings_analyst_end_time ON calendar_meetings("analystId", "endTime");
CREATE INDEX IF NOT EXISTS idx_calendar_meetings_end_time_desc ON calendar_meetings("endTime" DESC);

-- =====================================================
-- UPDATE STATISTICS
-- =====================================================

-- Update table statistics for query planner
ANALYZE analysts;
ANALYZE briefings;
ANALYZE briefing_analysts;
ANALYZE "Publication";
ANALYZE calendar_meetings;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check that indexes were created
SELECT 
    t.relname as table_name,
    i.relname as index_name,
    pg_size_pretty(pg_relation_size(i.oid)) as index_size
FROM pg_class t
JOIN pg_index idx ON t.oid = idx.indrelid
JOIN pg_class i ON i.oid = idx.indexrelid
WHERE t.relkind = 'r'
AND i.relname LIKE 'idx_%'
ORDER BY pg_relation_size(i.oid) DESC;

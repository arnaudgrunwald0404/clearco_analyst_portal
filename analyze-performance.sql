-- Performance Analysis Queries for Analyst Portal
-- Run these queries to identify performance bottlenecks

-- =====================================================
-- QUERY PERFORMANCE ANALYSIS
-- =====================================================

-- 1. Slowest queries (requires pg_stat_statements extension)
-- Uncomment if pg_stat_statements is enabled:
/*
SELECT 
    query,
    calls,
    total_time,
    total_time / calls AS avg_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE query NOT LIKE '%pg_stat_statements%'
AND calls > 0
ORDER BY total_time / calls DESC 
LIMIT 10;
*/

-- 2. Table sizes (identify largest tables)
SELECT 
    schemaname, 
    tablename, 
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 3. Index usage statistics
SELECT 
    schemaname, 
    tablename, 
    indexname, 
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- 4. Unused indexes (indexes with 0 scans)
SELECT 
    schemaname, 
    tablename, 
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- 5. Table access patterns
SELECT 
    schemaname, 
    tablename, 
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    n_tup_ins,
    n_tup_upd,
    n_tup_del
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;

-- 6. Missing indexes (tables with high sequential scans)
SELECT 
    schemaname, 
    tablename, 
    seq_scan,
    seq_tup_read,
    CASE 
        WHEN seq_scan > 0 THEN seq_tup_read / seq_scan 
        ELSE 0 
    END as avg_rows_per_scan
FROM pg_stat_user_tables 
WHERE schemaname = 'public' 
AND seq_scan > 0
ORDER BY seq_tup_read DESC;

-- =====================================================
-- SPECIFIC ANALYST PORTAL QUERIES
-- =====================================================

-- 7. Briefings table analysis
SELECT 
    status,
    COUNT(*) as count,
    MIN(scheduledAt) as earliest_scheduled,
    MAX(scheduledAt) as latest_scheduled
FROM briefings 
GROUP BY status
ORDER BY count DESC;

-- 8. Analysts table analysis
SELECT 
    status,
    influence,
    COUNT(*) as count
FROM analysts 
GROUP BY status, influence
ORDER BY count DESC;

-- 9. Publication date distribution
SELECT 
    DATE_TRUNC('month', publishedAt) as month,
    COUNT(*) as publications
FROM "Publication"
WHERE publishedAt IS NOT NULL
GROUP BY DATE_TRUNC('month', publishedAt)
ORDER BY month DESC
LIMIT 12;

-- 10. Calendar meetings analysis
SELECT 
    COUNT(*) as total_meetings,
    COUNT(DISTINCT analystId) as unique_analysts,
    MIN(endTime) as earliest_meeting,
    MAX(endTime) as latest_meeting
FROM calendar_meetings;

-- =====================================================
-- INDEX RECOMMENDATIONS BASED ON ANALYSIS
-- =====================================================

-- 11. Tables that need indexes (based on sequential scans)
WITH table_stats AS (
    SELECT 
        schemaname, 
        tablename, 
        seq_scan,
        seq_tup_read,
        idx_scan,
        CASE 
            WHEN seq_scan > 0 THEN seq_tup_read / seq_scan 
            ELSE 0 
        END as avg_rows_per_scan
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public'
)
SELECT 
    tablename,
    seq_scan,
    avg_rows_per_scan,
    CASE 
        WHEN seq_scan > 100 AND avg_rows_per_scan > 1000 THEN 'HIGH PRIORITY'
        WHEN seq_scan > 50 AND avg_rows_per_scan > 500 THEN 'MEDIUM PRIORITY'
        WHEN seq_scan > 10 AND avg_rows_per_scan > 100 THEN 'LOW PRIORITY'
        ELSE 'NO ACTION NEEDED'
    END as priority
FROM table_stats
WHERE seq_scan > 0
ORDER BY avg_rows_per_scan DESC;

-- =====================================================
-- QUERY PLAN ANALYSIS (for specific slow queries)
-- =====================================================

-- 12. Example query plan analysis for briefings due query
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM briefings 
WHERE status = 'SCHEDULED' 
AND scheduledAt < NOW() + INTERVAL '1 day'
ORDER BY scheduledAt ASC;

-- 13. Example query plan analysis for analysts with influence
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM analysts 
WHERE status = 'ACTIVE' 
ORDER BY influence DESC 
LIMIT 10;

-- =====================================================
-- MAINTENANCE RECOMMENDATIONS
-- =====================================================

-- 14. Tables that need VACUUM (high dead tuples)
SELECT 
    schemaname, 
    tablename, 
    n_dead_tup,
    n_live_tup,
    CASE 
        WHEN n_live_tup > 0 THEN (n_dead_tup::float / n_live_tup) * 100 
        ELSE 0 
    END as dead_tuple_percentage
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
AND n_dead_tup > 0
ORDER BY dead_tuple_percentage DESC;

-- 15. Tables that need ANALYZE (stale statistics)
SELECT 
    schemaname, 
    tablename, 
    last_autoanalyze,
    last_analyze,
    CASE 
        WHEN last_analyze IS NULL THEN 'NEVER ANALYZED'
        WHEN last_autoanalyze > last_analyze THEN 'AUTO-ANALYZED RECENTLY'
        ELSE 'MANUAL ANALYZE NEEDED'
    END as analyze_status
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY last_analyze ASC;

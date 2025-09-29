-- Simple Performance Analysis for Analyst Portal
-- Works with standard PostgreSQL without requiring extensions

-- =====================================================
-- TABLE ANALYSIS
-- =====================================================

-- 1. Table sizes (identify largest tables)
SELECT 
    schemaname, 
    tablename, 
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 2. Index usage statistics
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

-- 3. Unused indexes (indexes with 0 scans)
SELECT 
    schemaname, 
    tablename, 
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- 4. Table access patterns
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

-- 5. Tables with high sequential scans (need indexes)
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
-- ANALYST PORTAL SPECIFIC ANALYSIS
-- =====================================================

-- 6. Briefings table analysis
SELECT 
    status,
    COUNT(*) as count,
    MIN(scheduled_at) as earliest_scheduled,
    MAX(scheduled_at) as latest_scheduled
FROM briefings 
GROUP BY status
ORDER BY count DESC;

-- 7. Analysts table analysis
SELECT 
    status,
    influence,
    COUNT(*) as count
FROM analysts 
GROUP BY status, influence
ORDER BY count DESC;

-- 8. Publication date distribution
SELECT 
    DATE_TRUNC('month', published_at) as month,
    COUNT(*) as publications
FROM "Publication"
WHERE published_at IS NOT NULL
GROUP BY DATE_TRUNC('month', published_at)
ORDER BY month DESC
LIMIT 12;

-- 9. Calendar meetings analysis
SELECT 
    COUNT(*) as total_meetings,
    COUNT(DISTINCT analyst_id) as unique_analysts,
    MIN(end_time) as earliest_meeting,
    MAX(end_time) as latest_meeting
FROM calendar_meetings;

-- =====================================================
-- INDEX RECOMMENDATIONS
-- =====================================================

-- 10. Tables that need indexes (based on sequential scans)
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
-- QUERY PLAN ANALYSIS
-- =====================================================

-- 11. Example query plan analysis for briefings due query
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM briefings 
WHERE status = 'SCHEDULED' 
AND scheduled_at < NOW() + INTERVAL '1 day'
ORDER BY scheduled_at ASC;

-- 12. Example query plan analysis for analysts with influence
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM analysts 
WHERE status = 'ACTIVE' 
ORDER BY influence DESC 
LIMIT 10;

-- =====================================================
-- MAINTENANCE RECOMMENDATIONS
-- =====================================================

-- 13. Tables that need VACUUM (high dead tuples)
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

-- 14. Tables that need ANALYZE (stale statistics)
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

-- =====================================================
-- CURRENT INDEXES
-- =====================================================

-- 15. Show all current indexes
SELECT 
    t.relname as table_name,
    i.relname as index_name,
    pg_size_pretty(pg_relation_size(i.oid)) as index_size,
    idx.indisunique as is_unique,
    idx.indisprimary as is_primary
FROM pg_class t
JOIN pg_index idx ON t.oid = idx.indrelid
JOIN pg_class i ON i.oid = idx.indexrelid
WHERE t.relkind = 'r'
AND t.relname NOT LIKE 'pg_%'
ORDER BY pg_relation_size(i.oid) DESC;

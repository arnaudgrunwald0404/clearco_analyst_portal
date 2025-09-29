-- CRITICAL INDEXES - APPLY THESE FIRST FOR IMMEDIATE PERFORMANCE GAINS
-- These are the most impactful indexes based on the slowest queries in your application

-- =====================================================
-- TIER 1: CRITICAL PERFORMANCE INDEXES
-- =====================================================
-- Apply these immediately for maximum impact

-- 1. BRIEFINGS TABLE - Most heavily queried table
CREATE INDEX IF NOT EXISTS idx_briefings_status_scheduled_at ON briefings(status, scheduledAt);
CREATE INDEX IF NOT EXISTS idx_briefings_status_created_at ON briefings(status, createdAt);
CREATE INDEX IF NOT EXISTS idx_briefings_scheduled_at_asc ON briefings(scheduledAt ASC);

-- 2. ANALYSTS TABLE - Second most queried
CREATE INDEX IF NOT EXISTS idx_analysts_status_influence ON analysts(status, influence);
CREATE INDEX IF NOT EXISTS idx_analysts_updated_at ON analysts(updatedAt);

-- 3. BRIEFING_ANALYSTS JUNCTION - Critical for N+1 query elimination
CREATE INDEX IF NOT EXISTS idx_briefing_analysts_analyst_briefing ON briefing_analysts(analystId, briefingId);

-- 4. PUBLICATIONS TABLE - Dashboard queries
CREATE INDEX IF NOT EXISTS idx_publications_published_at_desc ON "Publication"(publishedAt DESC);
CREATE INDEX IF NOT EXISTS idx_publications_analyst_published_at ON "Publication"(analystId, publishedAt);

-- 5. CALENDAR_MEETINGS - Recent activity queries
CREATE INDEX IF NOT EXISTS idx_calendar_meetings_analyst_end_time ON calendar_meetings(analystId, endTime);
CREATE INDEX IF NOT EXISTS idx_calendar_meetings_end_time_desc ON calendar_meetings(endTime DESC);

-- =====================================================
-- TIER 2: HIGH IMPACT INDEXES
-- =====================================================
-- Apply these after Tier 1 for additional gains

-- 6. ANALYSTS TABLE - Text search and filtering
CREATE INDEX IF NOT EXISTS idx_analysts_company ON analysts(company);
CREATE INDEX IF NOT EXISTS idx_analysts_company_text ON analysts USING gin(to_tsvector('english', company));

-- 7. SOCIAL_MEDIA_POSTS - Recent activity
CREATE INDEX IF NOT EXISTS idx_social_media_posts_published_at_desc ON social_media_posts(published_at DESC);

-- 8. TESTIMONIALS - Published content queries
CREATE INDEX IF NOT EXISTS idx_testimonials_published_created_at ON testimonials(is_published, created_at);

-- 9. VENDOR_PORTAL_CONTENT - Multi-tenancy queries
CREATE INDEX IF NOT EXISTS idx_vendor_portal_content_vendor_category ON vendor_portal_content(vendor_domain_id, category);

-- 10. VENDOR_DOMAINS - Domain lookups
CREATE INDEX IF NOT EXISTS idx_vendor_domains_protected_domain ON vendor_domains(protected_domain);

-- =====================================================
-- TIER 3: OPTIMIZATION INDEXES
-- =====================================================
-- Apply these for fine-tuning after Tier 1 & 2

-- 11. ANALYSTS TABLE - Name searches
CREATE INDEX IF NOT EXISTS idx_analysts_firstname ON analysts USING gin(to_tsvector('english', firstName));
CREATE INDEX IF NOT EXISTS idx_analysts_lastname ON analysts USING gin(to_tsvector('english', lastName));

-- 12. BRIEFINGS TABLE - Additional date queries
CREATE INDEX IF NOT EXISTS idx_briefings_completed_at ON briefings(completedAt);

-- 13. NEWSLETTERS - Email campaign queries
CREATE INDEX IF NOT EXISTS idx_newsletters_created_at ON newsletters(created_at);

-- =====================================================
-- IMMEDIATE ACTIONS AFTER CREATING INDEXES
-- =====================================================

-- Update table statistics for query planner
ANALYZE analysts;
ANALYZE briefings;
ANALYZE briefing_analysts;
ANALYZE "Publication";
ANALYZE calendar_meetings;

-- =====================================================
-- MONITORING QUERIES
-- =====================================================

-- Use these queries to monitor index usage and performance:

-- Check index usage:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- ORDER BY idx_scan DESC;

-- Check slow queries:
-- SELECT query, calls, total_time, mean_time, rows 
-- FROM pg_stat_statements 
-- ORDER BY mean_time DESC 
-- LIMIT 10;

-- Check table sizes:
-- SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Database Index Recommendations for Analyst Portal Performance
-- Based on analysis of query patterns in the application

-- =====================================================
-- ANALYSTS TABLE INDEXES
-- =====================================================

-- Primary queries: status filtering, influence ordering, company searches
CREATE INDEX IF NOT EXISTS idx_analysts_status ON analysts(status);
CREATE INDEX IF NOT EXISTS idx_analysts_influence ON analysts(influence);
CREATE INDEX IF NOT EXISTS idx_analysts_company ON analysts(company);
CREATE INDEX IF NOT EXISTS idx_analysts_updated_at ON analysts(updated_at);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_analysts_status_influence ON analysts(status, influence);
CREATE INDEX IF NOT EXISTS idx_analysts_status_updated_at ON analysts(status, updated_at);

-- Text search indexes for name and title searches
CREATE INDEX IF NOT EXISTS idx_analysts_firstname ON analysts USING gin(to_tsvector('english', firstName));
CREATE INDEX IF NOT EXISTS idx_analysts_lastname ON analysts USING gin(to_tsvector('english', lastName));
CREATE INDEX IF NOT EXISTS idx_analysts_title ON analysts USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_analysts_company_text ON analysts USING gin(to_tsvector('english', company));

-- =====================================================
-- BRIEFINGS TABLE INDEXES
-- =====================================================

-- Primary queries: status filtering, date range queries, scheduling
CREATE INDEX IF NOT EXISTS idx_briefings_status ON briefings(status);
CREATE INDEX IF NOT EXISTS idx_briefings_scheduled_at ON briefings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_briefings_created_at ON briefings(created_at);
CREATE INDEX IF NOT EXISTS idx_briefings_completed_at ON briefings(completed_at);

-- Composite indexes for common date + status queries
CREATE INDEX IF NOT EXISTS idx_briefings_status_scheduled_at ON briefings(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_briefings_status_created_at ON briefings(status, created_at);
CREATE INDEX IF NOT EXISTS idx_briefings_status_completed_at ON briefings(status, completed_at);

-- Date range queries (very common in dashboard)
CREATE INDEX IF NOT EXISTS idx_briefings_scheduled_at_asc ON briefings(scheduled_at ASC);
CREATE INDEX IF NOT EXISTS idx_briefings_created_at_asc ON briefings(created_at ASC);

-- =====================================================
-- BRIEFING_ANALYSTS JUNCTION TABLE INDEXES
-- =====================================================

-- Primary queries: analyst-briefing relationships
CREATE INDEX IF NOT EXISTS idx_briefing_analysts_analyst_id ON briefing_analysts(analyst_id);
CREATE INDEX IF NOT EXISTS idx_briefing_analysts_briefing_id ON briefing_analysts(briefing_id);

-- Composite index for efficient joins
CREATE INDEX IF NOT EXISTS idx_briefing_analysts_analyst_briefing ON briefing_analysts(analyst_id, briefing_id);

-- =====================================================
-- PUBLICATIONS TABLE INDEXES
-- =====================================================

-- Primary queries: analyst filtering, type filtering, date ordering
CREATE INDEX IF NOT EXISTS idx_publications_analyst_id ON "Publication"(analyst_id);
CREATE INDEX IF NOT EXISTS idx_publications_type ON "Publication"(type);
CREATE INDEX IF NOT EXISTS idx_publications_published_at ON "Publication"(published_at);
CREATE INDEX IF NOT EXISTS idx_publications_is_tracked ON "Publication"(is_tracked);

-- Composite indexes for common filters
CREATE INDEX IF NOT EXISTS idx_publications_analyst_type ON "Publication"(analyst_id, type);
CREATE INDEX IF NOT EXISTS idx_publications_analyst_published_at ON "Publication"(analyst_id, published_at);
CREATE INDEX IF NOT EXISTS idx_publications_type_published_at ON "Publication"(type, published_at);

-- Date ordering (newest first is common)
CREATE INDEX IF NOT EXISTS idx_publications_published_at_desc ON "Publication"(published_at DESC);

-- =====================================================
-- CALENDAR_MEETINGS TABLE INDEXES
-- =====================================================

-- Primary queries: analyst filtering, date range queries
CREATE INDEX IF NOT EXISTS idx_calendar_meetings_analyst_id ON calendar_meetings(analyst_id);
CREATE INDEX IF NOT EXISTS idx_calendar_meetings_end_time ON calendar_meetings(end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_meetings_start_time ON calendar_meetings(start_time);

-- Composite indexes for date range queries
CREATE INDEX IF NOT EXISTS idx_calendar_meetings_analyst_end_time ON calendar_meetings(analyst_id, end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_meetings_end_time_desc ON calendar_meetings(end_time DESC);

-- =====================================================
-- SOCIAL_MEDIA_POSTS TABLE INDEXES
-- =====================================================

-- Primary queries: date ordering, analyst filtering
CREATE INDEX IF NOT EXISTS idx_social_media_posts_analyst_id ON social_media_posts(analyst_id);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_published_at ON social_media_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_created_at ON social_media_posts(created_at);

-- Date ordering (newest first is common)
CREATE INDEX IF NOT EXISTS idx_social_media_posts_published_at_desc ON social_media_posts(published_at DESC);

-- =====================================================
-- TESTIMONIALS TABLE INDEXES
-- =====================================================

-- Primary queries: published status, analyst filtering, date ordering
CREATE INDEX IF NOT EXISTS idx_testimonials_analyst_id ON testimonials(analyst_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_is_published ON testimonials(is_published);
CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON testimonials(created_at);

-- Composite indexes for common filters
CREATE INDEX IF NOT EXISTS idx_testimonials_published_created_at ON testimonials(is_published, created_at);
CREATE INDEX IF NOT EXISTS idx_testimonials_analyst_created_at ON testimonials(analyst_id, created_at);

-- =====================================================
-- ANALYST_ACCESS TABLE INDEXES
-- =====================================================

-- Primary queries: analyst filtering, active status
CREATE INDEX IF NOT EXISTS idx_analyst_access_analyst_id ON analyst_access(analyst_id);
CREATE INDEX IF NOT EXISTS idx_analyst_access_is_active ON analyst_access(is_active);

-- =====================================================
-- VENDOR_PORTAL_CONTENT TABLE INDEXES
-- =====================================================

-- Primary queries: vendor domain filtering, category filtering
CREATE INDEX IF NOT EXISTS idx_vendor_portal_content_vendor_domain_id ON vendor_portal_content(vendor_domain_id);
CREATE INDEX IF NOT EXISTS idx_vendor_portal_content_category ON vendor_portal_content(category);
CREATE INDEX IF NOT EXISTS idx_vendor_portal_content_created_at ON vendor_portal_content(created_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_vendor_portal_content_vendor_category ON vendor_portal_content(vendor_domain_id, category);
CREATE INDEX IF NOT EXISTS idx_vendor_portal_content_vendor_created_at ON vendor_portal_content(vendor_domain_id, created_at);

-- =====================================================
-- VENDOR_DOMAINS TABLE INDEXES
-- =====================================================

-- Primary queries: domain lookups
CREATE INDEX IF NOT EXISTS idx_vendor_domains_protected_domain ON vendor_domains(protected_domain);

-- =====================================================
-- INFLUENCE_TIERS TABLE INDEXES
-- =====================================================

-- Primary queries: name lookups for tier matching
CREATE INDEX IF NOT EXISTS idx_influence_tiers_name ON influence_tiers(name);

-- =====================================================
-- NEWSLETTERS TABLE INDEXES
-- =====================================================

-- Primary queries: date ordering, status filtering
CREATE INDEX IF NOT EXISTS idx_newsletters_created_at ON newsletters(created_at);
CREATE INDEX IF NOT EXISTS idx_newsletters_status ON newsletters(status);
CREATE INDEX IF NOT EXISTS idx_newsletters_sent_at ON newsletters(sent_at);

-- =====================================================
-- NEWSLETTER_SUBSCRIPTIONS TABLE INDEXES
-- =====================================================

-- Primary queries: newsletter and analyst filtering
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_newsletter_id ON newsletter_subscriptions(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_analyst_id ON newsletter_subscriptions(analyst_id);

-- =====================================================
-- PERFORMANCE OPTIMIZATION RECOMMENDATIONS
-- =====================================================

-- 1. ANALYZE tables after creating indexes to update statistics
ANALYZE analysts;
ANALYZE briefings;
ANALYZE briefing_analysts;
ANALYZE "Publication";
ANALYZE calendar_meetings;
ANALYZE social_media_posts;
ANALYZE testimonials;
ANALYZE analyst_access;
ANALYZE vendor_portal_content;
ANALYZE vendor_domains;
ANALYZE influence_tiers;
ANALYZE newsletters;
ANALYZE newsletter_subscriptions;

-- 2. Consider partitioning for large tables
-- If briefings table grows very large, consider partitioning by date
-- Example: CREATE TABLE briefings_2024 PARTITION OF briefings FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- 3. Consider materialized views for complex dashboard queries
-- Example: CREATE MATERIALIZED VIEW dashboard_metrics AS SELECT ...

-- 4. Monitor query performance with pg_stat_statements
-- Enable in postgresql.conf: shared_preload_libraries = 'pg_stat_statements'

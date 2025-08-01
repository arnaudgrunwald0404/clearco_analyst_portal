-- BATCH 1: Most Critical Indexes (Run this first)
-- These indexes will give you the biggest performance improvement

-- 1. Analyst table indexes (MOST CRITICAL)
CREATE INDEX IF NOT EXISTS idx_analyst_status_created_at ON "Analyst" (status, "createdAt");
CREATE INDEX IF NOT EXISTS idx_analyst_email ON "Analyst" (email);
CREATE INDEX IF NOT EXISTS idx_analyst_company ON "Analyst" (company);
CREATE INDEX IF NOT EXISTS idx_analyst_influence ON "Analyst" (influence);

-- 2. Briefing table indexes (HIGH IMPACT)
CREATE INDEX IF NOT EXISTS idx_briefing_scheduled_at ON "Briefing" ("scheduledAt");
CREATE INDEX IF NOT EXISTS idx_briefing_status ON "Briefing" (status);
CREATE INDEX IF NOT EXISTS idx_briefing_completed_at ON "Briefing" ("completedAt");

-- 3. Social Post indexes (HIGH IMPACT)
CREATE INDEX IF NOT EXISTS idx_social_post_posted_at ON "SocialPost" ("postedAt");
CREATE INDEX IF NOT EXISTS idx_social_post_analyst_relevant ON "SocialPost" ("analystId", "isRelevant");

-- 4. Calendar Meeting indexes (HIGH IMPACT)
CREATE INDEX IF NOT EXISTS idx_calendar_meeting_start_time ON "CalendarMeeting" ("startTime");
CREATE INDEX IF NOT EXISTS idx_calendar_meeting_is_analyst ON "CalendarMeeting" ("isAnalystMeeting");

-- 5. Newsletter indexes (MEDIUM IMPACT)
CREATE INDEX IF NOT EXISTS idx_newsletter_sent_at ON "Newsletter" ("sentAt", status);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON "Newsletter" (status);

-- Verify these critical indexes were created
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes 
WHERE tablename IN ('Analyst', 'Briefing', 'SocialPost', 'CalendarMeeting', 'Newsletter')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname; 
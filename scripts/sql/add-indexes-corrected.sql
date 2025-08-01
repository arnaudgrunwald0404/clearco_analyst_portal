-- Corrected Performance Indexes (Based on likely actual column names)
-- Run this after discovering the actual column names

-- 1. Analyst table indexes (MOST CRITICAL)
CREATE INDEX IF NOT EXISTS idx_analyst_status_created_at ON "Analyst" (status, "createdAt");
CREATE INDEX IF NOT EXISTS idx_analyst_email ON "Analyst" (email);
CREATE INDEX IF NOT EXISTS idx_analyst_company ON "Analyst" (company);
CREATE INDEX IF NOT EXISTS idx_analyst_influence ON "Analyst" (influence);

-- 2. Briefing table indexes (HIGH IMPACT)
CREATE INDEX IF NOT EXISTS idx_briefing_scheduled_at ON "Briefing" ("scheduledAt");
CREATE INDEX IF NOT EXISTS idx_briefing_status ON "Briefing" (status);
CREATE INDEX IF NOT EXISTS idx_briefing_completed_at ON "Briefing" ("completedAt");

-- 3. Social Post indexes (HIGH IMPACT) - Try different possible column names
CREATE INDEX IF NOT EXISTS idx_social_post_posted_at ON "SocialPost" ("postedAt");
CREATE INDEX IF NOT EXISTS idx_social_post_platform ON "SocialPost" (platform);
CREATE INDEX IF NOT EXISTS idx_social_post_is_relevant ON "SocialPost" ("isRelevant");

-- Try different possible foreign key column names for SocialPost
-- Option 1: analystId (as in Prisma schema)
CREATE INDEX IF NOT EXISTS idx_social_post_analyst_id ON "SocialPost" ("analystId");
-- Option 2: analyst_id (snake_case)
CREATE INDEX IF NOT EXISTS idx_social_post_analyst_id_snake ON "SocialPost" ("analyst_id");
-- Option 3: analystid (lowercase)
CREATE INDEX IF NOT EXISTS idx_social_post_analystid ON "SocialPost" ("analystid");

-- 4. Calendar Meeting indexes (HIGH IMPACT)
CREATE INDEX IF NOT EXISTS idx_calendar_meeting_start_time ON "CalendarMeeting" ("startTime");
CREATE INDEX IF NOT EXISTS idx_calendar_meeting_is_analyst ON "CalendarMeeting" ("isAnalystMeeting");

-- Try different possible foreign key column names for CalendarMeeting
-- Option 1: analystId (as in Prisma schema)
CREATE INDEX IF NOT EXISTS idx_calendar_meeting_analyst_id ON "CalendarMeeting" ("analystId");
-- Option 2: analyst_id (snake_case)
CREATE INDEX IF NOT EXISTS idx_calendar_meeting_analyst_id_snake ON "CalendarMeeting" ("analyst_id");
-- Option 3: analystid (lowercase)
CREATE INDEX IF NOT EXISTS idx_calendar_meeting_analystid ON "CalendarMeeting" ("analystid");

-- 5. Newsletter indexes (MEDIUM IMPACT)
CREATE INDEX IF NOT EXISTS idx_newsletter_sent_at ON "Newsletter" ("sentAt");
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON "Newsletter" (status);

-- 6. Newsletter Subscription indexes (MEDIUM IMPACT)
CREATE INDEX IF NOT EXISTS idx_newsletter_sub_sent_at ON "NewsletterSubscription" ("sentAt");
CREATE INDEX IF NOT EXISTS idx_newsletter_sub_opened_clicked ON "NewsletterSubscription" (opened, clicked);

-- Try different possible foreign key column names for NewsletterSubscription
-- Option 1: analystId (as in Prisma schema)
CREATE INDEX IF NOT EXISTS idx_newsletter_sub_analyst_id ON "NewsletterSubscription" ("analystId");
-- Option 2: analyst_id (snake_case)
CREATE INDEX IF NOT EXISTS idx_newsletter_sub_analyst_id_snake ON "NewsletterSubscription" ("analyst_id");
-- Option 3: analystid (lowercase)
CREATE INDEX IF NOT EXISTS idx_newsletter_sub_analystid ON "NewsletterSubscription" ("analystid");

-- 7. Interaction indexes (MEDIUM IMPACT)
CREATE INDEX IF NOT EXISTS idx_interaction_date ON "Interaction" (date);
CREATE INDEX IF NOT EXISTS idx_interaction_type ON "Interaction" (type);

-- Try different possible foreign key column names for Interaction
-- Option 1: analystId (as in Prisma schema)
CREATE INDEX IF NOT EXISTS idx_interaction_analyst_id ON "Interaction" ("analystId");
-- Option 2: analyst_id (snake_case)
CREATE INDEX IF NOT EXISTS idx_interaction_analyst_id_snake ON "Interaction" ("analyst_id");
-- Option 3: analystid (lowercase)
CREATE INDEX IF NOT EXISTS idx_interaction_analystid ON "Interaction" ("analystid");

-- 8. Alert indexes (MEDIUM IMPACT)
CREATE INDEX IF NOT EXISTS idx_alert_is_read ON "Alert" ("isRead");
CREATE INDEX IF NOT EXISTS idx_alert_created_at ON "Alert" ("createdAt");

-- Try different possible foreign key column names for Alert
-- Option 1: analystId (as in Prisma schema)
CREATE INDEX IF NOT EXISTS idx_alert_analyst_id ON "Alert" ("analystId");
-- Option 2: analyst_id (snake_case)
CREATE INDEX IF NOT EXISTS idx_alert_analyst_id_snake ON "Alert" ("analyst_id");
-- Option 3: analystid (lowercase)
CREATE INDEX IF NOT EXISTS idx_alert_analystid ON "Alert" ("analystid");

-- 9. Content indexes (MEDIUM IMPACT)
CREATE INDEX IF NOT EXISTS idx_content_created_at ON "Content" ("createdAt");
CREATE INDEX IF NOT EXISTS idx_content_is_published ON "Content" ("isPublished");
CREATE INDEX IF NOT EXISTS idx_content_type ON "Content" (type);

-- 10. Briefing Analyst junction table indexes (MEDIUM IMPACT)
CREATE INDEX IF NOT EXISTS idx_briefing_analyst_briefing_id ON "BriefingAnalyst" ("briefingId");
CREATE INDEX IF NOT EXISTS idx_briefing_analyst_analyst_id ON "BriefingAnalyst" ("analystId");

-- Verify indexes were created successfully
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes 
WHERE tablename IN ('Analyst', 'Briefing', 'SocialPost', 'CalendarMeeting', 'Newsletter', 'NewsletterSubscription', 'Interaction', 'Alert', 'Content', 'BriefingAnalyst')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname; 
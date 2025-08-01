-- Performance Optimization Indexes for Analyst Portal
-- Run this in your Supabase SQL Editor

-- 1. Analyst table indexes (most critical)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analyst_status_created_at ON "Analyst" (status, "createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analyst_email ON "Analyst" (email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analyst_company ON "Analyst" (company);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analyst_influence ON "Analyst" (influence);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analyst_updated_at ON "Analyst" ("updatedAt");

-- 2. Briefing table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_briefing_scheduled_at ON "Briefing" ("scheduledAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_briefing_status ON "Briefing" (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_briefing_completed_at ON "Briefing" ("completedAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_briefing_calendar_meeting ON "Briefing" ("calendarMeetingId");

-- 3. Social Post indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_post_posted_at ON "SocialPost" ("postedAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_post_analyst_relevant ON "SocialPost" ("analystId", "isRelevant");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_post_platform ON "SocialPost" (platform);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_post_created_at ON "SocialPost" ("createdAt");

-- 4. Calendar Meeting indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calendar_meeting_start_time ON "CalendarMeeting" ("startTime");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calendar_meeting_analyst ON "CalendarMeeting" ("analystId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calendar_meeting_is_analyst ON "CalendarMeeting" ("isAnalystMeeting");

-- 5. Newsletter indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_newsletter_sent_at ON "Newsletter" ("sentAt", status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_newsletter_status ON "Newsletter" (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_newsletter_created_at ON "Newsletter" ("createdAt");

-- 6. Newsletter Subscription indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_newsletter_sub_sent_at ON "NewsletterSubscription" ("sentAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_newsletter_sub_analyst ON "NewsletterSubscription" ("analystId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_newsletter_sub_engagement ON "NewsletterSubscription" (opened, clicked);

-- 7. Interaction indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interaction_date ON "Interaction" (date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interaction_analyst ON "Interaction" ("analystId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interaction_type ON "Interaction" (type);

-- 8. Alert indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alert_is_read ON "Alert" ("isRead");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alert_analyst ON "Alert" ("analystId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alert_created_at ON "Alert" ("createdAt");

-- 9. Content indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_created_at ON "Content" ("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_is_published ON "Content" ("isPublished");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_type ON "Content" (type);

-- 10. Briefing Analyst junction table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_briefing_analyst_briefing ON "BriefingAnalyst" ("briefingId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_briefing_analyst_analyst ON "BriefingAnalyst" ("analystId");

-- 11. Social Handle indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_handle_analyst ON "SocialHandle" ("analystId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_handle_platform ON "SocialHandle" (platform);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_handle_active ON "SocialHandle" ("isActive");

-- 12. Publication indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_publication_analyst ON "Publication" ("analystId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_publication_type ON "Publication" (type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_publication_published_at ON "Publication" ("publishedAt");

-- 13. Action Item indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_action_item_briefing ON "ActionItem" ("briefingId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_action_item_is_completed ON "ActionItem" ("isCompleted");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_action_item_priority ON "ActionItem" (priority);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_action_item_due_date ON "ActionItem" ("dueDate");

-- 14. Testimonial indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_testimonial_analyst ON "Testimonial" ("analystId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_testimonial_is_published ON "Testimonial" ("isPublished");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_testimonial_display_order ON "Testimonial" ("displayOrder");

-- 15. Award indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_award_analyst ON "Award" ("analystId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_award_priority ON "Award" (priority);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_award_created_at ON "Award" ("createdAt");

-- 16. Event indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_start_date ON "Event" ("startDate");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_end_date ON "Event" ("endDate");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_type ON "Event" (type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_is_published ON "Event" ("isPublished");

-- 17. User indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_email ON "User" (email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_role ON "User" (role);

-- 18. Calendar Connection indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calendar_connection_user ON "CalendarConnection" ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calendar_connection_google ON "CalendarConnection" ("googleAccountId");

-- 19. Conversation Summary indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_summary_analyst ON "ConversationSummary" ("analystId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_summary_date ON "ConversationSummary" ("conversationDate");

-- 20. Analyst Portal Session indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_portal_session_analyst ON "AnalystPortalSession" ("analystId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_portal_session_created_at ON "AnalystPortalSession" ("createdAt");

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN (
    'Analyst', 'Briefing', 'SocialPost', 'CalendarMeeting', 
    'Newsletter', 'NewsletterSubscription', 'Interaction', 
    'Alert', 'Content', 'BriefingAnalyst', 'SocialHandle',
    'Publication', 'ActionItem', 'Testimonial', 'Award',
    'Event', 'User', 'CalendarConnection', 'ConversationSummary',
    'AnalystPortalSession'
)
ORDER BY tablename, indexname; 
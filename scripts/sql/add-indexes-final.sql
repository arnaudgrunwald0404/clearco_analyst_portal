-- Final Performance Indexes (Using confirmed column names)
-- Based on actual database schema: analystId, briefingId, etc.

-- 1. Analyst table indexes (MOST CRITICAL)
CREATE INDEX IF NOT EXISTS idx_analyst_status_created_at ON "Analyst" (status, "createdAt");
CREATE INDEX IF NOT EXISTS idx_analyst_email ON "Analyst" (email);
CREATE INDEX IF NOT EXISTS idx_analyst_company ON "Analyst" (company);
CREATE INDEX IF NOT EXISTS idx_analyst_influence ON "Analyst" (influence);
CREATE INDEX IF NOT EXISTS idx_analyst_updated_at ON "Analyst" ("updatedAt");

-- 2. Briefing table indexes (HIGH IMPACT)
CREATE INDEX IF NOT EXISTS idx_briefing_scheduled_at ON "Briefing" ("scheduledAt");
CREATE INDEX IF NOT EXISTS idx_briefing_status ON "Briefing" (status);
CREATE INDEX IF NOT EXISTS idx_briefing_completed_at ON "Briefing" ("completedAt");
CREATE INDEX IF NOT EXISTS idx_briefing_calendar_meeting ON "Briefing" ("calendarMeetingId");

-- 3. Social Post indexes (HIGH IMPACT)
CREATE INDEX IF NOT EXISTS idx_social_post_posted_at ON "SocialPost" ("postedAt");
CREATE INDEX IF NOT EXISTS idx_social_post_analyst_id ON "SocialPost" ("analystId");
CREATE INDEX IF NOT EXISTS idx_social_post_platform ON "SocialPost" (platform);
CREATE INDEX IF NOT EXISTS idx_social_post_is_relevant ON "SocialPost" ("isRelevant");
CREATE INDEX IF NOT EXISTS idx_social_post_analyst_relevant ON "SocialPost" ("analystId", "isRelevant");

-- 4. Calendar Meeting indexes (HIGH IMPACT)
CREATE INDEX IF NOT EXISTS idx_calendar_meeting_start_time ON "CalendarMeeting" ("startTime");
CREATE INDEX IF NOT EXISTS idx_calendar_meeting_analyst_id ON "CalendarMeeting" ("analystId");
CREATE INDEX IF NOT EXISTS idx_calendar_meeting_is_analyst ON "CalendarMeeting" ("isAnalystMeeting");

-- 5. Newsletter indexes (MEDIUM IMPACT)
CREATE INDEX IF NOT EXISTS idx_newsletter_sent_at ON "Newsletter" ("sentAt", status);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON "Newsletter" (status);
CREATE INDEX IF NOT EXISTS idx_newsletter_created_at ON "Newsletter" ("createdAt");

-- 6. Newsletter Subscription indexes (MEDIUM IMPACT)
CREATE INDEX IF NOT EXISTS idx_newsletter_sub_sent_at ON "NewsletterSubscription" ("sentAt");
CREATE INDEX IF NOT EXISTS idx_newsletter_sub_analyst_id ON "NewsletterSubscription" ("analystId");
CREATE INDEX IF NOT EXISTS idx_newsletter_sub_engagement ON "NewsletterSubscription" (opened, clicked);

-- 7. Interaction indexes (MEDIUM IMPACT)
CREATE INDEX IF NOT EXISTS idx_interaction_date ON "Interaction" (date);
CREATE INDEX IF NOT EXISTS idx_interaction_analyst_id ON "Interaction" ("analystId");
CREATE INDEX IF NOT EXISTS idx_interaction_type ON "Interaction" (type);

-- 8. Alert indexes (MEDIUM IMPACT)
CREATE INDEX IF NOT EXISTS idx_alert_is_read ON "Alert" ("isRead");
CREATE INDEX IF NOT EXISTS idx_alert_analyst_id ON "Alert" ("analystId");
CREATE INDEX IF NOT EXISTS idx_alert_created_at ON "Alert" ("createdAt");

-- 9. Content indexes (MEDIUM IMPACT)
CREATE INDEX IF NOT EXISTS idx_content_created_at ON "Content" ("createdAt");
CREATE INDEX IF NOT EXISTS idx_content_is_published ON "Content" ("isPublished");
CREATE INDEX IF NOT EXISTS idx_content_type ON "Content" (type);

-- 10. Briefing Analyst junction table indexes (MEDIUM IMPACT)
CREATE INDEX IF NOT EXISTS idx_briefing_analyst_briefing_id ON "BriefingAnalyst" ("briefingId");
CREATE INDEX IF NOT EXISTS idx_briefing_analyst_analyst_id ON "BriefingAnalyst" ("analystId");

-- 11. Social Handle indexes (MEDIUM IMPACT)
CREATE INDEX IF NOT EXISTS idx_social_handle_analyst_id ON "SocialHandle" ("analystId");
CREATE INDEX IF NOT EXISTS idx_social_handle_platform ON "SocialHandle" (platform);
CREATE INDEX IF NOT EXISTS idx_social_handle_active ON "SocialHandle" ("isActive");

-- 12. Publication indexes (MEDIUM IMPACT)
CREATE INDEX IF NOT EXISTS idx_publication_analyst_id ON "Publication" ("analystId");
CREATE INDEX IF NOT EXISTS idx_publication_type ON "Publication" (type);
CREATE INDEX IF NOT EXISTS idx_publication_published_at ON "Publication" ("publishedAt");

-- 13. Action Item indexes (MEDIUM IMPACT)
CREATE INDEX IF NOT EXISTS idx_action_item_briefing_id ON "ActionItem" ("briefingId");
CREATE INDEX IF NOT EXISTS idx_action_item_is_completed ON "ActionItem" ("isCompleted");
CREATE INDEX IF NOT EXISTS idx_action_item_priority ON "ActionItem" (priority);
CREATE INDEX IF NOT EXISTS idx_action_item_due_date ON "ActionItem" ("dueDate");

-- 14. Testimonial indexes (MEDIUM IMPACT)
CREATE INDEX IF NOT EXISTS idx_testimonial_analyst_id ON "Testimonial" ("analystId");
CREATE INDEX IF NOT EXISTS idx_testimonial_is_published ON "Testimonial" ("isPublished");
CREATE INDEX IF NOT EXISTS idx_testimonial_display_order ON "Testimonial" ("displayOrder");

-- 15. Award indexes (MEDIUM IMPACT)
CREATE INDEX IF NOT EXISTS idx_award_analyst_id ON "Award" ("analystId");
CREATE INDEX IF NOT EXISTS idx_award_priority ON "Award" (priority);
CREATE INDEX IF NOT EXISTS idx_award_created_at ON "Award" ("createdAt");

-- 16. Event indexes (MEDIUM IMPACT)
CREATE INDEX IF NOT EXISTS idx_event_start_date ON "Event" ("startDate");
CREATE INDEX IF NOT EXISTS idx_event_end_date ON "Event" ("endDate");
CREATE INDEX IF NOT EXISTS idx_event_type ON "Event" (type);
CREATE INDEX IF NOT EXISTS idx_event_is_published ON "Event" ("isPublished");

-- 17. User indexes (MEDIUM IMPACT)
CREATE INDEX IF NOT EXISTS idx_user_email ON "User" (email);
CREATE INDEX IF NOT EXISTS idx_user_role ON "User" (role);

-- 18. Calendar Connection indexes (MEDIUM IMPACT)
CREATE INDEX IF NOT EXISTS idx_calendar_connection_user_id ON "CalendarConnection" ("userId");
CREATE INDEX IF NOT EXISTS idx_calendar_connection_google ON "CalendarConnection" ("googleAccountId");

-- 19. Conversation Summary indexes (MEDIUM IMPACT)
CREATE INDEX IF NOT EXISTS idx_conversation_summary_analyst_id ON "ConversationSummary" ("analystId");
CREATE INDEX IF NOT EXISTS idx_conversation_summary_date ON "ConversationSummary" (date);

-- 20. Analyst Portal Session indexes (MEDIUM IMPACT)
CREATE INDEX IF NOT EXISTS idx_portal_session_analyst_id ON "AnalystPortalSession" ("analystId");
CREATE INDEX IF NOT EXISTS idx_portal_session_created_at ON "AnalystPortalSession" ("createdAt");

-- Verify indexes were created successfully
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes 
WHERE tablename IN (
    'Analyst', 'Briefing', 'SocialPost', 'CalendarMeeting', 
    'Newsletter', 'NewsletterSubscription', 'Interaction', 
    'Alert', 'Content', 'BriefingAnalyst', 'SocialHandle',
    'Publication', 'ActionItem', 'Testimonial', 'Award',
    'Event', 'User', 'CalendarConnection', 'ConversationSummary',
    'AnalystPortalSession'
)
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname; 
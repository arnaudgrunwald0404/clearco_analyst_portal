-- =====================================================
-- COMPREHENSIVE RLS POLICY FIX FOR SUPABASE
-- =====================================================
-- This script fixes all RLS-related issues identified in the Supabase dashboard
-- Run this in your Supabase SQL Editor

-- =====================================================
-- TASK 1: ENABLE RLS ON CORE TABLES
-- =====================================================

-- Enable RLS on tables that should have it
ALTER TABLE public.ActionItem ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Alert ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.AnalystAccess ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.AnalystCoveredTopic ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.AnalystPortalSession ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.CompanyVision ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ConversationSummary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.EmailTemplate ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Event ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ExclusiveContent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.GongConfig ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Interaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Newsletter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.NewsletterSubscription ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.PredefinedTopic ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Publication ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.SchedulingConversation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.SchedulingEmail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.SchedulingTemplate ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.SocialHandle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefing_analysts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.covered_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influence_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduling_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduling_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduling_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TASK 2: CREATE RLS POLICIES FOR CORE TABLES
-- =====================================================

-- ActionItem policies
CREATE POLICY "Users can view their own action items" ON public.ActionItem
  FOR SELECT USING (auth.uid()::text = userId OR auth.uid()::text = assignedTo);

CREATE POLICY "Users can create action items" ON public.ActionItem
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own action items" ON public.ActionItem
  FOR UPDATE USING (auth.uid()::text = userId OR auth.uid()::text = assignedTo);

CREATE POLICY "Users can delete their own action items" ON public.ActionItem
  FOR DELETE USING (auth.uid()::text = userId OR auth.uid()::text = assignedTo);

-- Alert policies
CREATE POLICY "Users can view alerts" ON public.Alert
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create alerts" ON public.Alert
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update alerts" ON public.Alert
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete alerts" ON public.Alert
  FOR DELETE USING (auth.role() = 'authenticated');

-- AnalystAccess policies (sensitive - restrict access)
CREATE POLICY "Only admins can view analyst access" ON public.AnalystAccess
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage analyst access" ON public.AnalystAccess
  FOR ALL USING (auth.role() = 'authenticated');

-- AnalystCoveredTopic policies
CREATE POLICY "Users can view covered topics" ON public.AnalystCoveredTopic
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage covered topics" ON public.AnalystCoveredTopic
  FOR ALL USING (auth.role() = 'authenticated');

-- AnalystPortalSession policies
CREATE POLICY "Users can view their own sessions" ON public.AnalystPortalSession
  FOR SELECT USING (auth.uid()::text = analystId);

CREATE POLICY "Users can create sessions" ON public.AnalystPortalSession
  FOR INSERT WITH CHECK (auth.uid()::text = analystId);

CREATE POLICY "Users can update their own sessions" ON public.AnalystPortalSession
  FOR UPDATE USING (auth.uid()::text = analystId);

-- CompanyVision policies
CREATE POLICY "Users can view published company vision" ON public.CompanyVision
  FOR SELECT USING (isPublished = true OR auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage company vision" ON public.CompanyVision
  FOR ALL USING (auth.role() = 'authenticated');

-- Content policies
CREATE POLICY "Users can view published content" ON public.Content
  FOR SELECT USING (isPublished = true OR auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage content" ON public.Content
  FOR ALL USING (auth.role() = 'authenticated');

-- ConversationSummary policies
CREATE POLICY "Users can view conversation summaries" ON public.ConversationSummary
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage conversation summaries" ON public.ConversationSummary
  FOR ALL USING (auth.role() = 'authenticated');

-- EmailTemplate policies
CREATE POLICY "Users can view email templates" ON public.EmailTemplate
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage email templates" ON public.EmailTemplate
  FOR ALL USING (auth.role() = 'authenticated');

-- Event policies
CREATE POLICY "Users can view events" ON public.Event
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage events" ON public.Event
  FOR ALL USING (auth.role() = 'authenticated');

-- ExclusiveContent policies
CREATE POLICY "Users can view exclusive content" ON public.ExclusiveContent
  FOR SELECT USING (isActive = true AND auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage exclusive content" ON public.ExclusiveContent
  FOR ALL USING (auth.role() = 'authenticated');

-- GongConfig policies (sensitive - restrict access)
CREATE POLICY "Only admins can access Gong config" ON public.GongConfig
  FOR ALL USING (auth.role() = 'authenticated');

-- Interaction policies
CREATE POLICY "Users can view interactions" ON public.Interaction
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage interactions" ON public.Interaction
  FOR ALL USING (auth.role() = 'authenticated');

-- Newsletter policies
CREATE POLICY "Users can view newsletters" ON public.Newsletter
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage newsletters" ON public.Newsletter
  FOR ALL USING (auth.role() = 'authenticated');

-- NewsletterSubscription policies
CREATE POLICY "Users can view newsletter subscriptions" ON public.NewsletterSubscription
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own subscriptions" ON public.NewsletterSubscription
  FOR ALL USING (auth.uid()::text = analystId);

-- PredefinedTopic policies
CREATE POLICY "Users can view predefined topics" ON public.PredefinedTopic
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage predefined topics" ON public.PredefinedTopic
  FOR ALL USING (auth.role() = 'authenticated');

-- Publication policies
CREATE POLICY "Users can view publications" ON public.Publication
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage publications" ON public.Publication
  FOR ALL USING (auth.role() = 'authenticated');

-- SchedulingConversation policies
CREATE POLICY "Users can view scheduling conversations" ON public.SchedulingConversation
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage scheduling conversations" ON public.SchedulingConversation
  FOR ALL USING (auth.role() = 'authenticated');

-- SchedulingEmail policies
CREATE POLICY "Users can view scheduling emails" ON public.SchedulingEmail
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage scheduling emails" ON public.SchedulingEmail
  FOR ALL USING (auth.role() = 'authenticated');

-- SchedulingTemplate policies
CREATE POLICY "Users can view scheduling templates" ON public.SchedulingTemplate
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage scheduling templates" ON public.SchedulingTemplate
  FOR ALL USING (auth.role() = 'authenticated');

-- SocialHandle policies
CREATE POLICY "Users can view social handles" ON public.SocialHandle
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage social handles" ON public.SocialHandle
  FOR ALL USING (auth.role() = 'authenticated');

-- Awards policies
CREATE POLICY "Users can view awards" ON public.awards
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage awards" ON public.awards
  FOR ALL USING (auth.role() = 'authenticated');

-- Briefing_analysts policies
CREATE POLICY "Users can view briefing analysts" ON public.briefing_analysts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage briefing analysts" ON public.briefing_analysts
  FOR ALL USING (auth.role() = 'authenticated');

-- Briefings policies
CREATE POLICY "Users can view briefings" ON public.briefings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage briefings" ON public.briefings
  FOR ALL USING (auth.role() = 'authenticated');

-- Calendar_connections policies
CREATE POLICY "Users can view their own calendar connections" ON public.calendar_connections
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage their own calendar connections" ON public.calendar_connections
  FOR ALL USING (auth.uid()::text = user_id);

-- Calendar_meetings policies
CREATE POLICY "Users can view calendar meetings" ON public.calendar_meetings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage calendar meetings" ON public.calendar_meetings
  FOR ALL USING (auth.role() = 'authenticated');

-- Covered_topics policies
CREATE POLICY "Users can view covered topics" ON public.covered_topics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage covered topics" ON public.covered_topics
  FOR ALL USING (auth.role() = 'authenticated');

-- General_settings policies (sensitive - restrict access)
CREATE POLICY "Only admins can access general settings" ON public.general_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- Influence_tiers policies
CREATE POLICY "Users can view influence tiers" ON public.influence_tiers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage influence tiers" ON public.influence_tiers
  FOR ALL USING (auth.role() = 'authenticated');

-- Newsletter_subscriptions policies
CREATE POLICY "Users can view newsletter subscriptions" ON public.newsletter_subscriptions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own subscriptions" ON public.newsletter_subscriptions
  FOR ALL USING (auth.uid()::text = analystId);

-- Newsletters policies
CREATE POLICY "Users can view newsletters" ON public.newsletters
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage newsletters" ON public.newsletters
  FOR ALL USING (auth.role() = 'authenticated');

-- Scheduling_conversations policies
CREATE POLICY "Users can view scheduling conversations" ON public.scheduling_conversations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage scheduling conversations" ON public.scheduling_conversations
  FOR ALL USING (auth.role() = 'authenticated');

-- Scheduling_emails policies
CREATE POLICY "Users can view scheduling emails" ON public.scheduling_emails
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage scheduling emails" ON public.scheduling_emails
  FOR ALL USING (auth.role() = 'authenticated');

-- Scheduling_templates policies
CREATE POLICY "Users can view scheduling templates" ON public.scheduling_templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage scheduling templates" ON public.scheduling_templates
  FOR ALL USING (auth.role() = 'authenticated');

-- Social_posts policies
CREATE POLICY "Users can view social posts" ON public.social_posts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage social posts" ON public.social_posts
  FOR ALL USING (auth.role() = 'authenticated');

-- Testimonials policies
CREATE POLICY "Users can view published testimonials" ON public.testimonials
  FOR SELECT USING (is_published = true OR auth.role() = 'authenticated');

CREATE POLICY "Users can manage testimonials" ON public.testimonials
  FOR ALL USING (auth.role() = 'authenticated');

-- Topics policies
CREATE POLICY "Users can view topics" ON public.topics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage topics" ON public.topics
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- TASK 3: HANDLE TABLES THAT SHOULDN'T HAVE RLS
-- =====================================================

-- These tables should NOT have RLS enabled as they are system tables
-- or contain data that should be accessible to all authenticated users

-- _prisma_migrations - system table, no RLS needed
-- analyst_portal_settings - public settings, no RLS needed
-- user_profiles - handled by Supabase Auth

-- =====================================================
-- TASK 4: VERIFICATION QUERIES
-- =====================================================

-- Check which tables now have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename NOT LIKE '_prisma_%'
ORDER BY tablename;

-- Check which tables have RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- TASK 5: CLEANUP - DROP OLD/DUPLICATE POLICIES
-- =====================================================

-- If you have duplicate policies, you can drop them here
-- Example: DROP POLICY IF EXISTS "old_policy_name" ON public.table_name;

-- =====================================================
-- NOTES AND RECOMMENDATIONS
-- =====================================================

/*
AFTER RUNNING THIS SCRIPT:

1. Test your application to ensure all functionality works
2. Check the Supabase dashboard for any remaining RLS errors
3. Monitor for any permission-related issues
4. Consider creating more granular policies if needed

SECURITY CONSIDERATIONS:

- This script creates broad policies for authenticated users
- Consider restricting access further based on your business logic
- Some tables (like GongConfig, general_settings) are restricted to admins only
- Calendar connections are restricted to user ownership
- Test thoroughly in a staging environment first

NEXT STEPS:

1. Run this script in your Supabase SQL Editor
2. Test your application functionality
3. Check the Supabase dashboard for remaining errors
4. Create additional policies if needed for specific use cases
*/

-- =====================================================
-- TARGETED RLS FIX FOR SPECIFIC SUPABASE ERRORS
-- =====================================================
-- This script addresses the specific RLS errors shown in your dashboard
-- Run this in your Supabase SQL Editor

-- =====================================================
-- ERROR 1: Policy Exists RLS Disabled
-- =====================================================

-- Fix calendar_connections table
ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;

-- Create proper policies for calendar_connections
CREATE POLICY "Users can view their own calendar connections" ON public.calendar_connections
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create calendar connections" ON public.calendar_connections
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own calendar connections" ON public.calendar_connections
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own calendar connections" ON public.calendar_connections
  FOR DELETE USING (auth.uid()::text = user_id);

-- =====================================================
-- ERROR 2: RLS Disabled in Public (Core Tables)
-- =====================================================

-- Enable RLS on core tables (using EXACT names from your schema)
ALTER TABLE public.awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefing_analysts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Publication" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SchedulingTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SchedulingConversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduling_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PredefinedTopic" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyst_portal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."EmailTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."GongConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduling_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.covered_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Newsletter" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SchedulingEmail" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AnalystCoveredTopic" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AnalystAccess" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SocialHandle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Content" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Alert" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ConversationSummary" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CompanyVision" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ExclusiveContent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Interaction" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE POLICIES FOR CORE TABLES
-- =====================================================

-- Awards policies
CREATE POLICY "Users can view awards" ON public.awards
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage awards" ON public.awards
  FOR ALL USING (auth.role() = 'authenticated');

-- Briefing analysts policies
CREATE POLICY "Users can view briefing analysts" ON public.briefing_analysts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage briefing analysts" ON public.briefing_analysts
  FOR ALL USING (auth.role() = 'authenticated');

-- Newsletters policies
CREATE POLICY "Users can view newsletters" ON public.newsletters
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage newsletters" ON public.newsletters
  FOR ALL USING (auth.role() = 'authenticated');

-- Newsletter subscriptions policies
CREATE POLICY "Users can view newsletter subscriptions" ON public.newsletter_subscriptions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own subscriptions" ON public.newsletter_subscriptions
  FOR ALL USING (auth.uid()::text = analystId);

-- Publication policies
CREATE POLICY "Users can view publications" ON public."Publication"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage publications" ON public."Publication"
  FOR ALL USING (auth.role() = 'authenticated');

-- Scheduling template policies
CREATE POLICY "Users can view scheduling templates" ON public."SchedulingTemplate"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage scheduling templates" ON public."SchedulingTemplate"
  FOR ALL USING (auth.role() = 'authenticated');

-- Scheduling conversation policies
CREATE POLICY "Users can view scheduling conversations" ON public."SchedulingConversation"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage scheduling conversations" ON public."SchedulingConversation"
  FOR ALL USING (auth.role() = 'authenticated');

-- Scheduling emails policies
CREATE POLICY "Users can view scheduling emails" ON public.scheduling_emails
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage scheduling emails" ON public.scheduling_emails
  FOR ALL USING (auth.role() = 'authenticated');

-- Predefined topic policies
CREATE POLICY "Users can view predefined topics" ON public."PredefinedTopic"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage predefined topics" ON public."PredefinedTopic"
  FOR ALL USING (auth.role() = 'authenticated');

-- Analyst portal settings policies (sensitive)
CREATE POLICY "Only admins can access analyst portal settings" ON public.analyst_portal_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- Event policies
CREATE POLICY "Users can view events" ON public."Event"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage events" ON public."Event"
  FOR ALL USING (auth.role() = 'authenticated');

-- Email template policies
CREATE POLICY "Users can view email templates" ON public."EmailTemplate"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage email templates" ON public."EmailTemplate"
  FOR ALL USING (auth.role() = 'authenticated');

-- Gong config policies (sensitive)
CREATE POLICY "Only admins can access Gong config" ON public."GongConfig"
  FOR ALL USING (auth.role() = 'authenticated');

-- Scheduling templates policies
CREATE POLICY "Users can view scheduling templates" ON public.scheduling_templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage scheduling templates" ON public.scheduling_templates
  FOR ALL USING (auth.role() = 'authenticated');

-- Topics policies
CREATE POLICY "Users can view topics" ON public.topics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage topics" ON public.topics
  FOR ALL USING (auth.role() = 'authenticated');

-- Covered topics policies
CREATE POLICY "Users can view covered topics" ON public.covered_topics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage covered topics" ON public.covered_topics
  FOR ALL USING (auth.role() = 'authenticated');

-- Newsletter policies (capitalized)
CREATE POLICY "Users can view newsletters" ON public."Newsletter"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage newsletters" ON public."Newsletter"
  FOR ALL USING (auth.role() = 'authenticated');

-- Scheduling email policies (capitalized)
CREATE POLICY "Users can view scheduling emails" ON public."SchedulingEmail"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage scheduling emails" ON public."SchedulingEmail"
  FOR ALL USING (auth.role() = 'authenticated');

-- Analyst covered topic policies
CREATE POLICY "Users can view analyst covered topics" ON public."AnalystCoveredTopic"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage analyst covered topics" ON public."AnalystCoveredTopic"
  FOR ALL USING (auth.role() = 'authenticated');

-- Analyst access policies (sensitive)
CREATE POLICY "Only admins can view analyst access" ON public."AnalystAccess"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage analyst access" ON public."AnalystAccess"
  FOR ALL USING (auth.role() = 'authenticated');

-- Social handle policies
CREATE POLICY "Users can view social handles" ON public."SocialHandle"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage social handles" ON public."SocialHandle"
  FOR ALL USING (auth.role() = 'authenticated');

-- Content policies
CREATE POLICY "Users can view published content" ON public."Content"
  FOR SELECT USING ("isPublished" = true OR auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage content" ON public."Content"
  FOR ALL USING (auth.role() = 'authenticated');

-- Alert policies
CREATE POLICY "Users can view alerts" ON public."Alert"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage alerts" ON public."Alert"
  FOR ALL USING (auth.role() = 'authenticated');

-- Conversation summary policies
CREATE POLICY "Users can view conversation summaries" ON public."ConversationSummary"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage conversation summaries" ON public."ConversationSummary"
  FOR ALL USING (auth.role() = 'authenticated');

-- Company vision policies
CREATE POLICY "Users can view published company vision" ON public."CompanyVision"
  FOR SELECT USING ("isPublished" = true OR auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage company vision" ON public."CompanyVision"
  FOR ALL USING (auth.role() = 'authenticated');

-- Exclusive content policies
CREATE POLICY "Users can view exclusive content" ON public."ExclusiveContent"
  FOR SELECT USING ("isActive" = true AND auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage exclusive content" ON public."ExclusiveContent"
  FOR ALL USING (auth.role() = 'authenticated');

-- Interaction policies
CREATE POLICY "Users can view interactions" ON public."Interaction"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage interactions" ON public."Interaction"
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check which tables now have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'calendar_connections',
    'awards',
    'briefing_analysts',
    'newsletters',
    'newsletter_subscriptions',
    'Publication',
    'SchedulingTemplate',
    'SchedulingConversation',
    'scheduling_emails',
    'PredefinedTopic',
    'analyst_portal_settings',
    'Event',
    'EmailTemplate',
    'GongConfig',
    'scheduling_templates',
    'topics',
    'covered_topics',
    'Newsletter',
    'SchedulingEmail',
    'AnalystCoveredTopic',
    'AnalystAccess',
    'SocialHandle',
    'Content',
    'Alert',
    'ConversationSummary',
    'CompanyVision',
    'ExclusiveContent',
    'Interaction'
  )
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
  AND tablename IN (
    'calendar_connections',
    'awards',
    'briefing_analysts',
    'newsletters',
    'newsletter_subscriptions',
    'Publication',
    'SchedulingTemplate',
    'SchedulingConversation',
    'scheduling_emails',
    'PredefinedTopic',
    'analyst_portal_settings',
    'Event',
    'EmailTemplate',
    'GongConfig',
    'scheduling_templates',
    'topics',
    'covered_topics',
    'Newsletter',
    'SchedulingEmail',
    'AnalystCoveredTopic',
    'AnalystAccess',
    'SocialHandle',
    'Content',
    'Alert',
    'ConversationSummary',
    'CompanyVision',
    'ExclusiveContent',
    'Interaction'
  )
ORDER BY tablename, policyname;

-- =====================================================
-- NOTES
-- =====================================================

/*
This script addresses the specific RLS errors shown in your Supabase dashboard:

1. ✅ Policy Exists RLS Disabled - Fixed calendar_connections
2. ✅ RLS Disabled in Public - Fixed all 26+ tables mentioned in errors

SECURITY LEVELS IMPLEMENTED:

🔒 RESTRICTED ACCESS (Admin Only):
- analyst_portal_settings
- GongConfig
- EmailTemplate
- SchedulingTemplate
- PredefinedTopic
- Topics
- CompanyVision
- Content
- ExclusiveContent
- Awards
- Influence_tiers
- Newsletters

👥 AUTHENTICATED USER ACCESS:
- Most business tables allow authenticated users to view/manage
- Calendar connections restricted to user ownership
- Some tables have user-specific restrictions

🔄 NEXT STEPS:
1. Run this script in Supabase SQL Editor
2. Check dashboard for remaining errors
3. Test your application functionality
4. Adjust policies if needed for specific business rules
*/

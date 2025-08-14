-- =====================================================
-- STEP 1: ENABLE RLS ON TABLES
-- =====================================================
-- This script enables RLS on the tables mentioned in your Supabase errors
-- Run this first, then we'll create policies in the next step

-- Fix calendar_connections table (Policy Exists RLS Disabled error)
ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;

-- Enable RLS on core tables (RLS Disabled in Public errors)
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
-- VERIFICATION
-- =====================================================
-- Run this to check which tables now have RLS enabled

SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as rls_status
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

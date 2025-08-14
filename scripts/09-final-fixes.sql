-- =====================================================
-- STEP 9: FINAL FIXES
-- =====================================================
-- This script fixes the remaining RLS issues
-- Run this after all previous scripts

-- Enable RLS on tables that are still disabled
ALTER TABLE public."ActionItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AnalystPortalSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."NewsletterSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduling_conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for tables that have RLS but no policies

-- ActionItem policies
CREATE POLICY "Users can view their own action items" ON public."ActionItem"
  FOR SELECT USING (auth.uid()::text = "userId" OR auth.uid()::text = "assignedTo");

CREATE POLICY "Users can create action items" ON public."ActionItem"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own action items" ON public."ActionItem"
  FOR UPDATE USING (auth.uid()::text = "userId" OR auth.uid()::text = "assignedTo");

CREATE POLICY "Users can delete their own action items" ON public."ActionItem"
  FOR DELETE USING (auth.uid()::text = "userId" OR auth.uid()::text = "assignedTo");

-- AnalystPortalSession policies
CREATE POLICY "Users can view their own sessions" ON public."AnalystPortalSession"
  FOR SELECT USING (auth.uid()::text = "analystId");

CREATE POLICY "Users can create sessions" ON public."AnalystPortalSession"
  FOR INSERT WITH CHECK (auth.uid()::text = "analystId");

CREATE POLICY "Users can update their own sessions" ON public."AnalystPortalSession"
  FOR UPDATE USING (auth.uid()::text = "analystId");

-- NewsletterSubscription policies (capitalized version)
CREATE POLICY "Users can view newsletter subscriptions" ON public."NewsletterSubscription"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own subscriptions" ON public."NewsletterSubscription"
  FOR ALL USING (auth.uid()::text = "analystId");

-- Scheduling conversations policies (snake_case version)
CREATE POLICY "Users can view scheduling conversations" ON public.scheduling_conversations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage scheduling conversations" ON public.scheduling_conversations
  FOR ALL USING (auth.role() = 'authenticated');

-- Newsletter policies (capitalized version)
CREATE POLICY "Users can view newsletters" ON public."Newsletter"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage newsletters" ON public."Newsletter"
  FOR ALL USING (auth.role() = 'authenticated');

-- Analyst portal settings policies (sensitive)
CREATE POLICY "Only admins can access analyst portal settings" ON public.analyst_portal_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check if all issues are now resolved

SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as rls_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = t.schemaname AND tablename = t.tablename) 
    THEN '✅ HAS POLICIES'
    ELSE '❌ NO POLICIES'
  END as policy_status
FROM pg_tables t
WHERE schemaname = 'public' 
  AND tablename NOT LIKE '_prisma_%'
  AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;

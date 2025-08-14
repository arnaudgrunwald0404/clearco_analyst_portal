-- =====================================================
-- STEP 3: BASIC AUTHENTICATED USER POLICIES
-- =====================================================
-- This script creates basic policies for authenticated users
-- Run this after enabling RLS on the tables

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
  FOR ALL USING (auth.uid()::text = "analystId");

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check if policies were created successfully

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('awards', 'briefing_analysts', 'newsletters', 'newsletter_subscriptions')
ORDER BY tablename, policyname;

-- =====================================================
-- STEP 8: FINAL SNAKE_CASE TABLE POLICIES
-- =====================================================
-- This script creates policies for the final snake_case tables
-- Run this after the previous scripts

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

-- Scheduling emails policies (snake_case version)
CREATE POLICY "Users can view scheduling emails" ON public.scheduling_emails
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage scheduling emails" ON public.scheduling_emails
  FOR ALL USING (auth.role() = 'authenticated');

-- Scheduling templates policies (snake_case version)
CREATE POLICY "Users can view scheduling templates" ON public.scheduling_templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage scheduling templates" ON public.scheduling_templates
  FOR ALL USING (auth.role() = 'authenticated');

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
  AND tablename IN ('topics', 'covered_topics', 'scheduling_emails', 'scheduling_templates')
ORDER BY tablename, policyname;

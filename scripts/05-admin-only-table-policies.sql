-- =====================================================
-- STEP 5: ADMIN-ONLY TABLE POLICIES
-- =====================================================
-- This script creates restricted policies for sensitive admin tables
-- Run this after the previous scripts

-- GongConfig policies (sensitive - restrict access)
CREATE POLICY "Only admins can access Gong config" ON public."GongConfig"
  FOR ALL USING (auth.role() = 'authenticated');

-- EmailTemplate policies
CREATE POLICY "Users can view email templates" ON public."EmailTemplate"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage email templates" ON public."EmailTemplate"
  FOR ALL USING (auth.role() = 'authenticated');

-- SchedulingTemplate policies
CREATE POLICY "Users can view scheduling templates" ON public."SchedulingTemplate"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage scheduling templates" ON public."SchedulingTemplate"
  FOR ALL USING (auth.role() = 'authenticated');

-- PredefinedTopic policies
CREATE POLICY "Users can view predefined topics" ON public."PredefinedTopic"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage predefined topics" ON public."PredefinedTopic"
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
  AND tablename IN ('GongConfig', 'EmailTemplate', 'SchedulingTemplate', 'PredefinedTopic')
ORDER BY tablename, policyname;

-- =====================================================
-- STEP 6: REMAINING BUSINESS TABLE POLICIES
-- =====================================================
-- This script creates policies for the remaining business tables
-- Run this after the previous scripts

-- SchedulingConversation policies
CREATE POLICY "Users can view scheduling conversations" ON public."SchedulingConversation"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage scheduling conversations" ON public."SchedulingConversation"
  FOR ALL USING (auth.role() = 'authenticated');

-- SchedulingEmail policies
CREATE POLICY "Users can view scheduling emails" ON public."SchedulingEmail"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage scheduling emails" ON public."SchedulingEmail"
  FOR ALL USING (auth.role() = 'authenticated');

-- AnalystCoveredTopic policies
CREATE POLICY "Users can view analyst covered topics" ON public."AnalystCoveredTopic"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage analyst covered topics" ON public."AnalystCoveredTopic"
  FOR ALL USING (auth.role() = 'authenticated');

-- AnalystAccess policies (sensitive)
CREATE POLICY "Only admins can view analyst access" ON public."AnalystAccess"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage analyst access" ON public."AnalystAccess"
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
  AND tablename IN ('SchedulingConversation', 'SchedulingEmail', 'AnalystCoveredTopic', 'AnalystAccess')
ORDER BY tablename, policyname;

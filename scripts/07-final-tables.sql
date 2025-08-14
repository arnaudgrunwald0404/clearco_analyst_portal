-- =====================================================
-- STEP 7: FINAL TABLE POLICIES
-- =====================================================
-- This script creates policies for the final remaining tables
-- Run this after the previous scripts

-- SocialHandle policies
CREATE POLICY "Users can view social handles" ON public."SocialHandle"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage social handles" ON public."SocialHandle"
  FOR ALL USING (auth.role() = 'authenticated');

-- ConversationSummary policies
CREATE POLICY "Users can view conversation summaries" ON public."ConversationSummary"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage conversation summaries" ON public."ConversationSummary"
  FOR ALL USING (auth.role() = 'authenticated');

-- CompanyVision policies
CREATE POLICY "Users can view published company vision" ON public."CompanyVision"
  FOR SELECT USING ("isPublished" = true OR auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage company vision" ON public."CompanyVision"
  FOR ALL USING (auth.role() = 'authenticated');

-- ExclusiveContent policies
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
  AND tablename IN ('SocialHandle', 'ConversationSummary', 'CompanyVision', 'ExclusiveContent', 'Interaction')
ORDER BY tablename, policyname;

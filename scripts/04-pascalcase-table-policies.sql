-- =====================================================
-- STEP 4: PASCALCASE TABLE POLICIES
-- =====================================================
-- This script creates policies for PascalCase tables
-- Run this after the previous scripts

-- Publication policies
CREATE POLICY "Users can view publications" ON public."Publication"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage publications" ON public."Publication"
  FOR ALL USING (auth.role() = 'authenticated');

-- Event policies
CREATE POLICY "Users can view events" ON public."Event"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage events" ON public."Event"
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
  AND tablename IN ('Publication', 'Event', 'Content', 'Alert')
ORDER BY tablename, policyname;

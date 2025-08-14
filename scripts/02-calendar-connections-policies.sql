-- =====================================================
-- STEP 2: CALENDAR CONNECTIONS POLICIES
-- =====================================================
-- This script creates policies for the calendar_connections table
-- Run this after enabling RLS on the table

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
  AND tablename = 'calendar_connections'
ORDER BY policyname;

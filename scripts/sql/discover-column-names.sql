-- Discover actual column names in the database
-- Run this first to see what columns actually exist

-- Check Analyst table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Analyst' 
ORDER BY ordinal_position;

-- Check SocialPost table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'SocialPost' 
ORDER BY ordinal_position;

-- Check Briefing table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Briefing' 
ORDER BY ordinal_position;

-- Check CalendarMeeting table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'CalendarMeeting' 
ORDER BY ordinal_position;

-- Check Newsletter table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Newsletter' 
ORDER BY ordinal_position;

-- Check NewsletterSubscription table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'NewsletterSubscription' 
ORDER BY ordinal_position;

-- Check Interaction table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Interaction' 
ORDER BY ordinal_position;

-- Check Alert table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Alert' 
ORDER BY ordinal_position;

-- Check Content table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Content' 
ORDER BY ordinal_position;

-- Check BriefingAnalyst table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'BriefingAnalyst' 
ORDER BY ordinal_position; 
-- Discover the actual column names in your database
-- This will help us create the correct indexes

-- Check all tables and their columns
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name IN ('briefings', 'analysts', 'briefing_analysts', 'Publication', 'calendar_meetings', 'social_media_posts', 'testimonials')
ORDER BY table_name, ordinal_position;

-- Specifically check briefings table structure
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'briefings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

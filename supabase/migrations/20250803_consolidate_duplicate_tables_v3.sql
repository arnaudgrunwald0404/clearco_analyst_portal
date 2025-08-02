-- Migration to consolidate duplicate tables (snake_case to PascalCase)
-- Each table pair is handled in its own transaction for safety

-- 1. action_items -> ActionItem
BEGIN;
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM "action_items") THEN
        INSERT INTO "ActionItem" (
            id,
            user_id,  -- Using snake_case as that's what exists in the table
            analyst_id,
            action_type,
            action_status,
            description,
            due_date,
            completed_at,
            created_at,
            updated_at
        )
        SELECT 
            id,
            user_id,
            analyst_id,
            action_type,
            action_status,
            description,
            due_date,
            completed_at,
            created_at,
            updated_at
        FROM action_items
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;
DROP TABLE IF EXISTS action_items CASCADE;
COMMIT;

-- 2. calendar_meetings -> CalendarMeeting
BEGIN;
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM "calendar_meetings") THEN
        INSERT INTO "CalendarMeeting" (
            id,
            user_id,
            calendar_id,
            event_id,
            start_time,
            end_time,
            title,
            description,
            created_at,
            updated_at
        )
        SELECT 
            id,
            user_id,
            calendar_id,
            event_id,
            start_time,
            end_time,
            title,
            description,
            created_at,
            updated_at
        FROM calendar_meetings
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;
DROP TABLE IF EXISTS calendar_meetings CASCADE;
COMMIT;

-- 3. general_settings -> GeneralSettings
BEGIN;
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM "general_settings") THEN
        INSERT INTO "GeneralSettings" (
            id,
            company_name,
            company_logo,
            welcome_message,
            created_at,
            updated_at,
            quote_text,
            quote_author
        )
        SELECT 
            id,
            company_name,
            company_logo,
            welcome_message,
            created_at,
            updated_at,
            quote_text,
            quote_author
        FROM general_settings
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;
DROP TABLE IF EXISTS general_settings CASCADE;
DROP TABLE IF EXISTS general_settings_backup CASCADE;
COMMIT;

-- 4. newsletter_subscriptions -> NewsletterSubscription
BEGIN;
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM "newsletter_subscriptions") THEN
        INSERT INTO "NewsletterSubscription" (
            id,
            email,
            status,
            subscribed_at,
            unsubscribed_at,
            created_at,
            updated_at
        )
        SELECT 
            id,
            email,
            status,
            subscribed_at,
            unsubscribed_at,
            created_at,
            updated_at
        FROM newsletter_subscriptions
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;
DROP TABLE IF EXISTS newsletter_subscriptions CASCADE;
COMMIT;

-- 5. scheduling_conversations -> SchedulingConversation
BEGIN;
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM "scheduling_conversations") THEN
        INSERT INTO "SchedulingConversation" (
            id,
            user_id,
            analyst_id,
            status,
            scheduled_for,
            completed_at,
            created_at,
            updated_at
        )
        SELECT 
            id,
            user_id,
            analyst_id,
            status,
            scheduled_for,
            completed_at,
            created_at,
            updated_at
        FROM scheduling_conversations
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;
DROP TABLE IF EXISTS scheduling_conversations CASCADE;
COMMIT;

-- 6. scheduling_emails -> SchedulingEmail
BEGIN;
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM "scheduling_emails") THEN
        INSERT INTO "SchedulingEmail" (
            id,
            conversation_id,
            template_id,
            sent_at,
            created_at,
            updated_at
        )
        SELECT 
            id,
            conversation_id,
            template_id,
            sent_at,
            created_at,
            updated_at
        FROM scheduling_emails
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;
DROP TABLE IF EXISTS scheduling_emails CASCADE;
COMMIT;

-- 7. scheduling_templates -> SchedulingTemplate
BEGIN;
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM "scheduling_templates") THEN
        INSERT INTO "SchedulingTemplate" (
            id,
            name,
            subject,
            content,
            created_at,
            updated_at
        )
        SELECT 
            id,
            name,
            subject,
            content,
            created_at,
            updated_at
        FROM scheduling_templates
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;
DROP TABLE IF EXISTS scheduling_templates CASCADE;
COMMIT;

-- 8. social_posts -> SocialPost
BEGIN;
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM "social_posts") THEN
        INSERT INTO "SocialPost" (
            id,
            user_id,
            analyst_id,
            platform,
            post_url,
            content,
            posted_at,
            created_at,
            updated_at
        )
        SELECT 
            id,
            user_id,
            analyst_id,
            platform,
            post_url,
            content,
            posted_at,
            created_at,
            updated_at
        FROM social_posts
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;
DROP TABLE IF EXISTS social_posts CASCADE;
COMMIT;

-- Post-migration validation
DO $$ 
DECLARE
    table_record RECORD;
    source_count INT;
    target_count INT;
BEGIN
    -- Check counts for each table pair
    FOR table_record IN 
        SELECT 
            lower_table.table_name as source_table,
            upper_table.table_name as target_table
        FROM information_schema.tables lower_table
        JOIN information_schema.tables upper_table 
            ON upper_table.table_name = initcap(replace(lower_table.table_name, '_', ''))
        WHERE lower_table.table_schema = 'public' 
            AND upper_table.table_schema = 'public'
            AND lower_table.table_name ~ '^[a-z]'
            AND upper_table.table_name ~ '^[A-Z]'
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', table_record.source_table) INTO source_count;
        EXECUTE format('SELECT COUNT(*) FROM %I', table_record.target_table) INTO target_count;
        
        IF target_count < source_count THEN
            RAISE WARNING 'Possible data loss in %: source had % records, target has % records',
                table_record.target_table, source_count, target_count;
        ELSE
            RAISE NOTICE 'Successfully migrated % -> %: % records',
                table_record.source_table, table_record.target_table, target_count;
        END IF;
    END LOOP;
END $$;
-- Migration: Consolidate tables and standardize naming
-- This migration:
-- 1. Creates backup tables
-- 2. Consolidates duplicate tables
-- 3. Standardizes naming conventions

-- First, create a function to safely rename tables
CREATE OR REPLACE FUNCTION safe_rename_table(old_name text, new_name text) RETURNS void AS $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = old_name) THEN
        EXECUTE format('ALTER TABLE IF EXISTS %I RENAME TO %I', old_name, new_name);
        RAISE NOTICE 'Renamed table % to %', old_name, new_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create backup tables with timestamp
DO $$ 
DECLARE
    timestamp_suffix TEXT := to_char(current_timestamp, 'YYYYMMDD_HH24MI');
BEGIN
    -- Create backup schema if it doesn't exist
    CREATE SCHEMA IF NOT EXISTS backup;

    -- Backup analysts/analyst tables
    EXECUTE format('CREATE TABLE IF NOT EXISTS backup.analysts_%s AS SELECT * FROM analysts', timestamp_suffix);
    EXECUTE format('CREATE TABLE IF NOT EXISTS backup.analyst_%s AS SELECT * FROM analyst', timestamp_suffix);
    
    -- Backup settings tables
    EXECUTE format('CREATE TABLE IF NOT EXISTS backup.general_settings_%s AS SELECT * FROM general_settings', timestamp_suffix);
    EXECUTE format('CREATE TABLE IF NOT EXISTS backup.GeneralSettings_%s AS SELECT * FROM "GeneralSettings"', timestamp_suffix);
    EXECUTE format('CREATE TABLE IF NOT EXISTS backup.analyst_portal_settings_%s AS SELECT * FROM analyst_portal_settings', timestamp_suffix);
    
    -- Backup calendar tables
    EXECUTE format('CREATE TABLE IF NOT EXISTS backup.calendar_connections_%s AS SELECT * FROM calendar_connections', timestamp_suffix);
    EXECUTE format('CREATE TABLE IF NOT EXISTS backup.CalendarConnection_%s AS SELECT * FROM "CalendarConnection"', timestamp_suffix);

    -- Record backup in history
    CREATE TABLE IF NOT EXISTS backup.migration_history (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        suffix TEXT NOT NULL,
        tables_backed_up TEXT[],
        reason TEXT
    );

    INSERT INTO backup.migration_history (suffix, tables_backed_up, reason)
    VALUES (
        timestamp_suffix,
        ARRAY['analysts', 'analyst', 'general_settings', 'GeneralSettings', 'analyst_portal_settings', 'calendar_connections', 'CalendarConnection'],
        'Pre-consolidation backup'
    );
END $$;

-- Consolidate analysts tables
DO $$
BEGIN
    -- If both tables exist, merge analyst into analysts
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'analyst') 
       AND EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'analysts') THEN
        
        INSERT INTO analysts (
            id, first_name, last_name, email, company, title,
            phone, linkedin, twitter, website, bio, influence,
            status, notes, created_at, updated_at
        )
        SELECT 
            id, first_name, last_name, email, company, title,
            phone, linkedin, twitter, website, bio, influence,
            status, notes, created_at, updated_at
        FROM analyst
        ON CONFLICT (id) DO UPDATE
        SET 
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            email = EXCLUDED.email,
            company = EXCLUDED.company,
            title = EXCLUDED.title,
            phone = EXCLUDED.phone,
            linkedin = EXCLUDED.linkedin,
            twitter = EXCLUDED.twitter,
            website = EXCLUDED.website,
            bio = EXCLUDED.bio,
            influence = EXCLUDED.influence,
            status = EXCLUDED.status,
            notes = EXCLUDED.notes,
            updated_at = NOW();
        
        DROP TABLE analyst;
    
    -- If only analyst exists, rename it to analysts
    ELSIF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'analyst') THEN
        PERFORM safe_rename_table('analyst', 'analysts');
    END IF;
END $$;

-- Consolidate settings tables
DO $$
BEGIN
    -- Create unified settings table if it doesn't exist
    CREATE TABLE IF NOT EXISTS settings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        category TEXT NOT NULL,
        key TEXT NOT NULL,
        value JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (category, key)
    );

    -- Migrate general settings
    INSERT INTO settings (category, key, value, created_at, updated_at)
    SELECT 
        'general' as category,
        key,
        value::jsonb,
        created_at,
        updated_at
    FROM general_settings
    ON CONFLICT (category, key) DO UPDATE
    SET 
        value = EXCLUDED.value,
        updated_at = NOW();

    -- Migrate GeneralSettings
    INSERT INTO settings (category, key, value, created_at, updated_at)
    SELECT 
        'general' as category,
        key,
        value::jsonb,
        created_at,
        updated_at
    FROM "GeneralSettings"
    ON CONFLICT (category, key) DO UPDATE
    SET 
        value = EXCLUDED.value,
        updated_at = NOW();

    -- Migrate analyst portal settings
    INSERT INTO settings (category, key, value, created_at, updated_at)
    SELECT 
        'portal' as category,
        key,
        value::jsonb,
        created_at,
        updated_at
    FROM analyst_portal_settings
    ON CONFLICT (category, key) DO UPDATE
    SET 
        value = EXCLUDED.value,
        updated_at = NOW();

    -- Drop old settings tables
    DROP TABLE IF EXISTS general_settings;
    DROP TABLE IF EXISTS "GeneralSettings";
    DROP TABLE IF EXISTS analyst_portal_settings;
END $$;

-- Consolidate calendar connection tables
DO $$
BEGIN
    -- Create new calendar_connections table if it doesn't exist
    CREATE TABLE IF NOT EXISTS calendar_connections_new (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        calendar_id TEXT NOT NULL,
        calendar_name TEXT,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        token_expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (user_id, calendar_id)
    );

    -- Migrate data from both potential tables
    INSERT INTO calendar_connections_new (
        id, user_id, calendar_id, calendar_name,
        access_token, refresh_token, token_expires_at,
        created_at, updated_at
    )
    SELECT * FROM calendar_connections
    ON CONFLICT (user_id, calendar_id) DO UPDATE
    SET 
        calendar_name = EXCLUDED.calendar_name,
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        token_expires_at = EXCLUDED.token_expires_at,
        updated_at = NOW();

    INSERT INTO calendar_connections_new (
        id, user_id, calendar_id, calendar_name,
        access_token, refresh_token, token_expires_at,
        created_at, updated_at
    )
    SELECT * FROM "CalendarConnection"
    ON CONFLICT (user_id, calendar_id) DO UPDATE
    SET 
        calendar_name = EXCLUDED.calendar_name,
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        token_expires_at = EXCLUDED.token_expires_at,
        updated_at = NOW();

    -- Drop old tables
    DROP TABLE IF EXISTS calendar_connections;
    DROP TABLE IF EXISTS "CalendarConnection";

    -- Rename new table to final name
    ALTER TABLE calendar_connections_new RENAME TO calendar_connections;
END $$;

-- Update foreign key constraints
DO $$
BEGIN
    -- Update briefings foreign key
    ALTER TABLE IF EXISTS briefings
        DROP CONSTRAINT IF EXISTS briefings_analyst_id_fkey,
        ADD CONSTRAINT briefings_analyst_id_fkey 
        FOREIGN KEY (analyst_id) REFERENCES analysts(id);

    -- Update social_media_posts foreign key
    ALTER TABLE IF EXISTS social_media_posts
        DROP CONSTRAINT IF EXISTS social_media_posts_analyst_id_fkey,
        ADD CONSTRAINT social_media_posts_analyst_id_fkey 
        FOREIGN KEY (analyst_id) REFERENCES analysts(id);

    -- Update publications foreign key
    ALTER TABLE IF EXISTS publications
        DROP CONSTRAINT IF EXISTS publications_analyst_id_fkey,
        ADD CONSTRAINT publications_analyst_id_fkey 
        FOREIGN KEY (analyst_id) REFERENCES analysts(id);
END $$;

-- Create or update indexes
DO $$
BEGIN
    -- Settings indexes
    CREATE INDEX IF NOT EXISTS idx_settings_category_key ON settings(category, key);
    
    -- Calendar connections indexes
    CREATE INDEX IF NOT EXISTS idx_calendar_connections_user_id ON calendar_connections(user_id);
    CREATE INDEX IF NOT EXISTS idx_calendar_connections_calendar_id ON calendar_connections(calendar_id);
    
    -- Analysts indexes
    CREATE INDEX IF NOT EXISTS idx_analysts_email ON analysts(email);
    CREATE INDEX IF NOT EXISTS idx_analysts_company ON analysts(company);
    CREATE INDEX IF NOT EXISTS idx_analysts_status ON analysts(status);
    CREATE INDEX IF NOT EXISTS idx_analysts_influence ON analysts(influence);
END $$;

-- Grant appropriate permissions
DO $$
BEGIN
    -- Grant permissions to authenticated users
    GRANT ALL ON TABLE settings TO authenticated;
    GRANT ALL ON TABLE calendar_connections TO authenticated;
    GRANT ALL ON TABLE analysts TO authenticated;

    -- Grant permissions to anonymous users
    GRANT ALL ON TABLE settings TO anon;
    GRANT ALL ON TABLE calendar_connections TO anon;
    GRANT ALL ON TABLE analysts TO anon;

    -- Enable Row Level Security
    ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
    ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
    ALTER TABLE analysts ENABLE ROW LEVEL SECURITY;
END $$;
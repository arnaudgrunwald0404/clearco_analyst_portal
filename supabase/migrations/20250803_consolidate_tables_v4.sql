-- Migration: Consolidate duplicate tables and standardize naming
-- This migration handles:
-- 1. Merging analyst/analysts tables
-- 2. Standardizing settings tables
-- 3. Standardizing calendar connection tables

-- First, create backup tables
DO $$ 
DECLARE
    timestamp_suffix TEXT := to_char(current_timestamp, 'YYYYMMDD_HH24MI');
BEGIN
    -- Backup analysts/analyst tables
    EXECUTE format('CREATE TABLE IF NOT EXISTS analysts_backup_%s AS TABLE analysts', timestamp_suffix);
    EXECUTE format('CREATE TABLE IF NOT EXISTS analyst_backup_%s AS TABLE analyst', timestamp_suffix);
    
    -- Backup settings tables
    EXECUTE format('CREATE TABLE IF NOT EXISTS general_settings_backup_%s AS TABLE general_settings', timestamp_suffix);
    EXECUTE format('CREATE TABLE IF NOT EXISTS "GeneralSettings_backup_%s" AS TABLE "GeneralSettings"', timestamp_suffix);
    EXECUTE format('CREATE TABLE IF NOT EXISTS analyst_portal_settings_backup_%s AS TABLE analyst_portal_settings', timestamp_suffix);
    
    -- Backup calendar tables
    EXECUTE format('CREATE TABLE IF NOT EXISTS calendar_connections_backup_%s AS TABLE calendar_connections', timestamp_suffix);
    EXECUTE format('CREATE TABLE IF NOT EXISTS "CalendarConnection_backup_%s" AS TABLE "CalendarConnection"', timestamp_suffix);
    
    RAISE NOTICE 'Created backup tables with suffix: %', timestamp_suffix;
END $$;

-- Handle analysts/analyst tables
DO $$
DECLARE
    analyst_exists BOOLEAN;
    analysts_exists BOOLEAN;
BEGIN
    -- Check table existence
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'analyst'
    ) INTO analyst_exists;
    
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'analysts'
    ) INTO analysts_exists;

    -- Handle table consolidation
    IF analyst_exists AND analysts_exists THEN
        -- Merge data from analyst into analysts
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
            
        -- Drop the singular table after merging
        DROP TABLE analyst;
        RAISE NOTICE 'Merged analyst table into analysts and dropped analyst table';
    ELSIF analyst_exists AND NOT analysts_exists THEN
        -- Rename analyst to analysts if only analyst exists
        ALTER TABLE analyst RENAME TO analysts;
        RAISE NOTICE 'Renamed analyst table to analysts';
    END IF;
END $$;

-- Create unified settings table
CREATE TABLE IF NOT EXISTS settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL,
    key TEXT NOT NULL,
    value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (category, key)
);

-- Migrate settings data
DO $$
BEGIN
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

-- Standardize calendar connection tables
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

-- Migrate calendar connection data
DO $$
BEGIN
    -- Migrate from calendar_connections
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

    -- Migrate from CalendarConnection
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

    -- Drop old calendar tables
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
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_settings_category_key ON settings(category, key);
CREATE INDEX IF NOT EXISTS idx_calendar_connections_user_id ON calendar_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_analysts_email ON analysts(email);
CREATE INDEX IF NOT EXISTS idx_analysts_company ON analysts(company);

-- Grant permissions
GRANT ALL ON TABLE settings TO authenticated;
GRANT ALL ON TABLE settings TO anon;
GRANT ALL ON TABLE calendar_connections TO authenticated;
GRANT ALL ON TABLE calendar_connections TO anon;
GRANT ALL ON TABLE analysts TO authenticated;
GRANT ALL ON TABLE analysts TO anon;

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysts ENABLE ROW LEVEL SECURITY;
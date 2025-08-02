-- Table consolidation script
-- This script standardizes table names and merges duplicate tables

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

    -- Handle analysts/analyst tables
    IF analyst_exists AND analysts_exists THEN
        -- Merge data from analyst into analysts if both exist
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
    ELSIF NOT analyst_exists AND NOT analysts_exists THEN
        RAISE EXCEPTION 'Neither analysts nor analyst table exists!';
    END IF;

    -- Standardize settings tables
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

    -- Migrate data from both potential calendar tables
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

    -- Drop old calendar tables
    DROP TABLE IF EXISTS calendar_connections;
    DROP TABLE IF EXISTS "CalendarConnection";

    -- Rename new table to final name
    ALTER TABLE calendar_connections_new RENAME TO calendar_connections;

    -- Drop User table if it exists (keeping user_profiles as it extends auth.users)
    DROP TABLE IF EXISTS "User";

    -- Update dependencies
    ALTER TABLE IF EXISTS briefings
        DROP CONSTRAINT IF EXISTS briefings_analyst_id_fkey,
        ADD CONSTRAINT briefings_analyst_id_fkey 
        FOREIGN KEY (analyst_id) REFERENCES analysts(id);

    ALTER TABLE IF EXISTS social_media_posts
        DROP CONSTRAINT IF EXISTS social_media_posts_analyst_id_fkey,
        ADD CONSTRAINT social_media_posts_analyst_id_fkey 
        FOREIGN KEY (analyst_id) REFERENCES analysts(id);

    -- Add any missing indexes
    CREATE INDEX IF NOT EXISTS idx_settings_category_key ON settings(category, key);
    CREATE INDEX IF NOT EXISTS idx_calendar_connections_user_id ON calendar_connections(user_id);
    CREATE INDEX IF NOT EXISTS idx_analysts_email ON analysts(email);
    CREATE INDEX IF NOT EXISTS idx_analysts_company ON analysts(company);

    RAISE NOTICE 'Table consolidation completed successfully';
END $$;

-- Grant appropriate permissions
GRANT ALL ON TABLE settings TO authenticated;
GRANT ALL ON TABLE settings TO anon;
GRANT ALL ON TABLE calendar_connections TO authenticated;
GRANT ALL ON TABLE calendar_connections TO anon;
GRANT ALL ON TABLE analysts TO authenticated;
GRANT ALL ON TABLE analysts TO anon;

-- Enable RLS on new tables
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysts ENABLE ROW LEVEL SECURITY;
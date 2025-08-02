-- Backup script for database consolidation
-- Creates backup tables with timestamps to ensure we don't lose any data

DO $$ 
DECLARE
    timestamp_suffix TEXT := to_char(current_timestamp, 'YYYYMMDD_HH24MI');
BEGIN
    -- Backup settings tables
    EXECUTE format('CREATE TABLE IF NOT EXISTS general_settings_backup_%s AS SELECT * FROM general_settings', timestamp_suffix);
    EXECUTE format('CREATE TABLE IF NOT EXISTS "GeneralSettings_backup_%s" AS SELECT * FROM "GeneralSettings"', timestamp_suffix);
    EXECUTE format('CREATE TABLE IF NOT EXISTS analyst_portal_settings_backup_%s AS SELECT * FROM analyst_portal_settings', timestamp_suffix);

    -- Backup calendar tables
    EXECUTE format('CREATE TABLE IF NOT EXISTS calendar_connections_backup_%s AS SELECT * FROM calendar_connections', timestamp_suffix);
    EXECUTE format('CREATE TABLE IF NOT EXISTS "CalendarConnection_backup_%s" AS SELECT * FROM "CalendarConnection"', timestamp_suffix);

    -- Backup user tables
    EXECUTE format('CREATE TABLE IF NOT EXISTS user_profiles_backup_%s AS SELECT * FROM user_profiles', timestamp_suffix);
    EXECUTE format('CREATE TABLE IF NOT EXISTS "User_backup_%s" AS SELECT * FROM "User"', timestamp_suffix);

    -- Backup analyst tables
    EXECUTE format('CREATE TABLE IF NOT EXISTS analysts_backup_%s AS SELECT * FROM analysts', timestamp_suffix);
    EXECUTE format('CREATE TABLE IF NOT EXISTS analyst_backup_%s AS SELECT * FROM analyst', timestamp_suffix);

    -- Log the backup
    RAISE NOTICE 'Backup created with timestamp suffix: %', timestamp_suffix;
    
    -- Create a backup record
    CREATE TABLE IF NOT EXISTS backup_history (
        id SERIAL PRIMARY KEY,
        timestamp_suffix TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        tables_backed_up TEXT[],
        reason TEXT
    );
    
    INSERT INTO backup_history (timestamp_suffix, tables_backed_up, reason)
    VALUES (
        timestamp_suffix,
        ARRAY[
            'general_settings',
            'GeneralSettings',
            'analyst_portal_settings',
            'calendar_connections',
            'CalendarConnection',
            'user_profiles',
            'User',
            'analysts',
            'analyst'
        ],
        'Pre-consolidation backup for table cleanup and standardization'
    );
END $$;
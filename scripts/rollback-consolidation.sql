-- Rollback script for table consolidation
DO $$ 
DECLARE
    latest_backup TEXT;
BEGIN
    -- Get the latest backup suffix
    SELECT suffix INTO latest_backup
    FROM backup.migration_history
    ORDER BY timestamp DESC
    LIMIT 1;

    IF latest_backup IS NULL THEN
        RAISE EXCEPTION 'No backup found in migration_history';
    END IF;

    -- Restore analysts tables
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'backup' AND table_name = format('analysts_%s', latest_backup)) THEN
        DROP TABLE IF EXISTS analysts CASCADE;
        EXECUTE format('CREATE TABLE analysts AS SELECT * FROM backup.analysts_%s', latest_backup);
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'backup' AND table_name = format('analyst_%s', latest_backup)) THEN
        DROP TABLE IF EXISTS analyst CASCADE;
        EXECUTE format('CREATE TABLE analyst AS SELECT * FROM backup.analyst_%s', latest_backup);
    END IF;

    -- Restore settings tables
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'backup' AND table_name = format('general_settings_%s', latest_backup)) THEN
        DROP TABLE IF EXISTS general_settings CASCADE;
        EXECUTE format('CREATE TABLE general_settings AS SELECT * FROM backup.general_settings_%s', latest_backup);
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'backup' AND table_name = format('GeneralSettings_%s', latest_backup)) THEN
        DROP TABLE IF EXISTS "GeneralSettings" CASCADE;
        EXECUTE format('CREATE TABLE "GeneralSettings" AS SELECT * FROM backup.GeneralSettings_%s', latest_backup);
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'backup' AND table_name = format('analyst_portal_settings_%s', latest_backup)) THEN
        DROP TABLE IF EXISTS analyst_portal_settings CASCADE;
        EXECUTE format('CREATE TABLE analyst_portal_settings AS SELECT * FROM backup.analyst_portal_settings_%s', latest_backup);
    END IF;

    -- Restore calendar tables
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'backup' AND table_name = format('calendar_connections_%s', latest_backup)) THEN
        DROP TABLE IF EXISTS calendar_connections CASCADE;
        EXECUTE format('CREATE TABLE calendar_connections AS SELECT * FROM backup.calendar_connections_%s', latest_backup);
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'backup' AND table_name = format('CalendarConnection_%s', latest_backup)) THEN
        DROP TABLE IF EXISTS "CalendarConnection" CASCADE;
        EXECUTE format('CREATE TABLE "CalendarConnection" AS SELECT * FROM backup.CalendarConnection_%s', latest_backup);
    END IF;

    -- Record rollback
    INSERT INTO backup.migration_history (suffix, tables_backed_up, reason)
    VALUES (
        latest_backup,
        ARRAY['analysts', 'analyst', 'general_settings', 'GeneralSettings', 'analyst_portal_settings', 'calendar_connections', 'CalendarConnection'],
        'Rollback from consolidation'
    );

    RAISE NOTICE 'Successfully rolled back to backup with suffix: %', latest_backup;
END $$;
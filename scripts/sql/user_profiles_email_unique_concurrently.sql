-- user_profiles email unique index (concurrent) operational script
-- Purpose: upgrade from non-unique to UNIQUE index on lower(email) with minimal write blocking.
-- Notes:
-- - CREATE INDEX CONCURRENTLY cannot run inside a transaction block.
-- - This script assumes email is NOT NULL (set by prior migration) and duplicates have been resolved.
-- - Run with a low-write maintenance window if the table is large.

-- 0) Safety timeouts (avoid long blocking) — tune as needed
SET lock_timeout = '5s';
SET statement_timeout = '15min';

-- 1) Hard stop if duplicates exist (case-insensitive)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.user_profiles
    GROUP BY lower(email)
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate user_profiles.email values exist; aborting UNIQUE index creation.';
  END IF;
END $$;

-- 2) Drop any old non-unique index on lower(email) to keep catalog clean (non-blocking)
DROP INDEX CONCURRENTLY IF EXISTS user_profiles_email_idx;

-- 3) Create the UNIQUE index concurrently
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS user_profiles_email_unique_idx
  ON public.user_profiles (lower(email));

-- 4) Optional: analyze to update planner stats
ANALYZE public.user_profiles;

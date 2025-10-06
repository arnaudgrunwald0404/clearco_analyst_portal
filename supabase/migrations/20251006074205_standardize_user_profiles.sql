-- 0) Ensure schema exists
CREATE SCHEMA IF NOT EXISTS public;

-- 1) Create table if it does not exist at all (minimal, will be enriched below)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2) Rename camelCase to snake_case if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'createdAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'created_at'
  ) THEN
    EXECUTE 'ALTER TABLE public.user_profiles RENAME COLUMN "createdAt" TO created_at';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'updatedAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'updated_at'
  ) THEN
    EXECUTE 'ALTER TABLE public.user_profiles RENAME COLUMN "updatedAt" TO updated_at';
  END IF;
END $$;

-- 3) Add columns if missing (all snake_case)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='email') THEN
    ALTER TABLE public.user_profiles ADD COLUMN email text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='password') THEN
    ALTER TABLE public.user_profiles ADD COLUMN password text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='first_name') THEN
    ALTER TABLE public.user_profiles ADD COLUMN first_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='last_name') THEN
    ALTER TABLE public.user_profiles ADD COLUMN last_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='company') THEN
    ALTER TABLE public.user_profiles ADD COLUMN company text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='role') THEN
    ALTER TABLE public.user_profiles ADD COLUMN role text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='created_at') THEN
    ALTER TABLE public.user_profiles ADD COLUMN created_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='updated_at') THEN
    ALTER TABLE public.user_profiles ADD COLUMN updated_at timestamptz;
  END IF;
END $$;

-- 4) Backfill missing values
-- 4a) Email from auth.users where missing
UPDATE public.user_profiles up
SET email = au.email
FROM auth.users au
WHERE up.id::text = au.id::text AND (up.email IS NULL OR up.email = '');

-- 4b) Password to 'oauth' if missing
UPDATE public.user_profiles
SET password = 'oauth'
WHERE password IS NULL OR password = '';

-- 4c) Timestamps to now() if missing
UPDATE public.user_profiles
SET created_at = timezone('utc', now())
WHERE created_at IS NULL;

UPDATE public.user_profiles
SET updated_at = timezone('utc', now())
WHERE updated_at IS NULL;

-- 4d) Role default if missing (safe text; you can align later to an enum)
UPDATE public.user_profiles
SET role = COALESCE(role, 'VENDOR_USER');

-- 5) Set defaults (UTC) and NOT NULL constraints (after backfill)
DO $$
BEGIN
  -- Defaults
  EXECUTE 'ALTER TABLE public.user_profiles ALTER COLUMN created_at SET DEFAULT timezone(''utc'', now())';
  EXECUTE 'ALTER TABLE public.user_profiles ALTER COLUMN updated_at SET DEFAULT timezone(''utc'', now())';
  EXECUTE 'ALTER TABLE public.user_profiles ALTER COLUMN password SET DEFAULT ''oauth''';

  -- NOT NULL constraints (safe now that we backfilled)
  BEGIN
    EXECUTE 'ALTER TABLE public.user_profiles ALTER COLUMN email SET NOT NULL';
  EXCEPTION WHEN others THEN
    -- In case some rows still null due to unexpected issues, skip to avoid breaking migration
    RAISE NOTICE 'Skipped setting email NOT NULL due to existing nulls';
  END;

  BEGIN
    EXECUTE 'ALTER TABLE public.user_profiles ALTER COLUMN password SET NOT NULL';
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Skipped setting password NOT NULL due to existing nulls';
  END;

  BEGIN
    EXECUTE 'ALTER TABLE public.user_profiles ALTER COLUMN created_at SET NOT NULL';
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Skipped setting created_at NOT NULL due to existing nulls';
  END;

  BEGIN
    EXECUTE 'ALTER TABLE public.user_profiles ALTER COLUMN updated_at SET NOT NULL';
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Skipped setting updated_at NOT NULL due to existing nulls';
  END;
END $$;

-- 6) Helpful index on email (non-unique to be safe with duplicates)
CREATE INDEX IF NOT EXISTS user_profiles_email_idx ON public.user_profiles (lower(email));

-- 7) Auto-update updated_at on row updates
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $fn$
BEGIN
  NEW.updated_at := timezone('utc', now());
  RETURN NEW;
END
$fn$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_profiles_set_updated_at ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_set_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

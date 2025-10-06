-- Migration: Firm-wide analyst visibility via analyst_domains and RLS
-- Date: 2025-09-30
-- This migration introduces analyst_domains, links analysts to domains, and
-- updates RLS on briefings to allow firm-wide (domain-level) visibility while
-- preserving vendor isolation.

begin;

-- 1) Create analyst_domains table
create table if not exists public.analyst_domains (
  id text primary key,
  name text,
  protected_domain text unique,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

comment on table public.analyst_domains is 'Firm/domain grouping for analysts (e.g., gartner.com)';

-- 2) Link analysts -> analyst_domains
alter table if exists public.analysts
  add column if not exists analyst_domain_id text null references public.analyst_domains(id);

create index if not exists idx_analysts_analyst_domain_id on public.analysts(analyst_domain_id);

-- 3) Backfill analyst_domains from analysts.email domain
--    Note: requires pgcrypto for gen_random_uuid(); if unavailable, use md5-based fallback
DO $$ BEGIN
  PERFORM 1 FROM pg_extension WHERE extname = 'pgcrypto';
  IF NOT FOUND THEN
    BEGIN
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE NOTICE 'pgcrypto not available; will use md5-based IDs';
    END;
  END IF;
END $$;

with domains as (
  select distinct lower(split_part(email, '@', 2)) as domain
  from public.analysts
  where coalesce(email, '') <> ''
)
insert into public.analyst_domains (id, name, protected_domain)
select
  coalesce(gen_random_uuid()::text, md5(domain)) as id,
  domain,
  domain
from domains d
where d.domain is not null
  and d.domain <> ''
  and not exists (
    select 1 from public.analyst_domains ad where ad.protected_domain = d.domain
  );

update public.analysts a
set analyst_domain_id = ad.id
from public.analyst_domains ad
where ad.protected_domain = lower(split_part(a.email, '@', 2))
  and (a.analyst_domain_id is null or a.analyst_domain_id <> ad.id);

-- 4) Helper functions used by RLS policies
--    These are created or replaced to ensure consistent behavior.
create or replace function public.current_user_email()
returns text language sql stable as $$
  select lower(coalesce(nullif(current_setting('request.jwt.claims', true)::jsonb->>'email',''), ''))
$$;

create or replace function public.current_analyst_id()
returns text language sql stable as $$
  select a.id
  from public.analysts a
  where lower(a.email) = public.current_user_email()
  limit 1
$$;

create or replace function public.current_analyst_domain_id()
returns text language sql stable as $$
  select a.analyst_domain_id
  from public.analysts a
  where lower(a.email) = public.current_user_email()
  limit 1
$$;

-- Provide vendor-domain helper if not present. Replace carefully to a no-op-compatible default.
-- Expected behavior: return the vendor domain scope id for the current request.
-- If your app already defines this function, this REPLACE should keep behavior intact if signature matches.
create or replace function public.current_user_vendor_domain_id()
returns text language sql stable as $$
  -- This implementation assumes there is a table vendor_domains(protected_domain text, id text)
  -- and that the current user email domain maps to vendor_domains.protected_domain.
  with email_domain as (
    select split_part(public.current_user_email(), '@', 2) as d
  )
  select vd.id
  from public.vendor_domains vd, email_domain ed
  where lower(vd.protected_domain) = lower(ed.d)
  limit 1
$$;

-- Helper: vendor admin check based on user_profiles.role
create or replace function public.is_vendor_admin()
returns boolean language sql stable as $$
  select exists (
    select 1
    from public.user_profiles up
    where up.id::text = auth.uid()::text
      and upper(coalesce(up.role::text, '')) in ('SUPER_ADMIN','VENDOR_ADMIN')
  )
$$;

-- 5) RLS policies for briefings (firm-wide visibility, vendor isolated)
-- Ensure RLS enabled
alter table if exists public.briefings enable row level security;

-- Drop overly permissive existing policies if they exist to avoid OR-expansion
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='briefings' AND policyname='Authenticated users can view briefings'
  ) THEN
    DROP POLICY "Authenticated users can view briefings" ON public.briefings;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='briefings' AND policyname='Authenticated users can manage briefings'
  ) THEN
    DROP POLICY "Authenticated users can manage briefings" ON public.briefings;
  END IF;
END $$;

-- Individual analyst can view briefings they are attached to (within vendor)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='briefings' AND policyname='analyst_can_view_own_briefings'
  ) THEN
    CREATE POLICY analyst_can_view_own_briefings ON public.briefings
      FOR SELECT USING (
        vendor_domain_id = public.current_user_vendor_domain_id()
        AND EXISTS (
          SELECT 1
          FROM public.briefing_analysts ba
          WHERE ba."briefingId" = briefings.id
            AND ba."analystId" = public.current_analyst_id()
        )
      );
  END IF;
END $$;

-- Firm-wide: any analyst from the same analyst_domain as any attached analyst can view (within vendor)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='briefings' AND policyname='analyst_firm_can_view_briefings'
  ) THEN
    CREATE POLICY analyst_firm_can_view_briefings ON public.briefings
      FOR SELECT USING (
        vendor_domain_id = public.current_user_vendor_domain_id()
        AND EXISTS (
          SELECT 1
          FROM public.briefing_analysts ba
          JOIN public.analysts a ON a.id = ba."analystId"
          WHERE ba."briefingId" = briefings.id
            AND a.analyst_domain_id = public.current_analyst_domain_id()
        )
      );
  END IF;
END $$;

-- Optional: attendee-based visibility (attendeeEmails or attendees), vendor isolated
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='briefings'
      AND policyname='analyst_can_view_by_attendee_email'
  ) THEN
    -- If attendeeEmails column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='briefings' AND column_name='attendeeEmails'
    ) THEN
      EXECUTE $sql$
        CREATE POLICY analyst_can_view_by_attendee_email ON public.briefings
          FOR SELECT USING (
            vendor_domain_id = public.current_user_vendor_domain_id()
            AND public.current_user_email() IS NOT NULL
            AND attendeeEmails @> jsonb_build_array(public.current_user_email())
          );
      $sql$;
    -- Else if attendees (JSONB array of tuples [email, name, status]) exists
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='briefings' AND column_name='attendees'
    ) THEN
      EXECUTE $sql$
        CREATE POLICY analyst_can_view_by_attendee_email ON public.briefings
          FOR SELECT USING (
            vendor_domain_id = public.current_user_vendor_domain_id()
            AND public.current_user_email() IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM jsonb_array_elements(coalesce(attendees, '[]'::jsonb)) AS a(elem)
              WHERE lower(coalesce(a.elem->>0, '')) = public.current_user_email()
            )
          );
      $sql$;
    END IF;
  END IF;
END
$policy$;

-- Vendor admins can view all briefings for their vendor via standard client
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='briefings' AND policyname='vendor_admin_can_view_vendor_briefings'
  ) THEN
    CREATE POLICY vendor_admin_can_view_vendor_briefings ON public.briefings
      FOR SELECT USING (
        public.is_vendor_admin() = true
        AND vendor_domain_id = public.current_user_vendor_domain_id()
      );
  END IF;
END $$;

-- Keep insert/update/delete policies as-is for admins or app logic; do not broaden select.

-- 6) Ensure briefing_analysts select is vendor-isolated (if not already)
alter table if exists public.briefing_analysts enable row level security;

DO $$ BEGIN
  -- If an overly permissive view policy exists, leave it for non-select commands
  -- but ensure there is at least a vendor-isolated select policy.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='briefing_analysts' AND policyname='vendor_isolation_select'
  ) THEN
    CREATE POLICY vendor_isolation_select ON public.briefing_analysts
      FOR SELECT USING (
        vendor_domain_id IS NULL OR vendor_domain_id = public.current_user_vendor_domain_id()
      );
  END IF;
END $$;

commit;
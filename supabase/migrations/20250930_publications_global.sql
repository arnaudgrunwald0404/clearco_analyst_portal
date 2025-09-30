-- Publications: remove vendor scoping and simplify RLS
-- Date: 2025-09-30

begin;

-- Drop vendor column if present
alter table if exists public.publications
  drop column if exists vendor_domain_id;

-- Enable RLS and replace vendor policies with global read policy
alter table if exists public.publications enable row level security;

DO $$ BEGIN
  IF EXISTS (select 1 from pg_policies where schemaname='public' and tablename='publications' and policyname='vendor_isolation_select') THEN
    drop policy vendor_isolation_select on public.publications;
  END IF;
  IF EXISTS (select 1 from pg_policies where schemaname='public' and tablename='publications' and policyname='vendor_isolation_modify') THEN
    drop policy vendor_isolation_modify on public.publications;
  END IF;
END $$;

-- Allow all authenticated users to select publications (they're global)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='publications') THEN
    create policy publications_select_all on public.publications
      for select using (auth.uid() is not null);
  END IF;
END $$;

-- Optionally, restrict modifications to service role by default (no modify policy)
-- If you need write access from app code, uncomment below to allow authenticated writes
-- create policy publications_modify_all on public.publications
--   for all using (auth.uid() is not null) with check (auth.uid() is not null);

commit;

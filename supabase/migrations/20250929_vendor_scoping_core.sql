-- Vendor scoping core migration
-- Date: 2025-09-29
-- This migration adds vendor_domain_id to core tables and introduces helper functions and RLS policies

begin;

-- Helper function: current user email from JWT (lowercased)
create or replace function public.current_user_email()
returns text
language sql
stable
as $$
  select lower(coalesce((auth.jwt() ->> 'email')::text, ''));
$$;

-- Helper function: resolve vendor domain id for current user based on email domain
create or replace function public.current_user_vendor_domain_id()
returns text
language plpgsql
stable
as $$
declare
  v_email text;
  v_domain text;
  v_vendor_id text;
begin
  v_email := public.current_user_email();
  if v_email is null or v_email = '' then
    return null;
  end if;
  v_domain := split_part(v_email, '@', 2);
  select vd.id into v_vendor_id
  from public.vendor_domains vd
  where vd.protected_domain = lower(v_domain)
  limit 1;
  return v_vendor_id;
end;
$$;

-- Utility: add vendor_domain_id to a table if not exists
-- Note: we use dynamic SQL in application code; here we do explicit alters

-- influence_tiers
alter table if exists public.influence_tiers
  add column if not exists vendor_domain_id text null;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'influence_tiers_vendor_fk'
  ) THEN
    alter table public.influence_tiers
      add constraint influence_tiers_vendor_fk
      foreign key (vendor_domain_id) references public.vendor_domains(id) on delete set null;
  END IF;
END $$;

create index if not exists idx_influence_tiers_vendor on public.influence_tiers(vendor_domain_id);
-- unique tier name per vendor
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'influence_tiers_vendor_name_key'
  ) then
    alter table public.influence_tiers add constraint influence_tiers_vendor_name_key unique (vendor_domain_id, name);
  end if;
end $$;

-- analysts
alter table if exists public.analysts
  add column if not exists vendor_domain_id text null;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'analysts_vendor_fk'
  ) THEN
    alter table public.analysts
      add constraint analysts_vendor_fk
      foreign key (vendor_domain_id) references public.vendor_domains(id) on delete set null;
  END IF;
END $$;

create index if not exists idx_analysts_vendor on public.analysts(vendor_domain_id);

-- briefings
alter table if exists public.briefings
  add column if not exists vendor_domain_id text null;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'briefings_vendor_fk'
  ) THEN
    alter table public.briefings
      add constraint briefings_vendor_fk
      foreign key (vendor_domain_id) references public.vendor_domains(id) on delete set null;
  END IF;
END $$;

create index if not exists idx_briefings_vendor on public.briefings(vendor_domain_id);

-- testimonials
alter table if exists public.testimonials
  add column if not exists vendor_domain_id text null;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'testimonials_vendor_fk'
  ) THEN
    alter table public.testimonials
      add constraint testimonials_vendor_fk
      foreign key (vendor_domain_id) references public.vendor_domains(id) on delete set null;
  END IF;
END $$;

create index if not exists idx_testimonials_vendor on public.testimonials(vendor_domain_id);

-- awards
alter table if exists public.awards
  add column if not exists vendor_domain_id text null;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'awards_vendor_fk'
  ) THEN
    alter table public.awards
      add constraint awards_vendor_fk
      foreign key (vendor_domain_id) references public.vendor_domains(id) on delete set null;
  END IF;
END $$;

create index if not exists idx_awards_vendor on public.awards(vendor_domain_id);

-- newsletters
alter table if exists public.newsletters
  add column if not exists vendor_domain_id text null;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'newsletters_vendor_fk'
  ) THEN
    alter table public.newsletters
      add constraint newsletters_vendor_fk
      foreign key (vendor_domain_id) references public.vendor_domains(id) on delete set null;
  END IF;
END $$;

create index if not exists idx_newsletters_vendor on public.newsletters(vendor_domain_id);

-- newsletter_subscriptions
alter table if exists public.newsletter_subscriptions
  add column if not exists vendor_domain_id text null;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'newsletter_subscriptions_vendor_fk'
  ) THEN
    alter table public.newsletter_subscriptions
      add constraint newsletter_subscriptions_vendor_fk
      foreign key (vendor_domain_id) references public.vendor_domains(id) on delete set null;
  END IF;
END $$;

create index if not exists idx_newsletter_subscriptions_vendor on public.newsletter_subscriptions(vendor_domain_id);

-- Event table (PascalCase)
alter table if exists public."Event"
  add column if not exists vendor_domain_id text null;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'event_vendor_fk'
  ) THEN
    alter table public."Event"
      add constraint event_vendor_fk
      foreign key (vendor_domain_id) references public.vendor_domains(id) on delete set null;
  END IF;
END $$;

create index if not exists idx_event_vendor on public."Event"(vendor_domain_id);

-- RLS vendor isolation policies (idempotent drops then creates)
-- influence_tiers
alter table if exists public.influence_tiers enable row level security;

drop policy if exists vendor_isolation_select on public.influence_tiers;
drop policy if exists vendor_isolation_modify on public.influence_tiers;

create policy vendor_isolation_select on public.influence_tiers
  for select using (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  );

create policy vendor_isolation_modify on public.influence_tiers
  for all using (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  ) with check (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  );

-- analysts
alter table if exists public.analysts enable row level security;

drop policy if exists vendor_isolation_select on public.analysts;
drop policy if exists vendor_isolation_modify on public.analysts;

create policy vendor_isolation_select on public.analysts
  for select using (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  );

create policy vendor_isolation_modify on public.analysts
  for all using (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  ) with check (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  );

-- briefings
alter table if exists public.briefings enable row level security;

drop policy if exists vendor_isolation_select on public.briefings;
drop policy if exists vendor_isolation_modify on public.briefings;

create policy vendor_isolation_select on public.briefings
  for select using (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  );

create policy vendor_isolation_modify on public.briefings
  for all using (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  ) with check (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  );

-- testimonials
alter table if exists public.testimonials enable row level security;

drop policy if exists vendor_isolation_select on public.testimonials;
drop policy if exists vendor_isolation_modify on public.testimonials;

create policy vendor_isolation_select on public.testimonials
  for select using (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  );

create policy vendor_isolation_modify on public.testimonials
  for all using (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  ) with check (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  );

-- awards
alter table if exists public.awards enable row level security;

drop policy if exists vendor_isolation_select on public.awards;
drop policy if exists vendor_isolation_modify on public.awards;

create policy vendor_isolation_select on public.awards
  for select using (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  );

create policy vendor_isolation_modify on public.awards
  for all using (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  ) with check (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  );

-- newsletters
alter table if exists public.newsletters enable row level security;

drop policy if exists vendor_isolation_select on public.newsletters;
drop policy if exists vendor_isolation_modify on public.newsletters;

create policy vendor_isolation_select on public.newsletters
  for select using (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  );

create policy vendor_isolation_modify on public.newsletters
  for all using (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  ) with check (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  );

-- newsletter_subscriptions
alter table if exists public.newsletter_subscriptions enable row level security;

drop policy if exists vendor_isolation_select on public.newsletter_subscriptions;
drop policy if exists vendor_isolation_modify on public.newsletter_subscriptions;

create policy vendor_isolation_select on public.newsletter_subscriptions
  for select using (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  );

create policy vendor_isolation_modify on public.newsletter_subscriptions
  for all using (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  ) with check (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  );

-- Event
alter table if exists public."Event" enable row level security;

drop policy if exists vendor_isolation_select on public."Event";
drop policy if exists vendor_isolation_modify on public."Event";

create policy vendor_isolation_select on public."Event"
  for select using (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  );

create policy vendor_isolation_modify on public."Event"
  for all using (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  ) with check (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  );

commit;

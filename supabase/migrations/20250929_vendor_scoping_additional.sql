-- Vendor scoping additional migration
-- Date: 2025-09-29
-- Adds vendor_domain_id and RLS vendor isolation to additional tables

begin;

-- ========== Columns and FKs ==========
-- briefing_analysts (idempotent; prior migration may have added this)
alter table if exists public.briefing_analysts
  add column if not exists vendor_domain_id text null;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='briefing_analysts'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'briefing_analysts_vendor_fk'
    ) THEN
      alter table public.briefing_analysts
        add constraint briefing_analysts_vendor_fk
        foreign key (vendor_domain_id) references public.vendor_domains(id) on delete set null;
    END IF;
  END IF;
END $$;

create index if not exists idx_briefing_analysts_vendor on public.briefing_analysts(vendor_domain_id);

-- calendar_meetings
alter table if exists public.calendar_meetings
  add column if not exists vendor_domain_id text null;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='calendar_meetings'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'calendar_meetings_vendor_fk'
    ) THEN
      alter table public.calendar_meetings
        add constraint calendar_meetings_vendor_fk
        foreign key (vendor_domain_id) references public.vendor_domains(id) on delete set null;
    END IF;
  END IF;
END $$;

create index if not exists idx_calendar_meetings_vendor on public.calendar_meetings(vendor_domain_id);

-- social_posts (newer schema)
alter table if exists public.social_posts
  add column if not exists vendor_domain_id text null;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='social_posts'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'social_posts_vendor_fk'
    ) THEN
      alter table public.social_posts
        add constraint social_posts_vendor_fk
        foreign key (vendor_domain_id) references public.vendor_domains(id) on delete set null;
    END IF;
  END IF;
END $$;

create index if not exists idx_social_posts_vendor on public.social_posts(vendor_domain_id);

-- social_media_posts (older schema)
alter table if exists public.social_media_posts
  add column if not exists vendor_domain_id text null;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='social_media_posts'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'social_media_posts_vendor_fk'
    ) THEN
      alter table public.social_media_posts
        add constraint social_media_posts_vendor_fk
        foreign key (vendor_domain_id) references public.vendor_domains(id) on delete set null;
    END IF;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='social_media_posts'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_social_media_posts_vendor ON public.social_media_posts(vendor_domain_id);
  END IF;
END $$;

-- analyst_portal_settings
alter table if exists public.analyst_portal_settings
  add column if not exists vendor_domain_id text null;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='analyst_portal_settings'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'analyst_portal_settings_vendor_fk'
    ) THEN
      alter table public.analyst_portal_settings
        add constraint analyst_portal_settings_vendor_fk
        foreign key (vendor_domain_id) references public.vendor_domains(id) on delete set null;
    END IF;
  END IF;
END $$;

create index if not exists idx_analyst_portal_settings_vendor on public.analyst_portal_settings(vendor_domain_id);

-- portal_content
alter table if exists public.portal_content
  add column if not exists vendor_domain_id text null;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='portal_content'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'portal_content_vendor_fk'
    ) THEN
      alter table public.portal_content
        add constraint portal_content_vendor_fk
        foreign key (vendor_domain_id) references public.vendor_domains(id) on delete set null;
    END IF;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='portal_content'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_portal_content_vendor ON public.portal_content(vendor_domain_id);
  END IF;
END $$;

-- publications (if present)
alter table if exists public.publications
  add column if not exists vendor_domain_id text null;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='publications'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'publications_vendor_fk'
    ) THEN
      alter table public.publications
        add constraint publications_vendor_fk
        foreign key (vendor_domain_id) references public.vendor_domains(id) on delete set null;
    END IF;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='publications'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_publications_vendor ON public.publications(vendor_domain_id);
  END IF;
END $$;

-- events (snake_case; "Event" handled in core migration)
alter table if exists public.events
  add column if not exists vendor_domain_id text null;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='events'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'events_vendor_fk'
    ) THEN
      alter table public.events
        add constraint events_vendor_fk
        foreign key (vendor_domain_id) references public.vendor_domains(id) on delete set null;
    END IF;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='events'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_events_vendor ON public.events(vendor_domain_id);
  END IF;
END $$;


-- ========== Backfills (best-effort, idempotent) ==========
-- NOTE: These backfills assume FK relationships exist. They are safe to re-run.
-- briefing_analysts: derive from analyst
update public.briefing_analysts ba
set vendor_domain_id = a.vendor_domain_id
from public.analysts a
where ba."analystId" = a.id
  and (ba.vendor_domain_id is null or ba.vendor_domain_id <> a.vendor_domain_id);

-- calendar_meetings: derive from analyst_id if present
update public.calendar_meetings cm
set vendor_domain_id = a.vendor_domain_id
from public.analysts a
where cm."analystId" = a.id
  and (cm.vendor_domain_id is null or cm.vendor_domain_id <> a.vendor_domain_id);

-- social_posts: derive from analystId
update public.social_posts sp
set vendor_domain_id = a.vendor_domain_id
from public.analysts a
where sp."analystId" = a.id
  and (sp.vendor_domain_id is null or sp.vendor_domain_id <> a.vendor_domain_id);

-- social_media_posts: derive from analyst_id
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='social_media_posts'
  ) THEN
    UPDATE public.social_media_posts smp
    SET vendor_domain_id = a.vendor_domain_id
    FROM public.analysts a
    WHERE smp.analyst_id = a.id
      AND (smp.vendor_domain_id IS NULL OR smp.vendor_domain_id <> a.vendor_domain_id);
  END IF;
END $$;

-- analyst_portal_settings: if a single row per vendor is intended, fill by matching protected domain (heuristic)
-- NOTE: Adjust this backfill to your actual relationships if available.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='analyst_portal_settings' AND column_name='protectedDomain'
  ) THEN
    UPDATE public.analyst_portal_settings s
    SET vendor_domain_id = vd.id
    FROM public.vendor_domains vd
    WHERE (s.vendor_domain_id IS NULL) AND (
      lower(coalesce(s."protectedDomain", '')) <> '' AND lower(s."protectedDomain") = lower(vd.protected_domain)
    );
  END IF;
END $$;

-- portal_content: when content is linked to briefings or vendor via foreign key, prefer that relation instead.
-- This heuristic uses a vendor_id column if present, otherwise no-op.
-- update public.portal_content pc
-- set vendor_domain_id = vd.id
-- from public.vendor_domains vd
-- where pc.vendor_domain_id is null and pc.vendor_id = vd.id;

-- publications/events: organization mapping is vendor-specific in your app; backfill logic may vary.


-- ========== RLS and policies ==========
-- briefing_analysts
alter table if exists public.briefing_analysts enable row level security;

-- Drop old policies if they exist
DO $$ BEGIN
  IF EXISTS (select 1 from pg_policies where schemaname='public' and tablename='briefing_analysts' and policyname='vendor_isolation_select') THEN
    drop policy vendor_isolation_select on public.briefing_analysts;
  END IF;
  IF EXISTS (select 1 from pg_policies where schemaname='public' and tablename='briefing_analysts' and policyname='vendor_isolation_modify') THEN
    drop policy vendor_isolation_modify on public.briefing_analysts;
  END IF;
END $$;

create policy vendor_isolation_select on public.briefing_analysts
  for select using (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  );

create policy vendor_isolation_modify on public.briefing_analysts
  for all using (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  ) with check (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  );

-- calendar_meetings
alter table if exists public.calendar_meetings enable row level security;
DO $$ BEGIN
  IF EXISTS (select 1 from pg_policies where schemaname='public' and tablename='calendar_meetings' and policyname='vendor_isolation_select') THEN
    drop policy vendor_isolation_select on public.calendar_meetings;
  END IF;
  IF EXISTS (select 1 from pg_policies where schemaname='public' and tablename='calendar_meetings' and policyname='vendor_isolation_modify') THEN
    drop policy vendor_isolation_modify on public.calendar_meetings;
  END IF;
END $$;
create policy vendor_isolation_select on public.calendar_meetings
  for select using (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  );
create policy vendor_isolation_modify on public.calendar_meetings
  for all using (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  ) with check (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  );

-- social_posts
alter table if exists public.social_posts enable row level security;
DO $$ BEGIN
  IF EXISTS (select 1 from pg_policies where schemaname='public' and tablename='social_posts' and policyname='vendor_isolation_select') THEN
    drop policy vendor_isolation_select on public.social_posts;
  END IF;
  IF EXISTS (select 1 from pg_policies where schemaname='public' and tablename='social_posts' and policyname='vendor_isolation_modify') THEN
    drop policy vendor_isolation_modify on public.social_posts;
  END IF;
END $$;
create policy vendor_isolation_select on public.social_posts
  for select using (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  );
create policy vendor_isolation_modify on public.social_posts
  for all using (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  ) with check (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  );

-- social_media_posts
alter table if exists public.social_media_posts enable row level security;
DO $$ BEGIN
  IF EXISTS (select 1 from pg_policies where schemaname='public' and tablename='social_media_posts' and policyname='vendor_isolation_select') THEN
    drop policy vendor_isolation_select on public.social_media_posts;
  END IF;
  IF EXISTS (select 1 from pg_policies where schemaname='public' and tablename='social_media_posts' and policyname='vendor_isolation_modify') THEN
    drop policy vendor_isolation_modify on public.social_media_posts;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='social_media_posts') THEN
    create policy vendor_isolation_select on public.social_media_posts
      for select using (
        vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
      );

    create policy vendor_isolation_modify on public.social_media_posts
      for all using (
        vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
      ) with check (
        vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
      );
  END IF;
END $$;
-- analyst_portal_settings
alter table if exists public.analyst_portal_settings enable row level security;
DO $$ BEGIN
  IF EXISTS (select 1 from pg_policies where schemaname='public' and tablename='analyst_portal_settings' and policyname='vendor_isolation_select') THEN
    drop policy vendor_isolation_select on public.analyst_portal_settings;
  END IF;
  IF EXISTS (select 1 from pg_policies where schemaname='public' and tablename='analyst_portal_settings' and policyname='vendor_isolation_modify') THEN
    drop policy vendor_isolation_modify on public.analyst_portal_settings;
  END IF;
END $$;
create policy vendor_isolation_select on public.analyst_portal_settings
  for select using (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  );
create policy vendor_isolation_modify on public.analyst_portal_settings
  for all using (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  ) with check (
    vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
  );

-- portal_content
alter table if exists public.portal_content enable row level security;
DO $$ BEGIN
  IF EXISTS (select 1 from pg_policies where schemaname='public' and tablename='portal_content' and policyname='vendor_isolation_select') THEN
    drop policy vendor_isolation_select on public.portal_content;
  END IF;
  IF EXISTS (select 1 from pg_policies where schemaname='public' and tablename='portal_content' and policyname='vendor_isolation_modify') THEN
    drop policy vendor_isolation_modify on public.portal_content;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='portal_content') THEN
    create policy vendor_isolation_select on public.portal_content
      for select using (
        vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
      );
    create policy vendor_isolation_modify on public.portal_content
      for all using (
        vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
      ) with check (
        vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
      );
  END IF;
END $$;

-- publications
alter table if exists public.publications enable row level security;
DO $$ BEGIN
  IF EXISTS (select 1 from pg_policies where schemaname='public' and tablename='publications' and policyname='vendor_isolation_select') THEN
    drop policy vendor_isolation_select on public.publications;
  END IF;
  IF EXISTS (select 1 from pg_policies where schemaname='public' and tablename='publications' and policyname='vendor_isolation_modify') THEN
    drop policy vendor_isolation_modify on public.publications;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='publications') THEN
    create policy vendor_isolation_select on public.publications
      for select using (
        vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
      );
    create policy vendor_isolation_modify on public.publications
      for all using (
        vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
      ) with check (
        vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
      );
  END IF;
END $$;

-- events (snake_case)
alter table if exists public.events enable row level security;
DO $$ BEGIN
  IF EXISTS (select 1 from pg_policies where schemaname='public' and tablename='events' and policyname='vendor_isolation_select') THEN
    drop policy vendor_isolation_select on public.events;
  END IF;
  IF EXISTS (select 1 from pg_policies where schemaname='public' and tablename='events' and policyname='vendor_isolation_modify') THEN
    drop policy vendor_isolation_modify on public.events;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='events') THEN
    create policy vendor_isolation_select on public.events
      for select using (
        vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
      );
    create policy vendor_isolation_modify on public.events
      for all using (
        vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
      ) with check (
        vendor_domain_id is null or vendor_domain_id = public.current_user_vendor_domain_id()
      );
  END IF;
END $$;

commit;

-- Analyst private notes (cross-vendor, scoped to analyst; optionally linked to a vendor)
-- Date: 2025-09-30

begin;

create table if not exists public.analyst_notes (
  id uuid primary key default gen_random_uuid(),
  analyst_id text not null references public.analysts(id) on delete cascade,
  vendor_domain_id text null references public.vendor_domains(id) on delete set null,
  note_date date not null default current_date,
  title text null,
  content text not null,
  attachment_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS: keep it simple; app layer ensures only analysts access their own notes
alter table public.analyst_notes enable row level security;

-- Allow authenticated users to read/write; restrict at app layer by analyst_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='analyst_notes' AND policyname='analyst_notes_select'
  ) THEN
    create policy analyst_notes_select on public.analyst_notes
      for select using (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='analyst_notes' AND policyname='analyst_notes_modify'
  ) THEN
    create policy analyst_notes_modify on public.analyst_notes
      for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
  END IF;
END $$;

commit;
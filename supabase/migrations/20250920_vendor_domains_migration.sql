-- Migration: rename general_settings to vendor_domains and add vendor_domain_id to briefing_analysts
-- Date: 2025-09-20

begin;

-- 1) Rename table
alter table if exists public.general_settings
  rename to vendor_domains;

-- 2) Keep existing columns as-is; ensure primary key and indexes remain.
--    Create an explicit index on protected_domain for lookups (idempotent pattern)
create index if not exists idx_vendor_domains_protected_domain
  on public.vendor_domains (protected_domain);

-- 3) Add vendor_domain_id to briefing_analysts and create FK
alter table if exists public.briefing_analysts
  add column if not exists vendor_domain_id text null;

alter table if exists public.briefing_analysts
  add constraint briefing_analysts_vendor_domain_fk
  foreign key (vendor_domain_id) references public.vendor_domains(id)
  on delete set null;

create index if not exists idx_briefing_analysts_vendor_domain_id
  on public.briefing_analysts (vendor_domain_id);

commit;
-- Vendor-scoped portal settings and company profile stored on vendor_domains
-- This migration adds the necessary columns and migrates legacy values from analyst_portal_settings

begin;

alter table if exists public.vendor_domains
  add column if not exists portal_welcome_quote text default '',
  add column if not exists portal_contact_name text default '',
  add column if not exists portal_contact_title text default '',
  add column if not exists portal_contact_email text default '',
  add column if not exists portal_contact_phone text default '',
  add column if not exists portal_contact_image_url text default '',
  add column if not exists company_profile jsonb default '{}'::jsonb;

comment on column public.vendor_domains.company_profile is 'Company profile fields for Analyst Portal (mission, vision, values, team, business, offerings, etc.)';

-- Migrate legacy single-row analyst_portal_settings (if present) into all existing vendor_domains rows
-- This provides reasonable defaults across vendors; per-vendor editing is supported going forward
with aps as (
  select
    "welcomeQuote" as welcome_quote,
    coalesce(nullif("quoteAuthor", ''), '') as quote_author,
    coalesce(nullif("authorImageUrl", ''), '') as author_image_url
  from public.analyst_portal_settings
  limit 1
)
update public.vendor_domains vd
set
  portal_welcome_quote = coalesce((select welcome_quote from aps), portal_welcome_quote),
  -- best-effort split: quote_author like 'Name, Title'
  portal_contact_name = coalesce(
    (select split_part(quote_author, ',', 1) from aps),
    portal_contact_name
  ),
  portal_contact_title = coalesce(
    (select btrim(substring(quote_author from position(',' in quote_author)+1)) from aps),
    portal_contact_title
  ),
  portal_contact_image_url = coalesce((select author_image_url from aps), portal_contact_image_url)
where exists (select 1 from aps);

commit;
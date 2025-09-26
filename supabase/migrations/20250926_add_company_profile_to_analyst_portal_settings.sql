-- DEPRECATED: Do not run.
-- Company profile and portal fields have moved to public.vendor_domains.
-- Use migration: 20250926_vendor_domains_add_portal_and_company_profile.sql
-- Run this migration in your Supabase project before saving data from the new Company tab

alter table if exists analyst_portal_settings
  add column if not exists company_profile jsonb default '{}'::jsonb;

comment on column analyst_portal_settings.company_profile is 'Company profile fields for Analyst Portal (mission, vision, values, team, business, offerings, etc.)';
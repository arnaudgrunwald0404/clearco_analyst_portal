-- Migration: add attendees (JSONB) to briefings
-- Date: 2025-09-21

begin;

alter table if exists public.briefings
  add column if not exists attendees jsonb;

comment on column public.briefings.attendees is 'Array of arrays: [[attendee_email, attendee_name, attendee_status], ...]';

commit;

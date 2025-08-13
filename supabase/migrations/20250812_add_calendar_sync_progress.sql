-- Calendar sync progress events table
create table if not exists public.calendar_sync_progress (
  id bigserial primary key,
  connection_id text not null references public.calendar_connections(id) on delete cascade,
  type text not null,
  month text null,
  message text null,
  found_analyst_meetings integer null,
  total_events_processed integer null,
  relevant_meetings_count integer null,
  created_at timestamptz not null default now()
);

-- Helpful index for incremental fetches
create index if not exists idx_calendar_sync_progress_connection_id_id
  on public.calendar_sync_progress (connection_id, id);


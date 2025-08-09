-- Add participationStatus column to Event table
-- Values: SPONSORING | ATTENDING | CONSIDERING | NULL (Not Attending)

alter table "Event"
  add column if not exists "participationStatus" text;

-- Optional guard: constrain allowed non-null values
alter table "Event"
  add constraint event_participation_status_chk
  check (
    "participationStatus" is null or
    "participationStatus" in ('SPONSORING','ATTENDING','CONSIDERING')
  );

-- No backfill needed; existing rows remain NULL (interpreted as Not Attending in UI)

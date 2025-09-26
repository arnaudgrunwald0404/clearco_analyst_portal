-- Add company contact fields to analyst_portal_settings
ALTER TABLE analyst_portal_settings
  ADD COLUMN IF NOT EXISTS "contactName" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "contactTitle" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "contactEmail" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "contactPhone" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "contactImageUrl" text DEFAULT '';


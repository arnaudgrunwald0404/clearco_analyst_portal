-- Add resources column to analyst_portal_settings to drive portal Resources tab
ALTER TABLE analyst_portal_settings
ADD COLUMN IF NOT EXISTS "resources" jsonb DEFAULT '[]'::jsonb;


-- Add contentUrl column to briefings if it does not exist
ALTER TABLE briefings
  ADD COLUMN IF NOT EXISTS contentUrl text;


-- Add description column to newsletters table
ALTER TABLE newsletters ADD COLUMN IF NOT EXISTS description text;

-- Update existing newsletters to have empty description if null
UPDATE newsletters SET description = '' WHERE description IS NULL;


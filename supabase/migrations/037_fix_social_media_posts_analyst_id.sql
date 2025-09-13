-- Fix social_media_posts table to use TEXT analyst_id instead of UUID
-- This matches the actual analysts.id column type

-- First, drop the foreign key constraint
ALTER TABLE social_media_posts DROP CONSTRAINT social_media_posts_analyst_id_fkey;

-- Change the column type from UUID to TEXT
ALTER TABLE social_media_posts ALTER COLUMN analyst_id TYPE TEXT;

-- Add the foreign key constraint back with the correct type
ALTER TABLE social_media_posts 
ADD CONSTRAINT social_media_posts_analyst_id_fkey 
FOREIGN KEY (analyst_id) REFERENCES analysts(id) ON DELETE CASCADE;

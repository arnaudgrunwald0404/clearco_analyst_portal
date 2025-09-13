-- Add participationStatus column to Event table
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "participationStatus" text;

-- Add constraint to ensure only valid values
ALTER TABLE "Event" ADD CONSTRAINT event_participation_status_check 
CHECK ("participationStatus" IS NULL OR "participationStatus" IN ('SPONSORING','ATTENDING','CONSIDERING'));




-- Rename participationTypes column to participationStatus in Event table
ALTER TABLE "Event" RENAME COLUMN "participationTypes" TO "participationStatus";

-- Add constraint to ensure only valid values for the renamed column
ALTER TABLE "Event" ADD CONSTRAINT event_participation_status_check 
CHECK ("participationStatus" IS NULL OR "participationStatus" IN ('SPONSORING','ATTENDING','CONSIDERING'));















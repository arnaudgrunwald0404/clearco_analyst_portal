-- Complete Supabase Schema Migration
-- This script creates all tables and relationships needed for the analyst portal

-- First, drop existing tables if they exist to start fresh
DROP TABLE IF EXISTS "briefing_analysts" CASCADE;
DROP TABLE IF EXISTS "calendar_meetings" CASCADE;
DROP TABLE IF EXISTS "social_posts" CASCADE;
DROP TABLE IF EXISTS "action_items" CASCADE;
DROP TABLE IF EXISTS "briefings" CASCADE;
DROP TABLE IF EXISTS "calendar_connections" CASCADE;
DROP TABLE IF EXISTS "analysts" CASCADE;
DROP TABLE IF EXISTS "GeneralSettings" CASCADE;
DROP TABLE IF EXISTS "influence_tiers" CASCADE;

-- Drop existing enums if they exist
DROP TYPE IF EXISTS "influence" CASCADE;
DROP TYPE IF EXISTS "status" CASCADE;
DROP TYPE IF EXISTS "analyst_type" CASCADE;
DROP TYPE IF EXISTS "relationship_health" CASCADE;
DROP TYPE IF EXISTS "briefing_status" CASCADE;
DROP TYPE IF EXISTS "social_platform" CASCADE;
DROP TYPE IF EXISTS "action_item_status" CASCADE;
DROP TYPE IF EXISTS "action_item_priority" CASCADE;

-- Create enums
CREATE TYPE "influence" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH');
CREATE TYPE "status" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "analyst_type" AS ENUM ('Analyst', 'Press', 'Investor', 'Practitioner', 'Influencer');
CREATE TYPE "relationship_health" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL');
CREATE TYPE "briefing_status" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');
CREATE TYPE "social_platform" AS ENUM ('TWITTER', 'LINKEDIN', 'MEDIUM', 'BLOG', 'OTHER');
CREATE TYPE "action_item_status" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "action_item_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- Create analysts table
CREATE TABLE "analysts" (
    "id" TEXT PRIMARY KEY DEFAULT ('cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 25)),
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "company" TEXT NOT NULL,
    "title" TEXT,
    "type" "analyst_type" NOT NULL DEFAULT 'Analyst',
    "influence" "influence" NOT NULL DEFAULT 'MEDIUM',
    "status" "status" NOT NULL DEFAULT 'ACTIVE',
    "relationshipHealth" "relationship_health" NOT NULL DEFAULT 'GOOD',
    "keyThemes" TEXT,
    "bio" TEXT,
    "location" TEXT,
    "profileImageUrl" TEXT,
    "linkedinUrl" TEXT,
    "twitterHandle" TEXT,
    "personalWebsite" TEXT,
    "lastContactDate" TIMESTAMP WITH TIME ZONE,
    "nextContactDate" TIMESTAMP WITH TIME ZONE,
    "notes" TEXT,
    "tags" TEXT[],
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create influence_tiers table
CREATE TABLE "influence_tiers" (
    "id" TEXT PRIMARY KEY DEFAULT ('cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 25)),
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "briefingFrequency" INTEGER,
    "touchpointFrequency" INTEGER,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create briefings table
CREATE TABLE "briefings" (
    "id" TEXT PRIMARY KEY DEFAULT ('cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 25)),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "status" "briefing_status" NOT NULL DEFAULT 'SCHEDULED',
    "location" TEXT,
    "meetingUrl" TEXT,
    "agenda" TEXT,
    "notes" TEXT,
    "followUpItems" TEXT[],
    "recordingUrl" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringPattern" TEXT,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE("title", "scheduledAt")
);

-- Create briefing_analysts junction table
CREATE TABLE "briefing_analysts" (
    "id" TEXT PRIMARY KEY DEFAULT ('cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 25)),
    "briefingId" TEXT NOT NULL,
    "analystId" TEXT NOT NULL,
    "role" TEXT DEFAULT 'Attendee',
    "responseStatus" TEXT DEFAULT 'Pending',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE("briefingId", "analystId")
);

-- Create social_posts table
CREATE TABLE "social_posts" (
    "id" TEXT PRIMARY KEY DEFAULT ('cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 25)),
    "analystId" TEXT NOT NULL,
    "platform" "social_platform" NOT NULL,
    "content" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "postedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "engagements" INTEGER DEFAULT 0,
    "likes" INTEGER DEFAULT 0,
    "shares" INTEGER DEFAULT 0,
    "comments" INTEGER DEFAULT 0,
    "sentiment" TEXT,
    "themes" TEXT[],
    "isRelevant" BOOLEAN NOT NULL DEFAULT true,
    "responseGenerated" BOOLEAN NOT NULL DEFAULT false,
    "responseContent" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create action_items table
CREATE TABLE "action_items" (
    "id" TEXT PRIMARY KEY DEFAULT ('cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 25)),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "action_item_status" NOT NULL DEFAULT 'PENDING',
    "priority" "action_item_priority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP WITH TIME ZONE,
    "assignedTo" TEXT,
    "analystId" TEXT,
    "briefingId" TEXT,
    "tags" TEXT[],
    "completedAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create calendar_connections table
CREATE TABLE "calendar_connections" (
    "id" TEXT PRIMARY KEY DEFAULT ('cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 25)),
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'google',
    "email" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP WITH TIME ZONE,
    "calendarId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSync" TIMESTAMP WITH TIME ZONE,
    "syncInProgress" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create calendar_meetings table
CREATE TABLE "calendar_meetings" (
    "id" TEXT PRIMARY KEY DEFAULT ('cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 25)),
    "calendarConnectionId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP WITH TIME ZONE NOT NULL,
    "endTime" TIMESTAMP WITH TIME ZONE NOT NULL,
    "location" TEXT,
    "attendees" TEXT[],
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT DEFAULT 'confirmed',
    "briefingId" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE("calendarConnectionId", "externalId")
);

-- Create GeneralSettings table
CREATE TABLE "GeneralSettings" (
    "id" TEXT PRIMARY KEY DEFAULT ('cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 25)),
    "companyName" TEXT NOT NULL DEFAULT '',
    "protectedDomain" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "industryName" TEXT NOT NULL DEFAULT 'HR Technology',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE "briefing_analysts" ADD CONSTRAINT "briefing_analysts_briefingId_fkey" 
    FOREIGN KEY ("briefingId") REFERENCES "briefings"("id") ON DELETE CASCADE;

ALTER TABLE "briefing_analysts" ADD CONSTRAINT "briefing_analysts_analystId_fkey" 
    FOREIGN KEY ("analystId") REFERENCES "analysts"("id") ON DELETE CASCADE;

ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_analystId_fkey" 
    FOREIGN KEY ("analystId") REFERENCES "analysts"("id") ON DELETE CASCADE;

ALTER TABLE "action_items" ADD CONSTRAINT "action_items_analystId_fkey" 
    FOREIGN KEY ("analystId") REFERENCES "analysts"("id") ON DELETE SET NULL;

ALTER TABLE "action_items" ADD CONSTRAINT "action_items_briefingId_fkey" 
    FOREIGN KEY ("briefingId") REFERENCES "briefings"("id") ON DELETE SET NULL;

ALTER TABLE "calendar_meetings" ADD CONSTRAINT "calendar_meetings_calendarConnectionId_fkey" 
    FOREIGN KEY ("calendarConnectionId") REFERENCES "calendar_connections"("id") ON DELETE CASCADE;

ALTER TABLE "calendar_meetings" ADD CONSTRAINT "calendar_meetings_briefingId_fkey" 
    FOREIGN KEY ("briefingId") REFERENCES "briefings"("id") ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX "analysts_email_idx" ON "analysts"("email");
CREATE INDEX "analysts_company_idx" ON "analysts"("company");
CREATE INDEX "analysts_influence_idx" ON "analysts"("influence");
CREATE INDEX "analysts_status_idx" ON "analysts"("status");
CREATE INDEX "analysts_type_idx" ON "analysts"("type");

CREATE INDEX "briefings_scheduledAt_idx" ON "briefings"("scheduledAt");
CREATE INDEX "briefings_status_idx" ON "briefings"("status");

CREATE INDEX "briefing_analysts_briefingId_idx" ON "briefing_analysts"("briefingId");
CREATE INDEX "briefing_analysts_analystId_idx" ON "briefing_analysts"("analystId");

CREATE INDEX "social_posts_analystId_idx" ON "social_posts"("analystId");
CREATE INDEX "social_posts_platform_idx" ON "social_posts"("platform");
CREATE INDEX "social_posts_postedAt_idx" ON "social_posts"("postedAt");
CREATE INDEX "social_posts_isRelevant_idx" ON "social_posts"("isRelevant");

CREATE INDEX "action_items_status_idx" ON "action_items"("status");
CREATE INDEX "action_items_priority_idx" ON "action_items"("priority");
CREATE INDEX "action_items_dueDate_idx" ON "action_items"("dueDate");
CREATE INDEX "action_items_analystId_idx" ON "action_items"("analystId");

CREATE INDEX "calendar_connections_userId_idx" ON "calendar_connections"("userId");
CREATE INDEX "calendar_meetings_startTime_idx" ON "calendar_meetings"("startTime");

-- Disable RLS for all tables (simplest approach for now)
ALTER TABLE "analysts" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "influence_tiers" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "briefings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "briefing_analysts" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "social_posts" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "action_items" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "calendar_connections" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "calendar_meetings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "GeneralSettings" DISABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated and anonymous users
GRANT ALL ON "analysts" TO authenticated;
GRANT ALL ON "analysts" TO anon;
GRANT ALL ON "influence_tiers" TO authenticated;
GRANT ALL ON "influence_tiers" TO anon;
GRANT ALL ON "briefings" TO authenticated;
GRANT ALL ON "briefings" TO anon;
GRANT ALL ON "briefing_analysts" TO authenticated;
GRANT ALL ON "briefing_analysts" TO anon;
GRANT ALL ON "social_posts" TO authenticated;
GRANT ALL ON "social_posts" TO anon;
GRANT ALL ON "action_items" TO authenticated;
GRANT ALL ON "action_items" TO anon;
GRANT ALL ON "calendar_connections" TO authenticated;
GRANT ALL ON "calendar_connections" TO anon;
GRANT ALL ON "calendar_meetings" TO authenticated;
GRANT ALL ON "calendar_meetings" TO anon;
GRANT ALL ON "GeneralSettings" TO authenticated;
GRANT ALL ON "GeneralSettings" TO anon;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Insert sample data
-- Default influence tiers
INSERT INTO "influence_tiers" (id, name, color, "briefingFrequency", "touchpointFrequency", "order", "isActive")
VALUES
    ('cl_tier_very_high', 'VERY_HIGH', '#dc2626', 60, 30, 1, true),
    ('cl_tier_high', 'HIGH', '#ea580c', 90, 45, 2, true),
    ('cl_tier_medium', 'MEDIUM', '#ca8a04', 120, 60, 3, true),
    ('cl_tier_low', 'LOW', '#16a34a', null, null, 4, true);

-- Default general settings
INSERT INTO "GeneralSettings" (id, "companyName", "protectedDomain", "logoUrl", "industryName")
VALUES ('cl_general_settings_001', 'ClearCompany', 'clearcompany.com', '/clearco-logo.png', 'HR Technology');

-- Sample analysts
INSERT INTO "analysts" (id, "firstName", "lastName", email, company, title, type, influence, "keyThemes", bio)
VALUES
    ('cl_analyst_001', 'John', 'Smith', 'john.smith@example.com', 'Gartner', 'Senior Analyst', 'Analyst', 'HIGH', 'HR Technology, Talent Management', 'Senior analyst covering HR technology markets'),
    ('cl_analyst_002', 'Sarah', 'Johnson', 'sarah.j@forrester.com', 'Forrester', 'Principal Analyst', 'Analyst', 'VERY_HIGH', 'Future of Work, Employee Experience', 'Leading expert in future of work trends'),
    ('cl_analyst_003', 'Mike', 'Chen', 'mike.chen@techcrunch.com', 'TechCrunch', 'Senior Writer', 'Press', 'MEDIUM', 'Startups, HR Tech', 'Covers HR technology and startup ecosystem');

-- Sample briefings
INSERT INTO "briefings" (id, title, description, "scheduledAt", duration, status)
VALUES
    ('cl_brief_001', 'Q4 Product Roadmap Review', 'Quarterly briefing on our product roadmap and strategic direction', '2025-01-15 14:00:00+00', 60, 'SCHEDULED'),
    ('cl_brief_002', 'Market Trends Discussion', 'Discussion of current market trends and competitive landscape', '2025-01-20 15:00:00+00', 45, 'SCHEDULED');

-- Link analysts to briefings
INSERT INTO "briefing_analysts" ("briefingId", "analystId", role)
VALUES
    ('cl_brief_001', 'cl_analyst_001', 'Primary Attendee'),
    ('cl_brief_001', 'cl_analyst_002', 'Attendee'),
    ('cl_brief_002', 'cl_analyst_003', 'Primary Attendee');

-- Sample social posts
INSERT INTO "social_posts" (id, "analystId", platform, content, url, "postedAt", engagements, "isRelevant")
VALUES
    ('cl_social_001', 'cl_analyst_001', 'LINKEDIN', 'Great insights on the future of HR technology...', 'https://linkedin.com/posts/johnsmith/123', '2025-01-10 12:00:00+00', 25, true),
    ('cl_social_002', 'cl_analyst_002', 'TWITTER', 'The employee experience revolution is here...', 'https://twitter.com/sarahj/status/123', '2025-01-09 15:30:00+00', 45, true);

-- Sample action items
INSERT INTO "action_items" (id, title, description, status, priority, "dueDate", "analystId")
VALUES
    ('cl_action_001', 'Follow up on product demo', 'Send follow-up materials from product demonstration', 'PENDING', 'HIGH', '2025-01-25 17:00:00+00', 'cl_analyst_001'),
    ('cl_action_002', 'Schedule Q1 briefing', 'Schedule quarterly briefing for Q1 2025', 'IN_PROGRESS', 'MEDIUM', '2025-02-01 17:00:00+00', 'cl_analyst_002');

-- Verify the setup
SELECT 'analysts' as table_name, count(*) as row_count FROM "analysts"
UNION ALL
SELECT 'influence_tiers', count(*) FROM "influence_tiers"
UNION ALL
SELECT 'briefings', count(*) FROM "briefings"
UNION ALL
SELECT 'briefing_analysts', count(*) FROM "briefing_analysts"
UNION ALL
SELECT 'social_posts', count(*) FROM "social_posts"
UNION ALL
SELECT 'action_items', count(*) FROM "action_items"
UNION ALL
SELECT 'GeneralSettings', count(*) FROM "GeneralSettings"
ORDER BY table_name; 
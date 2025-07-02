-- Grant schema usage
GRANT USAGE ON SCHEMA public TO postgres;

-- Grant permissions for dashboard-specific tables
GRANT ALL ON "Analyst" TO postgres;
GRANT ALL ON "NewsletterSubscription" TO postgres;
GRANT ALL ON "Briefing" TO postgres;
GRANT ALL ON "Interaction" TO postgres;
GRANT ALL ON "CalendarMeeting" TO postgres;
GRANT ALL ON "Content" TO postgres;
GRANT ALL ON "Alert" TO postgres;
GRANT ALL ON "Newsletter" TO postgres;

-- Make sure sequences are accessible
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Disable RLS on these specific tables
ALTER TABLE "NewsletterSubscription" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Briefing" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Interaction" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "CalendarMeeting" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Content" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Alert" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Newsletter" DISABLE ROW LEVEL SECURITY;

-- Grant ownership of these tables to postgres
ALTER TABLE "NewsletterSubscription" OWNER TO postgres;
ALTER TABLE "Briefing" OWNER TO postgres;
ALTER TABLE "Interaction" OWNER TO postgres;
ALTER TABLE "CalendarMeeting" OWNER TO postgres;
ALTER TABLE "Content" OWNER TO postgres;
ALTER TABLE "Alert" OWNER TO postgres;
ALTER TABLE "Newsletter" OWNER TO postgres; 
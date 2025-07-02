-- Grant schema usage if not already granted
GRANT USAGE ON SCHEMA public TO postgres;

-- Grant permissions for social media tables
GRANT ALL ON "SocialPost" TO postgres;
GRANT ALL ON "SocialHandle" TO postgres;

-- Make sure sequences are accessible
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Disable RLS on social media tables
ALTER TABLE "SocialPost" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "SocialHandle" DISABLE ROW LEVEL SECURITY;

-- Grant ownership of social media tables to postgres
ALTER TABLE "SocialPost" OWNER TO postgres;
ALTER TABLE "SocialHandle" OWNER TO postgres;

-- Ensure the postgres role can access the analyst relationship
GRANT SELECT ON "Analyst" TO postgres;

-- Create indexes to improve performance (optional but recommended)
CREATE INDEX IF NOT EXISTS "social_post_posted_at_idx" ON "SocialPost"("postedAt");
CREATE INDEX IF NOT EXISTS "social_post_is_relevant_idx" ON "SocialPost"("isRelevant");
CREATE INDEX IF NOT EXISTS "social_post_analyst_id_idx" ON "SocialPost"("analystId"); 
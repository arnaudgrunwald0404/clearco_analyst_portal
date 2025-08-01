-- Add foreign key constraint between social_posts and analysts
ALTER TABLE social_posts 
ADD CONSTRAINT fk_social_posts_analyst 
FOREIGN KEY ("analystId") REFERENCES analysts(id) 
ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_social_posts_analyst_id ON social_posts("analystId");

-- Also add index for querying recent relevant posts
CREATE INDEX IF NOT EXISTS idx_social_posts_relevant_recent ON social_posts("isRelevant", "postedAt" DESC) WHERE "isRelevant" = true; 
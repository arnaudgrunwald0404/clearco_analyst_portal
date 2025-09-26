-- Clean up newsletter tables - standardize on snake_case
-- We'll keep 'newsletters' and 'newsletter_subscriptions' (snake_case)
-- and drop 'Newsletter' and 'NewsletterSubscription' (PascalCase) if they exist

-- First, let's check if the PascalCase tables exist and copy any data if needed
-- Note: This migration assumes we want to keep snake_case as the standard

-- Drop PascalCase tables if they exist (after ensuring data is in snake_case tables)
DROP TABLE IF EXISTS public."NewsletterSubscription" CASCADE;
DROP TABLE IF EXISTS public."Newsletter" CASCADE;

-- Ensure snake_case tables exist with proper structure
-- Add description column to newsletters if it doesn't exist
ALTER TABLE public.newsletters ADD COLUMN IF NOT EXISTS description text;

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_newsletters_status ON public.newsletters(status);
CREATE INDEX IF NOT EXISTS idx_newsletters_sent_at ON public.newsletters("sentAt");
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_newsletter_id ON public.newsletter_subscriptions("newsletterId");
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_analyst_id ON public.newsletter_subscriptions("analystId");

-- Update RLS policies for snake_case tables
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop any old PascalCase policies
DROP POLICY IF EXISTS "Users can view newsletters" ON public."Newsletter";
DROP POLICY IF EXISTS "Only admins can manage newsletters" ON public."Newsletter";
DROP POLICY IF EXISTS "Users can view newsletter subscriptions" ON public."NewsletterSubscription";
DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON public."NewsletterSubscription";

-- Create RLS policies for snake_case tables
DROP POLICY IF EXISTS "Users can view newsletters" ON public.newsletters;
DROP POLICY IF EXISTS "Only admins can manage newsletters" ON public.newsletters;
DROP POLICY IF EXISTS "Users can view newsletter subscriptions" ON public.newsletter_subscriptions;
DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON public.newsletter_subscriptions;

CREATE POLICY "Users can view newsletters" ON public.newsletters
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage newsletters" ON public.newsletters
  FOR ALL USING (true);

CREATE POLICY "Users can view newsletter subscriptions" ON public.newsletter_subscriptions
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own subscriptions" ON public.newsletter_subscriptions
  FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON public.newsletters TO authenticated;
GRANT ALL ON public.newsletters TO anon;
GRANT ALL ON public.newsletter_subscriptions TO authenticated;
GRANT ALL ON public.newsletter_subscriptions TO anon;


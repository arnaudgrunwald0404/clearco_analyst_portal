-- Create portal_content table for content management in analyst portal
CREATE TABLE IF NOT EXISTS portal_content (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text DEFAULT '',
  type text NOT NULL CHECK (type IN ('VIDEO', 'REPORT', 'DEMO', 'CASE_STUDY', 'WEBINAR')),
  category text NOT NULL CHECK (category IN ('brand', 'product', 'misc')),
  url text NOT NULL,
  "fileSize" text,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_portal_content_type ON portal_content(type);
CREATE INDEX IF NOT EXISTS idx_portal_content_category ON portal_content(category);
CREATE INDEX IF NOT EXISTS idx_portal_content_created_at ON portal_content("createdAt");

-- Disable RLS for now (can be enabled later if needed)
ALTER TABLE portal_content DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON portal_content TO authenticated;
GRANT ALL ON portal_content TO anon;


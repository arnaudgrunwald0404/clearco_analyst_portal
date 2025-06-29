-- Social Media Analysis Schema
-- This migration adds tables for tracking social media posts and analysis

-- Enum for social media platforms
CREATE TYPE social_platform AS ENUM ('LINKEDIN', 'TWITTER', 'YOUTUBE', 'MEDIUM', 'BLOG');

-- Enum for post types
CREATE TYPE post_type AS ENUM ('POST', 'ARTICLE', 'SHARE', 'COMMENT', 'VIDEO');

-- Enum for content categories/tags
CREATE TYPE content_category AS ENUM (
  'HR_TECH', 'TALENT_MANAGEMENT', 'EMPLOYEE_EXPERIENCE', 'AI_ML', 
  'FUTURE_OF_WORK', 'REMOTE_WORK', 'DEI', 'ANALYTICS', 'AUTOMATION',
  'RECRUITMENT', 'PERFORMANCE_MANAGEMENT', 'LEARNING_DEVELOPMENT',
  'COMPANY_CULTURE', 'LEADERSHIP', 'INDUSTRY_TRENDS', 'OTHER'
);

-- Social media posts table
CREATE TABLE social_media_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  analyst_id UUID REFERENCES analysts(id) ON DELETE CASCADE NOT NULL,
  platform social_platform NOT NULL,
  post_type post_type NOT NULL,
  post_id TEXT NOT NULL, -- Platform-specific post ID
  url TEXT NOT NULL,
  content TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  engagement_metrics JSONB DEFAULT '{}', -- likes, shares, comments, views
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  
  -- Ensure uniqueness per platform post
  UNIQUE(platform, post_id)
);

-- Content analysis table for AI-powered categorization
CREATE TABLE post_content_analysis (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES social_media_posts(id) ON DELETE CASCADE NOT NULL,
  categories content_category[] DEFAULT '{}', -- Array of detected categories
  sentiment_score DECIMAL(3,2), -- -1.0 to 1.0
  key_topics TEXT[] DEFAULT '{}', -- Extracted topics/keywords
  mentions_company BOOLEAN DEFAULT false, -- Whether post mentions our company
  relevance_score DECIMAL(3,2), -- 0.0 to 1.0 - how relevant to HR tech
  summary TEXT, -- AI-generated summary
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  analysis_version TEXT DEFAULT 'v1.0', -- Track analysis model version
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Social media monitoring jobs table
CREATE TABLE social_monitoring_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  analyst_id UUID REFERENCES analysts(id) ON DELETE CASCADE,
  platform social_platform NOT NULL,
  status TEXT DEFAULT 'PENDING', -- PENDING, RUNNING, COMPLETED, FAILED
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  posts_found INTEGER DEFAULT 0,
  posts_new INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_social_posts_analyst_id ON social_media_posts(analyst_id);
CREATE INDEX idx_social_posts_platform ON social_media_posts(platform);
CREATE INDEX idx_social_posts_published_at ON social_media_posts(published_at DESC);
CREATE INDEX idx_social_posts_scraped_at ON social_media_posts(scraped_at DESC);
CREATE INDEX idx_post_analysis_post_id ON post_content_analysis(post_id);
CREATE INDEX idx_post_analysis_categories ON post_content_analysis USING GIN(categories);
CREATE INDEX idx_post_analysis_relevance ON post_content_analysis(relevance_score DESC);
CREATE INDEX idx_post_analysis_company_mentions ON post_content_analysis(mentions_company);
CREATE INDEX idx_monitoring_jobs_analyst_platform ON social_monitoring_jobs(analyst_id, platform);
CREATE INDEX idx_monitoring_jobs_status ON social_monitoring_jobs(status);

-- RLS Policies
ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_content_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_monitoring_jobs ENABLE ROW LEVEL SECURITY;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_social_media_posts_updated_at 
  BEFORE UPDATE ON social_media_posts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_content_analysis_updated_at 
  BEFORE UPDATE ON post_content_analysis 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

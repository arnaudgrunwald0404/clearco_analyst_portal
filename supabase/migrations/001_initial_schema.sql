-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('ADMIN', 'EDITOR', 'ANALYST');
CREATE TYPE analyst_influence AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE analyst_status AS ENUM ('ACTIVE', 'INACTIVE', 'PROSPECT');
CREATE TYPE newsletter_status AS ENUM ('DRAFT', 'SCHEDULED', 'SENT');
CREATE TYPE interaction_type AS ENUM ('EMAIL', 'CALL', 'MEETING', 'CONFERENCE', 'SOCIAL');
CREATE TYPE content_type AS ENUM ('WHITEPAPER', 'CASE_STUDY', 'BLOG_POST', 'WEBINAR', 'PRESENTATION', 'OTHER');

-- User profiles table (extends auth.users)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role user_role NOT NULL DEFAULT 'EDITOR',
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Analysts table
CREATE TABLE analysts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  company TEXT,
  title TEXT,
  phone TEXT,
  linkedin TEXT,
  twitter TEXT,
  website TEXT,
  bio TEXT,
  influence analyst_influence NOT NULL DEFAULT 'MEDIUM',
  status analyst_status NOT NULL DEFAULT 'ACTIVE',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Analyst expertise areas
CREATE TABLE analyst_expertise (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  analyst_id UUID REFERENCES analysts(id) ON DELETE CASCADE NOT NULL,
  area TEXT NOT NULL,
  UNIQUE(analyst_id, area)
);

-- Analyst access credentials
CREATE TABLE analyst_access (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  analyst_id UUID REFERENCES analysts(id) ON DELETE CASCADE UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Newsletters table
CREATE TABLE newsletters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  html_content TEXT,
  status newsletter_status NOT NULL DEFAULT 'DRAFT',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  created_by UUID REFERENCES user_profiles(id) ON DELETE RESTRICT NOT NULL
);

-- Newsletter subscriptions tracking
CREATE TABLE newsletter_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  analyst_id UUID REFERENCES analysts(id) ON DELETE CASCADE NOT NULL,
  newsletter_id UUID REFERENCES newsletters(id) ON DELETE CASCADE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  opened BOOLEAN NOT NULL DEFAULT false,
  clicked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  UNIQUE(analyst_id, newsletter_id)
);

-- Interactions table
CREATE TABLE interactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  analyst_id UUID REFERENCES analysts(id) ON DELETE CASCADE NOT NULL,
  type interaction_type NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Content table
CREATE TABLE content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type content_type NOT NULL,
  url TEXT,
  file_path TEXT,
  is_exclusive BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Content access permissions for analysts
CREATE TABLE content_access (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content_id UUID REFERENCES content(id) ON DELETE CASCADE NOT NULL,
  analyst_id UUID REFERENCES analysts(id) ON DELETE CASCADE NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  UNIQUE(content_id, analyst_id)
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyst_expertise ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyst_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_access ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_analysts_email ON analysts(email);
CREATE INDEX idx_analysts_company ON analysts(company);
CREATE INDEX idx_analysts_status ON analysts(status);
CREATE INDEX idx_analyst_expertise_analyst_id ON analyst_expertise(analyst_id);
CREATE INDEX idx_newsletters_status ON newsletters(status);
CREATE INDEX idx_newsletters_created_by ON newsletters(created_by);
CREATE INDEX idx_newsletter_subscriptions_analyst_id ON newsletter_subscriptions(analyst_id);
CREATE INDEX idx_newsletter_subscriptions_newsletter_id ON newsletter_subscriptions(newsletter_id);
CREATE INDEX idx_interactions_analyst_id ON interactions(analyst_id);
CREATE INDEX idx_interactions_type ON interactions(type);
CREATE INDEX idx_interactions_date ON interactions(date);
CREATE INDEX idx_content_type ON content(type);
CREATE INDEX idx_content_is_published ON content(is_published);
CREATE INDEX idx_content_access_analyst_id ON content_access(analyst_id);

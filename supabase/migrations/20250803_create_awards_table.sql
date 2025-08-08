-- Create awards table
CREATE TABLE IF NOT EXISTS awards (
  id TEXT PRIMARY KEY DEFAULT 'cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  name TEXT NOT NULL,
  link TEXT,
  organization TEXT NOT NULL,
  product_topics TEXT, -- JSON array stored as text
  priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  submission_date TIMESTAMP WITH TIME ZONE NOT NULL,
  publication_date TIMESTAMP WITH TIME ZONE NOT NULL,
  owner TEXT,
  status TEXT DEFAULT 'EVALUATING' CHECK (status IN ('EVALUATING', 'SUBMITTED', 'UNDER_REVIEW', 'WINNER', 'FINALIST', 'NOT_SELECTED', 'WITHDRAWN')),
  cost TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all awards" ON awards
  FOR SELECT USING (true);

CREATE POLICY "Users can insert awards" ON awards
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update awards" ON awards
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete awards" ON awards
  FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_awards_organization ON awards(organization);
CREATE INDEX IF NOT EXISTS idx_awards_status ON awards(status);
CREATE INDEX IF NOT EXISTS idx_awards_priority ON awards(priority);
CREATE INDEX IF NOT EXISTS idx_awards_submission_date ON awards(submission_date);
CREATE INDEX IF NOT EXISTS idx_awards_publication_date ON awards(publication_date);

-- Add some sample data
INSERT INTO awards (name, organization, submission_date, publication_date, priority, status, notes) VALUES
('Best HR Technology Solution', 'HR Tech Awards 2024', '2024-01-15', '2024-03-15', 'HIGH', 'EVALUATING', 'Annual HR technology awards'),
('Workplace Innovation Award', 'Future of Work Summit', '2024-02-01', '2024-04-01', 'MEDIUM', 'SUBMITTED', 'Innovation in workplace technology'),
('Employee Experience Excellence', 'EX Awards 2024', '2024-01-30', '2024-03-30', 'HIGH', 'UNDER_REVIEW', 'Employee experience and engagement'),
('HR Technology Breakthrough', 'TechCrunch Disrupt', '2024-03-01', '2024-05-01', 'CRITICAL', 'EVALUATING', 'Breakthrough technology in HR space'); 
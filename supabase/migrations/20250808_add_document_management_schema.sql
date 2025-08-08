-- Add is_public column to content table
ALTER TABLE public.content
ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;

-- Create tags table
CREATE TABLE public.tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- e.g., 'analyst', 'company', 'industry'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  UNIQUE(name, type)
);

-- Create content_tags join table
CREATE TABLE public.content_tags (
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  PRIMARY KEY (content_id, tag_id)
);

-- Add indexes for performance
CREATE INDEX idx_content_is_public ON public.content(is_public);
CREATE INDEX idx_tags_type ON public.tags(type);
CREATE INDEX idx_content_tags_content_id ON public.content_tags(content_id);
CREATE INDEX idx_content_tags_tag_id ON public.content_tags(tag_id);

-- Enable RLS for new tables
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_tags ENABLE ROW LEVEL SECURITY;

-- Grant permissions for new tables
-- For tags, anyone can read, but only admins/editors can create/update/delete
CREATE POLICY "Allow read access to all authenticated users" ON public.tags FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin/editor to manage tags" ON public.tags FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (role = 'ADMIN' OR role = 'EDITOR')
  )
);

-- For content_tags, same as tags
CREATE POLICY "Allow read access to all authenticated users" ON public.content_tags FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin/editor to manage content_tags" ON public.content_tags FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (role = 'ADMIN' OR role = 'EDITOR')
  )
);

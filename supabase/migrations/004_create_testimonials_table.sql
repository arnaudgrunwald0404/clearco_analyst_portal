-- Create testimonials table if it doesn't exist
-- This migration ensures the testimonials table exists with the correct structure

DO $$
BEGIN
  -- Check if testimonials table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'testimonials'
  ) THEN
    -- Create testimonials table
    CREATE TABLE public.testimonials (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      text TEXT NOT NULL,
      author TEXT NOT NULL,
      company TEXT,
      rating INTEGER DEFAULT 5,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
      is_published BOOLEAN DEFAULT false,
      display_order INTEGER DEFAULT 0,
      analyst_id UUID REFERENCES public.analysts(id) ON DELETE SET NULL
    );
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON public.testimonials(created_at);
    CREATE INDEX IF NOT EXISTS idx_testimonials_display_order ON public.testimonials(display_order);
    CREATE INDEX IF NOT EXISTS idx_testimonials_analyst_id ON public.testimonials(analyst_id);
    
    -- Enable RLS
    ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies
    CREATE POLICY "Authenticated users can view testimonials" ON public.testimonials
      FOR SELECT USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Authenticated users can insert testimonials" ON public.testimonials
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
    CREATE POLICY "Authenticated users can update testimonials" ON public.testimonials
      FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
    
    CREATE POLICY "Authenticated users can delete testimonials" ON public.testimonials
      FOR DELETE USING (auth.role() = 'authenticated');
    
    RAISE NOTICE 'Testimonials table created successfully with RLS policies';
  ELSE
    RAISE NOTICE 'Testimonials table already exists';
  END IF;
END $$;

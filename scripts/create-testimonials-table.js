require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function createTestimonialsTable() {
  console.log('🔧 Creating testimonials table...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
    console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey)
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Check if table exists
    const { data: existingTable, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'testimonials')
      .single()
    
    if (existingTable) {
      console.log('✅ Testimonials table already exists')
      return
    }
    
    // Create the table using raw SQL
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
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
        
        CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON public.testimonials(created_at);
        CREATE INDEX IF NOT EXISTS idx_testimonials_display_order ON public.testimonials(display_order);
        CREATE INDEX IF NOT EXISTS idx_testimonials_analyst_id ON public.testimonials(analyst_id);
        
        ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Authenticated users can view testimonials" ON public.testimonials
          FOR SELECT USING (auth.role() = 'authenticated');
        
        CREATE POLICY "Authenticated users can insert testimonials" ON public.testimonials
          FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        
        CREATE POLICY "Authenticated users can update testimonials" ON public.testimonials
          FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
        
        CREATE POLICY "Authenticated users can delete testimonials" ON public.testimonials
          FOR DELETE USING (auth.role() = 'authenticated');
      `
    })
    
    if (createError) {
      console.error('❌ Error creating table:', createError)
      
      // Try alternative approach - create table directly
      const { error: directError } = await supabase
        .from('testimonials')
        .select('id')
        .limit(1)
      
      if (directError && directError.message.includes('does not exist')) {
        console.log('🔄 Table does not exist, trying to create it...')
        // The table doesn't exist, we need to create it manually
        console.log('⚠️  Please create the testimonials table manually in your Supabase dashboard with the following SQL:')
        console.log(`
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
          
          CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON public.testimonials(created_at);
          CREATE INDEX IF NOT EXISTS idx_testimonials_display_order ON public.testimonials(display_order);
          CREATE INDEX IF NOT EXISTS idx_testimonials_analyst_id ON public.testimonials(analyst_id);
          
          ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Authenticated users can view testimonials" ON public.testimonials
            FOR SELECT USING (auth.role() = 'authenticated');
          
          CREATE POLICY "Authenticated users can insert testimonials" ON public.testimonials
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');
          
          CREATE POLICY "Authenticated users can update testimonials" ON public.testimonials
            FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
          
          CREATE POLICY "Authenticated users can delete testimonials" ON public.testimonials
            FOR DELETE USING (auth.role() = 'authenticated');
        `)
      } else {
        console.log('✅ Table exists and is accessible')
      }
    } else {
      console.log('✅ Testimonials table created successfully')
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

if (require.main === module) {
  createTestimonialsTable()
    .then(() => {
      console.log('🏁 Script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Script failed:', error)
      process.exit(1)
    })
}

module.exports = { createTestimonialsTable }

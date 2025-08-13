require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function fixTestimonialsTable() {
  console.log('🔧 Checking testimonials table structure...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // First, let's try to insert a test record to see what columns exist
    console.log('🔍 Testing table structure...')
    
    const testData = {
      text: 'Test testimonial',
      author: 'Test Author',
      company: 'Test Company',
      rating: 5,
      is_published: false
    }
    
    const { data, error } = await supabase
      .from('testimonials')
      .insert(testData)
      .select('*')
      .single()
    
    if (error) {
      console.error('❌ Error inserting test data:', error.message)
      
      // Check if it's a missing column error
      if (error.message.includes('author')) {
        console.log('🔄 Adding missing author column...')
        
        // Try to add the author column
        const { error: alterError } = await supabase.rpc('exec_sql', {
          sql: 'ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS author TEXT;'
        })
        
        if (alterError) {
          console.error('❌ Error adding author column:', alterError)
          console.log('⚠️  Please manually add the author column in your Supabase dashboard:')
          console.log('ALTER TABLE public.testimonials ADD COLUMN author TEXT;')
        } else {
          console.log('✅ Author column added successfully')
        }
      }
      
      if (error.message.includes('company')) {
        console.log('🔄 Adding missing company column...')
        const { error: alterError } = await supabase.rpc('exec_sql', {
          sql: 'ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS company TEXT;'
        })
        
        if (alterError) {
          console.error('❌ Error adding company column:', alterError)
          console.log('⚠️  Please manually add the company column in your Supabase dashboard:')
          console.log('ALTER TABLE public.testimonials ADD COLUMN company TEXT;')
        } else {
          console.log('✅ Company column added successfully')
        }
      }
      
      if (error.message.includes('rating')) {
        console.log('🔄 Adding missing rating column...')
        const { error: alterError } = await supabase.rpc('exec_sql', {
          sql: 'ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 5;'
        })
        
        if (alterError) {
          console.error('❌ Error adding rating column:', alterError)
          console.log('⚠️  Please manually add the rating column in your Supabase dashboard:')
          console.log('ALTER TABLE public.testimonials ADD COLUMN rating INTEGER DEFAULT 5;')
        } else {
          console.log('✅ Rating column added successfully')
        }
      }
      
      if (error.message.includes('is_published')) {
        console.log('🔄 Adding missing is_published column...')
        const { error: alterError } = await supabase.rpc('exec_sql', {
          sql: 'ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;'
        })
        
        if (alterError) {
          console.error('❌ Error adding is_published column:', alterError)
          console.log('⚠️  Please manually add the is_published column in your Supabase dashboard:')
          console.log('ALTER TABLE public.testimonials ADD COLUMN is_published BOOLEAN DEFAULT false;')
        } else {
          console.log('✅ is_published column added successfully')
        }
      }
      
      // Try again after adding columns
      console.log('🔄 Retrying insert after column fixes...')
      const { data: retryData, error: retryError } = await supabase
        .from('testimonials')
        .insert(testData)
        .select('*')
        .single()
      
      if (retryError) {
        console.error('❌ Still getting error after fixes:', retryError)
        console.log('⚠️  Please manually create the testimonials table in your Supabase dashboard with this SQL:')
        console.log(`
          DROP TABLE IF EXISTS public.testimonials;
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
        console.log('✅ Test insert successful after fixes:', retryData)
        
        // Clean up test data
        await supabase
          .from('testimonials')
          .delete()
          .eq('id', retryData.id)
        
        console.log('✅ Testimonials table is now working correctly')
      }
      
    } else {
      console.log('✅ Testimonials table structure is correct')
      console.log('📊 Test data inserted:', data)
      
      // Clean up test data
      await supabase
        .from('testimonials')
        .delete()
        .eq('id', data.id)
      
      console.log('✅ Test data cleaned up')
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

if (require.main === module) {
  fixTestimonialsTable()
    .then(() => {
      console.log('🏁 Script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Script failed:', error)
      process.exit(1)
    })
}

module.exports = { fixTestimonialsTable }

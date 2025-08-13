require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function fixTestimonialsComplete() {
  console.log('🔧 Comprehensive testimonials table fix...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    console.log('⚠️  The testimonials table has structural issues that need to be fixed manually.')
    console.log('')
    console.log('📋 Please run the following SQL in your Supabase SQL Editor:')
    console.log('')
    console.log('```sql')
    console.log('-- Drop the existing testimonials table if it exists')
    console.log('DROP TABLE IF EXISTS public.testimonials CASCADE;')
    console.log('')
    console.log('-- Create the testimonials table with the correct structure')
    console.log('CREATE TABLE public.testimonials (')
    console.log('  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,')
    console.log('  text TEXT NOT NULL,')
    console.log('  author TEXT NOT NULL,')
    console.log('  company TEXT,')
    console.log('  rating INTEGER DEFAULT 5,')
    console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(\'utc\'::TEXT, NOW()) NOT NULL,')
    console.log('  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(\'utc\'::TEXT, NOW()) NOT NULL,')
    console.log('  is_published BOOLEAN DEFAULT false,')
    console.log('  display_order INTEGER DEFAULT 0,')
    console.log('  analyst_id UUID REFERENCES public.analysts(id) ON DELETE SET NULL')
    console.log(');')
    console.log('')
    console.log('-- Create indexes')
    console.log('CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON public.testimonials(created_at);')
    console.log('CREATE INDEX IF NOT EXISTS idx_testimonials_display_order ON public.testimonials(display_order);')
    console.log('CREATE INDEX IF NOT EXISTS idx_testimonials_analyst_id ON public.testimonials(analyst_id);')
    console.log('')
    console.log('-- Enable Row Level Security')
    console.log('ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;')
    console.log('')
    console.log('-- Create RLS policies')
    console.log('CREATE POLICY "Authenticated users can view testimonials" ON public.testimonials')
    console.log('  FOR SELECT USING (auth.role() = \'authenticated\');')
    console.log('')
    console.log('CREATE POLICY "Authenticated users can insert testimonials" ON public.testimonials')
    console.log('  FOR INSERT WITH CHECK (auth.role() = \'authenticated\');')
    console.log('')
    console.log('CREATE POLICY "Authenticated users can update testimonials" ON public.testimonials')
    console.log('  FOR UPDATE USING (auth.role() = \'authenticated\') WITH CHECK (auth.role() = \'authenticated\');')
    console.log('')
    console.log('CREATE POLICY "Authenticated users can delete testimonials" ON public.testimonials')
    console.log('  FOR DELETE USING (auth.role() = \'authenticated\');')
    console.log('```')
    console.log('')
    console.log('🔗 Go to: https://supabase.com/dashboard/project/[YOUR-PROJECT-ID]/sql/new')
    console.log('')
    console.log('📝 After running the SQL, test the API again.')
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

if (require.main === module) {
  fixTestimonialsComplete()
    .then(() => {
      console.log('🏁 Script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Script failed:', error)
      process.exit(1)
    })
}

module.exports = { fixTestimonialsComplete }

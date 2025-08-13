require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function quickTestimonialCheck() {
  console.log('🔍 Quick testimonial table check...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Test simple insert
    console.log('🧪 Testing testimonial insert...')
    const { data, error } = await supabase
      .from('testimonials')
      .insert({
        text: 'Quick test',
        author: 'Test User',
        company: 'Test Co',
        rating: 5
      })
      .select('*')
      .single()
    
    if (error) {
      console.error('❌ Insert failed:', error.message)
      console.log('')
      console.log('🔧 You need to fix the testimonials table in Supabase:')
      console.log('1. Go to https://supabase.com/dashboard')
      console.log('2. Select your project')
      console.log('3. Go to SQL Editor')
      console.log('4. Run the SQL I provided earlier')
    } else {
      console.log('✅ Insert successful:', data)
      
      // Clean up
      await supabase.from('testimonials').delete().eq('id', data.id)
      console.log('✅ Test data cleaned up')
      console.log('')
      console.log('🎉 Testimonials table is working correctly!')
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message)
  }
}

quickTestimonialCheck()

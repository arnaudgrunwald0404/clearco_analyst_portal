require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function testTestimonialsAPI() {
  console.log('🧪 Testing testimonials API...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // First, check what's in the database
    console.log('🔍 Checking database directly...')
    const { data: dbTestimonials, error: dbError } = await supabase
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (dbError) {
      console.error('❌ Database error:', dbError)
      return
    }
    
    console.log(`📊 Database has ${dbTestimonials.length} testimonials:`)
    dbTestimonials.forEach((t, i) => {
      console.log(`  ${i + 1}. "${t.text.substring(0, 50)}..." by ${t.author} (${t.is_published ? 'published' : 'draft'})`)
    })
    
    // Now test the API
    console.log('\n🌐 Testing API endpoints...')
    
    // Test published only
    console.log('📝 Testing /api/testimonials (published only)...')
    try {
      const publishedResponse = await fetch('http://localhost:3000/api/testimonials')
      const publishedData = await publishedResponse.json()
      console.log('✅ Published API response:', publishedData)
    } catch (apiError) {
      console.error('❌ Published API error:', apiError.message)
    }
    
    // Test all testimonials
    console.log('📝 Testing /api/testimonials?all=true (all testimonials)...')
    try {
      const allResponse = await fetch('http://localhost:3000/api/testimonials?all=true')
      const allData = await allResponse.json()
      console.log('✅ All testimonials API response:', allData)
    } catch (apiError) {
      console.error('❌ All testimonials API error:', apiError.message)
    }
    
    // Create a test testimonial if none exist
    if (dbTestimonials.length === 0) {
      console.log('\n📝 Creating a test testimonial...')
      const { data: newTestimonial, error: insertError } = await supabase
        .from('testimonials')
        .insert({
          text: 'This is a test testimonial to verify the API is working correctly.',
          author: 'Test User',
          company: 'Test Company',
          rating: 5,
          is_published: true,
          display_order: 1
        })
        .select('*')
        .single()
      
      if (insertError) {
        console.error('❌ Error creating test testimonial:', insertError)
      } else {
        console.log('✅ Created test testimonial:', newTestimonial)
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

if (require.main === module) {
  testTestimonialsAPI()
    .then(() => {
      console.log('🏁 Test completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Test failed:', error)
      process.exit(1)
    })
}

module.exports = { testTestimonialsAPI }

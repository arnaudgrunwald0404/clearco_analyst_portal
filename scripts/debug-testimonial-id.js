require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function debugTestimonialId() {
  console.log('🔍 Debugging testimonial ID issue...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Get the specific testimonial ID from the API
    console.log('🌐 Getting testimonial ID from API...')
    const apiResponse = await fetch('http://localhost:3000/api/testimonials?all=true')
    const apiData = await apiResponse.json()
    
    if (!apiData.success) {
      console.error('❌ API error:', apiData.error)
      return
    }
    
    const testimonialId = apiData.data[0].id
    console.log(`📝 API testimonial ID: ${testimonialId}`)
    console.log(`📝 API testimonial ID type: ${typeof testimonialId}`)
    console.log(`📝 API testimonial ID length: ${testimonialId.length}`)
    
    // Now try to find this exact ID in the database
    console.log('\n🔍 Searching database for this ID...')
    const { data: dbTestimonial, error: dbError } = await supabase
      .from('testimonials')
      .select('*')
      .eq('id', testimonialId)
      .single()
    
    if (dbError) {
      console.error('❌ Database error:', dbError)
      
      // Try to find any testimonials to see the ID format
      console.log('\n🔍 Checking all testimonials in database...')
      const { data: allTestimonials, error: allError } = await supabase
        .from('testimonials')
        .select('id, text, author')
        .limit(3)
      
      if (allError) {
        console.error('❌ Error fetching all testimonials:', allError)
      } else {
        console.log('📊 Database testimonials:')
        allTestimonials.forEach((t, i) => {
          console.log(`  ${i + 1}. ID: ${t.id} (type: ${typeof t.id}, length: ${t.id.length})`)
          console.log(`     Text: "${t.text.substring(0, 50)}..."`)
          console.log(`     Author: ${t.author}`)
        })
      }
    } else {
      console.log('✅ Found testimonial in database:', dbTestimonial)
    }
    
    // Try a different approach - search by text content
    console.log('\n🔍 Searching by text content...')
    const searchText = apiData.data[0].quote.substring(0, 30)
    const { data: searchResults, error: searchError } = await supabase
      .from('testimonials')
      .select('id, text, author')
      .ilike('text', `%${searchText}%`)
    
    if (searchError) {
      console.error('❌ Search error:', searchError)
    } else {
      console.log(`📊 Found ${searchResults.length} testimonials matching text:`, searchText)
      searchResults.forEach((t, i) => {
        console.log(`  ${i + 1}. ID: ${t.id} (type: ${typeof t.id}, length: ${t.id.length})`)
        console.log(`     Text: "${t.text.substring(0, 50)}..."`)
        console.log(`     Author: ${t.author}`)
      })
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

if (require.main === module) {
  debugTestimonialId()
    .then(() => {
      console.log('🏁 Debug completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Debug failed:', error)
      process.exit(1)
    })
}

module.exports = { debugTestimonialId }

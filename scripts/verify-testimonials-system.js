require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function verifyTestimonialsSystem() {
  console.log('🔍 Verifying testimonials system...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Test database query with analyst join
    console.log('📊 Testing database query with analyst join...')
    const { data: testimonials, error: dbError } = await supabase
      .from('testimonials')
      .select(`
        id, 
        text, 
        author, 
        company, 
        rating, 
        created_at, 
        is_published, 
        display_order,
        analyst_id,
        analysts!testimonials_analyst_id_fkey (
          id,
          firstName,
          lastName,
          company,
          title,
          profileImageUrl
        )
      `)
      .eq('is_published', true)
      .order('display_order', { ascending: true })
    
    if (dbError) {
      console.error('❌ Database error:', dbError)
      return
    }
    
    console.log(`✅ Found ${testimonials.length} published testimonials`)
    
    // Show each testimonial with analyst info
    testimonials.forEach((testimonial, i) => {
      const analyst = testimonial.analysts || {}
      console.log(`\n${i + 1}. "${testimonial.text.substring(0, 60)}..."`)
      console.log(`   Author: ${testimonial.author}`)
      console.log(`   Analyst: ${analyst.firstName} ${analyst.lastName} (${analyst.company || 'No company'})`)
      console.log(`   Analyst ID: ${analyst.id || 'Not linked'}`)
      console.log(`   Profile Image: ${analyst.profileImageUrl ? '✅ Available' : '❌ Not available'}`)
    })
    
    // Test API endpoint
    console.log('\n🌐 Testing API endpoint...')
    try {
      const response = await fetch('http://localhost:3000/api/testimonials')
      const apiData = await response.json()
      
      if (apiData.success) {
        console.log(`✅ API returned ${apiData.data.length} testimonials`)
        
        // Check if analyst data is properly formatted
        const hasAnalystData = apiData.data.every(t => t.analyst && t.analyst.id)
        console.log(`✅ Analyst data properly formatted: ${hasAnalystData ? 'Yes' : 'No'}`)
        
        // Check if profile images are available
        const withProfileImages = apiData.data.filter(t => t.analyst.profileImageUrl).length
        console.log(`✅ Testimonials with profile images: ${withProfileImages}/${apiData.data.length}`)
        
      } else {
        console.error('❌ API error:', apiData.error)
      }
    } catch (apiError) {
      console.error('❌ API test failed:', apiError.message)
    }
    
    // Summary
    console.log('\n📋 Summary:')
    console.log(`• Total testimonials: ${testimonials.length}`)
    console.log(`• Linked to analysts: ${testimonials.filter(t => t.analyst_id).length}`)
    console.log(`• With profile images: ${testimonials.filter(t => t.analysts?.profileImageUrl).length}`)
    console.log(`• Published: ${testimonials.filter(t => t.is_published).length}`)
    
    console.log('\n🎉 Testimonials system verification complete!')
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

if (require.main === module) {
  verifyTestimonialsSystem()
    .then(() => {
      console.log('🏁 Verification completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Verification failed:', error)
      process.exit(1)
    })
}

module.exports = { verifyTestimonialsSystem }

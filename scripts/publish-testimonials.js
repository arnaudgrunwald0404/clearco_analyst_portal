require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function publishTestimonials() {
  console.log('📝 Publishing testimonials...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // First, let's see what testimonials exist
    console.log('🔍 Checking existing testimonials...')
    const { data: existingTestimonials, error: fetchError } = await supabase
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (fetchError) {
      console.error('❌ Error fetching testimonials:', fetchError)
      return
    }
    
    console.log(`📊 Found ${existingTestimonials.length} testimonials`)
    
    if (existingTestimonials.length === 0) {
      console.log('📝 No testimonials found. Creating some sample testimonials...')
      
      // Create some sample testimonials
      const sampleTestimonials = [
        {
          text: 'The analyst portal has been incredibly helpful for our research needs. The insights provided are always timely and relevant.',
          author: 'Sarah Johnson',
          company: 'TechCorp',
          rating: 5,
          is_published: true,
          display_order: 1
        },
        {
          text: 'Working with this platform has streamlined our analyst engagement process significantly. Highly recommended!',
          author: 'Michael Chen',
          company: 'InnovateLabs',
          rating: 5,
          is_published: true,
          display_order: 2
        },
        {
          text: 'The quality of insights and the ease of access to expert analysts has made a real difference in our strategic planning.',
          author: 'Emily Rodriguez',
          company: 'FutureTech',
          rating: 4,
          is_published: true,
          display_order: 3
        }
      ]
      
      const { data: newTestimonials, error: insertError } = await supabase
        .from('testimonials')
        .insert(sampleTestimonials)
        .select('*')
      
      if (insertError) {
        console.error('❌ Error creating sample testimonials:', insertError)
        return
      }
      
      console.log('✅ Created sample testimonials:', newTestimonials.length)
      existingTestimonials.push(...newTestimonials)
    }
    
    // Now publish all unpublished testimonials
    console.log('📝 Publishing unpublished testimonials...')
    const { data: publishedTestimonials, error: updateError } = await supabase
      .from('testimonials')
      .update({ is_published: true })
      .eq('is_published', false)
      .select('*')
    
    if (updateError) {
      console.error('❌ Error publishing testimonials:', updateError)
      return
    }
    
    console.log(`✅ Published ${publishedTestimonials.length} testimonials`)
    
    // Show final count
    const { data: finalCount, error: countError } = await supabase
      .from('testimonials')
      .select('id', { count: 'exact' })
      .eq('is_published', true)
    
    if (countError) {
      console.error('❌ Error getting final count:', countError)
    } else {
      console.log(`📊 Total published testimonials: ${finalCount.length}`)
    }
    
    console.log('🎉 Testimonials are now published and should appear on the testimonials page!')
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

if (require.main === module) {
  publishTestimonials()
    .then(() => {
      console.log('🏁 Script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Script failed:', error)
      process.exit(1)
    })
}

module.exports = { publishTestimonials }

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function createSampleTestimonials() {
  console.log('📝 Creating sample testimonials...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Create sample testimonials
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
      },
      {
        text: 'This platform has transformed how we interact with industry experts. The insights are invaluable.',
        author: 'David Kim',
        company: 'Strategic Solutions',
        rating: 5,
        is_published: true,
        display_order: 4
      },
      {
        text: 'The analyst portal provides exceptional value. The quality and depth of insights are outstanding.',
        author: 'Lisa Thompson',
        company: 'Global Innovations',
        rating: 5,
        is_published: true,
        display_order: 5
      }
    ]
    
    console.log('📝 Inserting sample testimonials...')
    const { data: newTestimonials, error: insertError } = await supabase
      .from('testimonials')
      .insert(sampleTestimonials)
      .select('*')
    
    if (insertError) {
      console.error('❌ Error creating sample testimonials:', insertError)
      return
    }
    
    console.log(`✅ Created ${newTestimonials.length} sample testimonials`)
    
    // Show what was created
    newTestimonials.forEach((testimonial, i) => {
      console.log(`  ${i + 1}. "${testimonial.text.substring(0, 60)}..." by ${testimonial.author} (${testimonial.company})`)
    })
    
    // Check total count
    const { data: totalCount, error: countError } = await supabase
      .from('testimonials')
      .select('id', { count: 'exact' })
      .eq('is_published', true)
    
    if (countError) {
      console.error('❌ Error getting total count:', countError)
    } else {
      console.log(`📊 Total published testimonials: ${totalCount.length}`)
    }
    
    console.log('🎉 Sample testimonials created! They should now appear on the testimonials page.')
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

if (require.main === module) {
  createSampleTestimonials()
    .then(() => {
      console.log('🏁 Script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Script failed:', error)
      process.exit(1)
    })
}

module.exports = { createSampleTestimonials }

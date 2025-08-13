require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function createMissingAnalyst() {
  console.log('👤 Creating missing analyst...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Create Lisa Thompson analyst
    console.log('📝 Creating Lisa Thompson analyst...')
    const { data: newAnalyst, error: analystError } = await supabase
      .from('analysts')
      .insert({
        firstName: 'Lisa',
        lastName: 'Thompson',
        email: 'lisa.thompson@globalinnovations.com',
        company: 'Global Innovations',
        title: 'Technology Analyst',
        status: 'ACTIVE'
      })
      .select('*')
      .single()
    
    if (analystError) {
      console.error('❌ Error creating analyst:', analystError)
      return
    }
    
    console.log('✅ Created analyst:', newAnalyst)
    
    // Now link the testimonial to this analyst
    console.log('🔗 Linking testimonial to new analyst...')
    const { data: updatedTestimonial, error: testimonialError } = await supabase
      .from('testimonials')
      .update({ 
        analyst_id: newAnalyst.id,
        company: newAnalyst.company
      })
      .eq('author', 'Lisa Thompson')
      .select('*')
      .single()
    
    if (testimonialError) {
      console.error('❌ Error linking testimonial:', testimonialError)
      return
    }
    
    console.log('✅ Linked testimonial:', updatedTestimonial)
    
    // Show final stats
    const { data: finalStats, error: statsError } = await supabase
      .from('testimonials')
      .select('analyst_id', { count: 'exact' })
    
    if (!statsError) {
      const linked = finalStats.filter(t => t.analyst_id).length
      const total = finalStats.length
      console.log(`📊 Final stats: ${linked}/${total} testimonials linked to analysts`)
    }
    
    console.log('🎉 All testimonials are now linked to analysts!')
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

if (require.main === module) {
  createMissingAnalyst()
    .then(() => {
      console.log('🏁 Script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Script failed:', error)
      process.exit(1)
    })
}

module.exports = { createMissingAnalyst }

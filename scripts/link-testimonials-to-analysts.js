require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function linkTestimonialsToAnalysts() {
  console.log('🔗 Linking testimonials to analysts...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // First, get all analysts
    console.log('👥 Fetching analysts...')
    const { data: analysts, error: analystsError } = await supabase
      .from('analysts')
      .select('id, firstName, lastName, company')
      .eq('status', 'ACTIVE')
      .order('firstName', { ascending: true })
    
    if (analystsError) {
      console.error('❌ Error fetching analysts:', analystsError)
      return
    }
    
    console.log(`📊 Found ${analysts.length} active analysts`)
    analysts.forEach((analyst, i) => {
      console.log(`  ${i + 1}. ${analyst.firstName} ${analyst.lastName} (${analyst.company || 'No company'})`)
    })
    
    // Get all testimonials that don't have analyst_id
    console.log('\n📝 Fetching testimonials without analyst links...')
    const { data: testimonials, error: testimonialsError } = await supabase
      .from('testimonials')
      .select('*')
      .is('analyst_id', null)
      .order('created_at', { ascending: false })
    
    if (testimonialsError) {
      console.error('❌ Error fetching testimonials:', testimonialsError)
      return
    }
    
    console.log(`📊 Found ${testimonials.length} testimonials without analyst links`)
    
    if (testimonials.length === 0) {
      console.log('✅ All testimonials are already linked to analysts!')
      return
    }
    
    // Link testimonials to analysts based on author name
    console.log('\n🔗 Linking testimonials to analysts...')
    let linkedCount = 0
    
    for (const testimonial of testimonials) {
      // Try to find a matching analyst by name
      const authorName = testimonial.author.toLowerCase()
      let matchedAnalyst = null
      
      for (const analyst of analysts) {
        const analystName = `${analyst.firstName} ${analyst.lastName}`.toLowerCase()
        if (authorName.includes(analyst.firstName.toLowerCase()) || 
            authorName.includes(analyst.lastName.toLowerCase()) ||
            analystName.includes(authorName)) {
          matchedAnalyst = analyst
          break
        }
      }
      
      if (matchedAnalyst) {
        console.log(`✅ Linking "${testimonial.text.substring(0, 50)}..." to ${matchedAnalyst.firstName} ${matchedAnalyst.lastName}`)
        
        const { error: updateError } = await supabase
          .from('testimonials')
          .update({ 
            analyst_id: matchedAnalyst.id,
            company: matchedAnalyst.company || testimonial.company // Update company from analyst
          })
          .eq('id', testimonial.id)
        
        if (updateError) {
          console.error(`❌ Error linking testimonial ${testimonial.id}:`, updateError)
        } else {
          linkedCount++
        }
      } else {
        console.log(`⚠️  No analyst match found for "${testimonial.author}"`)
      }
    }
    
    console.log(`\n🎉 Successfully linked ${linkedCount} out of ${testimonials.length} testimonials`)
    
    // Show final stats
    const { data: finalStats, error: statsError } = await supabase
      .from('testimonials')
      .select('analyst_id', { count: 'exact' })
    
    if (!statsError) {
      const linked = finalStats.filter(t => t.analyst_id).length
      const total = finalStats.length
      console.log(`📊 Final stats: ${linked}/${total} testimonials linked to analysts`)
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

if (require.main === module) {
  linkTestimonialsToAnalysts()
    .then(() => {
      console.log('🏁 Script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Script failed:', error)
      process.exit(1)
    })
}

module.exports = { linkTestimonialsToAnalysts }

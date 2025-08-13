require('dotenv').config({ path: '.env.local' })

async function testTestimonialToggle() {
  console.log('🧪 Testing testimonial toggle functionality...')
  
  try {
    // First, get a list of testimonials
    console.log('📝 Fetching testimonials...')
    const response = await fetch('http://localhost:3000/api/testimonials?all=true')
    const data = await response.json()
    
    if (!data.success) {
      console.error('❌ Failed to fetch testimonials:', data.error)
      return
    }
    
    console.log(`✅ Found ${data.data.length} testimonials`)
    
    if (data.data.length === 0) {
      console.log('⚠️  No testimonials to test with')
      return
    }
    
    // Get the first testimonial
    const testimonial = data.data[0]
    console.log(`\n📝 Testing with testimonial: "${testimonial.quote.substring(0, 50)}..."`)
    console.log(`   Current status: ${testimonial.isPublished ? 'Published' : 'Draft'}`)
    
    // Test toggling the status
    const newStatus = !testimonial.isPublished
    const action = newStatus ? 'publish' : 'unpublish'
    
    console.log(`🔄 Attempting to ${action} testimonial...`)
    
    const toggleResponse = await fetch(`http://localhost:3000/api/testimonials/${testimonial.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        isPublished: newStatus
      })
    })
    
    const toggleData = await toggleResponse.json()
    
    if (toggleResponse.ok && toggleData.success) {
      console.log(`✅ Successfully ${action}ed testimonial!`)
      
      // Verify the change by fetching again
      console.log('🔄 Verifying the change...')
      const verifyResponse = await fetch('http://localhost:3000/api/testimonials?all=true')
      const verifyData = await verifyResponse.json()
      
      if (verifyData.success) {
        const updatedTestimonial = verifyData.data.find(t => t.id === testimonial.id)
        if (updatedTestimonial) {
          console.log(`✅ Verification successful! New status: ${updatedTestimonial.isPublished ? 'Published' : 'Draft'}`)
          
          // Toggle back to original state
          console.log(`🔄 Toggling back to original state...`)
          const revertResponse = await fetch(`http://localhost:3000/api/testimonials/${testimonial.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              isPublished: testimonial.isPublished
            })
          })
          
          if (revertResponse.ok) {
            console.log('✅ Successfully reverted to original state!')
          } else {
            console.log('⚠️  Failed to revert to original state')
          }
        }
      }
    } else {
      console.error('❌ Failed to toggle testimonial:', toggleData.error)
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message)
  }
}

if (require.main === module) {
  testTestimonialToggle()
    .then(() => {
      console.log('🏁 Test completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Test failed:', error)
      process.exit(1)
    })
}

module.exports = { testTestimonialToggle }

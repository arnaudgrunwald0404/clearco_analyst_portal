// Simple test script for testimonial API
const testTestimonialAPI = async () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  console.log('🧪 Testing Testimonial API...')
  
  const testData = {
    text: 'This is a test testimonial from the API test script.',
    author: 'Test Author',
    company: 'Test Company',
    rating: 5,
    date: new Date().toISOString()
  }
  
  try {
    console.log('📤 Sending test data:', testData)
    
    const response = await fetch(`${baseUrl}/api/testimonials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    })
    
    console.log('📥 Response status:', response.status)
    
    const data = await response.json()
    console.log('📥 Response data:', data)
    
    if (response.ok && data.success) {
      console.log('✅ Testimonial API test PASSED')
      return true
    } else {
      console.log('❌ Testimonial API test FAILED:', data.error)
      return false
    }
  } catch (error) {
    console.error('💥 Testimonial API test ERROR:', error)
    return false
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testTestimonialAPI()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('💥 Test failed with error:', error)
      process.exit(1)
    })
}

module.exports = { testTestimonialAPI }

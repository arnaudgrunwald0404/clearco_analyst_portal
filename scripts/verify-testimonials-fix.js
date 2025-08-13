require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function verifyTestimonialsFix() {
  console.log('✅ Verifying testimonials table fix...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    console.log('🧪 Testing testimonials table functionality...')
    
    // Test 1: Insert a testimonial
    console.log('📝 Test 1: Inserting testimonial...')
    const testData = {
      text: 'This is a test testimonial to verify the fix works.',
      author: 'Test Author',
      company: 'Test Company',
      rating: 5,
      is_published: false
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('testimonials')
      .insert(testData)
      .select('*')
      .single()
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError.message)
      return false
    }
    
    console.log('✅ Insert successful:', insertData)
    
    // Test 2: Read the testimonial
    console.log('📖 Test 2: Reading testimonial...')
    const { data: readData, error: readError } = await supabase
      .from('testimonials')
      .select('*')
      .eq('id', insertData.id)
      .single()
    
    if (readError) {
      console.error('❌ Read failed:', readError.message)
      return false
    }
    
    console.log('✅ Read successful:', readData)
    
    // Test 3: Update the testimonial
    console.log('✏️  Test 3: Updating testimonial...')
    const { data: updateData, error: updateError } = await supabase
      .from('testimonials')
      .update({ rating: 4, is_published: true })
      .eq('id', insertData.id)
      .select('*')
      .single()
    
    if (updateError) {
      console.error('❌ Update failed:', updateError.message)
      return false
    }
    
    console.log('✅ Update successful:', updateData)
    
    // Test 4: Delete the testimonial
    console.log('🗑️  Test 4: Deleting testimonial...')
    const { error: deleteError } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', insertData.id)
    
    if (deleteError) {
      console.error('❌ Delete failed:', deleteError.message)
      return false
    }
    
    console.log('✅ Delete successful')
    
    // Test 5: Test the API endpoint
    console.log('🌐 Test 5: Testing API endpoint...')
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    try {
      const response = await fetch(`${baseUrl}/api/testimonials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'API test testimonial',
          author: 'API Test Author',
          company: 'API Test Company',
          rating: 5,
          date: new Date().toISOString()
        })
      })
      
      const apiData = await response.json()
      
      if (response.ok && apiData.success) {
        console.log('✅ API test successful:', apiData)
        
        // Clean up API test data
        if (apiData.data?.id) {
          await supabase
            .from('testimonials')
            .delete()
            .eq('id', apiData.data.id)
          console.log('✅ API test data cleaned up')
        }
      } else {
        console.error('❌ API test failed:', apiData)
        return false
      }
    } catch (apiError) {
      console.error('❌ API test error:', apiError.message)
      return false
    }
    
    console.log('🎉 All tests passed! The testimonials table is working correctly.')
    return true
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
    return false
  }
}

if (require.main === module) {
  verifyTestimonialsFix()
    .then((success) => {
      if (success) {
        console.log('🏁 Verification completed successfully')
        process.exit(0)
      } else {
        console.log('🏁 Verification failed')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('💥 Verification failed with error:', error)
      process.exit(1)
    })
}

module.exports = { verifyTestimonialsFix }

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function testMinimalInsert() {
  console.log('🧪 Testing minimal insert to check table structure...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Try with just text first
    console.log('🔍 Trying insert with just text...')
    const { data: textData, error: textError } = await supabase
      .from('testimonials')
      .insert({ text: 'Test testimonial' })
      .select('*')
      .single()
    
    if (textError) {
      console.error('❌ Error with text only:', textError.message)
    } else {
      console.log('✅ Text only insert successful:', textData)
      // Clean up
      await supabase.from('testimonials').delete().eq('id', textData.id)
    }
    
    // Try with text and author
    console.log('🔍 Trying insert with text and author...')
    const { data: authorData, error: authorError } = await supabase
      .from('testimonials')
      .insert({ 
        text: 'Test testimonial with author',
        author: 'Test Author'
      })
      .select('*')
      .single()
    
    if (authorError) {
      console.error('❌ Error with text and author:', authorError.message)
    } else {
      console.log('✅ Text and author insert successful:', authorData)
      // Clean up
      await supabase.from('testimonials').delete().eq('id', authorData.id)
    }
    
    // Try with all fields
    console.log('🔍 Trying insert with all fields...')
    const { data: allData, error: allError } = await supabase
      .from('testimonials')
      .insert({ 
        text: 'Test testimonial with all fields',
        author: 'Test Author',
        company: 'Test Company',
        rating: 5,
        is_published: false
      })
      .select('*')
      .single()
    
    if (allError) {
      console.error('❌ Error with all fields:', allError.message)
    } else {
      console.log('✅ All fields insert successful:', allData)
      // Clean up
      await supabase.from('testimonials').delete().eq('id', allData.id)
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

if (require.main === module) {
  testMinimalInsert()
    .then(() => {
      console.log('🏁 Script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Script failed:', error)
      process.exit(1)
    })
}

module.exports = { testMinimalInsert }

const { createClient } = require('@supabase/supabase-js')

// Test authentication for different email types
async function testAuthentication() {
  console.log('🧪 Testing Authentication for Different Email Types\n')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const testEmails = [
    'admin@clearcompany.com',      // Should get ADMIN role
    'sarah.chen@clearcompany.com', // Should get ANALYST role
    'mike.johnson@clearcompany.com', // Should get ANALYST role
    'lisa.wang@clearcompany.com',  // Should get ANALYST role
    'user@example.com',            // Should get EDITOR role
    'test@othercompany.com'        // Should get EDITOR role
  ]

  for (const email of testEmails) {
    console.log(`📧 Testing email: ${email}`)
    
    try {
      // Check if user exists
      const { data: existingUser, error: userError } = await supabase.auth.admin.getUserByEmail(email)
      
      if (userError && userError.message.includes('User not found')) {
        console.log(`  ❌ User not found - would need to be created`)
      } else if (existingUser) {
        console.log(`  ✅ User exists`)
        
        // Check user profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', existingUser.user.id)
          .single()
        
        if (profileError) {
          console.log(`  ❌ No profile found`)
        } else {
          console.log(`  ✅ Profile found with role: ${profile.role}`)
          
          // Verify role assignment
          const emailDomain = email.split('@')[1]?.toLowerCase()
          const emailName = email.split('@')[0]?.toLowerCase()
          
          let expectedRole = 'EDITOR'
          if (emailDomain === 'clearcompany.com') {
            if (['sarah.chen', 'mike.johnson', 'lisa.wang'].includes(emailName)) {
              expectedRole = 'ANALYST'
            } else {
              expectedRole = 'ADMIN'
            }
          }
          
          if (profile.role === expectedRole) {
            console.log(`  ✅ Role assignment correct (${profile.role})`)
          } else {
            console.log(`  ❌ Role assignment incorrect (expected: ${expectedRole}, got: ${profile.role})`)
          }
        }
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`)
    }
    
    console.log('')
  }

  console.log('🎯 Authentication Test Summary:')
  console.log('- clearcompany.com emails (except fake analysts) → ADMIN role')
  console.log('- sarah.chen@clearcompany.com → ANALYST role')
  console.log('- mike.johnson@clearcompany.com → ANALYST role')
  console.log('- lisa.wang@clearcompany.com → ANALYST role')
  console.log('- All other emails → EDITOR role')
}

// Run the test
testAuthentication().catch(console.error) 
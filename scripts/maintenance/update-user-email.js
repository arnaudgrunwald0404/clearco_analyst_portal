import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateUserEmail() {
  console.log('🔍 Updating user email from auth data...')
  
  try {
    const targetUserId = 'd129d3b9-6cb7-4e77-ac3f-f233e1e047a0'
    
    // Get the auth user data
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(targetUserId)
    
    if (authError) {
      console.error('Error fetching auth user:', authError)
      return
    }
    
    console.log('Auth user data:', {
      id: authUser.user.id,
      email: authUser.user.email,
      metadata: authUser.user.user_metadata
    })
    
    // Update the User table with the correct email
    const { error: updateError } = await supabase
      .from('User')
      .update({ 
        email: authUser.user.email,
        name: authUser.user.user_metadata?.name || authUser.user.user_metadata?.full_name || authUser.user.email?.split('@')[0] || 'User',
        updatedAt: new Date().toISOString()
      })
      .eq('id', targetUserId)
    
    if (updateError) {
      console.error('Error updating user:', updateError)
      return
    }
    
    console.log('✅ User updated successfully')
    
    // Verify the update
    const { data: updatedUser, error: verifyError } = await supabase
      .from('User')
      .select('*')
      .eq('id', targetUserId)
      .single()
    
    if (verifyError) {
      console.error('Error verifying update:', verifyError)
      return
    }
    
    console.log('Updated user data:', updatedUser)
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

updateUserEmail()

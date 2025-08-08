import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Check if the user is authenticated
 * Returns the user if authenticated, or a 401 response if not
 */
export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Authentication required', redirectTo: '/auth' },
        { status: 401 }
      )
    }
  }
  
  return { user, response: null }
}
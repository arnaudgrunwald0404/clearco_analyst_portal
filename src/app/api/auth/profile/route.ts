import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, create minimal profile for authorized domains
      const email = user.email || ''
      const domain = email.split('@')[1]?.toLowerCase()
      
      if (domain === 'clearcompany.com') {
        const minimalProfile = {
          id: user.id,
          email,
          role: 'ADMIN' as const,
          first_name: user.user_metadata?.first_name || email.split('@')[0] || 'User',
          last_name: user.user_metadata?.last_name || '',
          company: 'ClearCompany',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        return NextResponse.json({ profile: minimalProfile })
      } else {
        return NextResponse.json({ error: 'Unauthorized domain' }, { status: 403 })
      }
    }
    
    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }
    
    return NextResponse.json({ profile })
    
  } catch (error) {
    console.error('Auth profile API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

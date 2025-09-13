import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/auth-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const email = decodeURIComponent(params.email)

    // Dev impersonation mode: allow read without auth using service-role
    const allowDevBypass = process.env.NODE_ENV !== 'production' && process.env.IMPERSONATE_MODE === 'true'
    let supabase: any

    if (!allowDevBypass) {
      const authResult = await requireAuth()
      if (authResult instanceof NextResponse) {
        return authResult
      }
      const authUser = authResult

      // Authorization: Ensure the authenticated user is requesting their own data, or is an admin.
      if (authUser.email !== email) {
        const s = await createClient()
        const { data: userProfile } = await s
          .from('user_profiles')
          .select('role')
          .eq('id', authUser.id)
          .single()

        if (!userProfile || userProfile.role !== 'ADMIN') {
          return NextResponse.json({ success: false, error: 'Permission denied.' }, { status: 403 })
        }
      }
      supabase = await createClient()
    } else {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 })
      }
      supabase = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    }

    const { data: analyst, error } = await supabase
      .from('analysts')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'Analyst not found' }, { status: 404 })
      }
      throw error
    }

    // Also fetch topics
    const { data: coveredTopics } = await supabase
      .from('covered_topics')
      .select('topic')
      .eq('analystId', analyst.id)

    ;(analyst as any).topics = coveredTopics?.map((ct: any) => ct.topic) || []

    return NextResponse.json({ success: true, data: analyst })
  } catch (error) {
    console.error('Error fetching analyst by email:', error)
    const devDetails = process.env.NODE_ENV !== 'production' ? { details: (error as any)?.message || String(error) } : {}
    return NextResponse.json({ success: false, error: 'Internal server error', ...devDetails }, { status: 500 })
  }
}

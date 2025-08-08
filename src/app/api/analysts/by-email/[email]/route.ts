import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const authUser = authResult

    const email = decodeURIComponent(params.email)

    // Authorization: Ensure the authenticated user is requesting their own data, or is an admin.
    if (authUser.email !== email) {
        const supabase = createClient()
        const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', authUser.id)
            .single()

        if (!userProfile || userProfile.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Permission denied.' }, { status: 403 })
        }
    }

    const supabase = createClient()
    const { data: analyst, error } = await supabase
      .from('analysts')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'Analyst not found' }, { status: 404 })
      }
      throw error
    }

    // Also fetch topics
    const { data: coveredTopics } = await supabase
      .from('covered_topics')
      .select('topic')
      .eq('analystId', analyst.id)

    analyst.topics = coveredTopics?.map(ct => ct.topic) || []

    return NextResponse.json({ success: true, data: analyst })
  } catch (error) {
    console.error('Error fetching analyst by email:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

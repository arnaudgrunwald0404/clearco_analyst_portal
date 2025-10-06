import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireSuperAdminAuth } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    // Require SUPER_ADMIN
    const authResult = await requireSuperAdminAuth()
    if (authResult instanceof NextResponse) return authResult

    const supabase = createServiceClient()

    const body = await request.json().catch(() => ({ analystIds: [] })) as { analystIds: string[] }
    const analystIds = Array.isArray(body.analystIds) ? body.analystIds : []
    if (analystIds.length === 0) {
      return NextResponse.json({ success: false, error: 'analystIds array is required' }, { status: 400 })
    }

    // Load analysts to map to emails
    const { data: analysts, error: fetchErr } = await supabase
      .from('analysts')
      .select('id, email')
      .in('id', analystIds)
    if (fetchErr) {
      console.error('Failed to fetch analysts for access removal:', fetchErr)
      return NextResponse.json({ success: false, error: 'Failed to load analysts' }, { status: 500 })
    }

    const targetEmails = new Set((analysts || []).map(a => (a.email || '').toLowerCase()).filter(Boolean))

    // Find matching auth users by email
    const { data: listed } = await supabase.auth.admin.listUsers()
    const usersToDelete = (listed?.users || []).filter(u => targetEmails.has((u.email || '').toLowerCase()))

    // Best-effort: remove user_profiles first
    const userIds = usersToDelete.map(u => u.id)
    if (userIds.length > 0) {
      await supabase.from('user_profiles').delete().in('id', userIds)
    }

    // Delete auth users
    let deletedAuthUsers = 0
    for (const u of usersToDelete) {
      const { error } = await supabase.auth.admin.deleteUser(u.id)
      if (!error) deletedAuthUsers++
    }

    // Legacy cleanup: analyst_access rows
    await supabase.from('analyst_access').delete().in('analyst_id', analystIds)

    return NextResponse.json({
      success: true,
      message: `Removed access for ${deletedAuthUsers} user(s)`,
      counts: { requested: analystIds.length, matchedEmails: targetEmails.size, deletedAuthUsers }
    })
  } catch (error) {
    console.error('Error removing analyst access:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

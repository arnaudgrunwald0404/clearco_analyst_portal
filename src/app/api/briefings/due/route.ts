import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const tierFilter = searchParams.get('tier') || ''
    
    const offset = (page - 1) * limit
    const now = new Date()

    console.log('🔍 [Briefings Due API] Fetching analysts due for briefings...')

    const supabase = await createClient()

    // Get all influence tiers for reference
    const { data: influenceTiers, error: tiersError } = await supabase
      .from('influence_tiers')
      .select('*')
      .eq('isActive', true)
      .order('order', { ascending: true })

    if (tiersError) {
      console.error('Error fetching influence tiers:', tiersError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch influence tiers' },
        { status: 500 }
      )
    }

    // Build the base query for analysts
    let query = supabase
      .from('analysts')
      .select('*')
      .eq('status', 'ACTIVE')

    // Add search filter
    if (search) {
      query = query.or(`firstName.ilike.%${search}%,lastName.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`)
    }

    // Get ALL analysts - no pagination limits
    const { data: analysts, error: analystsError } = await query.order('firstName', { ascending: true })

    if (analystsError) {
      console.error('Error fetching analysts:', analystsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch analysts' },
        { status: 500 }
      )
    }

    // Filter and process analysts who need briefings
    const analystsDueForBriefings: any[] = []
    
    for (const analyst of analysts || []) {
      // Map influence to tier information from the database (name-insensitive)
      const name = (influenceTiers || []).map(t => ({
        key: t.name.trim().toUpperCase(),
        row: t
      }))
      const influenceKey = analyst.influence.toUpperCase()
      const wanted = influenceKey // VERY_HIGH, HIGH, MEDIUM, LOW
      const tier = (name.find(n =>
        (wanted === 'VERY_HIGH' && (n.key.includes('VERY') && n.key.includes('HIGH'))) ||
        (wanted === 'HIGH' && n.key === 'HIGH') ||
        (wanted === 'MEDIUM' && n.key === 'MEDIUM') ||
        (wanted === 'LOW' && n.key === 'LOW')
      ) || {}).row || null
      
      if (!tier) continue
      
      // Skip analysts from inactive tiers
      if (!tier.isActive) continue

      const daysBetweenBriefings = tier?.briefingFrequency ?? 0

      // Get all briefing IDs linked to this analyst
      const { data: baRows } = await supabase
        .from('briefing_analysts')
        .select('briefingId')
        .eq('analystId', analyst.id)

      const briefingIds: string[] = (baRows || []).map(r => r.briefingId)

      // Fetch last completed briefing for this analyst
      let lastCompleted: any = null
      if (briefingIds.length > 0) {
        const { data: completedRows } = await supabase
          .from('briefings')
          .select('id, title, completedAt, scheduledAt, status')
          .in('id', briefingIds)
          .eq('status', 'COMPLETED')
          .order('completedAt', { ascending: false })
          .limit(1)
        lastCompleted = (completedRows && completedRows[0]) || null
      }

      // Fetch next scheduled briefing for this analyst
      let nextScheduled: any = null
      if (briefingIds.length > 0) {
        const { data: scheduledRows } = await supabase
          .from('briefings')
          .select('id, title, scheduledAt, status')
          .in('id', briefingIds)
          .gt('scheduledAt', now.toISOString())
          .in('status', ['SCHEDULED', 'RESCHEDULED'])
          .order('scheduledAt', { ascending: true })
          .limit(1)
        nextScheduled = (scheduledRows && scheduledRows[0]) || null
      }

      // Fallback to last analyst calendar meeting if no completed briefing
      let lastMeetingDate: string | null = null
      if (lastCompleted?.completedAt) {
        lastMeetingDate = lastCompleted.completedAt
      } else {
        const { data: lastMeeting } = await supabase
          .from('calendar_meetings')
          .select('start_time, end_time')
          .eq('is_analyst_meeting', true)
          .eq('analyst_id', analyst.id)
          .lte('start_time', now.toISOString())
          .order('start_time', { ascending: false })
          .limit(1)
          .single()
        if (lastMeeting) {
          lastMeetingDate = lastMeeting.end_time || lastMeeting.start_time
        }
      }
      
      // Calculate days since last meeting/briefing
      const daysSinceLastBriefing = lastMeetingDate
        ? Math.floor((now.getTime() - new Date(lastMeetingDate).getTime()) / (1000 * 60 * 60 * 24))
        : null
      
      // Check if analyst needs a briefing based on tier frequency
      // Skip if they have a future briefing scheduled
      const needsBriefing = !nextScheduled && (!lastMeetingDate || (daysSinceLastBriefing !== null && daysSinceLastBriefing >= daysBetweenBriefings))
      
      if (needsBriefing) {
        // Calculate overdue days
        const overdueDays = daysSinceLastBriefing !== null && daysBetweenBriefings > 0 && daysSinceLastBriefing > daysBetweenBriefings
          ? (daysSinceLastBriefing - daysBetweenBriefings)
          : (daysSinceLastBriefing !== null && daysBetweenBriefings === 0 ? 0 : 0)
        
        analystsDueForBriefings.push({
          id: analyst.id,
          firstName: analyst.firstName,
          lastName: analyst.lastName,
          email: analyst.email,
          company: analyst.company,
          title: analyst.title,
          influence: analyst.influence,
          relationshipHealth: analyst.relationshipHealth || 'GOOD',
          profileImageUrl: analyst.profileImageUrl,
          tier: {
            name: tier?.name || influenceKey,
            briefingFrequency: daysBetweenBriefings
          },
          lastBriefing: lastMeetingDate ? {
            id: lastCompleted?.id || '',
            scheduledAt: lastMeetingDate
          } : null,
          nextBriefing: nextScheduled ? {
            id: nextScheduled.id,
            scheduledAt: nextScheduled.scheduledAt,
            status: nextScheduled.status
          } : null,
          daysSinceLastBriefing: daysSinceLastBriefing || 0,
          overdueDays,
          needsBriefing: true
        })
      }
    }

    // Optional backend tier filter support (TIER_1..4), map by order if present
    let filtered = analystsDueForBriefings
    if (tierFilter && tierFilter !== 'ALL') {
      const normalized = tierFilter.toUpperCase()
      filtered = analystsDueForBriefings.filter(a => {
        const name = (a.tier?.name || '').toString().toUpperCase()
        if (normalized === 'TIER_1') return name.includes('VERY') && name.includes('HIGH')
        if (normalized === 'TIER_2') return name === 'HIGH'
        if (normalized === 'TIER_3') return name === 'MEDIUM'
        if (normalized === 'TIER_4') return name === 'LOW'
        return true
      })
    }

    // Get total count of all analysts (for reference)
    const { count: totalAnalysts } = await supabase
      .from('analysts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ACTIVE')

    console.log(`📊 [Briefings Due API] Found ${analystsDueForBriefings.length} analysts due for briefings`)

    return NextResponse.json({
      success: true,
      data: filtered,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalAnalysts: totalAnalysts || 0,
        totalPages: 1
      },
      filters: {
        search,
        tier: tierFilter
      }
    })

  } catch (error) {
    console.error('❌ [Briefings Due API] Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch analysts due for briefings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

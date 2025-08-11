import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// In-memory cache for heavy computation results
let cachedDueResults: { data: any[]; updatedAt: number; counts: Record<string, number> } | null = null
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const tierFilter = searchParams.get('tier') || ''
    const force = searchParams.get('force') === 'true'
    const now = new Date()

    console.log('🔍 [Briefings Due API] Fetching analysts due for briefings...')

    const supabase = await createClient()

    // Get all influence tiers for reference (active only)
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

    // If cache is valid, skip recompute and filter from cache
    const cacheValid = !force && cachedDueResults && (Date.now() - cachedDueResults.updatedAt) < CACHE_TTL_MS

    let analystsDueForBriefings: any[]
    if (cacheValid) {
      analystsDueForBriefings = cachedDueResults!.data
    } else {
      // Get ALL analysts - no pagination limits
      const { data: analysts, error: analystsError } = await query.order('firstName', { ascending: true })

      if (analystsError) {
        console.error('Error fetching analysts:', analystsError)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch analysts' },
          { status: 500 }
        )
      }

      // Build normalized tier name lookup
      const tierLookup = (influenceTiers || []).map(t => ({ key: t.name.trim().toUpperCase(), row: t }))

      // Filter and process analysts who need briefings
      const temp: any[] = []
      
      for (const analyst of analysts || []) {
      // Map influence to tier information from the database (name-insensitive)
        const influenceKey = (analyst.influence || '').toString().toUpperCase()
        const tier = (tierLookup.find(n =>
          (influenceKey === 'VERY_HIGH' && (n.key.includes('VERY') && n.key.includes('HIGH'))) ||
          (influenceKey === 'HIGH' && n.key === 'HIGH') ||
          (influenceKey === 'MEDIUM' && n.key === 'MEDIUM') ||
          (influenceKey === 'LOW' && n.key === 'LOW')
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

      // Fetch last completed briefing for this analyst (via join table)
      let lastCompleted: any = null
      if (briefingIds.length > 0) {
        const { data: completedRows } = await supabase
          .from('briefings')
          .select('id, title, completedAt, scheduledAt, status, attendeeEmails')
          .in('id', briefingIds)
          .eq('status', 'COMPLETED')
          .order('completedAt', { ascending: false })
          .limit(1)
        lastCompleted = (completedRows && completedRows[0]) || null
      }
      // If no completed briefing via join, try matching by attendee email
      if (!lastCompleted && analyst.email) {
        // Prefer exact array contains if attendeeEmails is an array/jsonb; fallback to client-side match
        let emailMatchedCompleted: any = null
        const { data: completedByEmail, error: completedByEmailErr } = await supabase
          .from('briefings')
          .select('id, title, completedAt, scheduledAt, status, attendeeEmails')
          .eq('status', 'COMPLETED')
          .order('completedAt', { ascending: false })
          .limit(200)
        if (!completedByEmailErr) {
          // Filter client-side for safety/case-insensitive match
          emailMatchedCompleted = (completedByEmail || []).find(b => {
            const list = Array.isArray(b.attendeeEmails) ? b.attendeeEmails : []
            return list.some((e: string) => (e || '').toLowerCase() === (analyst.email || '').toLowerCase())
          }) || null
        }
        if (emailMatchedCompleted) {
          lastCompleted = emailMatchedCompleted
        }
      }

      // Fetch next scheduled briefing for this analyst
      let nextScheduled: any = null
      if (briefingIds.length > 0) {
        const { data: scheduledRows } = await supabase
          .from('briefings')
          .select('id, title, scheduledAt, status, attendeeEmails')
          .in('id', briefingIds)
          .gt('scheduledAt', now.toISOString())
          .in('status', ['SCHEDULED', 'RESCHEDULED'])
          .order('scheduledAt', { ascending: true })
          .limit(1)
        nextScheduled = (scheduledRows && scheduledRows[0]) || null
      }
      // If no upcoming via join, try matching by attendee email
      if (!nextScheduled && analyst.email) {
        const { data: nextByEmail } = await supabase
          .from('briefings')
          .select('id, title, scheduledAt, status, attendeeEmails')
          .gt('scheduledAt', now.toISOString())
          .in('status', ['SCHEDULED', 'RESCHEDULED'])
          .order('scheduledAt', { ascending: true })
          .limit(100)
        const matchedUpcoming = (nextByEmail || []).find(b => {
          const list = Array.isArray(b.attendeeEmails) ? b.attendeeEmails : []
          return list.some((e: string) => (e || '').toLowerCase() === (analyst.email || '').toLowerCase())
        }) || null
        if (matchedUpcoming) nextScheduled = matchedUpcoming
      }

      // Determine last meeting date:
      // 1) completed briefing date
      // 2) otherwise, latest past briefing linked via join (even if not marked COMPLETED)
      // 3) otherwise, latest past briefing where analyst email is in attendeeEmails
      // 4) otherwise, fallback to calendar meeting record
      let lastMeetingDate: string | null = null
      let lastBriefingId: string = ''
      if (lastCompleted?.completedAt) {
        lastMeetingDate = lastCompleted.completedAt
        lastBriefingId = lastCompleted.id
      } else {
        // Try latest past briefing via join regardless of status
        if (briefingIds.length > 0) {
          const { data: pastViaJoin } = await supabase
            .from('briefings')
            .select('id, scheduledAt, status, title')
            .in('id', briefingIds)
            .lte('scheduledAt', now.toISOString())
            .order('scheduledAt', { ascending: false })
            .limit(1)
          const viaJoin = (pastViaJoin && pastViaJoin[0]) || null
          if (viaJoin) {
            lastMeetingDate = viaJoin.scheduledAt
            lastBriefingId = viaJoin.id
          }
        }
        // If none via join, find latest past scheduled briefing by email (even if status wasn't updated to COMPLETED)
        if (!lastMeetingDate && analyst.email) {
          const { data: pastByEmail } = await supabase
            .from('briefings')
            .select('id, title, scheduledAt, status, attendeeEmails')
            .lte('scheduledAt', now.toISOString())
            .order('scheduledAt', { ascending: false })
            .limit(200)
          let matchedPast = (pastByEmail || []).find(b => {
            const list = Array.isArray(b.attendeeEmails) ? b.attendeeEmails : []
            return list.some((e: string) => (e || '').toLowerCase() === (analyst.email || '').toLowerCase())
          }) || null
          // Fallback: match by name in title if email didn't match
          if (!matchedPast) {
            const first = (analyst.firstName || '').toLowerCase()
            const last = (analyst.lastName || '').toLowerCase()
            matchedPast = (pastByEmail || []).find(b => {
              const t = (b.title || '').toLowerCase()
              return first && last && t.includes(first) && t.includes(last)
            }) || null
          }
          if (matchedPast) {
            lastMeetingDate = matchedPast.scheduledAt
            lastBriefingId = matchedPast.id
          }
        }
        // If still no signal, fall back to calendar meetings
        if (!lastMeetingDate) {
          // Try matching calendar meetings by attendee email first (more reliable than analyst_id)
          if (analyst.email) {
            // 1) Look for the latest past meeting where attendees include analyst.email
            const { data: calByEmail } = await supabase
              .from('calendar_meetings')
              .select('start_time, end_time, attendees')
              .lte('start_time', now.toISOString())
              .order('start_time', { ascending: false })
              .limit(100)
            const matched = (calByEmail || []).find(m => {
              const list = Array.isArray((m as any).attendees) ? (m as any).attendees : []
              return list.some((e: string) => (e || '').toLowerCase() === (analyst.email || '').toLowerCase())
            }) || null
            if (matched) {
              lastMeetingDate = (matched as any).end_time || (matched as any).start_time
            }
          }
          // 2) If still not found, try the analyst_id linkage as a final fallback
          if (!lastMeetingDate) {
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
              lastMeetingDate = (lastMeeting as any).end_time || (lastMeeting as any).start_time
            }
          }
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
        // Calculate overdue days: max(days since last - frequency, 0), null if no last
        const rawOverdue = daysSinceLastBriefing !== null && daysBetweenBriefings > 0
          ? (daysSinceLastBriefing - daysBetweenBriefings)
          : null
        const overdueDays = rawOverdue !== null ? Math.max(rawOverdue, 0) : null

        temp.push({
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
            briefingFrequency: daysBetweenBriefings,
            normalized: influenceKey,
          },
          lastBriefing: lastMeetingDate ? {
            id: lastBriefingId || lastCompleted?.id || '',
            scheduledAt: lastMeetingDate
          } : null,
          nextBriefing: nextScheduled ? {
            id: nextScheduled.id,
            scheduledAt: nextScheduled.scheduledAt,
            status: nextScheduled.status
          } : null,
          daysSinceLastBriefing,
          overdueDays,
          needsBriefing: true
        })
      }
      }

      analystsDueForBriefings = temp;

      // compute counts per normalized tier
      const counts: Record<string, number> = { VERY_HIGH: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
      for (const a of analystsDueForBriefings) {
        const norm = (a.tier?.normalized || '').toUpperCase()
        if (counts[norm] !== undefined) counts[norm] += 1
      }

      cachedDueResults = { data: analystsDueForBriefings, updatedAt: Date.now(), counts };
    }

    // Optional backend tier filter support (TIER_1..4), map by order if present
    let filtered = analystsDueForBriefings;
    if (tierFilter && tierFilter !== 'ALL') {
      const normalized = tierFilter.toUpperCase()
      filtered = analystsDueForBriefings.filter(a => {
        const norm = (a.tier?.normalized || '').toString().toUpperCase()
        if (normalized === 'TIER_1') return norm === 'VERY_HIGH'
        if (normalized === 'TIER_2') return norm === 'HIGH'
        if (normalized === 'TIER_3') return norm === 'MEDIUM'
        if (normalized === 'TIER_4') return norm === 'LOW'
        return true
      })
    }

    // Basic search filter (client can also filter)
    if (search) {
      const s = search.toLowerCase()
      filtered = filtered.filter(a =>
        `${a.firstName} ${a.lastName}`.toLowerCase().includes(s) ||
        (a.email || '').toLowerCase().includes(s) ||
        (a.company || '').toLowerCase().includes(s)
      )
    }

    console.log(`📊 [Briefings Due API] Found ${analystsDueForBriefings.length} analysts due for briefings`)

    return NextResponse.json({
      success: true,
      data: filtered,
      cached: cacheValid,
      updatedAt: cachedDueResults?.updatedAt || Date.now(),
      total: filtered.length,
      countsByTier: cachedDueResults?.counts || { VERY_HIGH: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
      filters: { search, tier: tierFilter }
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

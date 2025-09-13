import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Enhanced tier-specific caching for better performance
interface TierCacheEntry {
  data: any[]
  updatedAt: number
  searchTerm: string
}

const tierCache = new Map<string, TierCacheEntry>()
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes (increased for better hit rate)

// Legacy cache for compatibility
let cachedDueResults: { data: any[]; updatedAt: number; counts: Record<string, number> } | null = null

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

    // Check tier-specific cache first (more granular and efficient)
    const cacheKey = `${tierFilter}_${search}`
    const tierCacheEntry = tierCache.get(cacheKey)
    const tierCacheValid = !force && tierCacheEntry && 
      (Date.now() - tierCacheEntry.updatedAt) < CACHE_TTL_MS &&
      tierCacheEntry.searchTerm === search

    if (tierCacheValid) {
      console.log(`💾 [CACHE HIT] Using cached data for tier: ${tierFilter}, search: "${search}"`)
      return NextResponse.json({
        success: true,
        data: tierCacheEntry.data,
        cached: true,
        updatedAt: tierCacheEntry.updatedAt,
        total: tierCacheEntry.data.length,
        countsByTier: cachedDueResults?.counts || { VERY_HIGH: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
        filters: { search, tier: tierFilter }
      })
    }

    // Fallback to legacy cache for full dataset queries
    const legacyCacheValid = !force && !tierFilter && !search && cachedDueResults && 
      (Date.now() - cachedDueResults.updatedAt) < CACHE_TTL_MS

    let analystsDueForBriefings: any[]
    if (legacyCacheValid) {
      console.log('💾 [LEGACY CACHE HIT] Using full cached dataset')
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

      // OPTIMIZED: Bulk fetch all data to eliminate N+1 queries
      console.log(`🚀 [OPTIMIZED] Processing ${(analysts || []).length} analysts with bulk queries...`)
      
      const analystIds = (analysts || []).map(a => a.id)
      const analystEmails = (analysts || []).map(a => a.email).filter(Boolean)
      
      // Bulk fetch all briefing-analyst relationships
      const { data: allBriefingAnalysts } = await supabase
        .from('briefing_analysts')
        .select('analystId, briefingId')
        .in('analystId', analystIds)
      
      // Get all briefing IDs and create lookup map
      const briefingIds = [...new Set((allBriefingAnalysts || []).map(ba => ba.briefingId))]
      const analystBriefingMap = new Map<string, string[]>()
      ;(allBriefingAnalysts || []).forEach(ba => {
        if (!analystBriefingMap.has(ba.analystId)) {
          analystBriefingMap.set(ba.analystId, [])
        }
        analystBriefingMap.get(ba.analystId)!.push(ba.briefingId)
      })

      // Bulk fetch all relevant briefings
      let allBriefings: any[] = []
      
      // Fetch briefings by ID (from briefing_analysts table)
      if (briefingIds.length > 0) {
        const { data: briefingsById } = await supabase
          .from('briefings')
          .select('id, title, completedAt, scheduledAt, status, attendeeEmails')
          .in('id', briefingIds)
        allBriefings = briefingsById || []
      }
      
      // Fetch briefings by email (for analysts not in briefing_analysts table)
      if (analystEmails.length > 0) {
        const { data: briefingsByEmail } = await supabase
          .from('briefings')
          .select('id, title, completedAt, scheduledAt, status, attendeeEmails')
          .in('status', ['COMPLETED', 'SCHEDULED', 'RESCHEDULED'])
          .order('scheduledAt', { ascending: false })
          .limit(1000) // Reasonable limit to prevent huge queries
        
        // Filter client-side for email matches and merge with existing
        const emailMatchedBriefings = (briefingsByEmail || []).filter(b => {
          if (allBriefings.some(existing => existing.id === b.id)) return false // Avoid duplicates
          const attendeeList = Array.isArray(b.attendeeEmails) ? b.attendeeEmails : []
          return analystEmails.some(email => 
            attendeeList.some((e: string) => e.toLowerCase() === email.toLowerCase())
          )
        })
        
        allBriefings = [...allBriefings, ...emailMatchedBriefings]
      }
      
      // Bulk fetch calendar meetings
      let allCalendarMeetings: any[] = []
      
      // Fetch meetings by analyst_id
      if (analystIds.length > 0) {
        const { data: meetingsById } = await supabase
          .from('calendar_meetings')
          .select('analyst_id, start_time, end_time, attendees, is_analyst_meeting')
          .in('analyst_id', analystIds)
          .lte('start_time', now.toISOString())
          .order('start_time', { ascending: false })
          .limit(500) // Reasonable limit
        allCalendarMeetings = meetingsById || []
      }
      
      // Fetch additional meetings by email (for meetings not linked by analyst_id)
      if (analystEmails.length > 0) {
        const { data: meetingsByEmail } = await supabase
          .from('calendar_meetings')
          .select('analyst_id, start_time, end_time, attendees, is_analyst_meeting')
          .lte('start_time', now.toISOString())
          .order('start_time', { ascending: false })
          .limit(500) // Reasonable limit
        
        // Filter client-side for email matches and merge
        const emailMatchedMeetings = (meetingsByEmail || []).filter(m => {
          if (allCalendarMeetings.some(existing => 
            existing.start_time === m.start_time && existing.analyst_id === m.analyst_id
          )) return false // Avoid duplicates
          const attendeeList = Array.isArray(m.attendees) ? m.attendees : []
          return analystEmails.some(email =>
            attendeeList.some((e: string) => e.toLowerCase() === email.toLowerCase())
          )
        })
        
        allCalendarMeetings = [...allCalendarMeetings, ...emailMatchedMeetings]
      }

      // Process analysts efficiently with bulk data
      const temp: any[] = []
      
      for (const analyst of analysts || []) {
        const influenceKey = (analyst.influence || '').toString().toUpperCase()
        const tier = (tierLookup.find(n =>
          (influenceKey === 'VERY_HIGH' && (n.key.includes('VERY') && n.key.includes('HIGH'))) ||
          (influenceKey === 'HIGH' && n.key === 'HIGH') ||
          (influenceKey === 'MEDIUM' && n.key === 'MEDIUM') ||
          (influenceKey === 'LOW' && n.key === 'LOW')
        ) || {}).row || null
        
        if (!tier || !tier.isActive) continue

        const daysBetweenBriefings = tier?.briefingFrequency ?? 0
        const analystBriefingIds = analystBriefingMap.get(analyst.id) || []
        
        // Filter briefings for this analyst
        const analystBriefings = (allBriefings || []).filter(b => 
          analystBriefingIds.includes(b.id) ||
          (analyst.email && Array.isArray(b.attendeeEmails) && 
           b.attendeeEmails.some((e: string) => e.toLowerCase() === analyst.email.toLowerCase()))
        )

        // Find last completed briefing
        const completedBriefings = analystBriefings
          .filter(b => b.status === 'COMPLETED')
          .sort((a, b) => new Date(b.completedAt || b.scheduledAt).getTime() - new Date(a.completedAt || a.scheduledAt).getTime())
        const lastCompleted = completedBriefings[0] || null

        // Find next scheduled briefing
        const upcomingBriefings = analystBriefings
          .filter(b => ['SCHEDULED', 'RESCHEDULED'].includes(b.status) && new Date(b.scheduledAt) > now)
          .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
        const nextScheduled = upcomingBriefings[0] || null

        // Find last meeting date
        let lastMeetingDate: string | null = null
        let lastBriefingId: string = ''
        
        if (lastCompleted?.completedAt) {
          lastMeetingDate = lastCompleted.completedAt
          lastBriefingId = lastCompleted.id
        } else {
          // Try latest past briefing (any status)
          const pastBriefings = analystBriefings
            .filter(b => new Date(b.scheduledAt) <= now)
            .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
          const latestPast = pastBriefings[0]
          
          if (latestPast) {
            lastMeetingDate = latestPast.scheduledAt
            lastBriefingId = latestPast.id
          } else {
            // Fallback to calendar meetings
            const analystMeetings = (allCalendarMeetings || []).filter(m =>
              m.analyst_id === analyst.id ||
              (analyst.email && Array.isArray(m.attendees) && 
               m.attendees.some((e: string) => e.toLowerCase() === analyst.email.toLowerCase()))
            ).sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
            
            const latestMeeting = analystMeetings[0]
            if (latestMeeting) {
              lastMeetingDate = latestMeeting.end_time || latestMeeting.start_time
            }
          }
        }

        // Calculate days since last meeting
        const daysSinceLastBriefing = lastMeetingDate
          ? Math.floor((now.getTime() - new Date(lastMeetingDate).getTime()) / (1000 * 60 * 60 * 24))
          : null

        // Check if needs briefing
        const needsBriefing = !nextScheduled && (!lastMeetingDate || (daysSinceLastBriefing !== null && daysSinceLastBriefing >= daysBetweenBriefings))

        if (needsBriefing) {
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

    // Cache the tier-specific results for faster subsequent requests
    if (tierFilter && !tierCacheValid) {
      tierCache.set(cacheKey, {
        data: filtered,
        updatedAt: Date.now(),
        searchTerm: search
      })
      console.log(`💾 [CACHE SET] Cached data for tier: ${tierFilter}, search: "${search}"`)
    }

    return NextResponse.json({
      success: true,
      data: filtered,
      cached: legacyCacheValid,
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

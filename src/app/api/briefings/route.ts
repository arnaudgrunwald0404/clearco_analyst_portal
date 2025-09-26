import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type Briefing = Database['public']['Tables']['briefings']['Row']
type BriefingInsert = Database['public']['Tables']['briefings']['Insert']
type BriefingAnalystInsert = Database['public']['Tables']['briefing_analysts']['Insert']

// Simple CUID-like ID generator
function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `cl${timestamp}${randomPart}`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const upcoming = searchParams.get('upcoming') === 'true'
    let analystId = searchParams.get('analystId')
    const vendorDomainId = searchParams.get('vendorDomainId') // new canonical filter: vendor_domains.id
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '1000', 10)

    const supabase = await createClient()
    const service = createServiceClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Grab the current user (for role/domain checks and implicit analyst lookup)
    const { data: { user } } = await supabase.auth.getUser()
    let userEmail = user?.email?.toLowerCase() || ''

    // Check for analyst context from request headers (for impersonation/analyst sessions)
    const analystEmailHeader = request.headers.get('x-analyst-email')
    const analystIdHeader = request.headers.get('x-analyst-id')
    
    console.log(`🔍 Auth context: user=${userEmail}, analystEmail=${analystEmailHeader}, analystId=${analystIdHeader}`)

    // If there's analyst context in headers, use that instead of Supabase auth
    if (analystEmailHeader && !analystId) {
      userEmail = analystEmailHeader.toLowerCase()
      console.log(`👤 Using analyst email from header: ${userEmail}`)
      
      if (analystIdHeader) {
        analystId = analystIdHeader
        console.log(`👤 Using analyst ID from header: ${analystId}`)
      }
    }

    // If no analystId was provided, attempt to derive it from the effective user email
    let effectiveAnalystId: string | null = null
    if (userEmail) {
      try {
        const { data: analystRow } = await supabase
          .from('analysts')
          .select('id, email, firstName, lastName')
          .eq('email', userEmail)
          .single()
        if (analystRow?.id) {
          effectiveAnalystId = analystRow.id
          if (!analystId) analystId = analystRow.id
          console.log(`🔍 Found analyst: ${analystRow.firstName} ${analystRow.lastName} (${analystRow.email}) with ID: ${analystRow.id}`)
        } else {
          console.log(`⚠️ No analyst found for email: ${userEmail}`)
        }
      } catch (e) {
        // Non-fatal: continue without implicit analyst filter if anything goes wrong
        console.warn(`❌ Error finding analyst for email ${userEmail}:`, e)
      }
    }

    // Guardrails to allow privileged service read when both params provided
    let useServiceRead = false
    if (analystId && vendorDomainId) {
      // Condition 1a: current server-session user is that analyst
      let isAnalystSelf = Boolean(effectiveAnalystId && effectiveAnalystId === analystId)

      // Condition 1b: header-provided analyst context (for impersonation SSR fetches)
      try {
        const headerAnalystEmail = request.headers.get('x-analyst-email')?.toLowerCase() || ''
        const headerAnalystId = request.headers.get('x-analyst-id') || ''
        if (!isAnalystSelf && headerAnalystEmail && headerAnalystId && headerAnalystId === analystId) {
          const { data: verified } = await service
            .from('analysts')
            .select('id, email')
            .eq('id', analystId)
            .eq('email', headerAnalystEmail)
            .single()
          if (verified?.id) {
            isAnalystSelf = true
          }
        }
      } catch (e) {
        console.warn('⚠️ Header analyst verification failed:', e)
      }

      // Condition 2: current user is vendor admin for the vendorDomainId
      let isVendorAdmin = false
      try {
        const { data: vendor } = await service
          .from('vendor_domains')
          .select('id, protected_domain')
          .eq('id', vendorDomainId)
          .single()
        const vendorDomain = vendor?.protected_domain?.toLowerCase()
        const userDomain = (userEmail || '').split('@')[1]

        // Domain-based vendor admin
        if (vendorDomain && userDomain && vendorDomain === userDomain) {
          isVendorAdmin = true
        }
        // Role-based override (platform ADMIN)
        if (!isVendorAdmin && user) {
          const { data: profile } = await service
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          if ((profile?.role || '').toUpperCase() === 'ADMIN') {
            isVendorAdmin = true
          }
        }
      } catch (e) {
        console.warn('⚠️ Vendor admin check failed (fallback to RLS):', e)
      }

      useServiceRead = Boolean(isAnalystSelf || isVendorAdmin)
    }

    let baseBriefings: any[] = []

    // Enforce guardrail: if both filters provided but not authorized, deny
    if (analystId && vendorDomainId && !useServiceRead) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: not authorized for this vendor/analyst combination' },
        { status: 403 }
      )
    }

    if (analystId) {
      const db = useServiceRead ? service : supabase
      // When filtering by analyst, apply the filter at the DB level BEFORE limiting
      let baQuery = db
        .from('briefing_analysts')
        .select(`
          briefings!inner(*)
        `)
        .eq('analystId', analystId)
        .order('briefings(scheduledAt)', { ascending: upcoming ? true : false })
        .limit(limit)

      if (status) {
        baQuery = baQuery.eq('briefings.status', status.toUpperCase())
      }

      // Filter by vendor if provided (now using vendor_domains.id)
      if (vendorDomainId && vendorDomainId.trim()) {
        baQuery = baQuery.eq('vendor_domain_id', vendorDomainId.trim())
      }

      if (upcoming) {
        const now = new Date().toISOString()
        baQuery = baQuery.gte('briefings.scheduledAt', now)
      }

      const { data: baRows, error: baErr } = await baQuery
      if (baErr) {
        console.error('Error fetching briefings for analyst:', baErr)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch briefings' },
          { status: 500 }
        )
      }

      baseBriefings = (baRows || []).map((r: any) => r.briefings).filter(Boolean)
      
      // Also fetch briefings where analyst email is in attendeeEmails field
      if (userEmail && baseBriefings.length < limit) {
        console.log(`🔍 Searching for briefings with email: ${userEmail} in attendeeEmails`)
        
        let emailQuery = supabase
          .from('briefings')
          .select('*')
          .contains('attendeeEmails', [userEmail])
          .order('scheduledAt', { ascending: upcoming ? true : false })
          .limit(limit - baseBriefings.length)

        if (status) {
          emailQuery = emailQuery.eq('status', status.toUpperCase())
        }

        if (upcoming) {
          const now = new Date().toISOString()
          emailQuery = emailQuery.gte('scheduledAt', now)
        }

        const { data: emailBriefings, error: emailErr } = await emailQuery
        console.log(`📧 Email query result: ${emailBriefings?.length || 0} briefings found`)
        if (emailErr) {
          console.error('❌ Email query error:', emailErr)
        }
        
        if (!emailErr && emailBriefings) {
          // Merge and deduplicate by ID
          const existingIds = new Set(baseBriefings.map(b => b.id))
          const newBriefings = emailBriefings.filter(b => !existingIds.has(b.id))
          console.log(`📋 Adding ${newBriefings.length} new briefings from email search`)
          baseBriefings = [...baseBriefings, ...newBriefings]
        }
        
        // Fallback: try text search if contains didn't work
        if (baseBriefings.length === 0) {
          console.log(`🔍 Fallback: trying text search for email: ${userEmail}`)
          let textQuery = supabase
            .from('briefings')
            .select('*')
            .textSearch('attendeeEmails', `"${userEmail}"`)
            .order('scheduledAt', { ascending: upcoming ? true : false })
            .limit(limit)

          if (status) {
            textQuery = textQuery.eq('status', status.toUpperCase())
          }

          if (upcoming) {
            const now = new Date().toISOString()
            textQuery = textQuery.gte('scheduledAt', now)
          }

          const { data: textBriefings, error: textErr } = await textQuery
          console.log(`📝 Text query result: ${textBriefings?.length || 0} briefings found`)
          if (!textErr && textBriefings) {
            baseBriefings = textBriefings
          }
        }
      }
    } else {
      // No analyst context: allow ClearCompany admins to view all briefings
      const isAdminDomain = userEmail.split('@')[1] === 'clearcompany.com'
      let isAdminRole = false

      if (user) {
        try {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          isAdminRole = (profile?.role || '').toUpperCase() === 'ADMIN'
        } catch (e) {
          // ignore profile fetch errors; we'll fall back to domain check
        }
      }

      if (!(isAdminDomain || isAdminRole)) {
        return NextResponse.json(
          { success: false, error: 'Analyst account required' },
          { status: 401 }
        )
      }

      // Admin view: fetch briefings directly with optional filters
      let bq = supabase
        .from('briefings')
        .select('*')
        .order('scheduledAt', { ascending: upcoming ? true : false })
        .limit(limit)

      if (status) {
        bq = bq.eq('status', status.toUpperCase())
      }

      if (upcoming) {
        const now = new Date().toISOString()
        bq = bq.gte('scheduledAt', now)
      }

      const { data, error } = await bq
      if (error) {
        console.error('Error fetching briefings (admin):', error)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch briefings' },
          { status: 500 }
        )
      }

      baseBriefings = data || []
    }

    // For each briefing, get associated analysts
    const dbForAnalysts = useServiceRead ? service : supabase
    const briefingsWithAnalysts = await Promise.all(
      baseBriefings.map(async (briefing) => {
        const { data: briefingAnalysts } = await dbForAnalysts
          .from('briefing_analysts')
          .select(`
            analystId,
            analysts!inner(
              id,
              firstName,
              lastName,
              email,
              company,
              title
            )
          `)
          .eq('briefingId', briefing.id)

        const analysts = briefingAnalysts?.map(ba => ba.analysts) || []

        return {
          ...briefing,
          analysts
        }
      })
    )

    // Apply search filter if provided
    let searchFilteredBriefings = briefingsWithAnalysts
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase()
      console.log(`🔍 Applying search filter for: "${searchTerm}"`)
      
      searchFilteredBriefings = briefingsWithAnalysts.filter(briefing => {
        // Search in briefing fields
        const briefingMatch = 
          briefing.title?.toLowerCase().includes(searchTerm) ||
          briefing.description?.toLowerCase().includes(searchTerm) ||
          briefing.location?.toLowerCase().includes(searchTerm) ||
          briefing.status?.toLowerCase().includes(searchTerm) ||
          briefing.type?.toLowerCase().includes(searchTerm)

        // Search in associated analysts
        const analystMatch = briefing.analysts?.some((analyst: any) => 
          `${analyst.firstName} ${analyst.lastName}`.toLowerCase().includes(searchTerm) ||
          analyst.firstName?.toLowerCase().includes(searchTerm) ||
          analyst.lastName?.toLowerCase().includes(searchTerm) ||
          analyst.email?.toLowerCase().includes(searchTerm) ||
          analyst.company?.toLowerCase().includes(searchTerm) ||
          analyst.title?.toLowerCase().includes(searchTerm)
        )

        // Additional fuzzy matching for partial names
        const fullNameMatch = briefing.analysts?.some((analyst: any) => {
          const fullName = `${analyst.firstName || ''} ${analyst.lastName || ''}`.toLowerCase()
          return fullName.includes(searchTerm)
        })

        const match = briefingMatch || analystMatch || fullNameMatch
        if (match) {
          console.log(`✅ Match found for briefing: ${briefing.title}`)
        }
        
        return match
      })
      
      console.log(`🔍 Search results: ${searchFilteredBriefings.length} out of ${briefingsWithAnalysts.length} briefings`)
    }

    console.log(`📊 Found ${searchFilteredBriefings.length} briefings${search ? ` (filtered from ${briefingsWithAnalysts.length} by search: "${search}")` : ''}`)
    return NextResponse.json({
      success: true,
      data: searchFilteredBriefings,
      total: searchFilteredBriefings.length,
      hasMore: false,
      nextCursor: null
    })

  } catch (error) {
    console.error('Error in briefings GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      scheduledAt,
      status = 'SCHEDULED',
      agenda,
      notes,
      analystIds = [],
      vendorDomainId
    } = body

    if (!title || !scheduledAt) {
      return NextResponse.json(
        { error: 'Title and scheduled date are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Create briefing
    const briefingData: BriefingInsert = {
      id: generateId(),
      title,
      description,
      scheduledAt,
      status,
      agenda,
      notes
    }

    const { data: newBriefing, error: briefingError } = await supabase
      .from('briefings')
      .insert(briefingData)
      .select()
      .single()

    if (briefingError) {
      console.error('Error creating briefing:', briefingError)
      return NextResponse.json(
        { error: 'Failed to create briefing' },
        { status: 500 }
      )
    }

    // Add analyst associations if provided
    if (analystIds.length > 0) {
      const briefingAnalystsData: BriefingAnalystInsert[] = analystIds.map((analystId: string) => ({
        id: generateId(),
        briefingId: newBriefing.id,
        analystId,
        // @ts-ignore - types updated to include vendor_domain_id
        vendor_domain_id: vendorDomainId || null
      }))

      const { error: associationError } = await supabase
        .from('briefing_analysts')
        .insert(briefingAnalystsData)

      if (associationError) {
        console.error('Error creating briefing-analyst associations:', associationError)
        // Don't fail the whole request, just log the error
      }
    }

    // Fetch the complete briefing with analysts
    const { data: briefingAnalysts } = await supabase
      .from('briefing_analysts')
      .select(`
        analystId,
        analysts!inner(
          id,
          firstName,
          lastName,
          email,
          company,
          title
        )
      `)
      .eq('briefingId', newBriefing.id)

    const analysts = briefingAnalysts?.map(ba => ba.analysts) || []

    const completeBriefing = {
      ...newBriefing,
      analysts
    }

    console.log(`✅ Created briefing: ${newBriefing.title}`)
    
    return NextResponse.json({
      success: true,
      message: 'Briefing created successfully',
      data: completeBriefing
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating briefing:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create briefing',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

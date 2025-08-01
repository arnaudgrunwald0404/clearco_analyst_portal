import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      companies = [],
      influences = [],
      statuses = [],
      types = [],
      relationshipHealths = [],
      search = '',
      limit = 1000
    } = body

    const supabase = await createClient()

    // Start with base query
    let query = supabase
      .from('analysts')
      .select('*')

    // Add search filter using OR logic
    if (search) {
      query = query.or(`firstName.ilike.%${search}%,lastName.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%,title.ilike.%${search}%`)
    }

    // Add company filter
    if (companies.length > 0) {
      query = query.in('company', companies)
    }

    // Add influence filter
    if (influences.length > 0) {
      query = query.in('influence', influences)
    }

    // Add status filter
    if (statuses.length > 0) {
      query = query.in('status', statuses)
    }

    // Add type filter
    if (types.length > 0) {
      query = query.in('type', types)
    }

    // Add relationship health filter
    if (relationshipHealths.length > 0) {
      query = query.in('relationshipHealth', relationshipHealths)
    }

    const { data: analysts, error } = await query
      .order('firstName', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error fetching filtered analysts:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch filtered analysts' },
        { status: 500 }
      )
    }

    console.log(`🔍 Found ${analysts?.length || 0} analysts matching filters`)

    return NextResponse.json({
      success: true,
      data: analysts || [],
      count: analysts?.length || 0,
      filters: {
        companies,
        influences,
        statuses,
        types,
        relationshipHealths,
        search
      }
    })

  } catch (error) {
    console.error('Error in filtered analysts API:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to filter analysts' },
      { status: 500 }
    )
  }
} 
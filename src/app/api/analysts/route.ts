import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

type Analyst = Database['public']['Tables']['analysts']['Row']
type AnalystInsert = Database['public']['Tables']['analysts']['Insert']

// Simple CUID-like ID generator
function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `cl${timestamp}${randomPart}`
}

// In-memory cache for basic analyst queries  
let cache: {
  data: any[] | null
  timestamp: number
  duration: number
} = {
  data: null,
  timestamp: 0, // Reset timestamp to force cache rebuild
  duration: 5 * 60 * 1000 // 5 minutes
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const topics = searchParams.getAll('topic')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const influence = searchParams.get('influence')

    const supabase = await createClient()

    // Check cache for basic queries
    const now = Date.now()
    const useCache = !topics.length && !status && !type && !influence
    
    if (useCache && cache.data && (now - cache.timestamp) < cache.duration) {
      console.log('📋 Returning cached analysts data')
      return NextResponse.json({
        success: true,
        data: cache.data
      })
    }

    // Build query
    let query = supabase
      .from('analysts')
      .select('*')
      .order('lastName', { ascending: true })

    // Apply filters
    if (status) {
      query = query.eq('status', status.toUpperCase())
    }
    if (type) {
      query = query.eq('type', type)
    }
    if (influence) {
      query = query.eq('influence', influence.toUpperCase())
    }

    const { data: analysts, error } = await query

    if (error) {
      console.error('Error fetching analysts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch analysts' },
        { status: 500 }
      )
    }

    let filteredAnalysts = analysts || []

    // Filter by topics if provided (this would need a separate table join in a real implementation)
    if (topics.length > 0) {
      // For now, we'll filter by topics in keyThemes field
      // In a full migration, you'd join with analyst_covered_topics table
      filteredAnalysts = filteredAnalysts.filter(analyst => 
        topics.some(topic => 
          analyst.keyThemes?.toLowerCase().includes(topic.toLowerCase())
        )
      )
    }

    // Update cache for basic queries
    if (useCache) {
      cache.data = filteredAnalysts
      cache.timestamp = now
      console.log(`📋 Cached ${filteredAnalysts.length} analysts`)
    }

    console.log(`📊 Found ${filteredAnalysts.length} analysts`)
    return NextResponse.json({
      success: true,
      data: filteredAnalysts
    })

  } catch (error) {
    console.error('Error in analysts GET:', error)
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
      firstName,
      lastName,
      email,
      company,
      title,
      phone,
      linkedIn,
      twitter,
      website,
      bio,
      profileImageUrl,
      type = 'Analyst',
      eligibleNewsletters,
      influenceScore = 50,
      influence = 'MEDIUM',
      status = 'ACTIVE',
      relationshipHealth = 'GOOD',
      notes
    } = body

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check for existing analyst with same email
    const { data: existingAnalyst } = await supabase
      .from('analysts')
      .select('id')
      .eq('email', email)
      .single()

    if (existingAnalyst) {
      return NextResponse.json(
        { error: 'Analyst with this email already exists' },
        { status: 409 }
      )
    }

    const analystData: AnalystInsert = {
      id: generateId(),
      firstName,
      lastName,
      email,
      company,
      title,
      phone,
      linkedIn,
      twitter,
      website,
      bio,
      profileImageUrl,
      type,
      eligibleNewsletters,
      influenceScore,
      influence,
      status,
      relationshipHealth,
      notes
    }

    const { data: newAnalyst, error: insertError } = await supabase
      .from('analysts')
      .insert(analystData)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating analyst:', insertError)
      return NextResponse.json(
        { error: 'Failed to create analyst' },
        { status: 500 }
      )
    }

    // Clear cache
    cache.data = null

    console.log(`✅ Created analyst: ${newAnalyst.firstName} ${newAnalyst.lastName}`)
    
    return NextResponse.json({
      success: true,
      message: 'Analyst created successfully',
      data: newAnalyst
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating analyst:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create analyst',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

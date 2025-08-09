import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { syncAnalystSocialHandlesOnUpdate } from '@/lib/social-sync'

type Analyst = Database['public']['Tables']['analysts']['Row']
type AnalystInsert = Database['public']['Tables']['analysts']['Insert']

// Fail fast if required Supabase env vars are missing (tests expect this throw on import)
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing')
}

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
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { success: false, error: 'Supabase not configured' },
        { status: 500 }
      )
    }
    const { searchParams } = new URL(request.url)
    const topics = searchParams.getAll('topic')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const influence = searchParams.get('influence')

    // Use service role to bypass RLS for admin dashboard APIs
    const supabase = createServiceClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

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

    const supabase = createServiceClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

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
      // Map request fields to DB column names
      linkedinUrl: linkedIn || null,
      twitterHandle: twitter || null,
      personalWebsite: website || null,
      bio,
      profileImageUrl,
      type,
      // Remove fields not present in schema: eligibleNewsletters, influenceScore
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
        { error: 'Failed to create analyst', details: insertError.message },
        { status: 500 }
      )
    }

    // Sync social handles
    try {
      await syncAnalystSocialHandlesOnUpdate({
        id: newAnalyst.id,
        twitterHandle: newAnalyst.twitterHandle,
        linkedinUrl: newAnalyst.linkedinUrl,
        personalWebsite: newAnalyst.personalWebsite
      })
    } catch (syncError) {
      console.error('Error syncing social handles:', syncError)
      // Don't fail the analyst creation, just log the error
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

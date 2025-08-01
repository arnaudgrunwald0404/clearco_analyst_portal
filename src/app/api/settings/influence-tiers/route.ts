import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

type InfluenceTier = Database['public']['Tables']['influence_tiers']['Row']
type InfluenceTierInsert = Database['public']['Tables']['influence_tiers']['Insert']

interface InfluenceTierRequest {
  id: string
  name: string
  briefingFrequency: number
  touchpointFrequency: number
  isActive: boolean
}

// Simple CUID-like ID generator
function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `cl${timestamp}${randomPart}`
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: tiers, error } = await supabase
      .from('influence_tiers')
      .select('*')
      .order('order', { ascending: true })

    if (error) {
      console.error('Error fetching analyst tiers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch analyst tiers' },
        { status: 500 }
      )
    }

    // Convert to frontend format (camelCase to camelCase, just handle null values)
    const formattedTiers = tiers.map(tier => ({
      id: tier.id,
      name: tier.name,
      briefingFrequency: tier.briefingFrequency === null ? -1 : tier.briefingFrequency,
      touchpointFrequency: tier.touchpointFrequency === null ? -1 : tier.touchpointFrequency,
      isActive: tier.isActive
    }))

    return NextResponse.json(formattedTiers)
  } catch (error) {
          console.error('Error in analyst tiers GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tiers }: { tiers: InfluenceTierRequest[] } = body

    if (!tiers || !Array.isArray(tiers)) {
      return NextResponse.json(
        { error: 'Tiers array is required' },
        { status: 400 }
      )
    }

    // Validate each tier
    for (const tier of tiers) {
      if (!tier.name) {
        return NextResponse.json(
          { error: 'Each tier must have a name' },
          { status: 400 }
        )
      }

      if (tier.briefingFrequency !== -1 && tier.briefingFrequency < 1) {
        return NextResponse.json(
          { error: 'Briefing frequency must be at least 1 day or -1 for "Never"' },
          { status: 400 }
        )
      }

      if (tier.touchpointFrequency !== -1 && tier.touchpointFrequency < 1) {
        return NextResponse.json(
          { error: 'Touchpoint frequency must be at least 1 day or -1 for "Never"' },
          { status: 400 }
        )
      }
    }

    const supabase = await createClient()

    // Delete all existing tiers first
    const { error: deleteError } = await supabase
      .from('influence_tiers')
      .delete()
      .neq('id', 'impossible-id') // This deletes all rows

    if (deleteError) {
      console.error('Error deleting existing tiers:', deleteError)
      return NextResponse.json(
        { error: 'Failed to clear existing tiers' },
        { status: 500 }
      )
    }

    // Insert new tiers - DON'T pass timestamps, let DB defaults handle them
    const tiersToInsert = tiers.map((tier, index) => ({
      id: generateId(), // Explicitly generate ID
      name: tier.name,
      color: '#6b7280', // Default gray color
      briefingFrequency: tier.briefingFrequency === -1 ? null : tier.briefingFrequency,
      touchpointFrequency: tier.touchpointFrequency === -1 ? null : tier.touchpointFrequency,
      order: index + 1,
      isActive: tier.isActive
      // DON'T include createdAt/updatedAt - let database defaults handle them
    }))

    const { data: createdTiers, error: insertError } = await supabase
      .from('influence_tiers')
      .insert(tiersToInsert)
      .select()

    if (insertError) {
      console.error('Error inserting new tiers:', insertError)
      return NextResponse.json(
        { error: 'Failed to create new tiers' },
        { status: 500 }
      )
    }

    // Convert back to frontend format
    const formattedTiers = createdTiers.map(tier => ({
      id: tier.id,
      name: tier.name,
      briefingFrequency: tier.briefingFrequency === null ? -1 : tier.briefingFrequency,
      touchpointFrequency: tier.touchpointFrequency === null ? -1 : tier.touchpointFrequency,
      isActive: tier.isActive
    }))

    console.log(`✅ Successfully saved ${formattedTiers.length} analyst tiers`)
    
    return NextResponse.json({
      success: true,
      message: `Successfully saved ${formattedTiers.length} analyst tiers`,
      data: {
        tiers: formattedTiers
      }
    })

  } catch (error) {
    console.error('Error saving analyst tiers:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to save analyst tiers',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
} 
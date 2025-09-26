import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// In-memory cache for briefings due counts
interface BriefingsDueCache {
  counts: {
    VERY_HIGH: number
    HIGH: number
    MEDIUM: number
    LOW: number
  }
  highestTier: number
  nextTier: number
  updatedAt: number
  isLoading: boolean
}

let cachedBriefingsDue: BriefingsDueCache | null = null
const CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutes cache
let backgroundUpdatePromise: Promise<void> | null = null

// Background refresh function
async function refreshBriefingsDueInBackground(): Promise<void> {
  if (backgroundUpdatePromise) {
    // Already updating in background
    return backgroundUpdatePromise
  }

  backgroundUpdatePromise = (async () => {
    try {
      console.log('🔄 [Background] Starting briefings due refresh...')
      
      // Mark as loading
      if (cachedBriefingsDue) {
        cachedBriefingsDue.isLoading = true
      }

      // Fetch fresh data directly using service client (avoid HTTP call)
      const supabase = createServiceClient()
      
      // Call briefings due API directly using the same logic
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
      console.log(`🔄 [Background] Calling briefings due API at: ${baseUrl}/api/briefings/due?force=true`)
      
      try {
        const response = await fetch(`${baseUrl}/api/briefings/due?force=true`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })

        if (!response.ok) {
          throw new Error(`API responded with ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log(`🔄 [Background] Briefings due API response:`, data)
        
        if (data.success && data.countsByTier) {
          const counts = data.countsByTier
          
          // Calculate highest tier and next tier counts
          const tiers = [
            { name: 'VERY_HIGH', count: counts.VERY_HIGH || 0, priority: 1 },
            { name: 'HIGH', count: counts.HIGH || 0, priority: 2 },
            { name: 'MEDIUM', count: counts.MEDIUM || 0, priority: 3 },
            { name: 'LOW', count: counts.LOW || 0, priority: 4 }
          ]

          // Find highest tier with count > 0
          const highestTierWithCount = tiers.find(tier => tier.count > 0)
          const highestTier = highestTierWithCount ? highestTierWithCount.count : 0

          // Find next tier with count > 0 (after highest)
          const nextTierWithCount = tiers.find(tier => 
            tier.priority > (highestTierWithCount?.priority || 0) && tier.count > 0
          )
          const nextTier = nextTierWithCount ? nextTierWithCount.count : 0

          // Update cache
          cachedBriefingsDue = {
            counts,
            highestTier,
            nextTier,
            updatedAt: Date.now(),
            isLoading: false
          }

          console.log(`✅ [Background] Briefings due refreshed: Highest=${highestTier}, Next=${nextTier}`, counts)
        } else {
          console.error('❌ [Background] Invalid response format:', data)
          throw new Error('Invalid response format')
        }
      } catch (fetchError) {
        console.error('❌ [Background] Fetch error:', fetchError)
        throw fetchError
      }
    } catch (error) {
      console.error('❌ [Background] Failed to refresh briefings due:', error)
      
      // Mark as not loading even on error
      if (cachedBriefingsDue) {
        cachedBriefingsDue.isLoading = false
      }
    } finally {
      backgroundUpdatePromise = null
    }
  })()

  return backgroundUpdatePromise
}

export async function GET(request: NextRequest) {
  try {
    const now = Date.now()
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    // Check if we have valid cached data
    const hasValidCache = cachedBriefingsDue && 
      (now - cachedBriefingsDue.updatedAt) < CACHE_TTL_MS

    // If no cache or force refresh, do initial load
    if (!cachedBriefingsDue || force) {
      console.log('🔄 [Initial] Loading briefings due data...')
      
      // Initialize with loading state
      cachedBriefingsDue = {
        counts: { VERY_HIGH: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
        highestTier: 0,
        nextTier: 0,
        updatedAt: now,
        isLoading: true
      }

      // Start background refresh (don't await)
      refreshBriefingsDueInBackground().catch(console.error)
    } 
    // If cache is stale but exists, return cached data and refresh in background
    else if (!hasValidCache && !cachedBriefingsDue.isLoading) {
      console.log('💾 [Stale Cache] Returning cached data, refreshing in background...')
      
      // Start background refresh (don't await)
      refreshBriefingsDueInBackground().catch(console.error)
    }
    // If cache is fresh, just return it
    else if (hasValidCache) {
      console.log('💾 [Fresh Cache] Returning cached briefings due data')
    }

    return NextResponse.json({
      success: true,
      data: {
        counts: cachedBriefingsDue.counts,
        highestTier: cachedBriefingsDue.highestTier,
        nextTier: cachedBriefingsDue.nextTier,
        total: Object.values(cachedBriefingsDue.counts).reduce((sum, count) => sum + count, 0)
      },
      cached: hasValidCache,
      isLoading: cachedBriefingsDue.isLoading,
      updatedAt: cachedBriefingsDue.updatedAt
    })

  } catch (error) {
    console.error('❌ [Briefings Due Cache] Error:', error)
    
    // Return cached data if available, even on error
    if (cachedBriefingsDue) {
      return NextResponse.json({
        success: true,
        data: {
          counts: cachedBriefingsDue.counts,
          highestTier: cachedBriefingsDue.highestTier,
          nextTier: cachedBriefingsDue.nextTier,
          total: Object.values(cachedBriefingsDue.counts).reduce((sum, count) => sum + count, 0)
        },
        cached: true,
        isLoading: false,
        updatedAt: cachedBriefingsDue.updatedAt,
        error: 'Serving cached data due to error'
      })
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch briefings due data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

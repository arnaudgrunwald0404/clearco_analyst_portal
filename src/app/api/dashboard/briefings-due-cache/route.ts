import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getVendorSlugFromContext } from '@/lib/vendor-server'
import { requireVendorScope, withVendorHeaders } from '@/lib/vendor-context'

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

const CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutes cache
const cacheByVendor = new Map<string, BriefingsDueCache>()
const backgroundByVendor = new Map<string, Promise<void>>()

// Background refresh function
async function refreshBriefingsDueInBackground(vendorKey: string): Promise<void> {
  const existingPromise = backgroundByVendor.get(vendorKey)
  if (existingPromise) {
    // Already updating in background for this vendor
    return existingPromise
  }

  const promise = (async () => {
    try {
      console.log(`🔄 [Background] Starting briefings due refresh for vendor=${vendorKey}...`)

      // Mark as loading
      const current = cacheByVendor.get(vendorKey)
      if (current) {
        current.isLoading = true
      }

      // Fetch fresh data via internal API, forwarding vendor header explicitly
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
      console.log(`🔄 [Background] Calling briefings due API at: ${baseUrl}/api/briefings/due?force=true (vendor=${vendorKey})`)

      try {
        // Attach vendor headers explicitly using resolved context when available
        const response = await fetch(`${baseUrl}/api/briefings/due?force=true`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'x-vendor-slug': vendorKey }
        })

        if (!response.ok) {
          throw new Error(`API responded with ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log(`🔄 [Background] Briefings due API response (vendor=${vendorKey}):`, data)
        
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

          // Update vendor cache
          cacheByVendor.set(vendorKey, {
            counts,
            highestTier,
            nextTier,
            updatedAt: Date.now(),
            isLoading: false
          })

          console.log(`✅ [Background] Briefings due refreshed (vendor=${vendorKey}): Highest=${highestTier}, Next=${nextTier}`, counts)
        } else {
          console.error('❌ [Background] Invalid response format:', data)
          throw new Error('Invalid response format')
        }
      } catch (fetchError) {
        console.error(`❌ [Background] Fetch error (vendor=${vendorKey}):`, fetchError)
        throw fetchError
      }
    } catch (error) {
      console.error(`❌ [Background] Failed to refresh briefings due (vendor=${vendorKey}):`, error)
      
      // Mark as not loading even on error
      const existing = cacheByVendor.get(vendorKey)
      if (existing) {
        existing.isLoading = false
      }
    } finally {
      backgroundByVendor.delete(vendorKey)
    }
  })()

  backgroundByVendor.set(vendorKey, promise)
  return promise
}

export async function GET(request: NextRequest) {
  // Resolve vendor context robustly; fall back to cookie/header slug if needed
  const ctxOrResp = await requireVendorScope(request)
  const fallbackSlug = getVendorSlugFromContext() || 'default'
  const vendorKey = (ctxOrResp as any)?.id || (ctxOrResp as any)?.slug || fallbackSlug
  try {
    const now = Date.now()
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    const cached = cacheByVendor.get(vendorKey) || null
    const hasValidCache = !!(cached && (now - cached.updatedAt) < CACHE_TTL_MS)

    // If no cache or force refresh, do initial load for this vendor
    if (!cached || force) {
      console.log(`🔄 [Initial] Loading briefings due data (vendor=${vendorKey})...`)
      
      // Initialize with loading state
      const initial: BriefingsDueCache = {
        counts: { VERY_HIGH: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
        highestTier: 0,
        nextTier: 0,
        updatedAt: now,
        isLoading: true
      }
      cacheByVendor.set(vendorKey, initial)

      // Start background refresh (don't await)
      refreshBriefingsDueInBackground(vendorKey).catch(console.error)
    } 
    // If cache is stale but exists, return cached data and refresh in background
    else if (!hasValidCache && cached && !cached.isLoading) {
      console.log(`💾 [Stale Cache] Returning cached data, refreshing in background (vendor=${vendorKey})...`)
      
      // Start background refresh (don't await)
      refreshBriefingsDueInBackground(vendorKey).catch(console.error)
    }
    // If cache is fresh, just return it
    else if (hasValidCache) {
      console.log(`💾 [Fresh Cache] Returning cached briefings due data (vendor=${vendorKey})`)
    }

    const current = cacheByVendor.get(vendorKey)!
    return NextResponse.json({
      success: true,
      data: {
        counts: current.counts,
        highestTier: current.highestTier,
        nextTier: current.nextTier,
        total: Object.values(current.counts).reduce((sum, count) => sum + count, 0)
      },
      cached: hasValidCache,
      isLoading: current.isLoading,
      updatedAt: current.updatedAt
    })

  } catch (error) {
    console.error(`❌ [Briefings Due Cache] Error (vendor=${vendorKey}):`, error)
    
    // Return cached data if available, even on error
    const cached = cacheByVendor.get(vendorKey)
    if (cached) {
      return NextResponse.json({
        success: true,
        data: {
          counts: cached.counts,
          highestTier: cached.highestTier,
          nextTier: cached.nextTier,
          total: Object.values(cached.counts).reduce((sum, count) => sum + count, 0)
        },
        cached: true,
        isLoading: false,
        updatedAt: cached.updatedAt,
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

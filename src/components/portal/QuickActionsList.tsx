'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Calendar, MessageSquarePlus, FolderOpen, LifeBuoy, Settings } from 'lucide-react'
import Drawer from '@/app/briefings/components/drawer/Drawer'
import type { Briefing } from '@/app/briefings/types'

export function QuickActionsList({ minimal = false }: { minimal?: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [supportEmail, setSupportEmail] = useState<string | null>(null)
  const [mostRecentBriefing, setMostRecentBriefing] = useState<Briefing | null>(null)
  const [selectedBriefing, setSelectedBriefing] = useState<Briefing | null>(null)
  const [drawerTab, setDrawerTab] = useState<"overview" | "materials" | "transcript">("overview")
  
  // Get analyst context from URL for impersonation - try multiple sources
  let analystId = searchParams?.get('analystId')
  
  // If no analystId in search params, try to extract from current URL
  if (!analystId && typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search)
    analystId = urlParams.get('analystId')
  }
  
  // Security: Detect analyst impersonation context for proper data isolation

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // Fetch general to get vendor domain, then scoped portal settings for support email
        const generalResp = await fetch('/api/settings/general', { cache: 'no-store' })
        let vendorDomain: string | undefined
        if (generalResp.ok) {
          const gj = await generalResp.json().catch(() => null as any)
          vendorDomain = gj?.protected_domain || undefined
        }
        const settingsParams = new URLSearchParams()
        if (vendorDomain) settingsParams.set('vendorDomain', vendorDomain)
        const resp = await fetch(`/api/settings/analyst-portal${settingsParams.toString() ? `?${settingsParams.toString()}` : ''}`, { cache: 'no-store' })
        if (resp.ok) {
          const json = await resp.json().catch(() => null as any)
          if (!cancelled) {
            setSupportEmail(json?.supportEmail || json?.contactEmail || null)
          }
        }

        // Fetch most recent briefing with analyst context if available
        const headers: Record<string, string> = {}
        
        // Security: Add analyst context headers for impersonation
        if (analystId) {
          try {
            // Fetch analyst data to get email for proper authentication headers
            const analystResp = await fetch(`/api/analysts/${analystId}`)
            
            if (analystResp.ok) {
              const analystData = await analystResp.json()
              
              if (analystData.email) {
                // Add analyst impersonation headers for secure API calls
                headers['x-analyst-email'] = analystData.email
                headers['x-analyst-id'] = analystId
              }
            }
          } catch (error) {
            console.error('Failed to fetch analyst data for impersonation:', error)
          }
        }
        
        const finalHeaders = {
          ...headers,
          'Cache-Control': 'no-cache'
        }
        
        // Security: Fetch briefings with analyst context for proper data isolation
        // Include analystId in the query to activate the impersonation/vendor-admin guard path in the API
        const briefingsParams = new URLSearchParams({ limit: '1', order: 'desc' })
        if (analystId) briefingsParams.set('analystId', analystId)
        
        const briefingsResp = await fetch(`/api/briefings?${briefingsParams.toString()}`, { 
          headers: finalHeaders
        })
        if (briefingsResp.ok) {
          const briefingsJson = await briefingsResp.json().catch(() => null as any)
          if (!cancelled && briefingsJson?.data?.length > 0) {
            const { normalizeBriefing } = await import('@/lib/normalizers/briefings')
            setMostRecentBriefing(normalizeBriefing(briefingsJson.data[0]))
          }
        }
      } catch {
        if (!cancelled) {
          setSupportEmail(null)
          setMostRecentBriefing(null)
        }
      }
    })()
    return () => { cancelled = true }
  }, [])

  const handleViewLastBriefing = () => {
    if (mostRecentBriefing) {
      setSelectedBriefing(mostRecentBriefing)
    } else {
      // Fallback to briefings page if no recent briefing
      // Security: Preserve analyst context when redirecting
      const currentUrl = new URL(window.location.href)
      const analystId = currentUrl.searchParams.get('analystId')
      
      if (analystId) {
        router.push(`/analyst_portal/vendor_profile/briefings?analystId=${analystId}`)
      } else {
        router.push('/analyst_portal/vendor_profile/briefings')
      }
    }
  }

  const Actions = (
    <>
      <div className="flex items-center justify-between pl-12 pr-6 pt-4">
        <div className="text-base font-semibold text-gray-900">Quick Actions</div>
      </div>
      <div className="flex flex-col gap-2 mt-2 pl-8 pr-6 ">
        <Button variant="ghost" className="justify-start gap-2" onClick={handleViewLastBriefing}>
          <Calendar className="w-4 h-4" />
          View Last Briefing
        </Button>
        <Button variant="ghost" className="justify-start gap-2" onClick={() => router.push('/scheduling-agent')}>
          <MessageSquarePlus className="w-4 h-4" />
          Request a Briefing
        </Button>
        <Button variant="ghost" className="justify-start gap-2" onClick={() => router.push('/analyst_portal/vendor_profile/resources')}>
          <FolderOpen className="w-4 h-4" />
          Recent Materials
        </Button>
        <Button asChild variant="ghost" className="justify-start gap-2">
          <a href="mailto:support@cupcake.com">
            <LifeBuoy className="w-4 h-4" />
            Contact Support
          </a>
        </Button>
        <Button variant="ghost" className="justify-start gap-2" onClick={() => router.push('/analyst_portal/vendor_profile/settings')}>
          <Settings className="w-4 h-4" />
          My Settings
        </Button>
      </div>
    </>
  )

  if (minimal) {
    return (
      <div className="pt-3">
        {Actions}
        
        {/* Briefing Drawer */}
        {selectedBriefing && (
          <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl border-l border-gray-200 z-50">
            <Drawer
              key={`quick-actions-briefing-drawer-${selectedBriefing.id}-${selectedBriefing.updatedAt}`}
              briefing={selectedBriefing}
              activeTab={drawerTab}
              onTabChange={setDrawerTab}
              onClose={() => setSelectedBriefing(null)}
              onUpdate={() => setSelectedBriefing(null)}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        {Actions}
      </div>
      
      {/* Briefing Drawer */}
      {selectedBriefing && (
        <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl border-l border-gray-200 z-50">
          <Drawer
            key={`quick-actions-briefing-drawer-${selectedBriefing.id}-${selectedBriefing.updatedAt}`}
            briefing={selectedBriefing}
            activeTab={drawerTab}
            onTabChange={setDrawerTab}
            onClose={() => setSelectedBriefing(null)}
            onUpdate={() => setSelectedBriefing(null)}
          />
        </div>
      )}
    </>
  )
}

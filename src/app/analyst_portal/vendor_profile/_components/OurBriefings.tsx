import { createClient } from '@/lib/supabase/server'
import OurBriefingsList from './OurBriefingsList'
import { vendorFetch } from '@/lib/vendor-server'

export default async function OurBriefings({ analystId: analystIdProp }: { analystId?: string }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let analystId: string | null = analystIdProp || null

  // If not provided via URL, derive from the current session email
  if (!analystId && user?.email) {
    const { data: analyst } = await supabase
      .from('analysts')
      .select('id, email')
      .eq('email', user.email)
      .single()
    analystId = analyst?.id || null
  }

  // Resolve a vendorDomainId using settings API first (preferred)
  let vendorDomainId: string | undefined = undefined
  try {
    const settingsResp = await vendorFetch('/api/settings/general', { cache: 'no-store' })
    if (settingsResp.ok) {
      try {
        const s = await settingsResp.json()
        if (s?.id) vendorDomainId = s.id as string
      } catch (parseError) {
        console.error('Failed to parse settings response:', parseError)
      }
    }
  } catch (fetchError) {
    console.error('Failed to fetch settings:', fetchError)
  }
  // Fallback: query vendor_domains directly and pick the first
  if (!vendorDomainId) {
    try {
      const { data: vendor } = await supabase
        .from('vendor_domains')
        .select('id')
        .limit(1)
        .single()
      vendorDomainId = vendor?.id || undefined
    } catch {}
  }

  const params = new URLSearchParams({ limit: '10' })
  if (analystId) params.append('analystId', analystId)
  if (vendorDomainId) params.append('vendorDomainId', vendorDomainId)

  // Add analyst context headers for impersonation support
  const headers: Record<string, string> = { 
    Accept: 'application/json',
  }
  
  // If we have analyst info, pass it in headers for API context
  if (analystId) {
    const { data: analystData } = await supabase
      .from('analysts')
      .select('email')
      .eq('id', analystId)
      .single()
    
    if (analystData?.email) {
      headers['x-analyst-email'] = analystData.email
      headers['x-analyst-id'] = analystId
    }
  }
  
  const resp = await vendorFetch(`/api/briefings?${params.toString()}`, {
    cache: 'no-store',
    headers,
  })
  let briefings: any[] = []
  if (resp.ok) {
    try {
      const json = await resp.json()
      briefings = Array.isArray(json?.data) ? json.data : []
    } catch (parseError) {
      console.error('Failed to parse briefings response:', parseError)
      return <div className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">Failed to load briefings data</div>
    }
  } else {
    // Surface authorization issues explicitly in UI instead of silent empty state
    try {
      const err = await resp.json()
      const msg = err?.error || `Request failed (${resp.status})`
      return <div className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">{msg}</div>
    } catch (parseError) {
      console.error('Failed to parse error response:', parseError)
      return <div className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">Request failed (${resp.status})</div>
    }
  }

  if (!briefings.length) {
    return (
      <div className="space-y-4">
        <div className="text-gray-500 italic">It's time they get their frosting on!</div>
        <div className="flex justify-start">
          <a
            href="/scheduling-agent"
            className="inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Schedule First Briefing
          </a>
        </div>
      </div>
    )
  }

  return <OurBriefingsList briefings={briefings} />
}

export function OurBriefingsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-16 rounded-lg bg-gray-100 animate-pulse" />
      <div className="h-16 rounded-lg bg-gray-100 animate-pulse" />
      <div className="h-16 rounded-lg bg-gray-100 animate-pulse" />
    </div>
  )
}


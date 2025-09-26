"use client"

import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'

export type ResourceCategory = 'brand' | 'product' | 'misc'

export interface PortalResource {
  id: string
  title: string
  kind?: 'presentation' | 'guide' | 'demo' | 'case-study' | 'spec' | 'api' | 'whitepaper' | 'video' | 'other'
  sizeLabel?: string // e.g., "4.2 MB"
  url: string // direct file url or API route to stream
  category?: ResourceCategory // brand | product | misc
}

export function ResourcesList() {
  const [items, setItems] = useState<PortalResource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // 1) Try pulling from portal settings (Settings > Analyst Portal)
        // Expecting an optional `resources` array in the payload
        // Vendor-scoped portal settings resources
        let vendorDomain: string | undefined
        try {
          const g = await fetch('/api/settings/general')
          if (g.ok) {
            const gj = await g.json().catch(() => ({} as any))
            vendorDomain = gj?.protected_domain || undefined
          }
        } catch {}
        const qs = new URLSearchParams()
        if (vendorDomain) qs.set('vendorDomain', vendorDomain)
        const s = await fetch(`/api/settings/analyst-portal${qs.toString() ? `?${qs.toString()}` : ''}`)
        if (s.ok) {
          const sj = await s.json().catch(() => ({} as any))
          const fromSettings: PortalResource[] = Array.isArray(sj?.resources) ? sj.resources : []
          if (mounted && fromSettings.length > 0) {
            setItems(fromSettings)
            setLoading(false)
            return
          }
        }

        // 2) If a dedicated portal resources API exists, use it
        const resp = await fetch('/api/portal/resources')
        if (resp.ok) {
          const json = await resp.json().catch(() => ({} as any))
          const list: PortalResource[] = Array.isArray(json) ? json : (json.data || [])
          if (mounted && list?.length) {
            setItems(list)
            setLoading(false)
            return
          }
        }
      } catch {}

      // Fallback sample resources so the UI works even if API not ready
      if (mounted) {
        setItems([
          { id: 'r1', title: 'Logo Pack', kind: 'presentation', sizeLabel: '4.2 MB', url: '/assets/samples/Product-Overview.pdf', category: 'brand' },
          { id: 'r2', title: 'Product Roadmap', kind: 'guide', sizeLabel: '1.8 MB', url: '/assets/samples/ROI-Calculator.xlsx', category: 'product' },
          { id: 'r3', title: 'Platform Demo Recording', kind: 'video', sizeLabel: '125 MB', url: '/assets/samples/Platform-Demo.mp4', category: 'product' },
          { id: 'r4', title: 'Executive Photos', kind: 'other', sizeLabel: '2.1 MB', url: '/assets/samples/Case-Studies.pdf', category: 'brand' },
          { id: 'r5', title: 'API Documentation', kind: 'api', sizeLabel: '—', url: '/api/docs', category: 'product' },
          { id: 'r6', title: 'Security & Compliance', kind: 'spec', sizeLabel: '—', url: '/assets/samples/Security-and-Compliance.pdf', category: 'misc' },
        ])
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const kindLabel = (k?: PortalResource['kind']) => {
    switch (k) {
      case 'presentation': return 'presentation'
      case 'guide': return 'guide'
      case 'demo': return 'demo'
      case 'case-study': return 'case study'
      case 'spec': return 'spec'
      case 'api': return 'api docs'
      case 'video': return 'video'
      case 'whitepaper': return 'whitepaper'
      default: return 'resource'
    }
  }

  const byCategory = useMemo(() => {
    const normCat = (c?: ResourceCategory) => (c === 'brand' || c === 'product' || c === 'misc') ? c : 'misc'
    return {
      brand: items.filter(i => normCat(i.category) === 'brand'),
      product: items.filter(i => normCat(i.category) === 'product'),
      misc: items.filter(i => normCat(i.category) === 'misc'),
    }
  }, [items])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resources</h3>
        <div className="space-y-3 animate-pulse">
          {[1,2,3,4].map(i => (<div key={i} className="h-12 bg-gray-100 rounded" />))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Resources</h3>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  // Build a download URL, signing private storage paths
  const getDownloadHref = async (urlOrPath: string): Promise<string> => {
    // If it looks like a Supabase storage path from the private bucket
    if (urlOrPath.startsWith('resources/')) {
      try {
        const resp = await fetch(`/api/resources/signed-url?path=${encodeURIComponent(urlOrPath)}`)
        const json = await resp.json()
        if (json?.success && json?.url) return json.url
      } catch {}
      return '#'
    }
    return urlOrPath
  }

  const handleDownload = async (e: React.MouseEvent, urlOrPath: string) => {
    e.preventDefault()
    const href = await getDownloadHref(urlOrPath)
    if (href && href !== '#') {
      window.open(href, '_blank')
    }
  }

  const renderSection = (label: string, list: PortalResource[], empty: string) => (
    <section>
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
      </div>
      <div className="divide-y">
        {list.map(item => (
          <div key={item.id} className="px-6 py-4 flex items-center justify-between">
            <div className="min-w-0">
              <div className="font-medium text-gray-900 truncate">{item.title}</div>
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-700">
                  {kindLabel(item.kind)}
                </span>
                {item.sizeLabel && <span>{item.sizeLabel}</span>}
              </div>
            </div>
            <div className="ml-4 shrink-0">
              <button
                onClick={(e) => handleDownload(e, item.url)}
                className="inline-flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </button>
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <div className="px-6 py-10 text-sm text-gray-500">{empty}</div>
        )}
      </div>
    </section>
  )

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {renderSection('Brand Kit', byCategory.brand, 'Load marketing assets such as logos, color palettes, design guidelines, executive pictures, etc')}
      {renderSection('Product', byCategory.product, 'Load product assets such as roadmaps, screenshots, prototypes, etc')}
      {renderSection('Miscellaneous', byCategory.misc, 'No miscellaneous resources yet')}
    </div>
  )
}


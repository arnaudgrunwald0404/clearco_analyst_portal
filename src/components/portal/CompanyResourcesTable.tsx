"use client"

import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'

// Unified resource item for the big table
interface TableResourceItem {
  id: string
  filename: string
  filetype: string
  sizeLabel?: string
  updatedAt?: string | null
  category: 'brand' | 'product' | 'misc' | 'press' | 'briefing'
  url: string
}

export default function CompanyResourcesTable() {
  const [items, setItems] = useState<TableResourceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const aggregated: TableResourceItem[] = []

        // 1) Portal resources (if available)
        try {
          const resp = await fetch('/api/portal/resources')
          if (resp.ok) {
            const json = await resp.json().catch(() => ({} as any))
            const list: any[] = Array.isArray(json) ? json : (json.data || [])
            for (const r of list) {
              aggregated.push({
                id: r.id || `portal-${r.url || r.title}`,
                filename: r.title || (r.url ? r.url.split('/').pop() : 'resource') || 'resource',
                filetype: inferType(r.url || ''),
                sizeLabel: r.sizeLabel || r.size || undefined,
                updatedAt: r.updatedAt || r.updated_at || null,
                category: normalizeCategory(r.category) as TableResourceItem['category'],
                url: r.url,
              })
            }
          }
        } catch {}

        // 2) Analyst portal settings resources (fallback)
        try {
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
            const fromSettings: any[] = Array.isArray(sj?.resources) ? sj.resources : []
            for (const r of fromSettings) {
              aggregated.push({
                id: r.id || `settings-${r.url || r.title}`,
                filename: r.title || (r.url ? r.url.split('/').pop() : 'resource') || 'resource',
                filetype: inferType(r.url || ''),
                sizeLabel: r.sizeLabel || r.size || undefined,
                updatedAt: r.updatedAt || r.updated_at || null,
                category: normalizeCategory(r.category) as TableResourceItem['category'],
                url: r.url,
              })
            }
          }
        } catch {}

        // 3) Logos (from BrandKit static assets)
        const logoAssets = [
          { label: 'Logo - Color (PNG)', href: '/assets/brand/logo-color.png' },
          { label: 'Logo - White (PNG)', href: '/assets/brand/logo-white.png' },
          { label: 'Logo - SVG', href: '/assets/brand/logo.svg' },
        ]
        for (const l of logoAssets) {
          aggregated.push({
            id: `logo-${l.href}`,
            filename: l.label,
            filetype: inferType(l.href),
            sizeLabel: undefined,
            updatedAt: null,
            category: 'brand',
            url: l.href,
          })
        }

        // 4) Press releases (as links)
        try {
          const pr = await fetch('/api/press-releases')
          if (pr.ok) {
            const json = await pr.json().catch(() => ({} as any))
            const list: any[] = Array.isArray(json) ? json : (json.data || [])
            for (const p of list) {
              aggregated.push({
                id: p.id || `press-${p.url || p.title}`,
                filename: p.title || (p.url ? p.url.split('/').pop() : 'press release') || 'press release',
                filetype: 'link',
                sizeLabel: undefined,
                updatedAt: p.publishedAt || p.updatedAt || null,
                category: 'press',
                url: p.url,
              })
            }
          }
        } catch {}

        // 5) Briefing materials (contentUrl)
        try {
          const b = await fetch('/api/briefings?limit=100&order=desc')
          if (b.ok) {
            const bj = await b.json().catch(() => ({} as any))
            const list: any[] = bj?.data || bj || []
            for (const br of list) {
              const cu = br.contentUrl || br.contenturl
              if (cu && typeof cu === 'string' && cu.trim()) {
                aggregated.push({
                  id: `briefing-${br.id}`,
                  filename: deriveBriefingFilename(br, cu),
                  filetype: inferType(cu),
                  sizeLabel: undefined,
                  updatedAt: br.updatedAt || br.updated_at || null,
                  category: 'briefing',
                  url: cu,
                })
              }
            }
          }
        } catch {}

        if (mounted) {
          // Sort by updatedAt desc, nulls last
          aggregated.sort((a, b) => {
            const ad = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
            const bd = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
            return bd - ad
          })
          setItems(aggregated)
          setLoading(false)
        }
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : 'Failed to load resources')
          setLoading(false)
        }
      }
    })()
    return () => { mounted = false }
  }, [])

  const handleDownload = async (e: React.MouseEvent, urlOrPath: string) => {
    e.preventDefault()
    const href = await getDownloadHref(urlOrPath)
    if (href && href !== '#') {
      window.open(href, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resources</h3>
        <div className="space-y-3 animate-pulse">
          {[1,2,3,4,5,6].map(i => (<div key={i} className="h-10 bg-gray-100 rounded" />))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Resources</h3>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Resources</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-gray-700">Filename</th>
              <th className="text-left px-3 py-3 font-medium text-gray-700">Type</th>
              <th className="text-left px-3 py-3 font-medium text-gray-700">Size</th>
              <th className="text-left px-3 py-3 font-medium text-gray-700">Updated</th>
              <th className="text-left px-3 py-3 font-medium text-gray-700">Category</th>
              <th className="text-right px-6 py-3 font-medium text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((it) => (
              <tr key={it.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 align-top">
                  <div className="max-w-[520px] truncate text-gray-900">{it.filename}</div>
                </td>
                <td className="px-3 py-3 align-top text-gray-700">{it.filetype}</td>
                <td className="px-3 py-3 align-top text-gray-700">{it.sizeLabel || '—'}</td>
                <td className="px-3 py-3 align-top text-gray-700">{it.updatedAt ? new Date(it.updatedAt).toLocaleDateString() : '—'}</td>
                <td className="px-3 py-3 align-top">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-700 capitalize">
                    {it.category}
                  </span>
                </td>
                <td className="px-6 py-3 align-top text-right">
                  <button
                    onClick={(e) => handleDownload(e, it.url)}
                    className="inline-flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-sm text-gray-500">No company resources available yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function inferType(url: string): string {
  const lower = url.toLowerCase()
  if (lower.startsWith('http') && !/\.(pdf|ppt|pptx|doc|docx|png|jpg|jpeg|svg|mp4|mov)(\?|$)/.test(lower)) return 'link'
  const m = lower.match(/\.([a-z0-9]+)(\?|$)/)
  return m ? m[1] : 'file'
}

function normalizeCategory(c: any): 'brand' | 'product' | 'misc' | 'press' | 'briefing' {
  const lc = String(c || '').toLowerCase()
  if (['brand','brandkit','brand-kit'].includes(lc)) return 'brand'
  if (['product'].includes(lc)) return 'product'
  if (['press','press-release','press-releases'].includes(lc)) return 'press'
  if (['briefing','briefings','deck','briefing-deck'].includes(lc)) return 'briefing'
  return 'misc'
}

function deriveBriefingFilename(br: any, url: string): string {
  const base = br?.title ? `Briefing: ${br.title}` : 'Briefing material'
  const leaf = url?.split('/').pop()
  if (leaf && !/^https?:/i.test(url)) return `${base} (${leaf})`
  return base
}

async function getDownloadHref(urlOrPath: string): Promise<string> {
  try {
    // If using a protected storage path that requires signing, adapt here
    if (urlOrPath.startsWith('resources/')) {
      const resp = await fetch(`/api/resources/signed-url?path=${encodeURIComponent(urlOrPath)}`)
      const json = await resp.json()
      if (json?.success && json?.url) return json.url
      return '#'
    }
  } catch {}
  return urlOrPath
}

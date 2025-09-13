"use client"

import { useEffect, useMemo, useState } from 'react'

interface PressRelease {
  id: string
  title: string
  url: string
  publishedAt?: string
}

export function BrandKit() {
  const [press, setPress] = useState<PressRelease[]>([])

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        const resp = await fetch('/api/press-releases?limit=3')
        const json = await resp.json().catch(() => ({} as any))
        const list: PressRelease[] = Array.isArray(json) ? json : (json.data || [])
        if (isMounted) setPress(list.slice(0,3))
      } catch {}
    })()
    return () => { isMounted = false }
  }, [])

  const logos = useMemo(() => [
    { label: 'Logo - Color (PNG)', href: '/assets/brand/logo-color.png' },
    { label: 'Logo - White (PNG)', href: '/assets/brand/logo-white.png' },
    { label: 'Logo - SVG', href: '/assets/brand/logo.svg' },
  ], [])

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Mission</h3>
        <p className="text-gray-700">Empower vendors and analysts to build trusted relationships through transparent insights and delightful collaboration.</p>
      </section>
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Vision</h3>
        <p className="text-gray-700">Be the most loved platform for analyst relations — where every briefing becomes a breakthrough.</p>
      </section>
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Values</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>Trust and candor</li>
          <li>Customer obsession</li>
          <li>Craft and simplicity</li>
          <li>Bias for action</li>
        </ul>
      </section>
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">History</h3>
        <p className="text-gray-700">Founded in 2024, we set out to modernize Analyst Relations tooling from scheduling to insight generation.</p>
      </section>
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Logos for download</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {logos.map((l) => (
            <a key={l.label} href={l.href} download className="border rounded-md p-3 hover:bg-gray-50 text-sm text-blue-600">
              {l.label}
            </a>
          ))}
        </div>
      </section>
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Latest press releases</h3>
        {press.length === 0 ? (
          <div className="text-gray-500 text-sm">No press releases available.</div>
        ) : (
          <ul className="space-y-2 text-sm">
            {press.map(p => (
              <li key={p.id} className="flex items-center justify-between">
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {p.title}
                </a>
                {p.publishedAt && (
                  <span className="text-gray-500 ml-3">{new Date(p.publishedAt).toLocaleDateString()}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}


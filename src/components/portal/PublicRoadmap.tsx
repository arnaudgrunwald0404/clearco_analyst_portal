"use client"

import { useEffect, useState } from 'react'

interface RoadmapItem {
  id: string
  title: string
  status: 'planned' | 'in-progress' | 'done'
  eta?: string
  description?: string
}

export function PublicRoadmap() {
  const [items, setItems] = useState<RoadmapItem[]>([])

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        const resp = await fetch('/api/roadmap/public')
        const json = await resp.json().catch(() => ([] as any))
        const list: RoadmapItem[] = Array.isArray(json) ? json : (json.data || [])
        if (isMounted) setItems(list)
      } catch {}
    })()
    return () => { isMounted = false }
  }, [])

  if (!items || items.length === 0) {
    return <div className="p-6 text-gray-500">No roadmap items yet.</div>
  }

  const cols = [
    { key: 'planned', title: 'Planned' },
    { key: 'in-progress', title: 'In Progress' },
    { key: 'done', title: 'Done' },
  ] as const

  return (
    <div className="p-6">
      <div className="grid md:grid-cols-3 gap-6">
        {cols.map(col => (
          <div key={col.key} className="bg-white border rounded-lg shadow-sm">
            <div className="px-4 py-3 border-b font-medium">{col.title}</div>
            <div className="p-4 space-y-3">
              {items.filter(i => i.status === col.key).map(item => (
                <div key={item.id} className="border rounded-md p-3">
                  <div className="font-medium text-gray-900">{item.title}</div>
                  {item.description && (
                    <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                  )}
                  {item.eta && (
                    <div className="text-xs text-gray-500 mt-2">ETA: {new Date(item.eta).toLocaleDateString()}</div>
                  )}
                </div>
              ))}
              {items.filter(i => i.status === col.key).length === 0 && (
                <div className="text-sm text-gray-500">Nothing here yet.</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


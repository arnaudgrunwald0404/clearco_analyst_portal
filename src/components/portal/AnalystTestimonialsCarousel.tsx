"use client"

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'

interface Testimonial {
  id: string
  text: string
  author: string
  company?: string
  rating?: number
  date?: string
}

export function AnalystTestimonialsCarousel() {
  const [items, setItems] = useState<Testimonial[]>([])
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        const resp = await fetch('/api/testimonials')
        const json = await resp.json().catch(() => ([] as any))
        const list: Testimonial[] = Array.isArray(json) ? json : (json.data || [])
        if (isMounted) setItems(list)
      } catch {}
    })()
    return () => { isMounted = false }
  }, [])

  if (!items || items.length === 0) {
    return (
      <div className="p-6 text-gray-500">No testimonials yet.</div>
    )
  }

  const current = items[idx]

  const next = () => setIdx((i) => (i + 1) % items.length)
  const prev = () => setIdx((i) => (i - 1 + items.length) % items.length)

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="p-2 rounded hover:bg-gray-100" aria-label="Previous">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-sm text-gray-500">{idx + 1} / {items.length}</div>
        <button onClick={next} className="p-2 rounded hover:bg-gray-100" aria-label="Next">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white border rounded-lg p-6 shadow-sm">
        {typeof current.rating === 'number' && (
          <div className="flex mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-4 h-4 ${i < (current.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
            ))}
          </div>
        )}
        <blockquote className="text-gray-800 text-lg leading-relaxed">
          “{current.text}”
        </blockquote>
        <div className="mt-4 text-sm text-gray-700">
          <span className="font-semibold">{current.author}</span>
          {current.company && <span className="ml-1">• {current.company}</span>}
        </div>
      </div>
    </div>
  )
}


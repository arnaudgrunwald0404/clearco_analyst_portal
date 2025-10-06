"use client"

import { useEffect, useMemo, useState } from "react"
import { Quote, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

interface PortalTestimonial {
  id: string
  quote: string
  author: string
  title?: string
  company?: string
  date: string
  verified?: boolean
  context?: string
  image?: string | null
}

function formatDate(dateString: string) {
  const d = new Date(dateString)
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

export default function TestimonialsOnRelationship() {
  const [items, setItems] = useState<PortalTestimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [companyName, setCompanyName] = useState<string>("Your company")

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // Fetch testimonials
        const resp = await fetch("/api/testimonials")
        const json = await resp.json().catch(() => ({} as any))
        const list = Array.isArray(json) ? json : (json?.data ?? [])
        const mapped: PortalTestimonial[] = list.map((t: any) => ({
          id: t.id,
          quote: t.quote ?? t.text ?? "",
          author: t.analyst ? `${t.analyst.firstName || ""} ${t.analyst.lastName || ""}`.trim() : (t.author || ""),
          title: t.analyst?.title || undefined,
          company: t.analyst?.company || t.company || undefined,
          date: t.createdAt || t.created_at || new Date().toISOString(),
          verified: Boolean(t.isPublished ?? t.is_published ?? true),
          context: t.context || "",
          image: t.analyst?.profileImageUrl || null,
        }))
        if (mounted) setItems(mapped)
      } catch {
        if (mounted) setItems([])
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    ;(async () => {
      try {
        const settingsResp = await fetch("/api/settings/general")
        if (settingsResp.ok) {
          const s = await settingsResp.json().catch(() => ({} as any))
          setCompanyName((s.company_name || s.companyName || "your company").trim())
        }
      } catch {}
    })()

    return () => { mounted = false }
  }, [])

  if (loading) {
    return (
      <section className="mt-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">What analysts say about {companyName}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="p-6 bg-white rounded-lg border border-gray-200 animate-pulse h-40" />
          ))}
        </div>
      </section>
    )
  }

  if (!items || items.length === 0) {
    return null
  }

  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">What analysts say about {companyName}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((t) => (
          <div key={t.id} className="p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow flex flex-col h-full">
            <div className="flex-1">
              <div className="mb-4">
                <Quote className="w-5 h-5 text-gray-300 mb-2" />
                <p className="text-gray-900 font-medium leading-relaxed">{t.quote}</p>
                {t.context && (
                  <p className="text-sm text-gray-500 mt-2 italic">— {t.context}</p>
                )}
              </div>
            </div>
            <div className="mt-auto">
              <div className="flex items-center mb-4">
                {t.image ? (
                  <img
                    src={t.image}
                    alt={t.author}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      const el = e.currentTarget as HTMLImageElement
                      el.src = `https://i.pravatar.cc/40?u=${encodeURIComponent(t.author || t.id)}`
                    }}
                  />
                ) : (
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm', 'bg-blue-500')}>
                    {(t.author || 'A').split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase()}
                  </div>
                )}
                <div className="ml-3">
                  <p className="font-semibold text-gray-900 text-sm">{t.author}</p>
                  {t.title && <p className="text-xs text-gray-600">{t.title}</p>}
                  <p className="text-xs font-medium text-blue-600">{t.company}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200 text-xs text-gray-500">
                {formatDate(t.date)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  MessageSquare,
  Quote,
  User,
  Search,
  Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

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

const categories = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'GENERAL', label: 'General' }
]

function formatDate(dateString: string) {
  const d = new Date(dateString)
  return isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function PortalTestimonialsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [items, setItems] = useState<PortalTestimonial[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const resp = await fetch('/api/testimonials')
        const json = await resp.json().catch(() => ({}))
        const list = Array.isArray(json) ? json : (json?.data ?? [])
        const mapped: PortalTestimonial[] = list.map((t: any) => ({
          id: t.id,
          quote: t.quote ?? t.text ?? '',
          author: t.analyst ? `${t.analyst.firstName || ''} ${t.analyst.lastName || ''}`.trim() : (t.author || ''),
          title: t.analyst?.title || undefined,
          company: t.analyst?.company || t.company || undefined,
          date: t.createdAt || t.created_at || new Date().toISOString(),
          verified: Boolean(t.isPublished ?? t.is_published ?? true),
          context: t.context || '',
          image: t.analyst?.profileImageUrl || null,
        }))
        if (mounted) setItems(mapped)
      } catch (e) {
        console.error('Failed to fetch testimonials:', e)
        if (mounted) setItems([])
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const filteredTestimonials = useMemo(() => {
    return items.filter(testimonial => {
      const q = searchTerm.toLowerCase()
      const matchesSearch = testimonial.quote.toLowerCase().includes(q) ||
        testimonial.author.toLowerCase().includes(q) ||
        (testimonial.company || '').toLowerCase().includes(q) ||
        (testimonial.context || '').toLowerCase().includes(q)
      const matchesCategory = selectedCategory === 'ALL'
      return matchesSearch && matchesCategory
    })
  }, [items, searchTerm, selectedCategory])

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ')
    return parts.slice(0, 2).map(p => p[0]).join('').toUpperCase() || 'A'
  }

  const getAvatarColor = (name: string) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500']
    const hash = name.charCodeAt(0) + (name.charCodeAt(1) || 0)
    return colors[hash % colors.length]
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analyst Testimonials</h1>
        <p className="mt-2 text-gray-600">
          Verified testimonials and quotes from industry analysts about our platform and services
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search testimonials..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="px-3 py-2 border border-input bg-background rounded-md"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="p-6 bg-white rounded-lg border border-gray-200 animate-pulse h-40" />
          ))}
        </div>
      )}

      {/* Testimonials Grid - match admin card layout */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTestimonials.map((t) => (
            <div key={t.id} className="p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">

              {/* Quote */}
              <div className="mb-4">
                <Quote className="w-5 h-5 text-gray-300 mb-2" />
                <p className="text-gray-900 font-medium leading-relaxed">“{t.quote}”</p>
                {t.context && (
                  <p className="text-sm text-gray-500 mt-2 italic">— {t.context}</p>
                )}
              </div>

              {/* Analyst Info */}
              <div className="flex items-center">
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
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm', getAvatarColor(t.author))}>
                    {getInitials(t.author)}
                  </div>
                )}
                <div className="ml-3">
                  <p className="font-semibold text-gray-900 text-sm">{t.author}</p>
                  {t.title && <p className="text-xs text-gray-600">{t.title}</p>}
                  <p className="text-xs font-medium text-blue-600">{t.company}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                {formatDate(t.date)}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredTestimonials.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-500">No testimonials found matching your criteria.</div>
        </div>
      )}
    </>
  )
}

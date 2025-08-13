'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Star, Quote } from 'lucide-react'
import { Caveat } from 'next/font/google'

const caveat = Caveat({ subsets: ['latin'], weight: ['400', '700'] })

interface Testimonial {
  id: string
  text: string
  author: string
  company: string
  rating: number
  date: string
}

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await fetch('/api/testimonials')
        const json = await response.json()
        const list = Array.isArray(json) ? json : (Array.isArray(json.data) ? json.data : [])
        setTestimonials(list)
      } catch (error) {
        console.error('Error fetching testimonials:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTestimonials()
  }, [])

  if (isLoading) {
    return (
      <section className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Vendor Testimonials
        </h2>
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-100 h-32 rounded-lg" />
          ))}
        </div>
      </section>
    )
  }

  if (!Array.isArray(testimonials) || testimonials.length === 0) {
    return null
  }

  return (
    <section className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Vendor Testimonials
      </h2>
      
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
        {testimonials.map((t, idx) => {
          const initials = (t.author || '').split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase() || 'A'
          const rotations = ['rotate-1', '-rotate-1', 'rotate-2', '-rotate-2']
          const rotation = rotations[idx % rotations.length]
          return (
            <div key={t.id} className="inline-block w-full break-inside-avoid mb-6">
              <div className={cn(
'relative w-full bg-yellow-100 rounded-sm shadow-[0_10px_20px_rgba(0,0,0,0.12)] p-4 border border-yellow-200',
                'transition-transform hover:rotate-0 hover:scale-[1.02]',
                rotation
              )}>
                {/* Tape at top */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-yellow-200/80 rounded-sm shadow-sm" />

                {/* Quote content */}
                <div className="h-full flex flex-col">
                  <div className="flex-1">
                    <Quote className="w-6 h-6 text-yellow-500/70 mb-2" />
                    <p className={cn('text-gray-800 text-[1.05rem] leading-relaxed italic', caveat.className)}>
                      “{t.text}”
                    </p>
                  </div>

                  {/* Bottom author area */}
                  <div className="mt-4 pt-3 border-t border-yellow-200 flex items-center gap-3">
                    {/* Avatar placeholder with initials */}
                    <div className="w-10 h-10 rounded-full bg-yellow-300 text-yellow-900 flex items-center justify-center font-bold">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{t.author}</div>
                      <div className="text-xs text-gray-700 truncate">{t.company}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
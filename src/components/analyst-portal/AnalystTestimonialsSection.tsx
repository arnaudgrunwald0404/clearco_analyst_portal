'use client'

import { useState, useEffect } from 'react'
import { Star, Quote } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AnalystTestimonial } from '@/types/analyst-portal'

export function AnalystTestimonialsSection() {
  const [testimonials, setTestimonials] = useState<AnalystTestimonial[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await fetch('/api/analyst-portal/testimonials')
        const data = await response.json()
        setTestimonials(data)
      } catch (error) {
        console.error('Error fetching analyst testimonials:', error)
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
          Vendor Testimonials for Analysts
        </h2>
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-100 h-32 rounded-lg" />
          ))}
        </div>
      </section>
    )
  }

  if (testimonials.length === 0) {
    return null
  }

  return (
    <section className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Vendor Testimonials for Analysts
      </h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {testimonials.map((testimonial) => (
          <div
            key={testimonial.id}
            className="relative bg-gray-50 rounded-lg p-6"
          >
            <Quote className="absolute right-4 top-4 h-8 w-8 text-gray-200" />
            
            {/* Rating */}
            <div className="flex items-center mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-4 w-4',
                    i < testimonial.rating
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  )}
                />
              ))}
            </div>

            {/* Testimonial Text */}
            <blockquote className="text-gray-700 mb-4">
              "{testimonial.text}"
            </blockquote>

            {/* Author Info */}
            <footer className="text-sm text-gray-600">
              <span className="font-medium">{testimonial.author}</span>
              <span className="mx-1">•</span>
              <span>{testimonial.company}</span>
            </footer>
          </div>
        ))}
      </div>
    </section>
  )
}
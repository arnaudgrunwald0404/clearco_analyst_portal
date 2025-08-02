'use client'

import { Quote } from 'lucide-react'

interface QuoteDisplayProps {
  quote?: {
    text: string
    author: string
    role?: string
  }
}

export function QuoteDisplay({ quote }: QuoteDisplayProps) {
  if (!quote) return null

  return (
    <div className="relative pl-12 py-4">
      <Quote className="absolute left-0 top-4 h-8 w-8 text-blue-500 opacity-50" />
      <blockquote className="text-lg text-gray-700 italic">
        "{quote.text}"
      </blockquote>
      <footer className="mt-2 text-sm text-gray-600">
        <span className="font-medium">{quote.author}</span>
        {quote.role && (
          <>
            <span className="mx-1">•</span>
            <span>{quote.role}</span>
          </>
        )}
      </footer>
    </div>
  )
}
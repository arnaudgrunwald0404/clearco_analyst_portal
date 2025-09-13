'use client'

import { Quote } from 'lucide-react'

interface QuoteDisplayProps {
  quote?: {
    text: string
    author: string
    role?: string
    authorImageUrl?: string
  }
  analystProfile?: {
    firstName?: string
    lastName?: string
    company?: string
  }
}

export function QuoteDisplay({ quote, analystProfile }: QuoteDisplayProps) {
  if (!quote) return null

  // Function to replace variables in the quote text
  const replaceVariables = (text: string): string => {
    if (!analystProfile) return text
    
    return text
      .replace(/\{first_name\}/gi, analystProfile.firstName || '')
      .replace(/\{company_name\}/gi, analystProfile.company || '')
      .replace(/\{full_name\}/gi, `${analystProfile.firstName || ''} ${analystProfile.lastName || ''}`.trim())
      .replace(/\{industry_name\}/gi, analystProfile.company || '') // Fallback to company for industry
  }

  const processedText = replaceVariables(quote.text)

  return (
    <div className="relative pl-12 py-4">
      {quote.authorImageUrl && (
          <img 
            src={quote.authorImageUrl} 
            alt={`${quote.author}`}
            className="w-24 h-24 rounded-full object-cover"
          />
        )}
      <blockquote className="text-lg text-gray-700 italic">
        "{processedText}"
      </blockquote>
      <footer className="mt-2 flex items-center gap-3">
        
        <div className="text-sm text-gray-600">
          <span className="font-medium">{quote.author}</span>
          {quote.role && (
            <>
              <span className="mx-1">•</span>
              <span>{quote.role}</span>
            </>
          )}
        </div>
      </footer>
    </div>
  )
}
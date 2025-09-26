'use client'

import { Quote } from 'lucide-react'
import { useSettings } from '@/contexts/SettingsContext'

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
  const { settings } = useSettings()
  if (!quote) return null

  // Function to replace variables in the quote text
  const replaceVariables = (text: string): string => {
    const companyFromSettings = settings?.companyName || ''

    let out = text
      .replace(/\{first_name\}/gi, analystProfile?.firstName || '')
      .replace(/\{full_name\}/gi, `${analystProfile?.firstName || ''} ${analystProfile?.lastName || ''}`.trim())
      // Always prefer the company name from Settings (General)
      .replace(/\{company_name\}/gi, companyFromSettings)

    // Optionally map industry if needed; fallback to settings company name when no explicit industry field
    out = out.replace(/\{industry_name\}/gi, companyFromSettings)

    return out
  }

  const processedText = replaceVariables(quote.text)

  return (
    <div className="relative pl-12 py-4">
      {quote.authorImageUrl && (
          <img 
            src={quote.authorImageUrl} 
            alt={`${quote.author}`}
            className="w-20 h-20 rounded-full object-cover"
          />
        )}
      <blockquote className="text-lg text-gray-700 italic">
        "{processedText}"
      </blockquote>
      <footer className="mt-2">
        <div className="text-sm text-gray-600">
          <div className="font-medium">{quote.author}</div>
          {quote.role && (
            <div>{quote.role}</div>
          )}
        </div>
      </footer>
    </div>
  )
}

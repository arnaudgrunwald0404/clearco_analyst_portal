'use client'

import { useState, useEffect } from 'react'
import { useSettings } from '@/contexts/SettingsContext'
import { AnalystBriefingCard } from '@/components/analyst-portal/AnalystBriefingCard'
import { AnalystPublicationsSection } from '@/components/analyst-portal/AnalystPublicationsSection'
import { AnalystTestimonialsSection } from '@/components/analyst-portal/AnalystTestimonialsSection'
import { AnalystQuoteDisplay } from '@/components/analyst-portal/AnalystQuoteDisplay'

export default function AnalystPortalPage() {
  const { settings } = useSettings()
  const [lastBriefing, setLastBriefing] = useState<any>(null)
  const [nextBriefing, setNextBriefing] = useState<any>(null)

  // Fetch briefings data
  useEffect(() => {
    const fetchBriefings = async () => {
      try {
        // Fetch last briefing
        const lastResponse = await fetch('/api/analyst-portal/briefings/last')
        const lastData = await lastResponse.json()
        setLastBriefing(lastData)

        // Fetch next briefing
        const nextResponse = await fetch('/api/analyst-portal/briefings/next')
        const nextData = await nextResponse.json()
        setNextBriefing(nextData)
      } catch (error) {
        console.error('Error fetching analyst briefings:', error)
      }
    }

    fetchBriefings()
  }, [])

  return (
    <div className="space-y-8">
      {/* Welcome Section with Quote */}
      <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome to Your Analyst Portal
        </h1>
        <AnalystQuoteDisplay quote={settings?.analystQuote} />
      </section>

      {/* Briefings Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Last Briefing */}
        <AnalystBriefingCard
          type="last"
          briefing={lastBriefing}
          className="bg-white rounded-xl shadow-sm"
        />

        {/* Next Briefing */}
        <AnalystBriefingCard
          type="next"
          briefing={nextBriefing}
          className="bg-white rounded-xl shadow-sm"
        />
      </div>

      {/* Testimonials Section */}
      <AnalystTestimonialsSection />

      {/* Publications Section */}
      <AnalystPublicationsSection />
    </div>
  )
}
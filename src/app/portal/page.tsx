'use client'

import { useState, useEffect } from 'react'
import { useSettings } from '@/contexts/SettingsContext'
import { useAuth } from '@/contexts/AuthContext'
import { BriefingCard } from '@/components/portal/BriefingCard'
import { PublicationsSection } from '@/components/portal/PublicationsSection'
import { TestimonialsSection } from '@/components/portal/TestimonialsSection'
import { QuoteDisplay } from '@/components/portal/QuoteDisplay'
import { ProfileWidget } from '@/components/portal/ProfileWidget'
import { AvailabilitySlots } from '@/components/portal/AvailabilitySlots'

export default function PortalPage() {
  const { settings } = useSettings()
  const { user } = useAuth()
  const [lastBriefing, setLastBriefing] = useState<any>(null)
  const [nextBriefing, setNextBriefing] = useState<any>(null)
  const [analystProfile, setAnalystProfile] = useState<any>(null)

  // Fetch briefings and analyst data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch last briefing
        const lastResponse = await fetch('/api/briefings/last')
        const lastData = await lastResponse.json()
        setLastBriefing(lastData)

        // Fetch next briefing
        const nextResponse = await fetch('/api/briefings/next')
        const nextData = await nextResponse.json()
        setNextBriefing(nextData)

        // Fetch analyst profile
        if (user?.email) {
          try {
            const profileResponse = await fetch(`/api/analysts/by-email/${encodeURIComponent(user.email)}`)
            const profileResult = await profileResponse.json()
            if (profileResult.success) {
              setAnalystProfile({
                name: `${profileResult.data.firstName} ${profileResult.data.lastName}`,
                profileImageUrl: profileResult.data.profileImageUrl,
                topics: profileResult.data.topics || [],
              })
            }
          } catch (e) {
            console.error("Failed to fetch analyst profile for widget", e)
          }
        }
      } catch (error) {
        console.error('Error fetching portal data:', error)
      }
    }

    fetchData()
  }, [user])

  return (
    <div className="space-y-8">
      {/* Welcome Section with Quote */}
      <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome to Your Analyst Portal
        </h1>
        <QuoteDisplay quote={settings?.analystQuote} />
      </section>

      {/* Profile Widget */}
      {analystProfile && <ProfileWidget analyst={analystProfile} />}

      {/* Interactive Scheduling Section */}
      <AvailabilitySlots />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Publications Section */}
      <PublicationsSection />
    </div>
  )
}
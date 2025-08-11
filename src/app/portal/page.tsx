'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
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
  const [recentBriefings, setRecentBriefings] = useState<any[]>([])
  const [upcomingBriefings, setUpcomingBriefings] = useState<any[]>([])
  const [analystProfile, setAnalystProfile] = useState<any>(null)
  const [pubsPast, setPubsPast] = useState<any[]>([])
  const [pubsUpcoming, setPubsUpcoming] = useState<any[]>([])
  const [portalSettings, setPortalSettings] = useState<{ welcomeQuote?: string; quoteAuthor?: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'peers'>('profile')

  // Fetch briefings and analyst data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch portal settings (quote)
        try {
          const sRes = await fetch('/api/settings/analyst-portal')
          if (sRes.ok) {
            const sJson = await sRes.json()
            setPortalSettings(sJson || null)
          }
        } catch {}

        // Fetch last briefing
        const lastResponse = await fetch('/api/briefings/last')
        const lastData = await lastResponse.json()
        setLastBriefing(lastData)

        // Fetch next briefing
        const nextResponse = await fetch('/api/briefings/next')
        const nextData = await nextResponse.json()
        setNextBriefing(nextData)

        // Fetch recent completed briefings (max 3)
        try {
          const rRes = await fetch('/api/briefings?status=COMPLETED&limit=3')
          const rJson = await rRes.json()
          setRecentBriefings(rJson?.data || [])
        } catch {}

        // Fetch upcoming scheduled briefings (max 3)
        try {
          const uRes = await fetch('/api/briefings?status=SCHEDULED&upcoming=true&limit=3')
          const uJson = await uRes.json()
          setUpcomingBriefings(uJson?.data || [])
        } catch {}

        // Fetch analyst profile and publications
        if (user?.email) {
          try {
            const profileResponse = await fetch(`/api/analysts/by-email/${encodeURIComponent(user.email)}`)
            const profileResult = await profileResponse.json()
            if (profileResult.success) {
              const prof = profileResult.data
              setAnalystProfile({
                id: prof.id,
                firstName: prof.firstName,
                lastName: prof.lastName,
                company: prof.company,
                profileImageUrl: prof.profileImageUrl,
                twitter: prof.twitter,
                linkedIn: prof.linkedIn,
                topics: prof.topics || [],
              })

              // Past publications (last 2 years)
              try {
                const pastRes = await fetch(`/api/analysts/${prof.id}/publications`)
                const pastJson = await pastRes.json()
                if (pastJson.success) setPubsPast(pastJson.data || [])
              } catch {}

              // Upcoming publications (next 6 months)
              try {
                const upRes = await fetch(`/api/publications?analystId=${encodeURIComponent(prof.id)}&filter=upcoming`)
                const upJson = await upRes.json()
                const arr = Array.isArray(upJson) ? upJson : (upJson.data || [])
                setPubsUpcoming(arr)
              } catch {}
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
    <div className="px-6 sm:px-8 lg:px-12 py-6 space-y-8">
      {/* Page Header */}
      <section className="bg-white rounded-xl shadow-sm p-6 sm:p-8 space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Welcome to Your Analyst Portal
        </h1>
        <div className="text-gray-600">
          <QuoteDisplay quote={{ text: portalSettings?.welcomeQuote || '', author: portalSettings?.quoteAuthor || '' }} />
        </div>
      </section>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'profile' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'peers' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          onClick={() => setActiveTab('peers')}
        >
          Peers & Testimonials
        </button>
      </div>

      {activeTab === 'profile' && (
        <>
          {/* Profile Widget */}
          {analystProfile && (
            <section className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
              <ProfileWidget analyst={analystProfile} publications={{ past: pubsPast, upcoming: pubsUpcoming }} />
            </section>
          )}

          {/* Interactive Scheduling Section */}
          <section className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Schedule a Briefing</h2>
            <AvailabilitySlots />
          </section>

          {/* Briefings summary */}
          <section className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Briefings</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {recentBriefings.slice(0,3).map((b:any, idx:number) => (
                <BriefingCard key={b.id || idx} type="last" briefing={b} />
              ))}
              {recentBriefings.length === 0 && (
                <div className="text-gray-600">No recent briefings found.</div>
              )}
            </div>
          </section>

          {/* Scheduled briefings */}
          <section className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Scheduled Briefings</h2>
            {upcomingBriefings.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-4">
                {upcomingBriefings.map((b:any) => (
                  <BriefingCard key={b.id} type="next" briefing={b} />
                ))}
              </div>
            ) : (
              <div className="text-gray-600">
                There are no scheduled briefings at this time. <a href="/briefings" className="text-blue-600 hover:underline">Schedule a briefing?</a>
              </div>
            )}
          </section>

          {/* Insights and follow-ups placeholder */}
          <section className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Insights & Follow-ups</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-semibold text-gray-900 mb-2">Key Insights</div>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>No insights captured yet.</li>
                </ul>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900 mb-2">Follow-ups</div>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>No follow-ups recorded.</li>
                </ul>
              </div>
            </div>
          </section>
        </>
      )}

      {activeTab === 'peers' && (
        <section className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Peers & Testimonials</h2>
          <TestimonialsSection />
          <div className="pt-6 text-sm text-gray-700">
            Want to contact ClearCompany? Use this email: <a href="mailto:agrunwald@clearcompany.com" className="text-blue-600 hover:underline">agrunwald@clearcompany.com</a>
          </div>
        </section>
      )}
    </div>
  )
}
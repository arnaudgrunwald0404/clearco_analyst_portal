'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useSettings } from '@/contexts/SettingsContext'
import { useAuth } from '@/contexts/AuthContext'
import { QuoteDisplay } from '@/components/portal/QuoteDisplay'
import { ProfileWidget } from '@/components/portal/ProfileWidget'
import { AvailabilitySlots } from '@/components/portal/AvailabilitySlots'
import { Button } from '@/components/ui/button'
import { Calendar, FileText } from 'lucide-react'
import AnalystDrawer from '@/components/drawers/analyst-drawer'
import BriefingDrawer from '@/app/briefings/components/drawer/Drawer'
import { AnalystTestimonialsCarousel } from '@/components/portal/AnalystTestimonialsCarousel'
import { PublicRoadmap } from '@/components/portal/PublicRoadmap'
import { BrandKit } from '@/components/portal/BrandKit'

export default function PortalPage() {
  const { settings } = useSettings()
  const { user } = useAuth()
  const [lastBriefing, setLastBriefing] = useState<any>(null)
  const [nextBriefing, setNextBriefing] = useState<any>(null)
  const [analystProfile, setAnalystProfile] = useState<any>(null)
  const [pubsPast, setPubsPast] = useState<any[]>([])
  const [pubsUpcoming, setPubsUpcoming] = useState<any[]>([])
  const [portalSettings, setPortalSettings] = useState<{ welcomeQuote?: string; quoteAuthor?: string; authorImageUrl?: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'section1' | 'section2'>('section1')

  // Drawer state
  const [showAnalystDrawer, setShowAnalystDrawer] = useState(false)
  const [selectedBriefing, setSelectedBriefing] = useState<any | null>(null)
  const [briefingDrawerTab, setBriefingDrawerTab] = useState<'overview' | 'transcript'>('overview')

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

        // Fetch last/next briefing
        try {
          const lastResponse = await fetch('/api/briefings/last')
          const lastData = await lastResponse.json().catch(() => null)
          setLastBriefing(lastData && lastData.id ? lastData : null)
        } catch {}
        try {
          const nextResponse = await fetch('/api/briefings/next')
          const nextData = await nextResponse.json().catch(() => null)
          setNextBriefing(nextData && nextData.id ? nextData : null)
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
                email: prof.email || user.email,
                title: prof.title || '',
                influence: prof.influence || 'MEDIUM',
                status: prof.status || 'ACTIVE',
                relationshipHealth: prof.relationshipHealth || 'GOOD',
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
            console.error('Failed to fetch analyst profile for widget', e)
          }
        }
      } catch (error) {
        console.error('Error fetching portal data:', error)
      }
    }

    fetchData()
  }, [user])

  const SmallBriefingCard = ({ label, briefing, onClick }: { label: string; briefing: any | null; onClick?: () => void }) => (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      {briefing ? (
        <button onClick={onClick} className="w-full text-left">
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar className="h-4 w-4" />
            <span className="truncate">{new Date(briefing.scheduledAt).toLocaleString()}</span>
          </div>
          <div className="mt-1 font-medium text-gray-900 truncate">{briefing.title || 'Briefing'}</div>
        </button>
      ) : (
        <div className="flex items-center justify-between">
          <span className="text-gray-500 italic">Not available</span>
          <a href="/briefings" className="text-sm text-blue-600 hover:underline">Schedule</a>
        </div>
      )}
    </div>
  )

  // Map analyst to drawer shape with safe defaults
  const analystForDrawer = analystProfile && {
    id: analystProfile.id,
    firstName: analystProfile.firstName,
    lastName: analystProfile.lastName,
    email: analystProfile.email,
    company: analystProfile.company,
    title: analystProfile.title,
    influence: analystProfile.influence,
    status: analystProfile.status,
    expertise: analystProfile.topics || [],
    linkedIn: analystProfile.linkedIn,
    twitter: analystProfile.twitter,
    phone: analystProfile.phone || '',
    bio: analystProfile.bio || '',
    profileImageUrl: analystProfile.profileImageUrl,
    influenceScore: analystProfile.influenceScore || 0,
    lastContactDate: analystProfile.lastContactDate || null,
    nextContactDate: analystProfile.nextContactDate || null,
    relationshipHealth: analystProfile.relationshipHealth || 'GOOD',
    keyThemes: analystProfile.keyThemes || [],
    website: analystProfile.website || '',
    coveredTopics: analystProfile.topics || [],
  }

  return (
    <div className="px-6 sm:px-8 lg:px-12 py-6 space-y-8">
      {/* Page Header */}
      <section className="p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="text-gray-600 mt-2">
              <QuoteDisplay 
                quote={{ 
                  text: portalSettings?.welcomeQuote || "Welcome to your analyst portal! We're excited to have you here.",
                  author: portalSettings?.quoteAuthor || 'The Cupcake Team',
                  authorImageUrl: portalSettings?.authorImageUrl || 'https://lh3.googleusercontent.com/a/ACg8ocJKqWteI1GXkmnswJmVq98vOmuAONA-RiWegDuqkHlk823I8qc=s96-c'
                }}
                analystProfile={analystProfile}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Top-level Sections */}
      <div className="flex items-center gap-2">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'section1' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          onClick={() => setActiveTab('section1')}
        >
          Section 1
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'section2' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          onClick={() => setActiveTab('section2')}
        >
          Section 2
        </button>
      </div>

      {activeTab === 'section1' && (
        <>
          {/* Profile */}
          {analystProfile && (
            <section className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
              <ProfileWidget 
                analyst={analystProfile} 
                publications={{ past: pubsPast, upcoming: pubsUpcoming }} 
                onEdit={() => setShowAnalystDrawer(true)}
              />
            </section>
          )}

          {/* Small cards: last and next briefing */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SmallBriefingCard 
              label="Last Briefing"
              briefing={lastBriefing}
              onClick={() => {
                if (lastBriefing) {
                  setSelectedBriefing(lastBriefing)
                  setBriefingDrawerTab('overview')
                }
              }}
            />
            <SmallBriefingCard 
              label="Next Briefing"
              briefing={nextBriefing}
              onClick={() => {
                if (nextBriefing) {
                  setSelectedBriefing(nextBriefing)
                  setBriefingDrawerTab('overview')
                }
              }}
            />
          </section>
        </>
      )}

      {activeTab === 'section2' && (
        <section className="bg-white rounded-xl shadow-sm p-0 overflow-hidden">
          {/* Inner tabs */}
          <SectionTwoTabs />
        </section>
      )}

      {/* Drawers */}
      {analystForDrawer && (
        <AnalystDrawer 
          isOpen={showAnalystDrawer}
          onClose={() => setShowAnalystDrawer(false)}
          analyst={analystForDrawer as any}
        />
      )}

      {selectedBriefing && (
        <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl border-l border-gray-200 z-50">
          <BriefingDrawer
            briefing={selectedBriefing}
            activeTab={briefingDrawerTab}
            onTabChange={setBriefingDrawerTab}
            onClose={() => setSelectedBriefing(null)}
            onUpdate={async () => {
              // refresh last/next after updates
              try {
                const [l, n] = await Promise.all([
                  fetch('/api/briefings/last').then(r => r.json()).catch(() => null),
                  fetch('/api/briefings/next').then(r => r.json()).catch(() => null),
                ])
                setLastBriefing(l && l.id ? l : null)
                setNextBriefing(n && n.id ? n : null)
                
                // Also refresh the selected briefing data if it matches one of the updated briefings
                if (selectedBriefing && (selectedBriefing.id === l?.id || selectedBriefing.id === n?.id)) {
                  const updatedBriefing = selectedBriefing.id === l?.id ? l : n
                  if (updatedBriefing) {
                    setSelectedBriefing(updatedBriefing)
                  }
                }
              } catch {}
            }}
          />
        </div>
      )}
    </div>
  )
}

function SectionTwoTabs() {
  const [tab, setTab] = useState<'testimonials' | 'roadmap' | 'brandkit'>('testimonials')
  return (
    <div>
      <div className="flex border-b">
        {[
          { id: 'testimonials', label: 'Analyst Testimonials' },
          { id: 'roadmap', label: 'Public Roadmap' },
          { id: 'brandkit', label: 'Brand Kit' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={cn(
              'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
              tab === (t.id as any)
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-6 sm:p-8">
        {tab === 'testimonials' && <AnalystTestimonialsCarousel />}
        {tab === 'roadmap' && <PublicRoadmap />}
        {tab === 'brandkit' && <BrandKit />}
      </div>
    </div>
  )
}

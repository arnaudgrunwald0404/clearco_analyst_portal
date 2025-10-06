'use client'

import { useEffect, useState } from 'react'
import { Calendar, Heart, Star, Activity, PlugZap } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface BriefingItem {
  id: string
  title?: string
  status?: string
  scheduledAt?: string
}

export default function AnalystHubPage() {
  const { user, loading: authLoading } = useAuth()
  const [briefingsYTD, setBriefingsYTD] = useState<number | null>(null)
  const [relationshipHealthAvg, setRelationshipHealthAvg] = useState<number | null>(null)
  const [influenceCoverage, setInfluenceCoverage] = useState<{ VERY_HIGH: number; HIGH: number; MEDIUM: number; LOW: number } | null>(null)
  const [upcomingTwoWeeks, setUpcomingTwoWeeks] = useState<BriefingItem[]>([])
  const [unratedBriefings, setUnratedBriefings] = useState<BriefingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        // Resolve analystId from user context or API
        let resolvedAnalystId: string | null = null
        const email = user?.email || ''
        const possibleId = (user as any)?.analystId as string | undefined
        if (possibleId) {
          resolvedAnalystId = possibleId
        } else if (email) {
          try {
            const r = await fetch(`/api/analysts/by-email/${encodeURIComponent(email)}`, { cache: 'no-store' })
            if (r.ok) {
              const j = await r.json()
              if (j?.success && j.data?.id) resolvedAnalystId = j.data.id
            }
          } catch {}
        }

        // 1) Analyst-specific KPIs
        if (resolvedAnalystId) {
          // Fetch analyst-specific briefings for YTD count
          const currentYear = new Date().getFullYear()
          const yearStart = new Date(currentYear, 0, 1).toISOString()
          const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59).toISOString()
          
          const analystHeaders: Record<string, string> = {}
          if (email) {
            analystHeaders['x-analyst-email'] = email
            analystHeaders['x-analyst-id'] = resolvedAnalystId
          }
          
          // Get all briefings for this analyst in the current year
          const briefingsQuery = new URLSearchParams({ 
            limit: '1000',
            analystId: resolvedAnalystId
          })
          const briefingsRes = await fetch(`/api/briefings?${briefingsQuery.toString()}`, {
            cache: 'no-store',
            headers: analystHeaders
          })
          const briefingsData = await briefingsRes.json()
          
          if (briefingsData?.success && Array.isArray(briefingsData.data)) {
            // Count briefings in current year
            const ytdBriefings = briefingsData.data.filter((b: any) => {
              if (!b.scheduledAt) return false
              const scheduledDate = new Date(b.scheduledAt)
              return scheduledDate >= new Date(yearStart) && scheduledDate <= new Date(yearEnd)
            })
            setBriefingsYTD(ytdBriefings.length)
          } else {
            setBriefingsYTD(0)
          }
          
          // Set default values for other metrics (these would need separate APIs)
          setRelationshipHealthAvg(null)
          setInfluenceCoverage(null)
        } else {
          // No analyst ID found, set defaults
          setBriefingsYTD(0)
          setRelationshipHealthAvg(null)
          setInfluenceCoverage(null)
        }
        // 2) Upcoming briefings strictly scoped to this analyst
        const query = new URLSearchParams({ upcoming: 'true', limit: '100' })
        if (resolvedAnalystId) query.set('analystId', resolvedAnalystId)
        const b = await fetch(`/api/briefings?${query.toString()}`, {
          cache: 'no-store',
          headers: resolvedAnalystId && email ? {
            'x-analyst-email': email,
            'x-analyst-id': resolvedAnalystId
          } : {}
        })
        const bj = await b.json()
        if (bj?.success && Array.isArray(bj.data)) {
          const in14d = (bj.data as BriefingItem[]).filter(it => {
            if (!it.scheduledAt) return false
            const dt = new Date(it.scheduledAt)
            const now = new Date()
            const in14 = new Date()
            in14.setDate(now.getDate() + 14)
            return dt >= now && dt <= in14
          })
          setUpcomingTwoWeeks(in14d)
        }

        // 3) Unrated briefings in last 30 days
        const unr = await fetch(`/api/briefing-ratings/unrated?days=30`, {
          cache: 'no-store',
          headers: resolvedAnalystId && email ? {
            'x-analyst-email': email,
            'x-analyst-id': resolvedAnalystId
          } : {}
        })
        const uj = await unr.json().catch(() => null as any)
        if (uj?.success && Array.isArray(uj.data)) {
          setUnratedBriefings(uj.data)
        }
      } catch (e) {
        setError('Failed to load Analyst Hub data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, authLoading])

  if (authLoading || loading) {
    return (
      <div className="p-6">
        <div className="bg-white border rounded-lg p-6 text-gray-600">Loading Analyst Hub…</div>
      </div>
    )
  }

  const smartInsights = [
    { text: "TechCorp's new AI features align with your Q2 research", action: 'Schedule' },
    { text: '3 vendors have content gaps in your expertise areas', action: 'Start outreach' },
    { text: 'Optimal time for CloudVendor briefing: Next Tuesday', action: 'Book slot' },
  ]

  const industryPulse = [
    { vendor: 'TechCorp', update: 'Shared new demo video', relevance: 'High' },
    { vendor: 'DataCorp', update: 'Announced product update 2.1', relevance: 'Medium' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Welcome + KPIs */}
      <div className="rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg border bg-white">
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <Calendar className="w-4 h-4" /> Briefings YTD
            </div>
            <div className="text-2xl font-semibold mt-1">{briefingsYTD ?? '—'}</div>
          </div>
          <div className="p-4 rounded-lg border bg-white">
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <Heart className="w-4 h-4" /> Relationship Health
            </div>
            <div className="text-sm mt-2 text-gray-700">Average: {relationshipHealthAvg ?? '—'}</div>
            <div className="text-xs text-gray-500">(Matrix breakdown coming soon)</div>
          </div>
          <div className="p-4 rounded-lg border bg-white md:col-span-2">
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <Star className="w-4 h-4" /> Influence coverage by tier (last 12m)
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2 text-sm">
              <div className="bg-purple-50 text-purple-800 rounded px-2 py-1">Very high: {influenceCoverage?.VERY_HIGH ?? 0}%</div>
              <div className="bg-blue-50 text-blue-800 rounded px-2 py-1">High: {influenceCoverage?.HIGH ?? 0}%</div>
              <div className="bg-green-50 text-green-800 rounded px-2 py-1">Medium: {influenceCoverage?.MEDIUM ?? 0}%</div>
              <div className="bg-gray-50 text-gray-800 rounded px-2 py-1">Low: {influenceCoverage?.LOW ?? 0}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* My Briefing Pipeline (2 weeks) */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">My Briefing Pipeline (next 2 weeks)</h2>
          <button className="text-sm text-blue-600 hover:underline">View calendar</button>
        </div>
        <div className="flex gap-3 overflow-x-auto">
          {upcomingTwoWeeks.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>No upcoming briefings in the next 2 weeks.</span>
              <a href="/analyst_portal/vendor_profile/settings" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                <PlugZap className="w-4 h-4" /> Connect your calendar
              </a>
            </div>
          ) : (
            upcomingTwoWeeks.map((b) => {
              const dt = b.scheduledAt ? new Date(b.scheduledAt) : null
              return (
                <div key={b.id} className="min-w-[240px] border rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-900 truncate" title={b.title || 'Briefing'}>
                    {b.title || 'Briefing'}
                  </div>
                  <div className="text-xs text-gray-500">{dt ? dt.toLocaleString() : ''}</div>
                  <div className="mt-2 inline-flex text-xs px-2 py-1 rounded-full bg-yellow-50 text-yellow-800">
                    {b.status || 'SCHEDULED'}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Reminders to rate recent briefings (last 30 days) */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Reminders: Rate recent briefings (last 30 days)</h2>
        </div>
        {unratedBriefings.length === 0 ? (
          <div className="text-sm text-gray-600">No pending ratings.</div>
        ) : (
          <div className="space-y-2">
            {unratedBriefings.map((b) => {
              const dt = b.scheduledAt ? new Date(b.scheduledAt) : null
              return (
                <div key={b.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate" title={b.title || 'Briefing'}>{b.title || 'Briefing'}</div>
                    <div className="text-xs text-gray-500">{dt ? dt.toLocaleDateString() : ''}</div>
                  </div>
                  <a href={`/analyst-portal`} className="text-sm text-blue-600 hover:underline">Rate</a>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Smart Insights */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Smart Insights</h2>
        {error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {smartInsights.map((si, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="text-sm text-gray-900">{si.text}</div>
                <button className="mt-3 text-sm inline-flex items-center gap-1 text-blue-600 hover:underline">
                  <Activity className="w-4 h-4" /> {si.action}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Industry Pulse */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Industry Pulse</h2>
        <div className="space-y-3">
          {industryPulse.map((it, i) => (
            <div key={i} className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <div className="text-sm font-medium text-gray-900">{it.vendor}</div>
                <div className="text-xs text-gray-600">{it.update}</div>
              </div>
              <div className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-800">{it.relevance}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

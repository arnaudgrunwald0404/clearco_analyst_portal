'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

function classNames(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(' ')
}

export default function RelationshipStatusCard() {
  const { user } = useAuth()
  const [relationshipData, setRelationshipData] = useState<{
    lastBriefingDate: string | null
    influence: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
    selectedVendorName: string
    loading: boolean
  }>({
    lastBriefingDate: null,
    influence: 'MEDIUM',
    selectedVendorName: 'Vendor',
    loading: true
  })

  useEffect(() => {
    const fetchRelationshipData = async () => {
      if (!user?.email) {
        setRelationshipData(prev => ({ ...prev, loading: false }))
        return
      }

      // Initialize variables
      let lastBriefingDate: string | null = null
      let influence: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' = 'MEDIUM'
      let analystId: string | null = null
      let selectedVendorName: string = 'Vendor'
      let vendorDomainId: string | undefined = undefined

      try {
        // Fetch general settings for vendor context (name + domain id)
        const sRes = await fetch('/api/settings/general', { cache: 'no-store' })
        if (sRes.ok) {
          const sJson = await sRes.json().catch(() => null)
          selectedVendorName = sJson?.company_name || 'Vendor'
          if (sJson?.id) vendorDomainId = sJson.id as string
        }

        // Fetch analyst data
        console.log('🔍 [RelationshipStatus] Looking up analyst for email:', user.email)
        const analystRes = await fetch(`/api/analysts/by-email/${encodeURIComponent(user.email)}`)
        
        if (analystRes.ok) {
          try {
            const analystJson = await analystRes.json()
            if (analystJson.success && analystJson.data) {
              analystId = analystJson.data.id
              influence = (analystJson.data.influence as any) || 'MEDIUM'
              console.log('👤 [RelationshipStatus] Found analyst:', { analystId, influence, email: user.email })
            }
          } catch (parseError) {
            console.error('Failed to parse analyst response:', parseError)
          }
        } else {
          console.log('❌ [RelationshipStatus] Analyst not found for email:', user.email)
        }

        // Fetch briefings if we have an analyst ID
        if (analystId) {
          const params = new URLSearchParams({ limit: '1', analystId })
          if (vendorDomainId) params.append('vendorDomainId', vendorDomainId)
          const headers: Record<string, string> = { 
            Accept: 'application/json',
            'x-analyst-email': user.email,
            'x-analyst-id': analystId
          }
          
          const url = `/api/briefings?${params.toString()}`
          
          console.log('🔍 [RelationshipStatus] Fetching briefings:', { url, headers, analystId, userEmail: user.email, vendorDomainId })
          
          const resp = await fetch(url, {
            cache: 'no-store',
            headers,
          })
          
          console.log('📡 [RelationshipStatus] API Response:', { status: resp.status, ok: resp.ok })
          
          if (resp.ok) {
            const json = await resp.json().catch(() => ({ data: [] }))
            const briefings = Array.isArray(json?.data) ? json.data : []
            
            console.log('📋 [RelationshipStatus] Briefings data:', { 
              count: briefings.length, 
              briefings: briefings.map((b: any) => ({ id: b.id, title: b.title, scheduledAt: b.scheduledAt, completedAt: b.completedAt }))
            })
            
            if (briefings.length > 0) {
              const latest = briefings[0]
              lastBriefingDate = latest.completedAt || latest.scheduledAt
              console.log('✅ [RelationshipStatus] Found latest briefing date:', lastBriefingDate)
            } else {
              console.log('❌ [RelationshipStatus] No briefings found')
            }
          } else {
            const errorText = await resp.text().catch(() => 'Unknown error')
            console.error('❌ [RelationshipStatus] API Error:', { status: resp.status, error: errorText })
          }
        }

        // Update state with the fetched data
        setRelationshipData({
          lastBriefingDate,
          influence,
          selectedVendorName,
          loading: false
        })

      } catch (error) {
        console.error('❌ [RelationshipStatus] Exception:', error)
        setRelationshipData(prev => ({ ...prev, loading: false }))
      }
    }

    fetchRelationshipData()
  }, [user?.email])

  // Compute status based on current state
  const { lastBriefingDate, influence, selectedVendorName, loading } = relationshipData
  
  const tierDaysMap: Record<string, number> = { VERY_HIGH: 45, HIGH: 60, MEDIUM: 90, LOW: 120 }
  const tierDays = tierDaysMap[influence] ?? 90

  let label = 'Loose Tooth'
  let description = "Have not started logging briefings in Cupcake ;("
  let color = 'text-red-700 bg-red-50 border-red-200'

  if (lastBriefingDate) {
    const lastDate = new Date(lastBriefingDate)
    const now = new Date()
    const daysSinceLast = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceLast <= tierDays) {
      label = 'Sugar High ;)'
      description = `Up-to-date in terms of briefings, as per the vendor's desired frequency of 1 briefing every ${tierDays} days.`
      color = 'text-green-700 bg-green-50 border-green-200'
    } else if (daysSinceLast <= 365) {
      label = 'Sweet!'
      description = 'There was a briefing in the past 12 months, you have a decent understanding of what they do. They\'d like to see you every ${tierDays} days though.'
      color = 'text-emerald-700 bg-emerald-50 border-emerald-200'
    } else {
      label = 'Bland?'
      description = 'A briefing... A distant while ago. What do they do again? ;) FYI, they\'d like to see you every ${tierDays} days.'
      color = 'text-amber-700 bg-amber-50 border-amber-200'
    }
  }

  if (loading) {
    return <RelationshipStatusSkeleton />
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Your Relationship with {selectedVendorName}</h2>
      </div>
      <div className="flex items-center gap-2 pl-4">
      <span className="font-medium">Status:</span>{' '}
      <div className={classNames('inline-flex items-center px-2 py-1 text-sm rounded border', color)}>{label}</div>
      </div>
      <div className="text-gray-700 pl-4">
        <span className="font-medium">Last Briefing:</span>{' '}
        {lastBriefingDate ? new Date(lastBriefingDate).toLocaleDateString() : 'No briefing found.'}

        {'  --->    '} {description}
      </div>
    </div>
  )
}

export function RelationshipStatusSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-5 bg-gray-100 rounded w-56 animate-pulse" />
      <div className="h-4 bg-gray-100 rounded w-40 animate-pulse" />
      <div className="h-4 bg-gray-100 rounded w-64 animate-pulse" />
      <div className="h-9 bg-gray-100 rounded w-36 animate-pulse" />
    </div>
  )
}


"use client"

import { useEffect, useState } from 'react'
import { CompanyOverviewSection } from './brand-kit/CompanyOverviewSection'
import { LeadershipTeamSection } from './brand-kit/LeadershipTeamSection'
import { OfferingsSection } from './brand-kit/OfferingsSection'
import { BusinessOverviewSection } from './brand-kit/BusinessOverviewSection'

export interface CompanyProfile {
  mission?: string
  vision?: string
  values?: string
  yearFounded?: string
  history?: string
  // Team
  ceo?: string
  cmo?: string
  cpo?: string
  numberOfEmployees?: string
  percentRD?: string
  percentCustomerSupport?: string
  percentSalesMarketing?: string
  keyInvestors?: string
  totalFundingToDate?: string
  // Business
  arrRange?: string
  acvAverage?: string
  packagingPricingModel?: string
  numberOfCustomers?: string
  targetMarket?: string
  targetVerticals?: string[]
  targetGeographies?: string[]
  marqueeCustomers?: string
  partnerEcosystem?: string
  // Offerings
  keyProducts?: string
  keyIntegrations?: string
  keyServices?: string
  keyComplianceCertifications?: string
}

export function BrandKit() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const generalResp = await fetch('/api/settings/general', { cache: 'no-store' }).catch(() => null)
        const generalJson = generalResp && generalResp.ok ? await generalResp.json().catch(() => null) : null
        const qs = new URLSearchParams()
        if (generalJson?.protected_domain) qs.set('vendorDomain', generalJson.protected_domain)

        const response = await fetch(`/api/settings/analyst-portal${qs.toString() ? `?${qs.toString()}` : ''}`, { cache: 'no-store' })
        if (response.ok) {
          const data = await response.json()
          const companyProfile = data?.company_profile || data?.companyProfile || {}
          setProfile(companyProfile)
        }
      } catch (error) {
        console.error('Failed to fetch company profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      <CompanyOverviewSection profile={profile || {}} />
      <LeadershipTeamSection profile={profile || {}} />
      <OfferingsSection profile={profile || {}} />
      <BusinessOverviewSection profile={profile || {}} />
    </div>
  )
}


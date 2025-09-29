"use client"

import type { CompanyProfile } from '../BrandKit'
import { Building, Globe2 } from 'lucide-react'

interface Props {
  profile: CompanyProfile
}

export function BusinessOverviewSection({ profile }: Props) {
  const verticals = profile.targetVerticals || []
  const geographies = profile.targetGeographies || []

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Business Overview</h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Annual Recurring Revenue</h3>
          <p className="text-gray-700 min-h-[1.25rem]">{profile.arrRange || '—'}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Average Contract Value</h3>
          <p className="text-gray-700 min-h-[1.25rem]">{profile.acvAverage || '—'}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Number of Customers</h3>
          <p className="text-gray-700 min-h-[1.25rem]">{profile.numberOfCustomers || '—'}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Target Market</h3>
          <p className="text-gray-700 min-h-[1.25rem]">{profile.targetMarket || '—'}</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Packaging & Pricing Model</h3>
        <p className="text-gray-700 leading-relaxed min-h-[1.5rem]">{profile.packagingPricingModel || '—'}</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Building className="w-5 h-5 text-blue-600" />
          Target Verticals
        </h3>
        <div className="flex flex-wrap gap-2 min-h-[1.75rem]">
          {verticals.length > 0 ? (
            verticals.map((v, i) => (
              <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {v}
              </span>
            ))
          ) : (
            <span className="text-gray-700">—</span>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Globe2 className="w-5 h-5 text-blue-600" />
          Target Geographies
        </h3>
        <div className="flex flex-wrap gap-2 min-h-[1.75rem]">
          {geographies.length > 0 ? (
            geographies.map((g, i) => (
              <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {g}
              </span>
            ))
          ) : (
            <span className="text-gray-700">—</span>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Marquee Customers</h3>
          <p className="text-gray-700 leading-relaxed min-h-[1.5rem]">{profile.marqueeCustomers || '—'}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Partner Ecosystem</h3>
          <p className="text-gray-700 leading-relaxed min-h-[1.5rem]">{profile.partnerEcosystem || '—'}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Total Funding to Date</h3>
          <p className="text-gray-700 min-h-[1.25rem]">{profile.totalFundingToDate || '—'}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Key Investors</h3>
          <p className="text-gray-700 min-h-[1.25rem]">{profile.keyInvestors || '—'}</p>
        </div>
      </div>
    </section>
  )
}

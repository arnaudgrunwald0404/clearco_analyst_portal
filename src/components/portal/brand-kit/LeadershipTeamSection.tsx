"use client"

import type { CompanyProfile } from '../BrandKit'
import { Users } from 'lucide-react'

interface Props {
  profile: CompanyProfile
}

export function LeadershipTeamSection({ profile }: Props) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
        <Users className="w-6 h-6 text-blue-600" />
        Leadership Team
      </h2>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gray-50 rounded-lg p-4 min-h-[88px]">
          <h3 className="font-semibold text-gray-900 mb-1">Chief Executive Officer</h3>
          <p className="text-gray-700">{profile.ceo || '—'}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 min-h-[88px]">
          <h3 className="font-semibold text-gray-900 mb-1">Chief Marketing Officer</h3>
          <p className="text-gray-700">{profile.cmo || '—'}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 min-h-[88px]">
          <h3 className="font-semibold text-gray-900 mb-1">Chief Product Officer</h3>
          <p className="text-gray-700">{profile.cpo || '—'}</p>
        </div>
      </div>
    </section>
  )
}

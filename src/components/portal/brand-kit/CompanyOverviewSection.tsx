"use client"

import type { CompanyProfile } from '../BrandKit'
import { Building, TrendingUp, Award } from 'lucide-react'

interface Props {
  profile: CompanyProfile
}

export function CompanyOverviewSection({ profile }: Props) {
  const valuesList = (profile.values || '')
    .split(/[\,\n]/)
    .map(t => t.trim())
    .filter(Boolean)

  return (
    <section className="space-y-8">
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900">Company Overview</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              Mission
            </h3>
            <p className="text-gray-700 leading-relaxed min-h-[1.5rem]">
              {profile.mission || '—'}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Vision
            </h3>
            <p className="text-gray-700 leading-relaxed min-h-[1.5rem]">
              {profile.vision || '—'}
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            Values
          </h3>
          {valuesList.length > 0 ? (
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              {valuesList.map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-700">—</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-1">Year Founded</h4>
            <p className="text-gray-700">{profile.yearFounded || '—'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-1">Employees</h4>
            <p className="text-gray-700">{profile.numberOfEmployees || '—'}</p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">History</h3>
          <p className="text-gray-700 leading-relaxed min-h-[1.5rem]">
            {profile.history || '—'}
          </p>
        </div>
      </div>
    </section>
  )
}

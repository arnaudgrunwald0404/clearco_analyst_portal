"use client"

import type { CompanyProfile } from '../BrandKit'

interface Props {
  profile: CompanyProfile
}

export function OfferingsSection({ profile }: Props) {
  return (
    <section className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Offerings</h2>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Key Products</h3>
          <p className="text-gray-700 leading-relaxed min-h-[1.5rem]">{profile.keyProducts || '—'}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Key Integrations</h3>
          <p className="text-gray-700 leading-relaxed min-h-[1.5rem]">{profile.keyIntegrations || '—'}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Key Services</h3>
          <p className="text-gray-700 leading-relaxed min-h-[1.5rem]">{profile.keyServices || '—'}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Key Compliance Certifications</h3>
          <p className="text-gray-700 leading-relaxed min-h-[1.5rem]">{profile.keyComplianceCertifications || '—'}</p>
        </div>
      </div>
    </section>
  )
}

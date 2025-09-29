import { Suspense } from 'react'
import OurBriefings, { OurBriefingsSkeleton } from './_components/OurBriefings'
import RelationshipStatusCard, { RelationshipStatusSkeleton } from './_components/RelationshipStatusCard'
import BriefingsHeader from './_components/BriefingsHeader'
import TestimonialsOnRelationship from './_components/TestimonialsOnRelationship'

export default function PortalPage({ searchParams }: { searchParams: { analystId?: string } }) {
  const analystId = searchParams?.analystId
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="grid grid-cols-1 gap-x-6 gap-y-12">
        <Suspense fallback={<RelationshipStatusSkeleton />}>
          <RelationshipStatusCard />
        </Suspense>
      </div>

      <div className="mt-12">
        <div className="mb-3">
          <BriefingsHeader />
        </div>
        <Suspense fallback={<OurBriefingsSkeleton />}>
          <OurBriefings analystId={analystId} />
        </Suspense>

        {/* Testimonials under Briefings */}
        <TestimonialsOnRelationship />
      </div>
    </div>
  )
}


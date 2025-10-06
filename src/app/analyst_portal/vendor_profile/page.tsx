import RelationshipStatusCard from './_components/RelationshipStatusCard'
import BriefingsHeader from './_components/BriefingsHeader'
import OurBriefings from './_components/OurBriefings'
import TestimonialsOnRelationship from './_components/TestimonialsOnRelationship'

export default async function VendorProfileHome({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const analystId = typeof searchParams?.analystId === 'string' ? searchParams.analystId : undefined

  return (
    <div className="p-6 space-y-10">
      {/* Relationship overview */}
      <RelationshipStatusCard />

      {/* Briefings summary */}
      <section>
        <div className="mb-3">
          <BriefingsHeader />
        </div>
        {/* Server component fetching briefings with RLS/impersonation support */}
        <OurBriefings analystId={analystId} />
      </section>

      {/* Testimonials section */}
      <TestimonialsOnRelationship />
    </div>
  )
}

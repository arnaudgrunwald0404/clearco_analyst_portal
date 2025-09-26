import { redirect } from 'next/navigation'

export default function PortalRelationshipPage() {
  // Redirect to the main portal home for now; content is equivalent.
  redirect('/portal')
}


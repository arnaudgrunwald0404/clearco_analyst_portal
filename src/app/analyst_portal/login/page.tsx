import { Metadata } from 'next'
import AnalystLoginForm from './AnalystLoginForm'

export const metadata: Metadata = {
  title: 'Analyst Portal Login',
  description: 'Login to access the analyst portal'
}

export default function AnalystPortalLoginPage() {
  return (
    <AnalystLoginForm 
      analystOnly 
      crossLinkHref="/vendor_portal/login" 
      crossLinkLabel="I am a vendor"
    />
  )
}

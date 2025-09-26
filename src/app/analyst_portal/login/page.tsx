import { Metadata } from 'next'
import AnalystLoginForm from '@/app/analyst-login/AnalystLoginForm'

export const metadata: Metadata = {
  title: 'Analyst Portal Login',
  description: 'Login to access the analyst portal'
}

export default function AnalystPortalLoginPage() {
  return <AnalystLoginForm />
}

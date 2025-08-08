import { Metadata } from 'next'
import AnalystLoginForm from './AnalystLoginForm'

export const metadata: Metadata = {
  title: 'Analyst Login - Analyst Portal',
  description: 'Login to access the analyst portal'
}

export default function AnalystLoginPage() {
  return <AnalystLoginForm />
} 
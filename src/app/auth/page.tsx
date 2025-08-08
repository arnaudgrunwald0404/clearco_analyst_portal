import { Metadata } from 'next'
import { Suspense } from 'react'
import AuthPageContent from './AuthPageContent'

export const metadata: Metadata = {
  title: 'Login - Analyst Portal',
  description: 'Sign in to access the Analyst Portal'
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  )
}

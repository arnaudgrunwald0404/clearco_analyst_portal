'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertTriangle, Shield } from 'lucide-react'

export default function AuthCodeError() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  
  const getErrorContent = () => {
    switch (error) {
      case 'unauthorized':
        return {
          title: 'Access Denied',
          message: 'This email address is not authorized for access to the system.',
          icon: Shield
        }
      case 'domain_restricted':
        return {
          title: 'Domain Restricted',
          message: 'Access is restricted to ClearCompany employees (@clearcompany.com) and registered industry analysts only.',
          icon: Shield
        }
      default:
        return {
          title: 'Authentication Error',
          message: 'Sorry, we couldn\'t authenticate your account. This could be due to an expired or invalid authentication link.',
          icon: AlertTriangle
        }
    }
  }
  
  const errorContent = getErrorContent()
  const ErrorIcon = errorContent.icon
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <ErrorIcon className="h-6 w-6 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {errorContent.title}
          </h1>
          <p className="text-gray-600 mb-6">
            {errorContent.message}
          </p>
          <div className="space-y-3">
            <Link
              href="/auth"
              className="w-full inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try logging in again
            </Link>
            <p className="text-sm text-gray-500">
              If you continue to have issues, please contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

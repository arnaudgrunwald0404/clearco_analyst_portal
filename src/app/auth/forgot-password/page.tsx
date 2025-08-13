'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  AlertCircle,
  Mail,
  ArrowRight,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to main auth page since password authentication is disabled
    router.push('/auth')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          {/* Header */}
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Password Authentication Disabled
            </h2>
            <p className="text-gray-600 mb-6">
              Password-based authentication has been disabled for security reasons.
            </p>
          </div>

          {/* Info Message */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm text-blue-700">
                Please use Google OAuth or magic link to sign in
              </span>
            </div>
          </div>

          {/* Redirect Button */}
          <Link
            href="/auth"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Sign In
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>

          {/* Alternative Options */}
          <div className="mt-6 text-sm text-gray-500">
            <p>Need help? Contact your administrator</p>
          </div>
        </div>
      </div>
    </div>
  )
}

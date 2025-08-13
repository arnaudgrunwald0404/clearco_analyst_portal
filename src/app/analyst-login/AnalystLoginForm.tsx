'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Loader2, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AnalystLoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }
    
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { error: magicError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { 
          emailRedirectTo: `${window.location.origin}/auth/callback` 
        }
      })
      
      if (magicError) {
        setError(magicError.message)
      } else {
        setSuccess('Magic link sent! Check your email and click the link to sign in.')
      }
    } catch (error) {
      setError('An unexpected error occurred')
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto w-16 h-16 mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Analyst Portal Access
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email to receive a secure sign-in link
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="email-input"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full h-14 text-base font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  Send Magic Link
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* Info Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              We'll send you a secure link to access the analyst portal
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact your administrator
          </p>
        </div>
      </div>
    </div>
  )
}
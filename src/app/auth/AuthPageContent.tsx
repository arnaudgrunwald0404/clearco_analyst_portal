'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Mail, Chrome, ArrowRight, CheckCircle } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function AuthPageContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [email, setEmail] = useState('')

  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, loading, signInWithGoogle } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    console.log('🔍 Auth page - User state:', { user, loading })
    
    // Check if user is already logged in and redirect
    if (!loading && user) {
      const redirectTo = user.role === 'ANALYST' ? '/portal' : '/'
      console.log('🔄 User is logged in, redirecting to:', redirectTo)
      router.push(redirectTo)
    } else if (!loading && !user) {
      console.log('✅ User is not logged in, showing auth page')
    }
  }, [user, loading, router])

  // Commented out password authentication
  /*
  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn(formData.email, formData.password)
      
      if (result.success && result.redirectTo) {
        router.push(result.redirectTo)
      } else {
        setError(result.error || 'Login failed')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  */

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError('')
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsLoading(false)
      setError('Google sign-in timed out. Please try again.')
    }, 10000) // 10 second timeout
    
    try {
      const result = await signInWithGoogle()
      
      clearTimeout(timeoutId) // Clear timeout if successful
      
      if (!result.success) {
        setError(result.error || 'Google sign-in failed')
        setIsLoading(false)
      } else {
        // If successful, the user will be redirected to Google OAuth
        // Don't reset loading state here as the page will redirect
        console.log('Google OAuth initiated successfully')
      }
    } catch (err) {
      clearTimeout(timeoutId) // Clear timeout on error
      console.error('Google sign-in error:', err)
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }
    
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      setSuccess('Magic link sent! Check your email and click the link to sign in.')
      setIsLoading(false)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if user is already logged in (prevents flash)
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 mb-6 relative">
            <Image
              src="/clearco-logo.png"
              alt="ClearCompany"
              fill
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Welcome to Analyst Portal
          </h1>
          <p className="text-gray-600 text-lg">
            Choose your preferred sign-in method
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <p className="text-green-700 text-sm">{success}</p>
              </div>
            </div>
          )}

          {/* Google Sign In - Primary Option */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-6 h-14 text-base font-medium border-2 hover:bg-gray-50 transition-all duration-200"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <Chrome className="mr-3 h-6 w-6" />
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">or</span>
            </div>
          </div>

          {/* Magic Link Form */}
          <form onSubmit={handleMagicLink} className="space-y-4">
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
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-base font-medium bg-blue-600 hover:bg-blue-700 transition-all duration-200"
              disabled={isLoading || !email.trim()}
              data-testid="magic-link-button"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  Send Magic Link
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          {/* Info Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              We'll send you a secure link to sign in without a password
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Need help? Contact your administrator
          </p>
        </div>
      </div>
    </div>
  )
}
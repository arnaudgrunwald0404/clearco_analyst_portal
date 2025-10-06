'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Mail, ArrowRight, CheckCircle, Chrome } from 'lucide-react'                     
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

type Props = { analystOnly?: boolean; crossLinkHref?: string; crossLinkLabel?: string }

export default function AnalystLoginForm({ analystOnly = false, crossLinkHref, crossLinkLabel }: Props) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const supabase = createClient()
  const { user, loading: authLoading } = useAuth()

  // Redirect if already authenticated as analyst
  useEffect(() => {
    console.log('[AnalystLoginForm] Auth state:', { authLoading, user: user?.email, role: user?.role })
    if (!authLoading && user && user.role === 'ANALYST') {
      console.log('Analyst already authenticated, redirecting to portal')
      router.push('/analyst_portal/analyst_hub')
    }
  }, [user, authLoading, router])

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        setError(error.message)
        setLoading(false)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

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
      if (analystOnly) {
        // Use analyst-portal API to enforce analyst-only access
        const resp = await fetch('/api/auth/analyst-portal/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() })
        })
        const result = await resp.json()
        if (!resp.ok || !result.success) {
          setError(result.error || 'Access restricted to registered analysts only. If you are internal, use /vendor_portal/login.')
        } else {
          setSuccess('Magic link sent! Check your email and click the link to sign in.')
        }
      } else {
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
      }
    } catch (error) {
      setError('An unexpected error occurred')
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
        style={{ backgroundImage: "url('/banner-art/5tEKURo4T77ldqhwOMzP9.png')" }}
      >
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: "url('/banner-art/5tEKURo4T77ldqhwOMzP9.png')" }}
    >
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-50 h-50 mb-2 relative">
              <Image
                src="/cupcake_logo.png"
                alt="Cupcake"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Welcome to Cupcake!
            </h1>
            <p className="text-gray-600 text-lg mb-6">
              Analyst Portal Access
            </p>
            <p className="text-gray-600 text-lg">
              Choose your preferred sign-in method:
            </p>
          </div>
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
          
          {/* Google Sign-In Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-6 h-14 text-gray-700 font-medium bg-pink-200 border-1 border-pink-400 hover:bg-pink-200 hover:shadow-lg hover:text-gray-900 transition-all duration-200"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <Chrome className="mr-3 h-6 w-6" />
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-pink-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">or</span>
            </div>
          </div>
          
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white transition-all duration-200"
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full h-14 text-base font-medium bg-pink-600 hover:bg-pink-700 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center rounded-lg text-white"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  Send Sweet Fairy Link
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* Info Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              We'll send you a secure fairy link to sign in without a password
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="pt-4 border-t border-gray-200 flex flex-wrap items-center justify-center gap-2 text-sm">
            {crossLinkHref && crossLinkLabel && (
              <>
                <span className="text-gray-300">|</span>
                <span className="text-gray-600">Are you a vendor or admin?</span>
                <span className="text-gray-300">|</span>
                <a 
                  href={crossLinkHref} 
                  className="inline-flex items-center font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200"
                >
                  {crossLinkLabel}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

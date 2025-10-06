'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Mail, Chrome, ArrowRight, CheckCircle } from 'lucide-react'
import { SpinningCupcake } from '@/components/ui/spinning-cupcake'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function VendorLoginContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [email, setEmail] = useState('')
  const [hasRedirected, setHasRedirected] = useState(false)
  const gsiContainerRef = useRef<HTMLDivElement | null>(null)

  const router = useRouter()
  const { user, loading, signInWithGoogle } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    console.log('🔍 Auth page - User state:', { user, loading, hasRedirected })
    
    // Check if user is already logged in and redirect (only once)
    if (!loading && user && !hasRedirected) {
      const redirectTo = user.role === 'ANALYST' ? '/analyst_portal/analyst_hub' : '/'
      console.log('🔄 User is logged in, redirecting to:', redirectTo)
      console.log('🔄 User role:', user.role)
      
      setHasRedirected(true) // Prevent multiple redirects
      
      // Use replace instead of push to avoid back button issues
      router.replace(redirectTo)
      
      // Fallback redirect after 3 seconds in case router.replace fails
      setTimeout(() => {
        console.log('🔄 Fallback redirect triggered')
        window.location.href = redirectTo
      }, 3000)
    } else if (!loading && !user) {
      console.log('✅ User is not logged in, showing auth page')
    }
  }, [user, loading, router, hasRedirected])

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

  // Official Google Sign-In (GSI) button integration
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) {
      console.warn('GSI: NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing')
      return
    }

    function initializeGsi() {
      try {
        // @ts-ignore - google global provided by GSI script
        const googleObj = (window as any).google
        if (!googleObj || !gsiContainerRef.current) return

        const handleCredentialResponse = async (response: any) => {
          try {
            setIsLoading(true)
            setError('')
            const res = await fetch('/api/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken: response.credential })
            })
            const data = await res.json()
            if (!res.ok || !data?.success) {
              setError(data?.error || 'Google authentication failed')
              setIsLoading(false)
              return
            }
            // Redirect after successful auth; middleware will gate domain
            window.location.href = '/'
          } catch (err) {
            setError('Google authentication failed')
            setIsLoading(false)
          }
        }

        googleObj.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          ux_mode: 'popup'
        })
        googleObj.accounts.id.renderButton(gsiContainerRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text: 'signin_with'
        })
        // Optionally also show One Tap
        // googleObj.accounts.id.prompt()
      } catch (e) {
        console.warn('GSI init error:', e)
      }
    }

    // If script already loaded
    // @ts-ignore
    if (typeof window !== 'undefined' && (window as any).google) {
      initializeGsi()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = initializeGsi
    document.head.appendChild(script)

    return () => {
      try {
        document.head.removeChild(script)
      } catch {}
    }
  }, [])

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
      <div
        className="min-h-screen flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: "url('/banner-art/5tEKURo4T77ldqhwOMzP9.png')" }}
      >
        <div className="text-center">
          <SpinningCupcake size="xl" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show loading state if user is already logged in (prevents white screen)
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <SpinningCupcake size={48} />
          <p className="text-gray-600 mt-4">Redirecting...</p>
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
          <div className="text-center mb-4">
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
              Cupcake is your delicious Industry Relationship Management portal.
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
            <div className=" p-4 bg-green-50 border-2 border-green-700 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-700 mr-2" />
                <p className="text-green-700 text-medium">{success}</p>
              </div>
            </div>
          )}

          {/* Google Sign-In (GSI) Button */}
          <div className="mb-6 flex justify-center">
            <div ref={gsiContainerRef} aria-label="Sign in with Google" />
          </div>

          {/* Fallback button in case GSI script fails to load */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-6 h-14 text-gray-700 font-medium bg-pink-200 border-1 border-pink-400 hover:bg-pink-200  hover:shadow-lg hover:text-gray-900 transition-all duration-200"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <Chrome className="mr-3 h-6 w-6" />
            Sign in with Google
          </Button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-pink-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-pink-600 font-medium">OR</span>
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
              className="w-full h-14 text-white font-bold bg-pink-600 hover:bg-pink-700 transition-all duration-200"
              disabled={isLoading || !email.trim()}
              data-testid="magic-link-button"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  Send Sweet Fairy Link
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          {/* Info Text */}
          <div className="my-4 text-center">
            <p className="text-sm text-gray-500">
              We'll send you a secure link to sign in without a password
            </p>
          </div>
          <div className="text-center border-t border-pink-200">
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
  
            <span className="text-gray-600">Are you an industry analyst?</span>
          
            <a 
              href="/analyst_portal/login" 
              className="inline-flex items-center font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200"
            >Go to analyst portal
              <ArrowRight className="ml-1 h-4 w-4" />
            </a>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

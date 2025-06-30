'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { 
  AlertCircle,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to new auth page
    router.replace('/auth')
  }, [router])
  
  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
}

function OldLoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loginMethod, setLoginMethod] = useState<'magic' | 'password'>('magic')
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  
  // Animated text effect
  const [titleNumber, setTitleNumber] = useState(0)
  const animatedPhrases = useMemo(
    () => ['exciting', 'inspiring', 'mind-boggling', 'packed with value', "you've never seen before"],
    []
  )
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Get user profile to determine role
        const { data: profile } = await supabase
          .from('User')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (profile?.role === 'ANALYST') {
          router.push('/portal')
        } else {
          router.push('/')
        }
      }
    }
    
    checkUser()
  }, [router, supabase])

  // Animated text effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === animatedPhrases.length - 1) {
        setTitleNumber(0)
      } else {
        setTitleNumber(titleNumber + 1)
      }
    }, 3000) // Longer duration for longer phrases
    return () => clearTimeout(timeoutId)
  }, [titleNumber, animatedPhrases])

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
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
        setIsLoading(false)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      // Show success message
      alert('Magic link sent! Check your email.')
      setIsLoading(false)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Simple mock authentication
      if (formData.email === 'admin@hrtech.com' && formData.password === 'password') {
        // Store user session
        localStorage.setItem('user', JSON.stringify({
          email: formData.email,
          name: 'Admin User',
          role: 'ADMIN'
        }))
        
        router.push('/')
      } else if (formData.email === 'sarah.chen@gartner.com' && formData.password === 'password') {
        // Analyst login
        localStorage.setItem('user', JSON.stringify({
          email: formData.email,
          name: 'Sarah Chen',
          role: 'ANALYST'
        }))
        
        router.push('/portal')
      } else {
        setError('Invalid email or password')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    }
    
    setIsLoading(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:flex-1 lg:justify-center lg:items-center">
        <div className="text-center max-w-lg">
          {/* ClearCompany Logo */}
          <div className="mb-12">
            <Image 
              src="/clearco-logo.png" 
              alt="ClearCo Logo" 
              width={200} 
              height={80} 
              className="mx-auto"
            />
          </div>
          
          {/* Main Heading with Animated Text */}
          <div className="flex flex-col gap-2">
            <h1 className="text-5xl font-bold text-white leading-tight">
              Let us show you
            </h1>
            <h1 className="text-5xl font-bold text-white leading-tight">
              something
            </h1>
            <div className="text-5xl font-bold text-white italic leading-tight h-20 flex items-center justify-center">
              <span className="relative flex justify-center overflow-hidden min-w-full">
                {animatedPhrases.map((phrase, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-bold italic whitespace-nowrap"
                    initial={{ opacity: 0, y: "-100" }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {phrase}
                  </motion.span>
                ))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex justify-center items-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="w-full max-w-sm lg:w-96">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-purple-900 mb-2">
                ClearCompany
              </h2>
              <h3 className="text-xl font-semibold text-purple-800 mb-4">
                Vision & Roadmap
              </h3>
              <h4 className="text-lg font-medium text-gray-800 mb-4">
                Sign In
              </h4>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Sign in with Google
            </button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Email Input and Method Toggle */}
            <form onSubmit={loginMethod === 'magic' ? handleMagicLink : handlePasswordSignIn} className="space-y-4">
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Work email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Toggle between Magic Link and Password */}
              <div className="flex space-x-2">
                <button
                  type={loginMethod === 'magic' ? 'submit' : 'button'}
                  onClick={() => {
                    if (loginMethod !== 'magic') {
                      setLoginMethod('magic')
                    }
                  }}
                  disabled={isLoading}
                  className={cn(
                    "flex-1 px-4 py-3 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
                    loginMethod === 'magic'
                      ? "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500"
                  )}
                >
                  {isLoading && loginMethod === 'magic' ? (
                    <><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Sending...</>
                  ) : (
                    'Send me a magic link'
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => setLoginMethod('password')}
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2",
                    loginMethod === 'password'
                      ? "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500"
                  )}
                >
                  Enter my password
                </button>
              </div>

              {/* Password Input (only shown when password method is selected) */}
              {loginMethod === 'password' && (
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              )}

              {/* Submit Button for Password Method */}
              {loginMethod === 'password' && (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Signing in...</>
                  ) : (
                    'Sign In'
                  )}
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

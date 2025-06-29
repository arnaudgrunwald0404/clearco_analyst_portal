'use client'

import { createClient } from '@/lib/supabase/client'

export default function TestOAuthPage() {
  const supabase = createClient()

  const testGoogleOAuth = async () => {
    console.log('Testing Google OAuth with Supabase...')
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })

    if (error) {
      console.error('OAuth Error:', error)
      alert(`OAuth Error: ${error.message}`)
    } else {
      console.log('OAuth initiated successfully:', data)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Test Supabase OAuth</h1>
        <p className="mb-4 text-gray-600">
          This page tests if Supabase OAuth is properly configured.
        </p>
        <button
          onClick={testGoogleOAuth}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Test Google OAuth
        </button>
        <div className="mt-4 text-sm text-gray-500">
          <p>Expected redirect URI in Google Console:</p>
          <code className="bg-gray-100 p-1 rounded text-xs">
            https://qimvwwfwakvgfvclqpue.supabase.co/auth/v1/callback
          </code>
          <p className="mt-2">Current setup (port 3000):</p>
          <ul className="text-xs space-y-1">
            <li>✅ http://localhost:3000/api/auth/google/callback</li>
            <li>✅ http://localhost:3000/api/auth/google-calendar/callback</li>
            <li>✅ https://qimvwwfwakvgfvclqpue.supabase.co/auth/v1/callback</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

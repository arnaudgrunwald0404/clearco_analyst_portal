'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, ArrowRight } from 'lucide-react'

export default function AnalystAccessPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new location in Settings
    router.replace('/settings?section=analyst-portal&tab=access')
  }, [router])

  return (
    <div className="p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="w-12 h-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Analyst Access Moved
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            The Analyst Access functionality has been moved to Settings
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-6">
            You're being redirected to the new location in Settings > Analyst Portal > Access Management
          </p>
          <div className="flex items-center justify-center text-blue-600">
            <ArrowRight className="w-5 h-5 animate-pulse" />
            <span className="ml-2">Redirecting...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
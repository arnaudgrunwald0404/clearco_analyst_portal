'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  FileText,
  MessageSquare,
  Calendar,
  Download,
  Play,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import WelcomeCarousel from '@/components/welcome-carousel'

export default function AnalystPortalDashboard() {
  const [impersonatedAnalyst, setImpersonatedAnalyst] = useState<any>(null)
  const [companySettings, setCompanySettings] = useState<any>(null)

  // Load impersonated analyst from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('impersonatedAnalyst')
    if (stored) {
      try {
        setImpersonatedAnalyst(JSON.parse(stored))
      } catch (error) {
        console.error('Error parsing impersonated analyst:', error)
      }
    }
  }, [])

  // Fetch company settings
  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const response = await fetch('/api/settings/general')
        const data = await response.json()
        setCompanySettings(data)
      } catch (error) {
        console.error('Error fetching company settings:', error)
      }
    }
    fetchCompanySettings()
  }, [])

  // Use impersonated analyst data or fallback to default
  const analystUser = impersonatedAnalyst || {
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah.chen@clearcompany.com',
    company: companySettings?.companyName || 'ClearCompany',
    title: 'Vice President Analyst'
  }

  return (
    <div className="space-y-8">
      {/* Welcome Carousel - Dismissible */}
      <WelcomeCarousel analystUser={analystUser} companySettings={companySettings} />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Quick Links */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Links</h3>
            
            <div className="space-y-4">
              {/* Upcoming Briefing */}
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-transparent border-2 border-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-indigo-700 font-medium mb-1">Upcoming Briefing</div>
                    <div className="text-sm font-semibold text-gray-900">Strategy Session</div>
                    <div className="text-xs text-gray-600 mb-2">Tomorrow 2:00 PM</div>
                    <Link href="https://zoom.us/meeting" className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">
                      Join via Zoom →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Latest Briefing */}
              <Link href="/portal/latest-briefing" className="block bg-gray-50 rounded-lg p-4 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-transparent border-2 border-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Play className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-blue-700 font-medium mb-1">Latest Briefing</div>
                    <div className="text-sm font-semibold text-gray-900">Product Update Q4</div>
                    <div className="text-xs text-gray-600">Watch recording →</div>
                  </div>
                </div>
              </Link>

              {/* Schedule Next Briefing */}
              <Link href="/portal/schedule-briefing" className="block bg-gray-50 rounded-lg p-4 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-transparent border-2 border-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-purple-700 font-medium mb-1">Schedule Briefing</div>
                    <div className="text-sm font-semibold text-gray-900">Book your next session</div>
                    <div className="text-xs text-gray-600">Schedule now →</div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column - Recent Activity Feed */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
            
            <div className="space-y-6">
              {/* New Content Added */}
              <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg border border-green-100">
                <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-700">New Content Added</span>
                    <span className="text-xs text-gray-500">2 hours ago</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Q4 Product Roadmap</h4>
                  <p className="text-sm text-gray-600 mb-3">Comprehensive overview of our product strategy and key milestones for the upcoming quarter.</p>
                  <Link href="/portal/content" className="text-green-600 hover:text-green-800 text-sm font-medium">
                    Read more →
                  </Link>
                </div>
              </div>

              {/* New Testimonial */}
              <div className="flex items-start space-x-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="w-16 h-16 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-700">New Testimonial</span>
                    <span className="text-xs text-gray-500">1 day ago</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Forrester Research</h4>
                  <p className="text-sm text-gray-600 mb-3">"Their innovative approach to HR technology has fundamentally changed how we think about talent management."</p>
                  <Link href="/portal/testimonials" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                    View testimonial →
                  </Link>
                </div>
              </div>

              {/* New Video Resource */}
              <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Play className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">New Video Resource</span>
                    <span className="text-xs text-gray-500">Yesterday</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">HR Tech Trends 2025</h4>
                  <p className="text-sm text-gray-600 mb-3">Expert insights on emerging trends and technologies shaping the future of human resources.</p>
                  <Link href="/portal/content" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Watch video →
                  </Link>
                </div>
              </div>

              {/* Research Report */}
              <div className="flex items-start space-x-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
                <div className="w-16 h-16 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Download className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-orange-700">Research Report Published</span>
                    <span className="text-xs text-gray-500">2 days ago</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Market Analysis Q4</h4>
                  <p className="text-sm text-gray-600 mb-3">In-depth analysis of market trends, competitive landscape, and growth opportunities.</p>
                  <Link href="/portal/content" className="text-orange-600 hover:text-orange-800 text-sm font-medium">
                    Download report →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

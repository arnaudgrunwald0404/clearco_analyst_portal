'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  FileText,
  MessageSquare,
  Newspaper,
  User,
  LogOut,
  Bell,
  Home,
  Calendar,
  ExternalLink,
  Settings,
  UserCheck
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/portal', icon: Home },
  { name: 'Publications', href: '/portal/content', icon: FileText },
  { name: 'Briefings (8)', href: '/portal/briefings', icon: Calendar },
  { name: 'Analyst Testimonials', href: '/portal/testimonials', icon: MessageSquare },
  { name: 'News', href: '/portal/news', icon: Newspaper },
]

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(true) // For now, assume logged in
  const [impersonatedAnalyst, setImpersonatedAnalyst] = useState<any>(null)

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

  // Use impersonated analyst data or fallback to default
  const analystUser = impersonatedAnalyst || {
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah.chen@clearcompany.com',
    company: 'ClearCompany',
    title: 'Vice President Analyst'
  }

  // Check if user is a ClearCompany employee (admin viewing portal)
  const isClearCompanyUser = analystUser.email?.endsWith('@clearcompany.com')
  const isImpersonating = !!impersonatedAnalyst

  if (!isLoggedIn) {
    // Login form would go here
    return <div>Login form...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Impersonation Banner - Moved to top */}
      {isImpersonating && (
        <div className="bg-black text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  <span className="mr-2">🎭</span>
                  You are viewing the analyst portal as <strong>{analystUser.firstName} {analystUser.lastName}</strong>
                  {analystUser.company && (
                    <span className="text-gray-300"> from {analystUser.company}</span>
                  )}
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  This view reflects the permissions, content, and experience that {analystUser.firstName} would see.
                </p>
              </div>
              <button
                onClick={() => {
                  sessionStorage.removeItem('impersonatedAnalyst')
                  window.location.href = '/'
                }}
                className="px-3 py-1 text-xs font-medium text-black bg-white hover:bg-gray-100 rounded-md transition-colors"
              >
                Exit Impersonation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                HR Tech Analysts Portal
              </h1>
            </div>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Bell className="w-5 h-5" />
              </button>
              
              {/* ClearCompany Admin Link */}
              {isClearCompanyUser && (
                <Link
                  href="/"
                  className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Back to Admin Dashboard"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Admin</span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Link>
              )}
              
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-white">
                      {analystUser.firstName.charAt(0)}{analystUser.lastName.charAt(0)}
                    </span>
                  </div>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-700">
                    {analystUser.firstName} {analystUser.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{analystUser.company}</p>
                </div>
              </div>

              <button 
                onClick={() => setIsLoggedIn(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors',
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>


      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}

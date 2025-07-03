'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { AnalystImpersonationModal } from '../analyst-impersonation-modal'
import {
  Users,
  Mail,
  BarChart3,
  Settings,
  Home,
  User,
  Lock,
  MessageSquare,
  LogOut,
  ChevronDown,
  Calendar,
  Award
} from 'lucide-react'

// Main navigation items (excluding Analyst Portal)
const mainNavigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Analysts', href: '/analysts', icon: Users },
  { name: 'Briefings', href: '/briefings', icon: Calendar },
  { name: 'Newsletters', href: '/newsletters', icon: Mail },
  { name: 'Testimonials', href: '/testimonials', icon: MessageSquare },
  { name: 'Awards', href: '/awards', icon: Award },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

// Analyst Portal as separate item (moved to bottom)
const analystPortalItem = { name: 'Analyst Portal', href: '/portal', icon: User }

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isImpersonationModalOpen, setIsImpersonationModalOpen] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')
  const { user, profile, signOut } = useAuth()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings/general')
        if (response.ok) {
          const data = await response.json()
          setLogoUrl(data.logoUrl || '')
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      }
    }

    fetchSettings()
  }, [])

  const handleLogout = async () => {
    try {
      console.log('Starting forced sign out process...')
      await signOut()
      
      // Additional forced cleanup
      localStorage.clear()
      sessionStorage.clear()
      
      // Use window.location for hard redirect to ensure complete session termination
      window.location.href = '/auth'
    } catch (error) {
      console.error('Error during forced sign out:', error)
      
      // Fallback: force clear everything and redirect
      localStorage.clear()
      sessionStorage.clear()
      
      // Clear any remaining auth tokens or state
      if (typeof document !== 'undefined') {
        document.cookie.split(";").forEach(function(c) {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      }
      
      // Force redirect even if signOut failed
      window.location.href = '/auth'
    }
  }

  // Generate user initials from first and last name or email
  const getUserInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    }
    if (user?.email) {
      const emailParts = user.email.split('@')[0]
      return emailParts.slice(0, 2).toUpperCase()
    }
    return 'AU'
  }

  // Get display name
  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`
    }
    if (profile?.first_name) {
      return profile.first_name
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'Admin User'
  }

  // Get email
  const getEmail = () => {
    return user?.email || profile?.email || 'admin@company.com'
  }

  const handleAnalystPortalClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsImpersonationModalOpen(true)
  }

  const handleImpersonate = (analyst: { id: string; firstName: string; lastName: string; email: string }) => {
    // Store the selected analyst in sessionStorage for the portal to access
    sessionStorage.setItem('impersonatedAnalyst', JSON.stringify(analyst))
    // Navigate to the portal
    router.push('/portal')
  }

  return (
    <>
      <div className="flex flex-col w-64 bg-white shadow-lg">
        {/* Logo Section */}
        {logoUrl && (
          <div className="flex items-center justify-center h-64 p-6 bg-gray-50 border-b border-gray-200">
            <img
              src={logoUrl}
              alt="Company Logo"
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}
        <nav className="flex-1 px-4 pb-4 pt-6">
          {/* Main Navigation */}
          <ul className="space-y-2">
            {mainNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Separator */}
          <div className="my-4">
            <hr className="border-gray-200" />
          </div>

          {/* Analyst Portal (with impersonation) */}
          <ul className="space-y-2">
            <li>
              <button
                onClick={handleAnalystPortalClick}
                className={cn(
                  'flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors text-left',
                  pathname.startsWith('/portal')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <analystPortalItem.icon className="w-5 h-5 mr-3" />
                {analystPortalItem.name}
              </button>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center w-full p-2 text-left rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-white">{getUserInitials()}</span>
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{getDisplayName()}</p>
                <p className="text-xs text-gray-600 truncate">{getEmail()}</p>
              </div>
              <ChevronDown className={cn(
                "w-4 h-4 text-gray-400 transition-transform",
                isDropdownOpen && "transform rotate-180"
              )} />
            </button>

            {isDropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <Link
                  href="/profile"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <User className="w-4 h-4 mr-3" />
                  View Profile
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
                </Link>
                <hr className="my-1 border-gray-200" />
                <button
                  onClick={() => {
                    setIsDropdownOpen(false)
                    handleLogout()
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analyst Impersonation Modal */}
      <AnalystImpersonationModal
        isOpen={isImpersonationModalOpen}
        onClose={() => setIsImpersonationModalOpen(false)}
        onImpersonate={handleImpersonate}
      />
    </>
  )
}

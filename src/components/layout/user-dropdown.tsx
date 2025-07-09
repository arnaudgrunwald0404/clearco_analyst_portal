'use client'

import Link from 'next/link'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

interface UserDropdownProps {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}

export function UserDropdown({ isOpen, onToggle, onClose }: UserDropdownProps) {
  const { user, profile, signOut } = useAuth()

  // Debug logging
  console.log('UserDropdown - user:', user)
  console.log('UserDropdown - profile:', profile)

  const handleLogout = async () => {
    console.log('🚪 LOGOUT: Starting logout process...')
    
    // Close dropdown first
    onClose()
    
    try {
      // Clear storage immediately
      console.log('🧹 LOGOUT: Clearing storage...')
      localStorage.clear()
      sessionStorage.clear()
      
      // Try to sign out from Supabase (but don't wait for it)
      console.log('🔐 LOGOUT: Attempting Supabase signout...')
      signOut().catch(error => {
        console.error('❌ LOGOUT: Supabase signout failed (but continuing):', error)
      })
      
      // Immediately redirect to login
      console.log('🔄 LOGOUT: Redirecting to login page...')
      window.location.href = '/login'
      
    } catch (error) {
      console.error('❌ LOGOUT: Error during logout:', error)
      // Force redirect anyway
      console.log('🚨 LOGOUT: Forcing redirect after error...')
      window.location.href = '/login'
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

  return (
    <div className="p-4 border-t border-gray-200 bg-white">
      <div className="relative">
        <button
          onClick={onToggle}
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
            isOpen && "transform rotate-180"
          )} />
        </button>

        {isOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            <Link
              href="/profile"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={onClose}
            >
              <User className="w-4 h-4 mr-3" />
              View Profile
            </Link>
            <Link
              href="/settings"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={onClose}
            >
              <Settings className="w-4 h-4 mr-3" />
              Settings
            </Link>
            <hr className="my-1 border-gray-200" />
            <button
              onClick={() => {
                console.log('🚪 DIRECT LOGOUT: Immediate redirect test...')
                window.location.href = '/login'
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out (Direct)
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out (Auth)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

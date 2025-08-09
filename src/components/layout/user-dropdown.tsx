'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, LogOut, User, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

interface UserDropdownProps {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}

export function UserDropdown({ isOpen, onToggle, onClose }: UserDropdownProps) {
  const { user, signOut } = useAuth()

  // Check for invalid user data and redirect to login if needed
  useEffect(() => {
    if (user && (!user.email || (!user.name || user.name === 'Admin User'))) {
      console.warn('Invalid user session detected, signing out...')
      signOut()
    }
  }, [user, signOut])

  const handleLogout = async () => {
    onClose()
    await signOut()
  }

  // Generate user initials from name or email
  const getUserInitials = () => {
    if (user?.name) {
      const nameParts = user.name.split(' ')
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
      }
      return nameParts[0][0].toUpperCase()
    }
    if (user?.email) {
      const emailParts = user.email.split('@')[0]
      return emailParts.slice(0, 2).toUpperCase()
    }
    return 'AU'
  }

  // Get display name - if we reach the fallback, this indicates an auth issue
  const getDisplayName = () => {
    if (user?.name && user?.email) {
      return user.name
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    // This fallback indicates invalid auth data - should redirect to login
    console.warn('Invalid user data detected - missing name and email')
    return 'Invalid User'
  }

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {getUserInitials()}
            </span>
          </div>
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900">
            {getDisplayName()}
          </p>
          <p className="text-xs text-gray-500">{user?.role}</p>
        </div>
        <ChevronDown className={cn(
          'w-4 h-4 text-gray-400 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <div className="py-1">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
            
            <div className="px-4 py-2 text-sm text-gray-700 border-t border-gray-100">
              <p className="font-medium">{getDisplayName()}</p>
              <p className="text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

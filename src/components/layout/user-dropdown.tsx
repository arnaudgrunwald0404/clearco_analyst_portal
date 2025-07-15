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
  const { user, profile, signOut } = useAuth()

  const handleLogout = async () => {
    console.log('🚪 LOGOUT: Mock logout called')
    
    // Close dropdown first
    onClose()
    
    // Just log for now - no actual logout needed
    console.log('Mock logout completed')
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
          <p className="text-xs text-gray-500">{profile?.role}</p>
        </div>
        <ChevronDown className={cn(
          'w-4 h-4 text-gray-400 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <div className="py-1">
            <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
              <p className="font-medium">{getDisplayName()}</p>
              <p className="text-gray-500">{user?.email}</p>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

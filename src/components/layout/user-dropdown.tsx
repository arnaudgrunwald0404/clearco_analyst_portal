'use client'

import { ChevronDown, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useRef } from 'react'

interface UserDropdownProps {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}

export function UserDropdown({ isOpen, onToggle, onClose }: UserDropdownProps) {
  const { user, loading, signOut } = useAuth()
  const rootRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    onClose()
    await signOut()
  }

  // Close on click outside or Escape
  useEffect(() => {
    if (!isOpen) return

    const handleClick = (e: MouseEvent) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [isOpen, onClose])

  // While auth is loading, render nothing to avoid flicker
  if (loading) {
    return null
  }

  // If user is invalid or missing after loading, render nothing
  if (!user || !user.email) {
    return null
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
    const emailParts = user.email.split('@')[0]
    return emailParts.slice(0, 2).toUpperCase()
  }

  // Get display name
  const getDisplayName = () => {
    if (user?.name && user?.email) {
      return user.name
    }
    return user.email.split('@')[0]
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={onToggle}
        className="flex items-center w-full justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-3">
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
        </div>
        <ChevronDown className={cn(
          'w-4 h-4 text-gray-400 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{getDisplayName()}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <div className="py-1">
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

'use client'

import { useState } from 'react'
import { SidebarLogo } from './sidebar-logo'
import { NavigationLinks } from './navigation-links'
import { UserDropdown } from './user-dropdown'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { User, Shield } from 'lucide-react'

export function Sidebar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { currentRole, toggleRole, profile } = useAuth()

  return (
    <div className="flex flex-col w-64 bg-white shadow-lg h-full">
      {/* Logo Section */}
      <SidebarLogo />
      
      {/* Role Toggle Button */}
      <div className="px-4 py-3 border-b border-gray-200">
        <Button
          onClick={toggleRole}
          variant="outline"
          size="sm"
          className="w-full justify-start"
        >
          {currentRole === 'ADMIN' ? (
            <>
              <Shield className="w-4 h-4 mr-2" />
              Admin Mode
            </>
          ) : (
            <>
              <User className="w-4 h-4 mr-2" />
              Analyst Mode
            </>
          )}
        </Button>
        <p className="text-xs text-gray-500 mt-1 text-center">
          {profile?.first_name} {profile?.last_name}
        </p>
      </div>
      
      {/* Navigation Links */}
      <NavigationLinks />
      
      {/* User Dropdown */}
      <UserDropdown 
        isOpen={isDropdownOpen}
        onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
        onClose={() => setIsDropdownOpen(false)}
      />
    </div>
  )
}

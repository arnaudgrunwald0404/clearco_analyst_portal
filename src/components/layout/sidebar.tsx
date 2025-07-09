'use client'

import { useState } from 'react'
import { SidebarLogo } from './sidebar-logo'
import { NavigationLinks } from './navigation-links'
import { UserDropdown } from './user-dropdown'

export function Sidebar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  return (
    <div className="flex flex-col w-64 bg-white shadow-lg h-full">
      {/* Logo Section */}
      <SidebarLogo />
      
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

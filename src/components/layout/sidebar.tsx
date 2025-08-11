'use client'

import { SidebarLogo } from './sidebar-logo'
import { NavigationLinks } from './navigation-links'

export function Sidebar() {
  return (
    <div className="flex flex-col w-64 bg-white shadow-lg h-full">
      {/* Logo Section */}
      <SidebarLogo />
      
      {/* Navigation Links */}
      <NavigationLinks />
    </div>
  )
}

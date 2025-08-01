'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { mainNavigation, analystPortalItem, type NavigationItem } from './navigation-config'
import { AnalystImpersonationModal } from '../modals/analyst-impersonation-modal'

export function NavigationLinks() {
  const pathname = usePathname()
  const router = useRouter()
  const [isImpersonationModalOpen, setIsImpersonationModalOpen] = useState(false)

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

  const renderNavigationItem = (item: NavigationItem) => {
    const isActive = pathname === item.href
    const isBriefingsDue = item.name === 'Briefings due'
    
    return (
      <li key={item.name} className={isBriefingsDue ? '-mt-2' : ''}>
        <Link
          href={item.href}
          className={cn(
            'flex items-center text-sm font-medium rounded-lg transition-colors',
            isBriefingsDue 
              ? 'px-4 py-2 ml-8' // Indented sub-item styling
              : 'px-4 py-3', // Regular item styling
            isActive
              ? 'bg-blue-100 text-blue-700'
              : isBriefingsDue 
              ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' // Lighter text for sub-item
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          )}
        >
          {/* Only show icon for main items, not for sub-items */}
          {!isBriefingsDue && <item.icon className="w-5 h-5 mr-3" />}
          {item.name}
        </Link>
      </li>
    )
  }

  return (
    <>
      <nav className="flex-1 px-4 pb-4 pt-6">
        {/* Main Navigation */}
        <ul className="space-y-2">
          {mainNavigation.map((item) => {
            return renderNavigationItem(item)
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

      {/* Analyst Impersonation Modal */}
      <AnalystImpersonationModal
        isOpen={isImpersonationModalOpen}
        onClose={() => setIsImpersonationModalOpen(false)}
        onImpersonate={handleImpersonate}
      />
    </>
  )
}

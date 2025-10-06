'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { mainNavigation, adminNavigationItem, analystPortalItem, type NavigationItem } from './navigation-config'
import { AnalystImpersonationModal } from '../modals/analyst-impersonation-modal'
import { useAuth } from '@/contexts/AuthContext'
import { useSettings } from '@/contexts/SettingsContext'
import { isSuperAdmin } from '@/lib/auth-utils-client'

export function NavigationLinks() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signInAnalyst } = useAuth()
  const { settings } = useSettings()
  const [isImpersonationModalOpen, setIsImpersonationModalOpen] = useState(false)

  const handleAnalystPortalClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsImpersonationModalOpen(true)
  }

  const handleImpersonate = async (analyst: { id: string; firstName: string; lastName: string; email: string }) => {
    // Persist selection for any auxiliary logic
    sessionStorage.setItem('impersonatedAnalyst', JSON.stringify(analyst))

    // Programmatic analyst login using shared password (public env for client)
    const password = process.env.NEXT_PUBLIC_DEFAULT_ANALYST_PASSWORD || 'changeme123!'
    const res = await signInAnalyst(analyst.email, password)
    if (res.success) {
      // Include analystId in URL so server components know the context
      router.push(`/analyst_portal/analyst_hub?analystId=${encodeURIComponent(analyst.id)}`)
    } else {
      alert(res.error || 'Failed to open portal as analyst')
    }
  }

  const renderNavigationItem = (item: NavigationItem) => {
    const isActive = pathname === item.href
    const isSubItem = item.name === 'Briefings Due' || item.name === 'Follow Ups'
    
    return (
      <li key={item.name} className={isSubItem ? '-mt-2' : ''}>
        <Link
          href={item.href}
          className={cn(
            'flex items-center text-sm font-medium rounded-lg transition-colors',
            isSubItem 
              ? 'px-4 py-2 ml-8' // Indented sub-item styling
              : 'px-4 py-3', // Regular item styling
            isActive
              ? 'bg-pink-100 text-pink-700'
              : isSubItem 
              ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' // Lighter text for sub-item
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          )}
        >
          {/* Only show icon for main items, not for sub-items, and only if icon exists */}
          {!isSubItem && item.icon && <item.icon className="w-5 h-5 mr-3" />}
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

        {/* Separator - only show if there are items below */}
        {isSuperAdmin(user) && (
          <div className="my-4">
            <hr className="border-gray-200" />
          </div>
        )}

        {/* Items under separator */}
        {isSuperAdmin(user) && (
          <ul className="space-y-2">
            {/* Admin - only show for Super Admins */}
            <li>
              <Link
                href={adminNavigationItem.href}
                className={cn(
                  'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                  pathname?.startsWith('/admin')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <adminNavigationItem.icon className="w-5 h-5 mr-3" />
                {adminNavigationItem.name}
              </Link>
            </li>
            {/* Analyst Portal removed from vendor navigation - only accessible via direct URL or admin impersonation */}
          </ul>
        )}
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

'use client'

import React from 'react'
import { PortalTabs } from '@/components/portal/PortalTabs'

interface PortalShellProps {
  sidebar?: React.ReactNode
  rightSidebar?: React.ReactNode
  children: React.ReactNode
}

export default function PortalShell({ sidebar, rightSidebar, children }: PortalShellProps) {
  const hasRight = !!rightSidebar
  return (
    <div className="min-h-[100svh] bg-gray-50">
      {/* Main grid area (full width) */}
      <div className="w-full px-24 py-6">
        <div className={`grid grid-cols-1 gap-y-4 gap-x-18 ${hasRight ? 'lg:grid-cols-[2.5fr_7fr_2.5fr] xl:grid-cols-[2.5fr_7fr_2.5fr]' : 'lg:grid-cols-[2.5fr_9.5fr] xl:grid-cols-[2.5fr_9.5fr]'}`}>
          {/* Left Sidebar */}
          <aside className="order-1 lg:order-none min-w-0">
            {sidebar}
          </aside>

          {/* Main Content */}
          <main className={`min-w-0`}>
            {/* Tabs at top of content, aligned to the right of the sidebar */}
            <div className="mb-4">
              <PortalTabs />
            </div>
            {children}
          </main>

          {/* Right Sidebar (optional) */}
          {hasRight && (
            <aside className="min-w-0">
              {rightSidebar}
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import AnalystSidebar from '@/components/analyst/AnalystSidebar'
import AnalystHeader from '@/components/analyst/AnalystHeader'

export default function AnalystHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AnalystHeader />
      <div className="flex">
        <AnalystSidebar />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
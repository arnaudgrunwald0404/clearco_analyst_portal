'use client'

import BriefingDensityChart from '@/components/analytics/briefing-density-chart'

export default function AnalyticsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Analytics</h1>
      <BriefingDensityChart />
    </div>
  )
}

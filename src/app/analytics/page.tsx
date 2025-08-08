'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'
import BriefingDensityChart from '@/components/analytics/briefing-density-chart'

export default function AnalyticsPage() {
  return (
    <div className="p-8">
      <Card className="shadow-sm border border-gray-200 p-6">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            Analytics
          </CardTitle>
          <CardDescription className="text-base ml-10 text-gray-600 leading-relaxed">
            View detailed analytics and insights about your analyst relationships and activities
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2 pl-4 mr-10">
          <BriefingDensityChart />
        </CardContent>
      </Card>
    </div>
  )
}

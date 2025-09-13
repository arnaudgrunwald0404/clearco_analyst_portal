'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, TrendingUp, Calendar, Activity, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface UsageData {
  totalRequests: number
  remainingRequests: number
  dailyAverage: number
  projectedMonthly: number
  canMakeRequest: boolean
  warning?: string
}

interface WeeklyData {
  thisWeek: number
  lastWeek: number
  weeklyBudget: number
  canRunWeeklySync: boolean
}

export default function TwitterUsageDashboard() {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [weeklyData, setWeeklyData] = useState<WeeklyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsageData = async () => {
    try {
      setLoading(true)
      setError(null)

      // This would need to be implemented as an API endpoint
      const response = await fetch('/api/social-media/twitter-usage')
      const result = await response.json()

      if (result.success) {
        setUsage(result.data.monthly)
        setWeeklyData(result.data.weekly)
      } else {
        throw new Error(result.error || 'Failed to fetch usage data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error fetching Twitter usage:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsageData()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading usage data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load usage data: {error}
            </AlertDescription>
          </Alert>
          <Button onClick={fetchUsageData} className="mt-4" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const usagePercentage = usage ? (usage.totalRequests / 500) * 100 : 0
  const weeklyPercentage = weeklyData ? (weeklyData.thisWeek / weeklyData.weeklyBudget) * 100 : 0

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-500'
    if (percentage >= 70) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getUsageVariant = (percentage: number) => {
    if (percentage >= 90) return 'destructive' as const
    if (percentage >= 70) return 'secondary' as const
    return 'default' as const
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Monthly Usage
            </CardTitle>
            <CardDescription>
              Twitter API requests this month (500 limit)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {usage && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">
                      {usage.totalRequests}
                    </span>
                    <Badge variant={getUsageVariant(usagePercentage)}>
                      {usagePercentage.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={usagePercentage} className="h-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{usage.remainingRequests} remaining</span>
                    <span>500 total</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Daily Average</p>
                    <p className="text-lg font-semibold">{usage.dailyAverage}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Projected</p>
                    <p className={`text-lg font-semibold ${getUsageColor((usage.projectedMonthly / 500) * 100)}`}>
                      {usage.projectedMonthly}
                    </p>
                  </div>
                </div>

                {usage.warning && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{usage.warning}</AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Weekly Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Weekly Usage
            </CardTitle>
            <CardDescription>
              This week's API usage (115 weekly budget)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {weeklyData && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">
                      {weeklyData.thisWeek}
                    </span>
                    <Badge variant={getUsageVariant(weeklyPercentage)}>
                      {weeklyPercentage.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={weeklyPercentage} className="h-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{weeklyData.weeklyBudget - weeklyData.thisWeek} remaining</span>
                    <span>{weeklyData.weeklyBudget} budget</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Last Week</p>
                    <p className="text-lg font-semibold">{weeklyData.lastWeek}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sync Status</p>
                    <Badge variant={weeklyData.canRunWeeklySync ? "default" : "destructive"}>
                      {weeklyData.canRunWeeklySync ? "Available" : "Budget Exceeded"}
                    </Badge>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Usage Summary & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-sm text-muted-foreground">SAFE DAILY USAGE</h4>
              <p className="text-2xl font-bold text-green-600">≤16</p>
              <p className="text-xs text-muted-foreground">requests per day</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-sm text-muted-foreground">WEEKLY BUDGET</h4>
              <p className="text-2xl font-bold text-blue-600">115</p>
              <p className="text-xs text-muted-foreground">requests per week</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-sm text-muted-foreground">MONTHLY LIMIT</h4>
              <p className="text-2xl font-bold text-red-600">500</p>
              <p className="text-xs text-muted-foreground">hard limit</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Recommendations:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Run weekly sync on Sundays to refresh analyst Twitter data</li>
              <li>Limit manual testing to 2-3 requests per day maximum</li>
              <li>Process 8-10 analysts per week (10 tweets each = ~10 requests)</li>
              <li>Monitor usage daily to avoid exceeding monthly limit</li>
              <li>Use dry-run mode for testing whenever possible</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button onClick={fetchUsageData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Contribution {
  date: string
  count: number
  maxInfluence?: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | null
}

const BriefingDensityChart = () => {
  const [data, setData] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/analytics/briefing-density')
        if (response.ok) {
          const result = await response.json()
          // Handle both direct array and object with data property
          const dataArray = Array.isArray(result) ? result : (result.data || [])
          console.log('📊 Briefing density data:', { result, dataArray })
          setData(dataArray)
        } else {
          console.error('Failed to fetch briefing density data:', response.status, response.statusText)
          setData([])
        }
      } catch (error) {
        console.error('Error fetching briefing density data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const today = new Date()
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(today.getFullYear() - 1)

  const dates = Array.from({ length: 365 }, (_, i) => {
    const date = new Date(oneYearAgo)
    date.setDate(oneYearAgo.getDate() + i)
    return date
  })

  const contributionsByDate = (Array.isArray(data) ? data : []).reduce((acc, curr) => {
    acc[curr.date] = { count: curr.count, maxInfluence: curr.maxInfluence }
    return acc
  }, {} as Record<string, { count: number; maxInfluence?: Contribution['maxInfluence'] }>)

  const getInfluenceColor = (maxInfluence?: Contribution['maxInfluence'], count?: number) => {
    if (!count || count === 0) return 'bg-gray-100 text-gray-900'
    switch (maxInfluence) {
      case 'VERY_HIGH':
        return 'bg-red-600 text-white'
      case 'HIGH':
        return 'bg-orange-500 text-white'
      case 'MEDIUM':
        return 'bg-yellow-400 text-gray-900'
      case 'LOW':
        return 'bg-green-500 text-white'
      default:
        return 'bg-gray-300 text-gray-900'
    }
  }

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]

  const monthLabels = []
  let lastMonth = -1
  for (let i = 0; i < 52; i++) {
    const date = dates[i * 7]
    const month = date.getMonth()
    if (month !== lastMonth) {
      monthLabels.push(
        <div key={i} className="text-xs text-gray-500" style={{ gridColumn: i + 1 }}>
          {months[month]}
        </div>
      )
      lastMonth = month
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Briefing Density</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="grid grid-cols-52 gap-1 mb-2">
              {monthLabels}
            </div>
            <div className="grid grid-flow-col grid-rows-7 gap-1">
              {dates.map((date, i) => {
                const dateString = date.toISOString().split('T')[0]
                const info = contributionsByDate[dateString] || { count: 0, maxInfluence: undefined }
                const color = getInfluenceColor(info.maxInfluence, info.count)
                return (
                  <div
                    key={i}
                    className={`relative w-4 h-4 rounded-sm flex items-center justify-center ${color}`}
                    title={`${info.count} meeting${info.count === 1 ? '' : 's'} on ${date.toDateString()}`}
                  >
                    {info.count > 1 && (
                      <span className="text-[10px] leading-none font-semibold">
                        {info.count}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex justify-end items-center mt-4 text-xs text-gray-600 gap-2">
              <span>Influence:</span>
              <div className="flex items-center gap-1"><div className="w-4 h-4 rounded-sm bg-green-500" /> <span>Low</span></div>
              <div className="flex items-center gap-1"><div className="w-4 h-4 rounded-sm bg-yellow-400" /> <span>Medium</span></div>
              <div className="flex items-center gap-1"><div className="w-4 h-4 rounded-sm bg-orange-500" /> <span>High</span></div>
              <div className="flex items-center gap-1"><div className="w-4 h-4 rounded-sm bg-red-600" /> <span>Very High</span></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default BriefingDensityChart 
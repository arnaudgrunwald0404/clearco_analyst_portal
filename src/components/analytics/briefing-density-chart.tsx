'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Contribution {
  date: string
  count: number
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
    acc[curr.date] = curr.count
    return acc
  }, {} as Record<string, number>)

  const getColor = (count: number) => {
    if (count === 0) return 'bg-gray-100'
    if (count <= 1) return 'bg-green-200'
    if (count <= 3) return 'bg-green-400'
    if (count <= 5) return 'bg-green-600'
    return 'bg-green-800'
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
                const count = contributionsByDate[dateString] || 0
                return (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-sm ${getColor(count)}`}
                    title={`${count} briefings on ${date.toDateString()}`}
                  />
                )
              })}
            </div>
            <div className="flex justify-end items-center mt-4 text-xs text-gray-600">
              <span>Less</span>
              <div className="w-4 h-4 bg-gray-100 rounded-sm mx-1"></div>
              <div className="w-4 h-4 bg-green-200 rounded-sm mx-1"></div>
              <div className="w-4 h-4 bg-green-400 rounded-sm mx-1"></div>
              <div className="w-4 h-4 bg-green-600 rounded-sm mx-1"></div>
              <div className="w-4 h-4 bg-green-800 rounded-sm mx-1"></div>
              <span>More</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default BriefingDensityChart 
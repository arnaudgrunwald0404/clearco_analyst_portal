'use client'

import { useState, useEffect } from 'react'

export interface BoulderEpic {
  id: string
  name: string
  alternate_name?: string
  description?: string
  module?: string
  devRoadmap?: string
  quarter: string
  release?: string
  releaseDate?: string
  status?: string
  statusComplete?: boolean
  boulder_file_url?: string
  cpo_take?: string
  priority?: 'Critical' | 'High' | 'Medium' | 'Low'
  effort?: string
  team_size?: number
  dependencies?: string[]
}

export interface QuarterGroup {
  quarter: string
  epics: BoulderEpic[]
}

export interface BoulderResponse {
  quarters: QuarterGroup[]
  availableModules: string[]
  totalBoulders: number
  filteredBoulders: number
}

export interface BoulderParams {
  search?: string
  modules?: string[]
  pastQuarters?: number
  futureQuarters?: number
}

export interface UseBoulders {
  data: BoulderResponse | null
  isLoading: boolean
  error: Error | null
  refetch: (params?: BoulderParams) => void
}

export function useBoulders(params: BoulderParams = {}): UseBoulders {
  const [data, setData] = useState<BoulderResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchBoulders = async (fetchParams: BoulderParams = {}) => {
    try {
      setIsLoading(true)
      setError(null)

      // Build query parameters
      const searchParams = new URLSearchParams()
      
      if (fetchParams.search) {
        searchParams.append('search', fetchParams.search)
      }
      
      if (fetchParams.modules && fetchParams.modules.length > 0) {
        searchParams.append('modules', fetchParams.modules.join(','))
      }
      
      if (fetchParams.pastQuarters) {
        searchParams.append('pastQuarters', fetchParams.pastQuarters.toString())
      }
      
      if (fetchParams.futureQuarters) {
        searchParams.append('futureQuarters', fetchParams.futureQuarters.toString())
      }

      // Try the boulders API endpoint
      const response = await fetch(`/api/boulders?${searchParams.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch boulders: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error('Error fetching boulders:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch'))
      
      // Set fallback data so the UI doesn't break completely
      setData({
        quarters: [],
        availableModules: [],
        totalBoulders: 0,
        filteredBoulders: 0
      })
    } finally {
      setIsLoading(false)
    }
  }

  const refetch = (newParams?: BoulderParams) => {
    const mergedParams = { ...params, ...newParams }
    fetchBoulders(mergedParams)
  }

  useEffect(() => {
    fetchBoulders(params)
  }, []) // Only run on mount

  return {
    data,
    isLoading,
    error,
    refetch
  }
}
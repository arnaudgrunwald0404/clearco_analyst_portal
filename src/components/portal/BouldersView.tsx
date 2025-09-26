'use client'

import React, { useState } from 'react'
import { useBoulders, BoulderEpic } from '@/hooks/useBoulders'
import { Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { SimpleBoulderCard } from './SimpleBoulderCard'
import { MultiSelect, Option } from '@/components/ui/multi-select'

export const BouldersView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [selectedEpic, setSelectedEpic] = useState<BoulderEpic | null>(null)
  
  const { data, isLoading, error, refetch } = useBoulders({
    search: searchQuery,
    modules: selectedModules,
    pastQuarters: 2,
    futureQuarters: 3
  })

  // Handle search with debouncing
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    // Debounce the API call
    const timeoutId = setTimeout(() => {
      refetch({ search: query, modules: selectedModules })
    }, 500)
    
    // Cleanup function to prevent multiple API calls
    return () => clearTimeout(timeoutId)
  }

  // Handle module filter change
  const handleModuleChange = (modules: string[]) => {
    setSelectedModules(modules)
    refetch({ search: searchQuery, modules })
  }

  // Build module options for MultiSelect
  const moduleOptions: Option[] = (data?.availableModules || [])
    .map(module => ({
      value: module,
      label: module,
    }))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="ml-2 text-gray-600">Loading Boulders...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        <p>Error loading Boulders: {error.message}</p>
        <button 
          onClick={() => refetch()} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="py-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Boulders - Significant Roadmap Items
      </h2>
      
      <div className="text-sm text-gray-900 mb-4 hidden md:block">
        This view shows the most significant roadmap items ("boulders") organized by quarters. 
        These are items of particular significance for customer delight and strategic direction.
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 mt-2 mb-4 w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          <label htmlFor="boulders-search" className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Search
          </label>
          <div className="relative w-full sm:w-[286px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="boulders-search"
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className="pl-9 w-full"
              type="text"
            />
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          <label htmlFor="boulder-module-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Module/R&D Pod:
          </label>
          <MultiSelect
            options={moduleOptions}
            selected={selectedModules}
            onChange={handleModuleChange}
            placeholder="All modules"
            className="w-full sm:w-[286px]"
          />
        </div>
      </div>

      {/* Results Summary */}
      {data && (
        <div className="text-sm text-gray-600 mb-4">
          Showing {data.filteredBoulders} of {data.totalBoulders} boulders
        </div>
      )}

      {/* Quarters Display */}
      {data?.quarters.map(quarterGroup => {
        if (quarterGroup.epics.length === 0) {
          return (
            <div key={quarterGroup.quarter} className="mb-8">
              <h3 className="text-xl font-semibold text-gray-700 mb-3">{quarterGroup.quarter}</h3>
              <p className="text-gray-500">No boulders scheduled for this quarter.</p>
            </div>
          )
        }

        return (
          <div key={quarterGroup.quarter} className="mb-8">
            <h3 className="text-xl font-bold text-gray-700 mb-3">{quarterGroup.quarter}</h3>
            <div className="boulder-quarter-row flex overflow-x-auto pb-4 -mb-4 pr-4">
              <div className="flex flex-col md:flex-row flex-nowrap pl-1 gap-4">
                {quarterGroup.epics.map(epic => (
                  <SimpleBoulderCard 
                    key={epic.id} 
                    epic={epic} 
                    onClick={(epic) => {
                      // For now, just log the click - you can add modal later
                      console.log('Boulder clicked:', epic)
                      setSelectedEpic(epic)
                    }} 
                  />
                ))}
              </div>
            </div>
          </div>
        )
      })}

      {/* Empty State */}
      {data && data.quarters.every(q => q.epics.length === 0) && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No Boulders match your current filters.</p>
          <p className="text-gray-400 text-sm mt-2">
            Try adjusting your search terms or module filters.
          </p>
        </div>
      )}
    </div>
  )
}



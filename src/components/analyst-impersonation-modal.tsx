'use client'

import { useState, useEffect } from 'react'
import { X, Search, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Analyst {
  id: string
  firstName: string
  lastName: string
  email: string
  company?: string
  title?: string
}

interface AnalystImpersonationModalProps {
  isOpen: boolean
  onClose: () => void
  onImpersonate: (analyst: Analyst) => void
}

export function AnalystImpersonationModal({ 
  isOpen, 
  onClose, 
  onImpersonate 
}: AnalystImpersonationModalProps) {
  const [analysts, setAnalysts] = useState<Analyst[]>([])
  const [filteredAnalysts, setFilteredAnalysts] = useState<Analyst[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAnalyst, setSelectedAnalyst] = useState<Analyst | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch analysts when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAnalysts()
    }
  }, [isOpen])

  // Filter analysts based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredAnalysts(analysts)
    } else {
      const filtered = analysts.filter(analyst => {
        const fullName = `${analyst.firstName} ${analyst.lastName}`.toLowerCase()
        const company = analyst.company?.toLowerCase() || ''
        const email = analyst.email.toLowerCase()
        const term = searchTerm.toLowerCase()
        
        return fullName.includes(term) || 
               company.includes(term) || 
               email.includes(term)
      })
      setFilteredAnalysts(filtered)
    }
  }, [searchTerm, analysts])

  const fetchAnalysts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/analysts')
      if (response.ok) {
        const data = await response.json()
        setAnalysts(data.data || [])
      } else {
        console.error('Failed to fetch analysts')
      }
    } catch (error) {
      console.error('Error fetching analysts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImpersonate = () => {
    if (selectedAnalyst) {
      onImpersonate(selectedAnalyst)
      onClose()
      setSelectedAnalyst(null)
      setSearchTerm('')
    }
  }

  const handleClose = () => {
    onClose()
    setSelectedAnalyst(null)
    setSearchTerm('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Open Analyst Portal As
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search analysts by name, company, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Analyst List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {loading ? (
                <div className="text-center py-4 text-gray-500">
                  Loading analysts...
                </div>
              ) : filteredAnalysts.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  {searchTerm ? 'No analysts found matching your search.' : 'No analysts available.'}
                </div>
              ) : (
                filteredAnalysts.map((analyst) => (
                  <button
                    key={analyst.id}
                    onClick={() => setSelectedAnalyst(analyst)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border transition-colors',
                      selectedAnalyst?.id === analyst.id
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">
                          {analyst.firstName} {analyst.lastName}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {analyst.company && `${analyst.company} • `}{analyst.email}
                        </div>
                        {analyst.title && (
                          <div className="text-xs text-gray-400 truncate">
                            {analyst.title}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImpersonate}
              disabled={!selectedAnalyst}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                selectedAnalyst
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              )}
            >
              Open Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

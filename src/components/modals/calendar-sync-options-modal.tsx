'use client'

import { useState } from 'react'
import { Calendar, Clock, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalendarSyncOptions {
  timeWindow: 'future' | 'custom' | 'all'
  startDate?: string
  endDate?: string
  includePast: boolean
}

interface CalendarSyncOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (options: CalendarSyncOptions) => void
  isStarting: boolean
}

export default function CalendarSyncOptionsModal({
  isOpen,
  onClose,
  onConfirm,
  isStarting
}: CalendarSyncOptionsModalProps) {
  const [options, setOptions] = useState<CalendarSyncOptions>({
    timeWindow: 'future',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    includePast: false
  })

  const handleConfirm = () => {
    onConfirm(options)
  }

  const handleTimeWindowChange = (window: 'future' | 'custom' | 'all') => {
    if (window === 'future') {
      setOptions({
        ...options,
        timeWindow: 'future',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        includePast: false
      })
    } else if (window === 'all') {
      setOptions({
        ...options,
        timeWindow: 'all',
        startDate: new Date(Date.UTC(2024, 0, 1)).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        includePast: true
      })
    } else {
      setOptions({
        ...options,
        timeWindow: 'custom',
        includePast: true
      })
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Calendar Sync Options
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Choose what time period to sync
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Time Window Options */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Time Window</h4>
              
              {/* Future Meetings Only - One-click option */}
              <div className="relative">
                <input
                  type="radio"
                  id="future"
                  name="timeWindow"
                  value="future"
                  checked={options.timeWindow === 'future'}
                  onChange={() => handleTimeWindowChange('future')}
                  className="sr-only"
                />
                <label
                  htmlFor="future"
                  className={cn(
                    "block p-4 border-2 rounded-lg cursor-pointer transition-all duration-200",
                    options.timeWindow === 'future'
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                      options.timeWindow === 'future'
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    )}>
                      {options.timeWindow === 'future' && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-gray-900">Future Meetings Only</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                          Recommended
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Sync meetings from today forward. Fastest option, focuses on upcoming briefings.
                      </p>
                      <div className="mt-2 text-xs text-gray-500">
                        <span className="font-medium">Range:</span> Today → 6 months ahead
                      </div>
                    </div>
                  </div>
                </label>
              </div>

              {/* All Meetings */}
              <div className="relative">
                <input
                  type="radio"
                  id="all"
                  name="timeWindow"
                  value="all"
                  checked={options.timeWindow === 'all'}
                  onChange={() => handleTimeWindowChange('all')}
                  className="sr-only"
                />
                <label
                  htmlFor="all"
                  className={cn(
                    "block p-4 border-2 rounded-lg cursor-pointer transition-all duration-200",
                    options.timeWindow === 'all'
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                      options.timeWindow === 'all'
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    )}>
                      {options.timeWindow === 'all' && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-900">All Meetings</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Sync all meetings from January 2024 forward. Comprehensive but slower.
                      </p>
                      <div className="mt-2 text-xs text-gray-500">
                        <span className="font-medium">Range:</span> Jan 2024 → 6 months ahead
                      </div>
                    </div>
                  </div>
                </label>
              </div>

              {/* Custom Range */}
              <div className="relative">
                <input
                  type="radio"
                  id="custom"
                  name="timeWindow"
                  value="custom"
                  checked={options.timeWindow === 'custom'}
                  onChange={() => handleTimeWindowChange('custom')}
                  className="sr-only"
                />
                <label
                  htmlFor="custom"
                  className={cn(
                    "block p-4 border-2 rounded-lg cursor-pointer transition-all duration-200",
                    options.timeWindow === 'custom'
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                      options.timeWindow === 'custom'
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    )}>
                      {options.timeWindow === 'custom' && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-900">Custom Range</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Choose your own start and end dates for the sync period.
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Custom Date Range Inputs */}
            {options.timeWindow === 'custom' && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-900">Custom Date Range</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      value={options.startDate || ''}
                      onChange={(e) => setOptions({ ...options, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      value={options.endDate || ''}
                      onChange={(e) => setOptions({ ...options, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Warning for Past Meetings */}
            {options.includePast && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Syncing Past Meetings</p>
                  <p>
                    This will sync historical meetings which may take longer and create more calendar records. 
                    Consider using "Future Meetings Only" for faster syncing.
                  </p>
                </div>
              </div>
            )}

            {/* Estimated Time */}
            <div className="text-sm text-gray-600 text-center">
              <span className="font-medium">Estimated sync time:</span>{' '}
              {options.timeWindow === 'future' ? '2-5 minutes' : 
               options.timeWindow === 'all' ? '5-15 minutes' : '3-10 minutes'}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={isStarting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-200 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isStarting || (options.timeWindow === 'custom' && (!options.startDate || !options.endDate))}
              className={cn(
                "px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 transition-colors flex items-center gap-2",
                isStarting && "cursor-not-allowed"
              )}
            >
              {isStarting && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {isStarting ? 'Starting Sync...' : 'Start Sync'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

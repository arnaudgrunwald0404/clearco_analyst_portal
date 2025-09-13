'use client'

import { RefreshCw, X, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SimpleSyncModalProps {
  isOpen: boolean
  onClose: () => void
  connectionTitle: string
  onCancel?: () => void
  isSyncInProgress?: boolean
  hasError?: boolean
  isComplete?: boolean
}

export default function SimpleSyncModal({ 
  isOpen, 
  onClose, 
  connectionTitle,
  onCancel,
  isSyncInProgress,
  hasError,
  isComplete
}: SimpleSyncModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <RefreshCw className={cn(
                "w-5 h-5 text-blue-600",
                isSyncInProgress && "animate-spin"
              )} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {hasError ? 'Sync Failed' : isComplete ? 'Sync Complete' : 'Syncing Calendar'}
              </h3>
              <p className="text-sm text-gray-600">{connectionTitle}</p>
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
        <div className="p-6">
          {hasError ? (
            <div className="flex items-center space-x-3 text-red-600">
              <AlertCircle className="w-6 h-6" />
              <div>
                <p className="font-medium">Calendar sync failed</p>
                <p className="text-sm text-red-500">Please try again or contact support if the issue persists.</p>
              </div>
            </div>
          ) : isComplete ? (
            <div className="flex items-center space-x-3 text-green-600">
              <CheckCircle className="w-6 h-6" />
              <div>
                <p className="font-medium">Calendar sync completed successfully!</p>
                <p className="text-sm text-green-500">Your briefings have been updated with the latest calendar data.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3 text-blue-600">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <div>
                <p className="font-medium">Syncing your calendar...</p>
                <p className="text-sm text-blue-500">This may take a few minutes for large calendars.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          {hasError ? (
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : isComplete ? (
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="flex justify-between">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Cancel Sync
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors ml-auto"
              >
                Close (sync continues)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

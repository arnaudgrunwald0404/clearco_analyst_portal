import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { FileText, Link, Table, CheckCircle, AlertCircle, X } from 'lucide-react'

interface SyncDetails {
  spreadsheetId?: string
  sheetTitle?: string
  totalRows?: number
  eventsProcessed?: number
  source?: string
}

interface SyncDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  details: SyncDetails | null
  message: string
}

export default function SyncDetailsModal({ isOpen, onClose, details, message }: SyncDetailsModalProps) {
  if (!details) return null

  const getGoogleSheetsUrl = (spreadsheetId: string) => {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Events Sync Complete
                </Dialog.Title>
                
                <div className="space-y-4">
                  {/* Success Message */}
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 text-sm font-medium">{message}</p>
                  </div>

                  {/* File Information */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Source File Information
                    </h3>
                    
                    <div className="space-y-2">
                      {/* File URL */}
                      {details.spreadsheetId && (
                        <div className="flex items-start gap-2">
                          <Link className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 mb-1">File URL:</p>
                            <a
                              href={getGoogleSheetsUrl(details.spreadsheetId)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                            >
                              {getGoogleSheetsUrl(details.spreadsheetId)}
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Sheet Name */}
                      {details.sheetTitle && (
                        <div className="flex items-start gap-2">
                          <Table className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-1">Sheet Tab:</p>
                            <p className="text-sm text-gray-900 font-medium">{details.sheetTitle}</p>
                          </div>
                        </div>
                      )}

                      {/* Source Type */}
                      {details.source && (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-1">Source Type:</p>
                            <p className="text-sm text-gray-900">{details.source}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Processing Summary */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900">Processing Summary</h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Total Rows</p>
                        <p className="text-lg font-semibold text-gray-900">{details.totalRows || 0}</p>
                      </div>
                      
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-600 mb-1">Events Processed</p>
                        <p className="text-lg font-semibold text-blue-900">{details.eventsProcessed || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Close Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

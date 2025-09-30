'use client'

import { X } from 'lucide-react'
import { cn, formatDateTime, getPriorityColor } from '@/lib/utils'
import type { Award } from '@/app/awards/types'

interface AwardDrawerProps {
  isOpen: boolean
  onClose: () => void
  award: Award | null
}

export default function AwardDrawer({ isOpen, onClose, award }: AwardDrawerProps) {
  if (!isOpen || !award) return null

  const closeDrawer = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{award.name || 'Award'}</h2>
          <button
            onClick={closeDrawer}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Publication Date:</p>
            <p className="text-sm text-gray-900">{award.publicationDate ? formatDateTime(award.publicationDate) : 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Submission Date:</p>
            <p className="text-sm text-gray-900">{award.submissionDate ? formatDateTime(award.submissionDate) : 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Organization:</p>
            <p className="text-sm text-gray-900">{award.organization || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Priority:</p>
            <span className={getPriorityColor(award.priority)}>{award.priority}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Topics:</p>
            <p className="text-sm text-gray-900">{Array.isArray(award.productTopics) ? award.productTopics.join(', ') : (award.productTopics || 'N/A')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}


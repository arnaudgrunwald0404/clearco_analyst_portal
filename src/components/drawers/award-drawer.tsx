'use client'

import { Dispatch, SetStateAction } from 'react'
import { X } from 'lucide-react'
import { cn, formatDateTime, getPriorityColor } from '@/lib/utils'

interface AwardDrawerProps {
  isOpen: boolean
  onClose: () => void
  award: Award | null
}

interface Award {
  id: string
  awardName: string
  publicationDate: string
  processStartDate: string
  contactInfo: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  topics: string
  createdAt: string
  updatedAt: string
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
          <h2 className="text-xl font-semibold text-gray-900">{award.awardName}</h2>
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
            <p className="text-sm text-gray-900">{formatDateTime(award.publicationDate)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Process Start Date:</p>
            <p className="text-sm text-gray-900">{formatDateTime(award.processStartDate)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Contact Information:</p>
            <p className="text-sm text-gray-900">{award.contactInfo}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Priority:</p>
            <span className={getPriorityColor(award.priority)}>{award.priority}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Topics:</p>
            <p className="text-sm text-gray-900">{award.topics}</p>
          </div>
        </div>
      </div>
    </div>
  )
}


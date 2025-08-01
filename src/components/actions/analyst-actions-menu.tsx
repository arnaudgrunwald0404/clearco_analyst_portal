'use client'

import { useState, useEffect, useRef } from 'react'
import { MoreHorizontal, Edit, Trash2, Eye, Mail, Calendar, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createPortal } from 'react-dom'
import { useToast } from '@/components/ui/toast'

interface AnalystActionsMenuProps {
  analystId: string
  analystName: string
  onDelete?: () => void
  onView?: () => void
}

export default function AnalystActionsMenu({ 
  analystId, 
  analystName, 
  onDelete, 
  onView 
}: AnalystActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { addToast } = useToast()

  // Mount effect for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      
      // Calculate initial position
      let top = buttonRect.bottom + window.scrollY + 4 // 4px gap
      let left = buttonRect.right + window.scrollX - 192 // 192px is dropdown width (w-48)
      
      // Ensure dropdown doesn't go off-screen horizontally
      if (left < 8) {
        left = 8
      } else if (left + 192 > viewportWidth - 8) {
        left = viewportWidth - 192 - 8
      }
      
      // Check if dropdown would go off-screen vertically
      const dropdownHeight = 240 // Approximate dropdown height
      if (top + dropdownHeight > viewportHeight + window.scrollY - 8) {
        // Position above the button instead
        top = buttonRect.top + window.scrollY - dropdownHeight - 4
      }
      
      setDropdownPosition({ top, left })
    }
  }, [isOpen])

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])


  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/analysts/${analystId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          console.log('Analyst archived successfully:', result.message)
          
          // Close the confirmation modal immediately
          setShowDeleteConfirm(false)
          setIsOpen(false)
          
          // Show success message
          addToast({ type: 'success', message: `${analystName} has been archived successfully` })
          
          // Call the onDelete callback to refresh the list
          onDelete?.()
        } else {
          console.error('Failed to archive analyst:', result.error)
          addToast({ type: 'error', message: result.error || 'Failed to archive analyst' })
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }))
        console.error('Failed to archive analyst:', errorData)
        addToast({ type: 'error', message: errorData.error || 'Failed to archive analyst. Please try again.' })
      }
    } catch (error) {
      console.error('Error archiving analyst:', error)
      addToast({ type: 'error', message: 'Network error. Please check your connection and try again.' })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleView = () => {
    onView?.()
    setIsOpen(false)
  }

  const handleArchiveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setShowDeleteConfirm(true)
    setIsOpen(false)
  }

  // Close dropdown when clicking outside
  const closeDropdown = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* Dropdown Menu */}
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(!isOpen)
          }}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          {/* Backdrop with subtle transparency */}
          <div 
            className="fixed inset-0 z-50 transition-opacity duration-300"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.15)' }}
            onClick={() => setShowDeleteConfirm(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full pointer-events-auto transform transition-all duration-300 scale-100">
              {/* Header */}
              <div className="flex items-start p-6 pb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Archive Analyst
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    This action will archive the analyst and hide them from the active list
                  </p>
                </div>
              </div>
              
              {/* Content */}
              <div className="px-6 pb-6">
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-700 mb-3">
                    Are you sure you want to archive <span className="font-semibold text-gray-900">{analystName}</span>?
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-3 flex-shrink-0"></div>
                      <span>Set their status to "Archived"</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-3 flex-shrink-0"></div>
                      <span>Hide them from active analyst lists</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-3 flex-shrink-0"></div>
                      <span>Preserve all historical data and interactions</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-3 flex-shrink-0"></div>
                      <span>Allow restoration later if needed</span>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-200 disabled:opacity-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className={cn(
                      "px-5 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 focus:ring-2 focus:ring-amber-200 disabled:opacity-50 flex items-center gap-2 transition-colors font-medium",
                      isDeleting && "cursor-not-allowed"
                    )}
                  >
                    {isDeleting && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {isDeleting ? 'Archiving...' : 'Archive Analyst'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Portal-based Dropdown */}
      {mounted && isOpen && createPortal(
        <>
          {/* Backdrop to close dropdown */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={closeDropdown}
          />
          
          {/* Dropdown Menu */}
          <div 
            ref={dropdownRef}
            className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 w-48"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleView()
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Eye className="w-4 h-4 mr-3" />
              View Details
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                /* Handle contact action */
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Mail className="w-4 h-4 mr-3" />
              Send Email
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                /* Handle schedule briefing */
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Calendar className="w-4 h-4 mr-3" />
              Schedule Briefing
            </button>
            
            {/* Divider */}
            <div className="border-t border-gray-100 my-1" />
            
            <button
              onClick={handleArchiveClick}
              className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-3" />
              Archive Analyst
            </button>
          </div>
        </>,
        document.body
      )}
    </>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreVertical, Eye, Edit3, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface AwardActionsMenuProps {
  awardId: string
  awardName: string
  onDelete: () => void
  onEdit: () => void
  onView: () => void
}

export default function AwardActionsMenu({ 
  awardId, 
  awardName, 
  onDelete, 
  onEdit, 
  onView 
}: AwardActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { addToast } = useToast()

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const menuWidth = 120 // min-w-[120px]
      const menuHeight = 150 // estimated height
      
      let top = rect.bottom + 4
      let right = window.innerWidth - rect.right
      
      // Adjust if menu would go off bottom of screen
      if (top + menuHeight > window.innerHeight) {
        top = rect.top - menuHeight - 4 // Show above button instead
      }
      
      // Adjust if menu would go off left side of screen
      if (right + menuWidth > window.innerWidth) {
        right = window.innerWidth - rect.left - menuWidth
      }
      
      setMenuPosition({ top, right })
    }
  }, [isOpen])

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/awards/${awardId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete award')
      }

      addToast({ type: 'success', message: 'Award deleted successfully' })
      onDelete()
    } catch (error) {
      console.error('Error deleting award:', error)
      addToast({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to delete award' 
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
      setIsOpen(false)
    }
  }

  const handleEdit = () => {
    setIsOpen(false)
    onEdit()
  }

  const handleView = () => {
    setIsOpen(false)
    onView()
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded hover:bg-gray-100 transition-colors"
        disabled={isDeleting}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => {
              setIsOpen(false)
              setShowDeleteConfirm(false)
            }}
          />
          
          {/* Menu */}
          <div 
            className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[120px]"
            style={{
              top: `${menuPosition.top}px`,
              right: `${menuPosition.right}px`
            }}
          >
            <button
              onClick={handleView}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Eye className="w-4 h-4 mr-2" />
              View
            </button>
            
            <button
              onClick={handleEdit}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </button>
            
            <hr className="my-1 border-gray-200" />
            
            {!showDeleteConfirm ? (
              <button
                onClick={handleDelete}
                className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            ) : (
              <div className="px-3 py-2">
                <p className="text-xs text-gray-600 mb-2">
                  Delete "{awardName}"?
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? '...' : 'Yes'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="flex-1 px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors disabled:opacity-50"
                  >
                    No
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

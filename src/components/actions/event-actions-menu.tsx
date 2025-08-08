'use client'

import { Fragment, useState } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface EventActionsMenuProps {
  eventId: string
  eventName: string
  onDelete: () => void
  onEdit: () => void
  onView: () => void
}

export default function EventActionsMenu({ 
  eventId, 
  eventName, 
  onDelete, 
  onEdit, 
  onView 
}: EventActionsMenuProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { addToast } = useToast()

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${eventName}"? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok && result.success) {
        addToast({ type: 'success', message: 'Event deleted successfully' })
        onDelete()
      } else {
        throw new Error(result.error || 'Failed to delete event')
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      addToast({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to delete event' 
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-100">
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onView}
                  className={`${
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  } group flex w-full items-center px-4 py-2 text-sm`}
                >
                  <Eye className="mr-3 h-4 w-4" aria-hidden="true" />
                  View Details
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onEdit}
                  className={`${
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  } group flex w-full items-center px-4 py-2 text-sm`}
                >
                  <Edit className="mr-3 h-4 w-4" aria-hidden="true" />
                  Edit Event
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className={`${
                    active ? 'bg-red-50 text-red-700' : 'text-red-600'
                  } group flex w-full items-center px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Trash2 className="mr-3 h-4 w-4" aria-hidden="true" />
                  {isDeleting ? 'Deleting...' : 'Delete Event'}
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}

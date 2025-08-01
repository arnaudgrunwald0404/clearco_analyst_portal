'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Plus, Minus } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { useEventEnums } from '@/hooks/useEventEnums'

interface AddEventModalProps {
  isOpen: boolean
  onClose: () => void
  onEventAdded: () => void
}

export default function AddEventModal({ isOpen, onClose, onEventAdded }: AddEventModalProps) {
  const [formData, setFormData] = useState({
    eventName: '',
    link: '',
    type: 'CONFERENCE' as string,
    audienceGroups: [] as string[],
    startDate: '',
    participationTypes: [] as string[],
    owner: '',
    location: '',
    status: 'EVALUATING' as string,
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addToast } = useToast()
  const { enums, loading: enumsLoading } = useEventEnums()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleMultiSelectChange = (field: 'audienceGroups' | 'participationTypes', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value) 
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.eventName || !formData.startDate) {
      addToast({ type: 'error', message: 'Event name and start date are required' })
      return
    }

    setIsSubmitting(true)

    // Enhanced debugging
    console.log('🚀 Starting event creation...')
    console.log('📊 Form data:', formData)
    console.log('🔧 Enums state:', { enums, enumsLoading })

    try {
      const requestBody = JSON.stringify(formData)
      console.log('📤 Request body:', requestBody)
      
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      })

      console.log('📥 Response status:', response.status)
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()))
      
      const result = await response.json()
      console.log('📥 Response body:', result)
      


      if (response.ok && result.success) {
        console.log('✅ Event created successfully!')
        addToast({ type: 'success', message: 'Event added successfully' })
        onEventAdded()
        handleClose()
      } else {
        console.error('❌ API returned error:', result)
        throw new Error(result.error || `HTTP ${response.status}: Failed to add event`)
      }
    } catch (error) {
      console.error('❌ Event creation failed:', error)
      console.error('❌ Error details:', {
        name: (error as any)?.name,
        message: (error as any)?.message,
        stack: (error as any)?.stack
      })
      
      addToast({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to add event' 
      })
    } finally {
      setIsSubmitting(false)
      console.log('🏁 Event creation process completed')
    }
  }

  const handleClose = () => {
    setFormData({
      eventName: '',
      link: '',
      type: 'CONFERENCE',
      audienceGroups: [],
      startDate: '',
      participationTypes: [],
      owner: '',
      location: '',
      status: 'EVALUATING',
      notes: ''
    })
    onClose()
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={handleClose}
                  >
                    <span className="sr-only">Close</span>
                    <X className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:ml-0 sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900 mb-6">
                      Add New Event
                    </Dialog.Title>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Event Name */}
                      <div>
                        <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 mb-2">
                          Event Name *
                        </label>
                        <input
                          type="text"
                          id="eventName"
                          value={formData.eventName}
                          onChange={(e) => handleInputChange('eventName', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Enter event name"
                          required
                        />
                      </div>

                      {/* Link */}
                      <div>
                        <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-2">
                          Event Link
                        </label>
                        <input
                          type="url"
                          id="link"
                          value={formData.link}
                          onChange={(e) => handleInputChange('link', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="https://example.com/event"
                        />
                      </div>

                      {/* Type and Status Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                            Type
                          </label>
                          <select
                            id="type"
                            value={formData.type}
                            onChange={(e) => handleInputChange('type', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            disabled={enumsLoading}
                          >
                            {enums?.eventTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                          </label>
                          <select
                            id="status"
                            value={formData.status}
                            onChange={(e) => handleInputChange('status', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            disabled={enumsLoading}
                          >
                            {enums?.eventStatuses.map((status) => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Start Date and Owner Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                            Start Date *
                          </label>
                          <input
                            type="date"
                            id="startDate"
                            value={formData.startDate}
                            onChange={(e) => handleInputChange('startDate', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="owner" className="block text-sm font-medium text-gray-700 mb-2">
                            Owner
                          </label>
                          <input
                            type="text"
                            id="owner"
                            value={formData.owner}
                            onChange={(e) => handleInputChange('owner', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Event owner"
                          />
                        </div>
                      </div>

                      {/* Location */}
                      <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                          Location
                        </label>
                        <input
                          type="text"
                          id="location"
                          value={formData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Event location"
                        />
                      </div>

                      {/* Audience Groups */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Audience Groups
                        </label>
                        <div className="space-y-2">
                          {enums?.audienceGroups.map((option) => (
                            <label key={option.value} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.audienceGroups.includes(option.value)}
                                onChange={() => handleMultiSelectChange('audienceGroups', option.value)}
                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                disabled={enumsLoading}
                              />
                              <span className="ml-2 text-sm text-gray-900">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Participation Types */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Participation Types
                        </label>
                        <div className="space-y-2">
                          {enums?.participationTypes.map((option) => (
                            <label key={option.value} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.participationTypes.includes(option.value)}
                                onChange={() => handleMultiSelectChange('participationTypes', option.value)}
                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                disabled={enumsLoading}
                              />
                              <span className="ml-2 text-sm text-gray-900">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                          Notes
                        </label>
                        <textarea
                          id="notes"
                          rows={3}
                          value={formData.notes}
                          onChange={(e) => handleInputChange('notes', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Additional notes about the event"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={handleClose}
                          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? 'Adding...' : 'Add Event'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

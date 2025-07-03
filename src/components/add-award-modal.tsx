'use client'

import { useState } from 'react'
import { X, Calendar, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface AddAwardModalProps {
  isOpen: boolean
  onClose: () => void
  onAwardAdded: () => void
}

export default function AddAwardModal({ isOpen, onClose, onAwardAdded }: AddAwardModalProps) {
  const [formData, setFormData] = useState({
    awardName: '',
    publicationDate: '',
    processStartDate: '',
    contactInfo: '',
    priority: 'MEDIUM',
    topics: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { addToast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.awardName.trim()) {
      newErrors.awardName = 'Award name is required'
    }

    if (!formData.publicationDate) {
      newErrors.publicationDate = 'Publication date is required'
    }

    if (!formData.processStartDate) {
      newErrors.processStartDate = 'Process start date is required'
    }

    if (!formData.contactInfo.trim()) {
      newErrors.contactInfo = 'Contact information is required'
    }

    // Validate that process start date is before publication date
    if (formData.publicationDate && formData.processStartDate) {
      const pubDate = new Date(formData.publicationDate)
      const startDate = new Date(formData.processStartDate)
      if (startDate >= pubDate) {
        newErrors.processStartDate = 'Process start date must be before publication date'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/awards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create award')
      }

      const result = await response.json()
      
      if (result.success) {
        addToast({ type: 'success', message: 'Award added successfully' })
        setFormData({
          awardName: '',
          publicationDate: '',
          processStartDate: '',
          contactInfo: '',
          priority: 'MEDIUM',
          topics: ''
        })
        setErrors({})
        onAwardAdded()
      } else {
        throw new Error(result.error || 'Failed to create award')
      }
    } catch (error) {
      console.error('Error creating award:', error)
      addToast({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to create award' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({
        awardName: '',
        publicationDate: '',
        processStartDate: '',
        contactInfo: '',
        priority: 'MEDIUM',
        topics: ''
      })
      setErrors({})
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New Award</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Award Name */}
          <div>
            <label htmlFor="awardName" className="block text-sm font-medium text-gray-700 mb-1">
              Award Name *
            </label>
            <input
              type="text"
              id="awardName"
              name="awardName"
              value={formData.awardName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter award name"
              disabled={loading}
            />
            {errors.awardName && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.awardName}
              </p>
            )}
          </div>

          {/* Date Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Publication Date */}
            <div>
              <label htmlFor="publicationDate" className="block text-sm font-medium text-gray-700 mb-1">
                Publication Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="publicationDate"
                  name="publicationDate"
                  value={formData.publicationDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {errors.publicationDate && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.publicationDate}
                </p>
              )}
            </div>

            {/* Process Start Date */}
            <div>
              <label htmlFor="processStartDate" className="block text-sm font-medium text-gray-700 mb-1">
                Process Start Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="processStartDate"
                  name="processStartDate"
                  value={formData.processStartDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {errors.processStartDate && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.processStartDate}
                </p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Information *
            </label>
            <textarea
              id="contactInfo"
              name="contactInfo"
              value={formData.contactInfo}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter contact information (email, phone, organization, etc.)"
              disabled={loading}
            />
            {errors.contactInfo && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.contactInfo}
              </p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          {/* Topics */}
          <div>
            <label htmlFor="topics" className="block text-sm font-medium text-gray-700 mb-1">
              Topics
            </label>
            <textarea
              id="topics"
              name="topics"
              value={formData.topics}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter relevant topics or keywords"
              disabled={loading}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              )}
              {loading ? 'Creating...' : 'Create Award'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

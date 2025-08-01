'use client'

import React, { useState, useEffect } from 'react'
import { X, Calendar, AlertCircle, Upload, FileText, CheckCircle, Loader, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

interface AddAwardModalProps {
  isOpen: boolean
  onClose: () => void
  onAwardAdded: () => void
}

interface AwardFormData {
  awardName: string
  publicationDate: string
  processStartDate: string
  lastSubmissionDate: string
  nextSubmissionDate: string
  contactInfo: string
  organizer: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  topics: string
  notes: string
}

interface BulkUploadData {
  awards: AwardFormData[]
  mapping: Record<string, string>
  unmappedColumns: string[]
  successCount?: number
  errorCount?: number
  errors?: string[]
}

function AddAwardModal({ isOpen, onClose, onAwardAdded }: AddAwardModalProps) {
  const [activeTab, setActiveTab] = useState<'form' | 'bulk'>('form')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadStep, setUploadStep] = useState<'upload' | 'mapping' | 'preview' | 'processing' | 'success'>('upload')
  const [bulkData, setBulkData] = useState<BulkUploadData | null>(null)
  const [rawData, setRawData] = useState<any[]>([])
  const [fileName, setFileName] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()
  
  // Form state
  const [formData, setFormData] = useState<AwardFormData>({
    awardName: '',
    publicationDate: '',
    processStartDate: '',
    lastSubmissionDate: '',
    nextSubmissionDate: '',
    contactInfo: '',
    organizer: '',
    priority: 'MEDIUM',
    topics: '',
    notes: ''
  })

  // Expected field mappings for intelligent matching
  const fieldMappings = {
    awardName: ['award name', 'awardname', 'name', 'title', 'award_name', 'award'],
    publicationDate: ['publication date', 'publicationdate', 'pub date', 'publish date', 'publication_date', 'pub_date'],
    processStartDate: ['process start date', 'processstartdate', 'start date', 'process_start_date', 'start_date'],
    lastSubmissionDate: ['last submission date', 'lastsubmissiondate', 'last submission', 'last_submission_date', 'previous submission'],
    nextSubmissionDate: ['next submission date', 'nextsubmissiondate', 'next submission', 'next_submission_date', 'upcoming submission'],
    contactInfo: ['contact info', 'contactinfo', 'contact', 'contact information', 'contact_info', 'contact_information'],
    organizer: ['organizer', 'organization', 'organizing body', 'host', 'sponsor', 'organiser'],
    priority: ['priority', 'importance', 'level', 'priority level'],
    topics: ['topics', 'categories', 'keywords', 'tags', 'subject', 'subjects'],
    notes: ['notes', 'comments', 'additional info', 'description', 'remarks', 'additional_info']
  }

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
        alert('Award added successfully')
        setFormData({
          awardName: '',
          publicationDate: '',
          processStartDate: '',
          lastSubmissionDate: '',
          nextSubmissionDate: '',
          contactInfo: '',
          organizer: '',
          priority: 'MEDIUM',
          topics: '',
          notes: ''
        })
        setErrors({})
        onAwardAdded()
        handleClose()
      } else {
        throw new Error(result.error || 'Failed to create award')
      }
    } catch (error) {
      console.error('Error creating award:', error)
      alert(error instanceof Error ? error.message : 'Failed to create award')
    } finally {
      setLoading(false)
    }
  }

  const resetModal = () => {
    setActiveTab('form')
    setUploadStep('upload')
    setBulkData(null)
    setRawData([])
    setFileName('')
    setFormData({
      awardName: '',
      publicationDate: '',
      processStartDate: '',
      lastSubmissionDate: '',
      nextSubmissionDate: '',
      contactInfo: '',
      organizer: '',
      priority: 'MEDIUM',
      topics: '',
      notes: ''
    })
    setErrors({})
  }

  const handleClose = () => {
    if (!loading) {
      resetModal()
      onClose()
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const fileExtension = file.name.split('.').pop()?.toLowerCase()

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          setRawData(results.data)
          processFileData(results.data)
        },
        error: (error) => {
          console.error('CSV parsing error:', error)
          alert('Error parsing CSV file')
        }
      })
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        setRawData(jsonData)
        processFileData(jsonData)
      }
      reader.readAsArrayBuffer(file)
    } else {
      alert('Please upload a CSV or Excel file')
    }
  }

  const processFileData = async (data: any[]) => {
    if (!data.length) return

    // Get all unique column names from all rows
    const allColumns = new Set<string>()
    data.forEach(row => {
      Object.keys(row).forEach(col => allColumns.add(col))
    })
    const columns = Array.from(allColumns)
    
    const mapping: Record<string, string> = {}
    const unmappedColumns: string[] = []

    console.log('All columns found:', columns)
    
    try {
      columns.forEach(column => {
        const normalizedColumn = column.toLowerCase().trim()
        let mapped = false
        
        console.log(`Processing column: "${column}" (normalized: "${normalizedColumn}")`)
        
        // Try header-based matching
        for (const [field, variants] of Object.entries(fieldMappings)) {
          if (variants.some(variant => normalizedColumn.includes(variant))) {
            mapping[column] = field
            mapped = true
            console.log(`  -> Mapped to ${field} via header matching`)
            break
          }
        }
        
        if (!mapped) {
          unmappedColumns.push(column)
          console.log(`  -> UNMAPPED`)
        }
      })
    } catch (error) {
      console.error('Column mapping error:', error)
    }

    console.log('Final mapping:', mapping)
    console.log('Unmapped columns:', unmappedColumns)

    setBulkData({ awards: [], mapping, unmappedColumns })
    setUploadStep('mapping')
  }

  const handleBulkImport = async () => {
    if (!bulkData || !rawData.length) return

    setUploadStep('processing')
    
    try {
      // Transform raw data according to mapping
      const awardsToImport = rawData.map(row => {
        const award: any = {
          priority: 'MEDIUM',
          topics: ''
        }

        // Apply mappings
        Object.entries(bulkData.mapping).forEach(([sourceColumn, targetField]) => {
          if (targetField && row[sourceColumn]) {
            const value = row[sourceColumn].toString().trim()
            if (value) {
              if (targetField === 'priority') {
                // Map priority values to database enum values
                const priorityMapping: Record<string, string> = {
                  'low': 'LOW',
                  'medium': 'MEDIUM',
                  'high': 'HIGH',
                  'critical': 'CRITICAL'
                }
                award[targetField] = priorityMapping[value.toLowerCase()] || 'MEDIUM'
              } else {
                award[targetField] = value
              }
            }
          }
        })

        return award
      }).filter(award => award.awardName && award.publicationDate && award.processStartDate && award.contactInfo) // Only include valid awards

      console.log('Awards to import:', awardsToImport)

      // Use bulk API endpoint
      const response = await fetch('/api/awards/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ awards: awardsToImport })
      })

      let successCount = 0
      let errorCount = 0
      let errors: string[] = []

      if (response.ok) {
        const result = await response.json()
        successCount = result.data.count
        errors = result.data.errors || []
        errorCount = errors.length
      } else {
        const errorData = await response.json()
        errorCount = awardsToImport.length
        errors = [errorData.error || 'Failed to import awards']
      }

      // Show results
      if (successCount > 0) {
        // Show success state
        setUploadStep('success')
        onAwardAdded() // Refresh the list
        
        // Auto-close modal after 3 seconds
        setTimeout(() => {
          handleClose()
        }, 3000)
        
        // Store success stats for display
        setBulkData({
          ...bulkData,
          successCount,
          errorCount,
          errors: errors.slice(0, 5)
        })
      } else {
        alert(`Failed to import awards:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...and more' : ''}`)
        setUploadStep('preview') // Go back to preview
      }

    } catch (error) {
      console.error('Bulk import error:', error)
      alert('Error during bulk import')
      setUploadStep('preview')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Add Awards</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('form')}
            className={cn(
              'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'form'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            Single Award
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={cn(
              'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'bulk'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            Bulk Upload
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {activeTab === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-6">
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

          {/* Additional Date Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Last Submission Date */}
            <div>
              <label htmlFor="lastSubmissionDate" className="block text-sm font-medium text-gray-700 mb-1">
                Last Submission Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="lastSubmissionDate"
                  name="lastSubmissionDate"
                  value={formData.lastSubmissionDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Next Submission Date */}
            <div>
              <label htmlFor="nextSubmissionDate" className="block text-sm font-medium text-gray-700 mb-1">
                Next Submission Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="nextSubmissionDate"
                  name="nextSubmissionDate"
                  value={formData.nextSubmissionDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
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

          {/* Organizer */}
          <div>
            <label htmlFor="organizer" className="block text-sm font-medium text-gray-700 mb-1">
              Organizer
            </label>
            <input
              type="text"
              id="organizer"
              name="organizer"
              value={formData.organizer}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter organization or analyst organizing the award"
              disabled={loading}
            />
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

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes & Comments
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter any additional notes, comments, or information about this award"
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
          )}

          {activeTab === 'bulk' && (
            <div className="space-y-6">
              {uploadStep === 'upload' && (
                <>
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Bulk Upload Awards
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Upload a CSV or Excel file with award information
                    </p>
                    
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                    </label>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Expected Columns:</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>• Award Name (required)</div>
                      <div>• Publication Date (required)</div>
                      <div>• Process Start Date (required)</div>
                      <div>• Contact Info (required)</div>
                      <div>• Last Submission Date</div>
                      <div>• Next Submission Date</div>
                      <div>• Organizer</div>
                      <div>• Priority</div>
                      <div>• Topics</div>
                      <div>• Notes & Comments</div>
                    </div>
                  </div>
                </>
              )}

              {uploadStep === 'mapping' && bulkData && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Column Mapping</h3>
                    <div className="text-sm text-gray-500">
                      File: {fileName} ({rawData.length} rows)
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    Map your file columns to the expected fields:
                  </p>

                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {(() => {
                      // Get all unique column names from all rows
                      const allColumns = new Set<string>()
                      rawData.forEach(row => {
                        Object.keys(row).forEach(col => allColumns.add(col))
                      })
                      return Array.from(allColumns)
                    })().map((column) => (
                      <div key={column} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{column}</div>
                          <div className="text-xs text-gray-500">
                            Sample: {(() => {
                              // Find first non-empty value from first 5 rows
                              const sampleValue = rawData.slice(0, 5)
                                .map(row => row[column])
                                .find(val => val && val.toString().trim())
                              return sampleValue ? sampleValue.toString().slice(0, 50) + (sampleValue.toString().length > 50 ? '...' : '') : 'No data'
                            })()} 
                          </div>
                        </div>
                        <div className="w-48">
                          <select
                            value={bulkData.mapping[column] || ''}
                            onChange={(e) => {
                              setBulkData({
                                ...bulkData,
                                mapping: {
                                  ...bulkData.mapping,
                                  [column]: e.target.value
                                }
                              })
                            }}
                            className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Skip this column</option>
                            <option value="awardName">Award Name</option>
                            <option value="publicationDate">Publication Date</option>
                            <option value="processStartDate">Process Start Date</option>
                            <option value="lastSubmissionDate">Last Submission Date</option>
                            <option value="nextSubmissionDate">Next Submission Date</option>
                            <option value="contactInfo">Contact Information</option>
                            <option value="organizer">Organizer</option>
                            <option value="priority">Priority</option>
                            <option value="topics">Topics</option>
                            <option value="notes">Notes & Comments</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between pt-4 border-t">
                    <button
                      onClick={() => {
                        setUploadStep('upload')
                        setBulkData(null)
                        setRawData([])
                        setFileName('')
                      }}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setUploadStep('preview')}
                      disabled={(() => {
                        // Check if required fields are mapped
                        const mappedFields = Object.values(bulkData?.mapping || {})
                        return !mappedFields.includes('awardName') || !mappedFields.includes('publicationDate') || !mappedFields.includes('processStartDate') || !mappedFields.includes('contactInfo')
                      })()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Preview Data
                    </button>
                  </div>
                </div>
              )}

              {uploadStep === 'preview' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Preview</h3>
                    <div className="text-sm text-gray-500">
                      {rawData.length} awards ready to import
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Award Name</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Publication Date</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contact Info</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {rawData.slice(0, 10).map((row, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {row[Object.keys(bulkData?.mapping || {}).find(k => bulkData?.mapping[k] === 'awardName') || '']}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {row[Object.keys(bulkData?.mapping || {}).find(k => bulkData?.mapping[k] === 'publicationDate') || '']}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {row[Object.keys(bulkData?.mapping || {}).find(k => bulkData?.mapping[k] === 'contactInfo') || '']}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between pt-4 border-t">
                    <button
                      onClick={() => setUploadStep('mapping')}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Back to Mapping
                    </button>
                    <button
                      onClick={handleBulkImport}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Import Awards
                    </button>
                  </div>
                </div>
              )}

              {uploadStep === 'processing' && (
                <div className="space-y-4 text-center">
                  <div className="flex flex-col items-center">
                    <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Importing Awards
                    </h3>
                    <p className="text-gray-600">
                      Please wait while we import your awards to the database...
                    </p>
                  </div>
                </div>
              )}

              {uploadStep === 'success' && (
                <div className="space-y-4 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Import Successful!
                    </h3>
                    <div className="text-center">
                      <p className="text-gray-600 mb-2">
                        Successfully imported <span className="font-semibold text-green-600">{bulkData?.successCount ?? '0'}</span> awards!
                      </p>
                      {bulkData?.errorCount && bulkData.errorCount > 0 && (
                        <p className="text-sm text-amber-600">
                          {bulkData.errorCount} awards failed to import
                        </p>
                      )}
                      <div className="mt-4 text-sm text-gray-500">
                        This modal will close automatically in a few seconds...
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={handleClose}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AddAwardModal

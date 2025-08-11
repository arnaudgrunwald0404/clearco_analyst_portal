'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus, Upload, FileText, CheckCircle, AlertCircle, Loader, Sparkles, RefreshCw, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

interface AddAnalystModalProps {
  isOpen: boolean
  onClose: () => void
  onAnalystAdded: () => void
}

interface AnalystFormData {
  firstName: string
  lastName: string
  email: string
  company?: string
  linkedIn?: string
  twitter?: string
  type: 'Analyst' | 'Press' | 'Investor' | 'Practitioner' | 'Influencer'
  eligibleNewsletters: string[]
  coveredTopics: string[]
  influence: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
}

interface BulkUploadData {
  analysts: AnalystFormData[]
  mapping: Record<string, string>
  unmappedColumns: string[]
  successCount?: number
  errorCount?: number
  errors?: string[]
}

function AddAnalystModal({ isOpen, onClose, onAnalystAdded }: AddAnalystModalProps) {
  const [activeTab, setActiveTab] = useState<'form' | 'bulk'>('form')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadStep, setUploadStep] = useState<'upload' | 'mapping' | 'preview' | 'processing' | 'success'>('upload')
  const [bulkData, setBulkData] = useState<BulkUploadData | null>(null)
  const [rawData, setRawData] = useState<any[]>([])
  const [fileName, setFileName] = useState('')
  
  // Form state
  const [formData, setFormData] = useState<AnalystFormData>({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    linkedIn: '',
    twitter: '',
    type: 'Analyst',
    eligibleNewsletters: [],
    coveredTopics: [],
    influence: 'MEDIUM'
  })
  
  const [newTopic, setNewTopic] = useState('')
  const [isScrapingBio, setIsScrapingBio] = useState(false)
  const [isSuggestingTopics, setIsSuggestingTopics] = useState(false)
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([])

  // Expected field mappings for intelligent matching
  const fieldMappings = {
    firstName: ['first name', 'firstname', 'fname', 'given name', 'first_name', 'first'],
    lastName: ['last name', 'lastname', 'lname', 'surname', 'family name', 'last_name', 'last'],
    email: ['email', 'email address', 'e-mail', 'mail', 'contact email'],
    company: ['company', 'organization', 'firm', 'employer', 'corp', 'org', 'organisation'],
    title: ['title', 'position', 'job title', 'role', 'designation'],
    phone: ['phone', 'telephone', 'mobile', 'cell', 'contact number', 'phone number'],
    linkedIn: ['linkedin', 'linkedin url', 'linkedin profile', 'linkedin_url', 'linkedin link', 'linkedin.com'],
    twitter: ['twitter', 'twitter handle', 'twitter url', 'twitter_handle', '@', 'x.com'],
    website: ['website', 'web', 'url', 'homepage', 'site'],
    bio: ['bio', 'biography', 'description', 'about', 'summary', 'author_of', 'author of'],
    coveredTopics: ['covered topics', 'topics', 'expertise', 'skills', 'specialization', 'focus areas', 'domains', 'coverage', 'covered_topics', 'focus_areas'],
    type: ['type', 'analyst type', 'category', 'classification'],
    eligibleNewsletters: ['newsletters', 'eligible newsletters', 'subscriptions'],
    influence: ['influence', 'influence level', 'tier', 'ranking'],
    status: ['status', 'state', 'active']
  }

  const resetModal = () => {
    setActiveTab('form')
    setUploadStep('upload')
    setBulkData(null)
    setRawData([])
    setFileName('')
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      company: '',
      linkedIn: '',
      twitter: '',
      type: 'Analyst',
      eligibleNewsletters: [],
      coveredTopics: [],
      influence: 'MEDIUM'
    })
    setNewTopic('')
  }

  const handleClose = () => {
    resetModal()
    onClose()
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

    // Get all unique column names from all rows (not just first row)
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
        
        // First try header-based matching
        for (const [field, variants] of Object.entries(fieldMappings)) {
          if (variants.some(variant => normalizedColumn.includes(variant))) {
            mapping[column] = field
            mapped = true
            console.log(`  -> Mapped to ${field} via header matching`)
            break
          }
        }
        
        // If not mapped by header, analyze the data content
        if (!mapped) {
          const sampleValues = data
            .slice(0, Math.min(10, data.length))
            .map(row => row[column])
            .filter(val => val && val.toString().trim())
            .slice(0, 5) // Look at first 5 non-empty values
          
          console.log(`  Sample values for "${column}":`, sampleValues)
          
          if (sampleValues.length > 0) {
            // Check for LinkedIn URLs
            if (sampleValues.some(val => 
              val.toString().toLowerCase().includes('linkedin.com') ||
              val.toString().toLowerCase().includes('linkedin')
            )) {
              mapping[column] = 'linkedIn'
              mapped = true
              console.log(`  -> Mapped to linkedIn via content analysis`)
            }
            // Check for Twitter URLs or handles
            else if (sampleValues.some(val => {
              const valStr = val.toString().toLowerCase()
              return valStr.includes('twitter.com') ||
                     valStr.includes('x.com') ||
                     valStr.startsWith('@') ||
                     valStr.includes('twitter')
            })) {
              mapping[column] = 'twitter'
              mapped = true
              console.log(`  -> Mapped to twitter via content analysis`)
            }
            // Check for email patterns
            else if (sampleValues.some(val => 
              val.toString().includes('@') && val.toString().includes('.')
            )) {
              mapping[column] = 'email'
              mapped = true
              console.log(`  -> Mapped to email via content analysis`)
            }
            // Check for topics (comma-separated or multi-word entries)
            else if (sampleValues.some(val => {
              const valStr = val.toString()
              return valStr.includes(',') || 
                     valStr.includes(';') ||
                     (valStr.split(' ').length > 1 && valStr.length > 10)
            })) {
              mapping[column] = 'coveredTopics'
              mapped = true
              console.log(`  -> Mapped to coveredTopics via content analysis`)
            }
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

    setBulkData({ analysts: [], mapping, unmappedColumns })
    setUploadStep('mapping')
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.firstName || !formData.lastName || !formData.email) {
      alert('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      // Convert eligibleNewsletters array to string for API and set default status
      const apiData = {
        ...formData,
        eligibleNewsletters: formData.eligibleNewsletters.length > 0 ? formData.eligibleNewsletters.join(',') : null,
        status: 'ACTIVE'
      }
      
      const response = await fetch('/api/analysts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData)
      })

      if (response.ok) {
        onAnalystAdded()
        handleClose()
      } else {
        const errorData = await response.json()
        alert(`Failed to create analyst: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error creating analyst:', error)
      alert('Error creating analyst')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addTopic = () => {
    if (newTopic.trim() && !formData.coveredTopics.includes(newTopic.trim())) {
      setFormData({
        ...formData,
        coveredTopics: [...formData.coveredTopics, newTopic.trim()]
      })
      setNewTopic('')
    }
  }

  const removeTopic = (topicToRemove: string) => {
    setFormData({
      ...formData,
      coveredTopics: formData.coveredTopics.filter(topic => topic !== topicToRemove)
    })
  }

  const handleBulkImport = async () => {
    if (!bulkData || !rawData.length) return

    setUploadStep('processing')
    
    try {
      // Transform raw data according to mapping
      const analystsToImport = rawData.map(row => {
        const analyst: any = {
          type: 'Analyst',
          influence: 'MEDIUM',
          status: 'ACTIVE',
          eligibleNewsletters: null,
          coveredTopics: []
        }

        // Apply mappings
        Object.entries(bulkData.mapping).forEach(([sourceColumn, targetField]) => {
          if (targetField && row[sourceColumn]) {
            const value = row[sourceColumn].toString().trim()
            if (value) {
              if (targetField === 'coveredTopics') {
                // Handle comma-separated topics
                analyst[targetField] = value.split(/[,;]/).map(topic => topic.trim()).filter(topic => topic)
              } else if (targetField === 'eligibleNewsletters') {
                // Handle comma-separated newsletters
                analyst[targetField] = value.split(/[,;]/).map(nl => nl.trim()).filter(nl => nl)
              } else if (targetField === 'type') {
                // Map type values to database enum values
                const typeMapping: Record<string, string> = {
                  'analyst': 'Analyst',
                  'press': 'Press',
                  'investor': 'Investor',
                  'practitioner': 'Practitioner',
                  'influencer': 'Influencer',
                  'practitioner_influencer': 'Practitioner', // fallback for old data
                  'practitioner influencer': 'Practitioner' // fallback for old data
                }
                analyst[targetField] = typeMapping[value.toLowerCase()] || 'Analyst'
              } else {
                analyst[targetField] = value
              }
            }
          }
        })

        return analyst
      }).filter(analyst => analyst.firstName && analyst.lastName && analyst.email) // Only include valid analysts

      console.log('Analysts to import:', analystsToImport)

      // Use bulk API endpoint for better performance
      const response = await fetch('/api/analysts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysts: analystsToImport })
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
        errorCount = analystsToImport.length
        errors = [errorData.error || 'Failed to import analysts']
      }

      // Show results
      if (successCount > 0) {
        // Show success state
        setUploadStep('success')
        onAnalystAdded() // Refresh the list
        
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
        alert(`Failed to import analysts:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...and more' : ''}`)
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
    <div className="modal-wrapper">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900">Add Analysts</h2>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5 text-gray-500" />
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
              Single Analyst
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
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      LinkedIn
                    </label>
                    <input
                      type="url"
                      value={formData.linkedIn}
                      onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Twitter
                    </label>
                    <input
                      type="url"
                      value={formData.twitter}
                      onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                      placeholder="https://twitter.com/username"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>


                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as AnalystFormData['type'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Analyst">Analyst</option>
                      <option value="Press">Press</option>
                      <option value="Investor">Investor</option>
                      <option value="Practitioner">Practitioner</option>
                      <option value="Influencer">Influencer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Influence
                    </label>
                    <select
                      value={formData.influence}
                      onChange={(e) => setFormData({ ...formData, influence: e.target.value as AnalystFormData['influence'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="VERY_HIGH">Very High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Covered Topics
                    </label>
                    {formData.firstName && formData.lastName && (
                      <button
                        type="button"
                        onClick={() => {/* Suggest topics functionality */}}
                        disabled={isSuggestingTopics}
                        className="inline-flex items-center px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 disabled:opacity-50"
                      >
                        {isSuggestingTopics ? (
                          <>
                            <Loader className="w-3 h-3 mr-1 animate-spin" />
                            Suggesting...
                          </>
                        ) : (
                          <>
                            <Lightbulb className="w-3 h-3 mr-1" />
                            Suggest Topics
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                      placeholder="Add a topic (e.g., 'HR Technology', 'Talent Management')"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={addTopic}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Display current topics */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.coveredTopics.map((topic, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {topic}
                        <button
                          type="button"
                          onClick={() => removeTopic(topic)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Display suggested topics */}
                  {suggestedTopics.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Suggested Topics:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {suggestedTopics.map((topic, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              if (!formData.coveredTopics.includes(topic)) {
                                setFormData({
                                  ...formData,
                                  coveredTopics: [...formData.coveredTopics, topic]
                                })
                              }
                              // Remove from suggestions
                              setSuggestedTopics(suggestedTopics.filter(item => item !== topic))
                            }}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            {topic}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Eligible Newsletters - temporarily removed */}
                {/*
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Eligible Newsletters
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    Select which newsletters this analyst should be eligible to receive
                  </p>
                  <div className="space-y-2">
                    {['Weekly HR Tech Insights', 'Monthly Market Report', 'Product Updates'].map((newsletter) => {
                      const isSelected = formData.eligibleNewsletters.includes(newsletter)
                      
                      return (
                        <label key={newsletter} className="flex items-center">
                          <input 
                            type="checkbox" 
                            className="mr-2" 
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  eligibleNewsletters: [...formData.eligibleNewsletters, newsletter]
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  eligibleNewsletters: formData.eligibleNewsletters.filter(n => n !== newsletter)
                                })
                              }
                            }}
                          />
                          <span className="text-sm">{newsletter}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
                */}

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting && <Loader className="w-4 h-4 animate-spin" />}
                    Add Analyst
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
                        Bulk Upload Analysts
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Upload a CSV or Excel file with analyst information
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
                        <div>• First Name (required)</div>
                        <div>• Last Name (required)</div>
                        <div>• Email (required)</div>
                        <div>• Company</div>
                        <div>• LinkedIn</div>
                        <div>• Twitter</div>
                        <div>• Covered Topics</div>
                        <div>• Type</div>
                        <div>• Influence Level</div>
                        {/* <div>• Eligible Newsletters</div> */}
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
                              <option value="firstName">First Name</option>
                              <option value="lastName">Last Name</option>
                              <option value="email">Email</option>
                              <option value="company">Company</option>
                              <option value="linkedIn">LinkedIn</option>
                              <option value="twitter">Twitter</option>
                              <option value="coveredTopics">Covered Topics</option>
                              <option value="type">Type</option>
                              <option value="influence">Influence</option>
                              {/* <option value="eligibleNewsletters">Eligible Newsletters</option> */}
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
                          return !mappedFields.includes('firstName') || !mappedFields.includes('lastName') || !mappedFields.includes('email')
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
                        {rawData.length} analysts ready to import
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto border rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {rawData.slice(0, 10).map((row, index) => (
                            <tr key={index}>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                {row[Object.keys(bulkData?.mapping || {}).find(k => bulkData?.mapping[k] === 'firstName') || '']} {row[Object.keys(bulkData?.mapping || {}).find(k => bulkData?.mapping[k] === 'lastName') || '']}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                {row[Object.keys(bulkData?.mapping || {}).find(k => bulkData?.mapping[k] === 'email') || '']}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                {row[Object.keys(bulkData?.mapping || {}).find(k => bulkData?.mapping[k] === 'company') || '']}
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
                        Import Analysts
                      </button>
                    </div>
                  </div>
                )}

                {uploadStep === 'processing' && (
                  <div className="space-y-4 text-center">
                    <div className="flex flex-col items-center">
                      <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Importing Analysts
                      </h3>
                      <p className="text-gray-600">
                        Please wait while we import your analysts to the database...
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
                          Successfully imported <span className="font-semibold text-green-600">{bulkData?.successCount ?? '0'}</span> analysts!
                        </p>
                        {bulkData?.errorCount && bulkData.errorCount > 0 && (
                          <p className="text-sm text-amber-600">
                            {bulkData.errorCount} analysts failed to import
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
    </div>
  )
}

export default AddAnalystModal

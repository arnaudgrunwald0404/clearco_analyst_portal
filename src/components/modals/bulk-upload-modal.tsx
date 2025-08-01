'use client'

import React, { useState, useMemo } from 'react'
import { X, Upload, FileText, CheckCircle, AlertCircle, Download, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { useToast } from '@/components/ui/toast'

interface BulkUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onItemsAdded: () => void
  type: 'awards' | 'events'
  apiEndpoint: string
  fieldMappings: Record<string, string[]>
  requiredFields: string[]
  templateData: Record<string, any>[]
}

interface BulkUploadData {
  items: Record<string, any>[]
  mapping: Record<string, string>
  unmappedColumns: string[]
  successCount?: number
  errorCount?: number
  errors?: string[]
}

export default function BulkUploadModal({ 
  isOpen, 
  onClose, 
  onItemsAdded, 
  type,
  apiEndpoint,
  fieldMappings,
  requiredFields,
  templateData
}: BulkUploadModalProps) {
  const [uploadStep, setUploadStep] = useState<'upload' | 'mapping' | 'preview' | 'processing' | 'success'>('upload')
  const [bulkData, setBulkData] = useState<BulkUploadData | null>(null)
  const [rawData, setRawData] = useState<any[]>([])
  const [fileName, setFileName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const { addToast } = useToast()

  const typeLabel = type === 'awards' ? 'Award' : 'Event'
  const typeLabelPlural = type === 'awards' ? 'Awards' : 'Events'

  // Intelligent field mapping
  const autoMapFields = (columns: string[]) => {
    const mapping: Record<string, string> = {}
    const unmapped: string[] = []

    columns.forEach(column => {
      const normalizedColumn = column.toLowerCase().trim()
      let mapped = false

      for (const [field, aliases] of Object.entries(fieldMappings)) {
        if (aliases.some(alias => normalizedColumn.includes(alias.toLowerCase()))) {
          mapping[column] = field
          mapped = true
          break
        }
      }

      if (!mapped) {
        unmapped.push(column)
      }
    })

    return { mapping, unmapped }
  }

  const processFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        let parsedData: any[] = []

        if (file.name.endsWith('.csv')) {
          Papa.parse(data as string, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              parsedData = results.data
            }
          })
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          parsedData = XLSX.utils.sheet_to_json(worksheet)
        } else {
          throw new Error('Unsupported file format. Please use CSV or Excel files.')
        }

        if (parsedData.length === 0) {
          throw new Error('No data found in the file.')
        }

        const columns = Object.keys(parsedData[0])
        const { mapping, unmapped } = autoMapFields(columns)

        setRawData(parsedData)
        setBulkData({
          items: [],
          mapping,
          unmappedColumns: unmapped
        })
        setFileName(file.name)
        setUploadStep('mapping')
        
      } catch (error) {
        console.error('Error processing file:', error)
        addToast({ 
          type: 'error', 
          message: error instanceof Error ? error.message : 'Error processing file' 
        })
      }
    }

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file)
    } else {
      reader.readAsBinaryString(file)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      processFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const updateMapping = (column: string, field: string) => {
    if (!bulkData) return

    setBulkData(prev => {
      if (!prev) return prev
      
      const newMapping = { ...prev.mapping }
      const newUnmapped = [...prev.unmappedColumns]

      if (field === '') {
        delete newMapping[column]
        if (!newUnmapped.includes(column)) {
          newUnmapped.push(column)
        }
      } else {
        newMapping[column] = field
        const unmappedIndex = newUnmapped.indexOf(column)
        if (unmappedIndex > -1) {
          newUnmapped.splice(unmappedIndex, 1)
        }
      }

      return {
        ...prev,
        mapping: newMapping,
        unmappedColumns: newUnmapped
      }
    })
  }

  const generatePreview = () => {
    if (!bulkData || rawData.length === 0) return

    const mappedItems = rawData.map(row => {
      const item: Record<string, any> = {}
      
      Object.entries(bulkData.mapping).forEach(([column, field]) => {
        if (row[column] !== undefined && row[column] !== null && row[column] !== '') {
          item[field] = row[column]
        }
      })

      return item
    })

    setBulkData(prev => prev ? { ...prev, items: mappedItems } : null)
    setUploadStep('preview')
  }

  const processBulkUpload = async () => {
    if (!bulkData?.items) return

    setIsSubmitting(true)
    setUploadStep('processing')

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [type]: bulkData.items }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setBulkData(prev => prev ? {
          ...prev,
          successCount: result.data.count,
          errorCount: result.data.errors?.length || 0,
          errors: result.data.errors
        } : null)
        
        setUploadStep('success')
        addToast({ type: 'success', message: `${result.data.count} ${type} imported successfully` })
        onItemsAdded()
      } else {
        // Show detailed errors if available
        let errorMessage = result.error || `Failed to import ${type}`
        if (result.details && Array.isArray(result.details)) {
          errorMessage = `${errorMessage}:\n${result.details.join('\n')}`
        }
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error(`Error importing ${type}:`, error)
      addToast({ 
        type: 'error', 
        message: error instanceof Error ? error.message : `Failed to import ${type}` 
      })
      setUploadStep('preview')
    } finally {
      setIsSubmitting(false)
    }
  }

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, typeLabelPlural)
    XLSX.writeFile(wb, `${type}_template.xlsx`)
  }

  const resetModal = () => {
    setUploadStep('upload')
    setBulkData(null)
    setRawData([])
    setFileName('')
    setIsSubmitting(false)
    setDragOver(false)
  }

  const handleClose = () => {
    if (!isSubmitting) {
      resetModal()
      onClose()
    }
  }

  const mappingComplete = useMemo(() => {
    if (!bulkData) return false
    return requiredFields.every(field => 
      Object.values(bulkData.mapping).includes(field)
    )
  }, [bulkData, requiredFields])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-lg font-medium text-gray-900">
              Bulk Import {typeLabelPlural}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              disabled={isSubmitting}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {uploadStep === 'upload' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Upload {typeLabelPlural} File
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload a CSV or Excel file containing your {type}. The file should include columns that match the required fields.
                  </p>
                </div>

                {/* File Upload Area */}
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                    dragOver ? "border-blue-400 bg-blue-50" : "border-gray-300",
                    "hover:border-gray-400"
                  )}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop your file here, or
                  </p>
                  <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">
                    Choose File
                    <input
                      type="file"
                      className="hidden"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Supported formats: CSV, Excel (.xlsx, .xls)
                  </p>
                </div>

                {/* Download Template */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Download className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        Download Template
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Download a template file with the correct column headers to get started.
                      </p>
                      <button
                        onClick={downloadTemplate}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Download {typeLabel} Template
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {uploadStep === 'mapping' && bulkData && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Map Your Columns
                  </h3>
                  <p className="text-sm text-gray-600">
                    Map the columns from your file to the {typeLabel.toLowerCase()} fields. Required fields are marked with *.
                  </p>
                </div>

                <div className="space-y-4">
                  {Object.keys(rawData[0] || {}).map(column => (
                    <div key={column} className="flex items-center space-x-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700">
                          {column}
                        </label>
                      </div>
                      <div className="flex-1">
                        <select
                          value={bulkData.mapping[column] || ''}
                          onChange={(e) => updateMapping(column, e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="">-- Skip this column --</option>
                          {Object.keys(fieldMappings).map(field => (
                            <option key={field} value={field}>
                              {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              {requiredFields.includes(field) ? ' *' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                {!mappingComplete && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-yellow-400" />
                      <div className="ml-3">
                        <p className="text-sm text-yellow-800">
                          Please map all required fields: {requiredFields.join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setUploadStep('upload')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={generatePreview}
                    disabled={!mappingComplete}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Preview Data
                  </button>
                </div>
              </div>
            )}

            {uploadStep === 'preview' && bulkData && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Preview {typeLabelPlural}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Review the data before importing. {bulkData.items.length} {type} will be imported.
                  </p>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-md max-h-96 overflow-y-auto">
                  <ul className="divide-y divide-gray-200">
                    {bulkData.items.slice(0, 10).map((item, index) => (
                      <li key={index} className="px-4 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {item.eventName || item.awardName || `${typeLabel} ${index + 1}`}
                          </div>
                          <div className="text-gray-500 mt-1">
                            {Object.entries(item).slice(1, 3).map(([key, value]) => (
                              <span key={key} className="inline-block mr-4">
                                {key}: {String(value)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {bulkData.items.length > 10 && (
                  <p className="text-sm text-gray-600">
                    ... and {bulkData.items.length - 10} more {type}
                  </p>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setUploadStep('mapping')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Back to Mapping
                  </button>
                  <button
                    onClick={processBulkUpload}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Importing...' : `Import ${bulkData.items.length} ${typeLabelPlural}`}
                  </button>
                </div>
              </div>
            )}

            {uploadStep === 'processing' && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Importing {typeLabelPlural}...
                </h3>
                <p className="text-sm text-gray-600">
                  Please wait while we process your data.
                </p>
              </div>
            )}

            {uploadStep === 'success' && bulkData && (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Import Completed!
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Successfully imported: {bulkData.successCount} {type}</p>
                  {bulkData.errorCount! > 0 && (
                    <p className="text-red-600">
                      Errors: {bulkData.errorCount} {type} failed to import
                    </p>
                  )}
                </div>

                {bulkData.errors && bulkData.errors.length > 0 && (
                  <div className="mt-6 text-left">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Errors:</h4>
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 max-h-32 overflow-y-auto">
                      <ul className="text-xs text-red-700 space-y-1">
                        {bulkData.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleClose}
                  className="mt-6 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

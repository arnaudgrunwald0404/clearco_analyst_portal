'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building, Globe, Image, Save, AlertCircle, CheckCircle, Upload, X } from 'lucide-react'

interface GeneralSettings {
  id: string
  companyName: string
  protectedDomain: string
  logoUrl: string
  industryName: string
  createdAt: string
  updatedAt: string
}

interface FormData {
  companyName: string
  protectedDomain: string
  logoUrl: string
  industryName: string
}

interface HelpText {
  title?: string
  content: string
}

interface GeneralSettingsFormProps {
  showHelp?: (helpText: HelpText, element?: HTMLElement) => void
  hideHelp?: () => void
}

export default function GeneralSettingsForm({ showHelp, hideHelp }: GeneralSettingsFormProps) {
  const [settings, setSettings] = useState<GeneralSettings | null>(null)
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    protectedDomain: '',
    logoUrl: '',
    industryName: 'HR Technology'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url')
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/general')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        setFormData({
          companyName: data.companyName || '',
          protectedDomain: data.protectedDomain || '',
          logoUrl: data.logoUrl || '',
          industryName: data.industryName || 'HR Technology'
        })
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      setMessage({
        type: 'error',
        text: 'Failed to load settings. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/settings/general', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedSettings = await response.json()
        setSettings(updatedSettings)
        setMessage({
          type: 'success',
          text: 'Settings saved successfully!'
        })
      } else {
        const errorData = await response.json()
        setMessage({
          type: 'error',
          text: errorData.error || 'Failed to save settings'
        })
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({
        type: 'error',
        text: 'Failed to save settings. Please try again.'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    setMessage(null)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('logo', file)

      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: uploadFormData,
      })

      if (response.ok) {
        const result = await response.json()
        setFormData(prev => ({
          ...prev,
          logoUrl: result.logoUrl
        }))
        setMessage({
          type: 'success',
          text: 'Logo uploaded successfully!'
        })
      } else {
        const errorData = await response.json()
        setMessage({
          type: 'error',
          text: errorData.error || 'Failed to upload logo'
        })
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      setMessage({
        type: 'error',
        text: 'Failed to upload logo. Please try again.'
      })
    } finally {
      setUploading(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear any existing messages when user starts typing
    if (message) {
      setMessage(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Error Message Banner (only show errors at top) */}
      {message && message.type === 'error' && (
        <div className="p-4 rounded-lg border flex items-center gap-2 bg-red-50 border-red-200 text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Company Name */}
      <div 
        className="space-y-2"
        onMouseEnter={(e) => showHelp?.({
          content: 'The name of your company using this analyst portal platform'
        }, e.currentTarget)}
        onMouseLeave={() => hideHelp?.()}
      >
        <Label htmlFor="companyName" className="text-base font-medium flex items-center gap-3">
          <Building className="w-5 h-5" />
          Company Name *
        </Label>
        <Input
          id="companyName"
          type="text"
          value={formData.companyName}
          onChange={(e) => handleInputChange('companyName', e.target.value)}
          placeholder="Enter your company name"
          required
          className="w-full py-2 ml-6 pl-2"
        />
      </div>

      {/* Protected Domain */}
      <div 
        className="space-y-2"
        onMouseEnter={(e) => showHelp?.({
          content: 'Only users with email addresses from this domain will have access to this section of the portal'
        }, e.currentTarget)}
        onMouseLeave={() => hideHelp?.()}
      >
        <Label htmlFor="protectedDomain" className="text-base font-medium flex items-center gap-3">
          <Globe className="w-5 h-5" />
          Protected Domain *
        </Label>
        <Input
          id="protectedDomain"
          type="text"
          value={formData.protectedDomain}
          onChange={(e) => handleInputChange('protectedDomain', e.target.value)}
          placeholder="company.com"
          required
          className="w-full py-2 ml-6 mr-6 pl-2"
        />
      </div>

      {/* Logo */}
      <div 
        className="space-y-2"
        onMouseEnter={(e) => showHelp?.({
          content: uploadMethod === 'url' 
            ? 'Enter a public URL pointing to your company logo image'
            : 'Upload an image file (JPG, PNG, GIF, WebP, or SVG) up to 5MB'
        }, e.currentTarget)}
        onMouseLeave={() => hideHelp?.()}
      >
        <Label className="text-base font-medium flex items-center gap-3">
          <Image className="w-5 h-5" />
          Company Logo
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit ml-4">
            <button
              type="button"
              onClick={() => setUploadMethod('url')}
              className={`px-2 py-0.5 rounded text-sm font-medium transition-colors ${
                uploadMethod === 'url'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Enter URL
            </button>
            <button
              type="button"
              onClick={() => setUploadMethod('file')}
              className={`px-2 py-0.5 rounded text-sm font-medium transition-colors ${
                uploadMethod === 'file'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Upload File
            </button>
          </div>
        </Label>
        
        {uploadMethod === 'url' ? (
          <div className="space-y-2">
            <Input
              id="logoUrl"
              type="url"
              value={formData.logoUrl}
              onChange={(e) => handleInputChange('logoUrl', e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full py-2 ml-6 pl-2"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="flex gap-3 ml-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Choose File'}
              </Button>
              {formData.logoUrl && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                  Remove
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Logo Preview */}
        {formData.logoUrl && (
          <div className="ml-8 mt-4">
            <p className="text-sm text-gray-600 mb-3">Preview:</p>
            <img
              src={formData.logoUrl}
              alt="Logo preview"
              className="max-w-32 max-h-16 object-contain border border-gray-200 rounded"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}
      </div>

      {/* Industry Name */}
      <div 
        className="space-y-2"
        onMouseEnter={(e) => showHelp?.({
          content: 'The industry your company operates in (e.g., HR Technology, HR Tech)'
        }, e.currentTarget)}
        onMouseLeave={() => hideHelp?.()}
      >
        <Label htmlFor="industryName" className="text-base font-medium flex items-center gap-3">
          <Building className="w-5 h-5" />
          Industry Name *
        </Label>
        <Input
          id="industryName"
          type="text"
          value={formData.industryName}
          onChange={(e) => handleInputChange('industryName', e.target.value)}
          placeholder="HR Technology"
          required
          className="w-full pt-2 ml-6 pl-2"
        />
      </div>

      {/* Save Button with inline success message */}
      <div className="ml-6 flex items-center">
        <Button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
        
        {/* Inline success message */}
        {message && message.type === 'success' && (
          <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            <span>{message.text}</span>
          </div>
        )}
      </div>
    </form>
  )
}

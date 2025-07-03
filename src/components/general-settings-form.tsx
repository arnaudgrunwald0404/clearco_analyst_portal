'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building, Globe, Image, Save, AlertCircle, CheckCircle } from 'lucide-react'

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

export default function GeneralSettingsForm() {
  const [settings, setSettings] = useState<GeneralSettings | null>(null)
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    protectedDomain: '',
    logoUrl: '',
    industryName: 'HR Technology'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

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

  const handleSubmit = async (e: React.FormEvent) => {
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

      const data = await response.json()

      if (response.ok) {
        setSettings(data)
        setMessage({
          type: 'success',
          text: 'Settings saved successfully!'
        })
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to save settings'
        })
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      setMessage({
        type: 'error',
        text: 'Failed to save settings. Please try again.'
      })
    } finally {
      setSaving(false)
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message Banner (only show errors at top) */}
      {message && message.type === 'error' && (
        <div className="p-4 rounded-lg border flex items-center gap-2 bg-red-50 border-red-200 text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Company Name */}
      <div className="space-y-2">
        <Label htmlFor="companyName" className="text-sm font-medium flex items-center gap-2">
          <Building className="w-4 h-4" />
          Company Name *
        </Label>
        <Input
          id="companyName"
          type="text"
          value={formData.companyName}
          onChange={(e) => handleInputChange('companyName', e.target.value)}
          placeholder="Enter your company name"
          required
          className="w-full"
        />
        <p className="text-xs text-gray-500">
          The name of your company using this analyst portal platform
        </p>
      </div>

      {/* Protected Domain */}
      <div className="space-y-2">
        <Label htmlFor="protectedDomain" className="text-sm font-medium flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Protected Domain *
        </Label>
        <Input
          id="protectedDomain"
          type="text"
          value={formData.protectedDomain}
          onChange={(e) => handleInputChange('protectedDomain', e.target.value)}
          placeholder="company.com"
          required
          className="w-full"
        />
        <p className="text-xs text-gray-500">
          Only users with email addresses from this domain will have access to this section of the portal
        </p>
      </div>

      {/* Logo URL */}
      <div className="space-y-2">
        <Label htmlFor="logoUrl" className="text-sm font-medium flex items-center gap-2">
          <Image className="w-4 h-4" />
          Logo URL
        </Label>
        <Input
          id="logoUrl"
          type="url"
          value={formData.logoUrl}
          onChange={(e) => handleInputChange('logoUrl', e.target.value)}
          placeholder="https://example.com/logo.png"
          className="w-full"
        />
        <p className="text-xs text-gray-500">
          A public URL pointing to your company logo image
        </p>
        {formData.logoUrl && (
          <div className="mt-2">
            <p className="text-xs text-gray-600 mb-2">Preview:</p>
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
      <div className="space-y-2">
        <Label htmlFor="industryName" className="text-sm font-medium">
          Industry Name *
        </Label>
        <Input
          id="industryName"
          type="text"
          value={formData.industryName}
          onChange={(e) => handleInputChange('industryName', e.target.value)}
          placeholder="HR Technology"
          required
          className="w-full"
        />
        <p className="text-xs text-gray-500">
          The industry your company operates in (e.g., HR Technology, HR Tech)
        </p>
      </div>

      {/* Save Button with inline success message */}
      <div className="pt-4 flex items-center gap-4">
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

      {/* Settings Info */}
      {settings && (
        <div className="pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Last updated: {new Date(settings.updatedAt).toLocaleString()}
          </p>
        </div>
      )}
    </form>
  )
}

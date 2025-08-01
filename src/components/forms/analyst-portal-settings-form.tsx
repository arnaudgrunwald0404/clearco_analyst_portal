'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Quote, User, Image, Save, AlertCircle, CheckCircle } from 'lucide-react'

interface AnalystPortalSettings {
  id: string
  welcomeQuote: string
  quoteAuthor: string
  authorImageUrl: string
  createdAt: string
  updatedAt: string
}

interface FormData {
  welcomeQuote: string
  quoteAuthor: string
  authorImageUrl: string
}

export default function AnalystPortalSettingsForm() {
  const [settings, setSettings] = useState<AnalystPortalSettings | null>(null)
  const [formData, setFormData] = useState<FormData>({
    welcomeQuote: '',
    quoteAuthor: '',
    authorImageUrl: ''
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
      const response = await fetch('/api/settings/analyst-portal')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        setFormData({
          welcomeQuote: data.welcomeQuote || '',
          quoteAuthor: data.quoteAuthor || '',
          authorImageUrl: data.authorImageUrl || ''
        })
      }
    } catch (error) {
      console.error('Failed to fetch analyst portal settings:', error)
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
      const response = await fetch('/api/settings/analyst-portal', {
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
          text: 'Analyst portal settings saved successfully!'
        })
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to save settings'
        })
      }
    } catch (error) {
      console.error('Failed to save analyst portal settings:', error)
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
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
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

      {/* Welcome Quote */}
      <div className="space-y-2">
        <Label htmlFor="welcomeQuote" className="text-sm font-medium flex items-center gap-2">
          <Quote className="w-4 h-4" />
          Welcome Quote *
        </Label>
        <Textarea
          id="welcomeQuote"
          value={formData.welcomeQuote}
          onChange={(e) => handleInputChange('welcomeQuote', e.target.value)}
          placeholder="Enter an inspiring quote to welcome analysts to the portal"
          required
          className="w-full min-h-[80px]"
          rows={3}
        />
        <p className="text-xs text-gray-500">
          This quote will be displayed prominently on the analyst portal welcome page
        </p>
      </div>

      {/* Quote Author */}
      <div className="space-y-2">
        <Label htmlFor="quoteAuthor" className="text-sm font-medium flex items-center gap-2">
          <User className="w-4 h-4" />
          Quote Author *
        </Label>
        <Input
          id="quoteAuthor"
          type="text"
          value={formData.quoteAuthor}
          onChange={(e) => handleInputChange('quoteAuthor', e.target.value)}
          placeholder="Enter the name of the person who said this quote"
          required
          className="w-full"
        />
        <p className="text-xs text-gray-500">
          The name and title of the person attributed to this quote
        </p>
      </div>

      {/* Author Image URL */}
      <div className="space-y-2">
        <Label htmlFor="authorImageUrl" className="text-sm font-medium flex items-center gap-2">
          <Image className="w-4 h-4" />
          Author Image URL
        </Label>
        <Input
          id="authorImageUrl"
          type="url"
          value={formData.authorImageUrl}
          onChange={(e) => handleInputChange('authorImageUrl', e.target.value)}
          placeholder="https://example.com/author-photo.jpg"
          className="w-full"
        />
        <p className="text-xs text-gray-500">
          A public URL pointing to a photo of the quote author
        </p>
        {formData.authorImageUrl && (
          <div className="mt-2">
            <p className="text-xs text-gray-600 mb-2">Preview:</p>
            <img
              src={formData.authorImageUrl}
              alt="Author preview"
              className="w-16 h-16 object-cover border border-gray-200 rounded-full"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}
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

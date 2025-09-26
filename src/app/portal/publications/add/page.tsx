'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Plus, Save, FileText, BookOpen, Newspaper, Calendar, Video, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const publicationTypes = [
  { value: 'RESEARCH_REPORT', label: 'Research Report', icon: BookOpen },
  { value: 'ARTICLE', label: 'Article', icon: Newspaper },
  { value: 'WHITEPAPER', label: 'Whitepaper', icon: FileText },
  { value: 'BLOG_POST', label: 'Blog Post', icon: Newspaper },
  { value: 'WEBINAR', label: 'Webinar', icon: Video },
  { value: 'PODCAST', label: 'Podcast', icon: Mic },
  { value: 'OTHER', label: 'Other', icon: FileText }
]

export default function AddPublicationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const type = searchParams.get('type') // 'published' or 'upcoming'
  
  const [saving, setSaving] = useState(false)
  const [analystId, setAnalystId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    summary: '',
    type: 'RESEARCH_REPORT',
    publishedAt: type === 'published' 
      ? new Date().toISOString().split('T')[0] 
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
  })

  // Get current analyst ID
  useEffect(() => {
    const fetchAnalystId = async () => {
      try {
        const response = await fetch('/api/auth/user')
        if (response.ok) {
          const userData = await response.json()
          if (userData.email) {
            // Get analyst ID by email
            const analystResponse = await fetch(`/api/analysts/by-email/${encodeURIComponent(userData.email)}`)
            if (analystResponse.ok) {
              const analystData = await analystResponse.json()
              if (analystData.success && analystData.data) {
                setAnalystId(analystData.data.id)
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching analyst ID:', error)
      }
    }
    fetchAnalystId()
  }, [])

  const isUpcoming = type === 'upcoming'
  const pageTitle = isUpcoming ? 'Add Upcoming Research' : 'Add Recent Publication'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    if (!analystId) {
      console.error('Analyst ID not found')
      setSaving(false)
      return
    }

    try {
      const response = await fetch('/api/publications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          analystId,
          isTracked: true,
        }),
      })

      if (response.ok) {
        router.push('/portal?added=publication')
      } else {
        const errorData = await response.json()
        console.error('Failed to save publication:', errorData)
      }
    } catch (error) {
      console.error('Error saving publication:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {isUpcoming 
                ? 'Share your upcoming research to get timely vendor input.'
                : 'Log your recent publications to showcase your expertise.'
              }
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Publication Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter publication title"
                  required
                  className="mt-1"
                />
              </div>

              {/* Type */}
              <div>
                <Label htmlFor="type">Type *</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {publicationTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <Label htmlFor="publishedAt">
                  {isUpcoming ? 'Expected Publication Date' : 'Publication Date'} *
                </Label>
                <Input
                  id="publishedAt"
                  type="date"
                  value={formData.publishedAt}
                  onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              {/* URL */}
              <div>
                <Label htmlFor="url">
                  URL {!isUpcoming && '*'}
                </Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                  required={!isUpcoming}
                  className="mt-1"
                />
                {isUpcoming && (
                  <p className="text-xs text-gray-500 mt-1">
                    URL can be added later when the research is published
                  </p>
                )}
              </div>

              {/* Summary */}
              <div>
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Brief description of the publication content..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !formData.title || !analystId}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Publication'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

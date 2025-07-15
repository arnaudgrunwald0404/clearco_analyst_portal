'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Select, MultiSelect, TextInput, Textarea, Group, Stack, Title, Loader, Modal } from '@mantine/core'
import { ArrowLeft, Send } from 'lucide-react'

function mergeTemplate(html: string, { title, subject, content }: { title: string, subject: string, content: string }) {
  return html
    .replace(/\{\{title\}\}/g, title)
    .replace(/\{\{subject\}\}/g, subject)
    .replace(/\{\{content\}\}/g, content)
}

export default function CreateNewsletterPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [analystIds, setAnalystIds] = useState<string[]>([])
  const [status, setStatus] = useState<'DRAFT' | 'SCHEDULED'>('DRAFT')
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null)
  const [templates, setTemplates] = useState<any[]>([])
  const [analysts, setAnalysts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // For preview
  const selectedTemplate = templateId ? templates.find(t => t.id === templateId) : null
  const previewHtml = selectedTemplate ? mergeTemplate(selectedTemplate.html, { title, subject, content }) : ''

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [templatesRes, analystsRes] = await Promise.all([
          fetch('/api/email-templates'),
          fetch('/api/analysts')
        ])
        const templatesData = await templatesRes.json()
        const analystsData = await analystsRes.json()
        setTemplates(templatesData.templates || [])
        setAnalysts(analystsData.data || [])
      } catch (e) {
        setError('Failed to load templates or analysts')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    if (!title.trim() || !subject.trim() || !content.trim() || analystIds.length === 0) {
      setError('Please fill in all required fields and select at least one recipient.')
      return
    }
    if (status === 'SCHEDULED' && !scheduledAt) {
      setError('Please select a scheduled date and time.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/newsletters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subject,
          content,
          templateId,
          status,
          scheduledAt: status === 'SCHEDULED' && scheduledAt ? scheduledAt.toISOString() : null,
          recipientAnalystIds: analystIds
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSuccess(true)
        setTimeout(() => router.push('/newsletters'), 1200)
      } else {
        setError(data.error || 'Failed to create newsletter')
      }
    } catch (e) {
      setError('Failed to create newsletter')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <Group mb="md">
        <Button variant="subtle" leftSection={<ArrowLeft size={18} />} onClick={() => router.push('/newsletters')}>
          Back to Newsletters
        </Button>
      </Group>
      <Title order={1} className="text-3xl font-bold mb-2">Create Newsletter</Title>
      <p className="text-gray-600 mb-8">Draft and schedule a new analyst newsletter. Select a template, add content, and choose recipients.</p>
      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]"><Loader size="lg" /></div>
      ) : (
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="Title"
              placeholder="Newsletter title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
            <TextInput
              label="Subject"
              placeholder="Email subject line"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
            />
            <Select
              label="Email Template"
              placeholder="Select a template"
              data={templates.map(t => ({ value: t.id, label: t.name }))}
              value={templateId}
              onChange={setTemplateId}
              clearable
            />
            <Textarea
              label="Content"
              placeholder="Newsletter content (can use merge tags)"
              value={content}
              onChange={e => setContent(e.target.value)}
              minRows={6}
              required
            />
            <MultiSelect
              label="Recipients"
              placeholder="Select analysts to receive this newsletter"
              data={analysts.map(a => ({ value: a.id, label: `${a.firstName} ${a.lastName} (${a.email})` }))}
              value={analystIds}
              onChange={setAnalystIds}
              searchable
              nothingFoundMessage="No analysts found"
              required
            />
            <Group gap="md">
              <Select
                label="Status"
                data={[
                  { value: 'DRAFT', label: 'Draft' },
                  { value: 'SCHEDULED', label: 'Scheduled' }
                ]}
                value={status}
                onChange={v => setStatus(v as 'DRAFT' | 'SCHEDULED')}
                className="w-40"
              />
              {status === 'SCHEDULED' && (
                <div className="flex flex-col">
                  <label htmlFor="scheduledAt" className="mb-1 text-sm font-medium text-gray-700">Scheduled At</label>
                  <input
                    id="scheduledAt"
                    type="datetime-local"
                    className="border border-gray-300 rounded-lg px-3 py-2"
                    value={scheduledAt ? new Date(scheduledAt).toISOString().slice(0,16) : ''}
                    onChange={e => setScheduledAt(e.target.value ? new Date(e.target.value) : null)}
                    min={new Date().toISOString().slice(0,16)}
                    required
                  />
                </div>
              )}
            </Group>
            {error && <div className="text-red-600">{error}</div>}
            {success && <div className="text-green-600">Newsletter created successfully! Redirecting...</div>}
            <Button type="submit" leftSection={<Send size={16} />} loading={submitting} disabled={submitting}>
              Create Newsletter
            </Button>
          </Stack>
        </form>
      )}
      {/* Live Preview */}
      {selectedTemplate && (
        <div className="mt-12">
          <Title order={2} className="text-xl font-bold mb-4">Live Template Preview</Title>
          <div className="border rounded-lg overflow-hidden shadow bg-white">
            <iframe
              title="Newsletter Preview"
              srcDoc={previewHtml}
              className="w-full min-h-[500px] bg-white"
              style={{ border: 'none' }}
            />
          </div>
        </div>
      )}
    </div>
  )
} 
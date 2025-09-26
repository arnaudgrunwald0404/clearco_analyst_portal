'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ResourceCategory = 'brand' | 'product' | 'misc'

interface PortalResource {
  id: string
  title: string
  kind?: 'presentation' | 'guide' | 'demo' | 'case-study' | 'spec' | 'api' | 'whitepaper' | 'video' | 'other'
  sizeLabel?: string
  url: string
  category?: ResourceCategory
}

interface AnalystPortalSettings {
  id: string
  welcomeQuote: string
  quoteAuthor: string
  authorImageUrl: string
  resources?: PortalResource[]
  contactName?: string
  contactTitle?: string
  contactEmail?: string
  contactPhone?: string
  contactImageUrl?: string
  createdAt: string
  updatedAt: string
}

interface PortalSettingsFormData {
  welcomeQuote: string
  quoteAuthor: string
  authorImageUrl: string
  resources: PortalResource[]
  contactName?: string
  contactTitle?: string
  contactEmail?: string
  contactPhone?: string
  contactImageUrl?: string
}

export default function AnalystPortalSettingsForm() {
  const [settings, setSettings] = useState<AnalystPortalSettings | null>(null)
  const [formData, setFormData] = useState<PortalSettingsFormData>({
    welcomeQuote: '',
    quoteAuthor: '',
    authorImageUrl: '',
    resources: []
  })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const response = await fetch('/api/settings/analyst-portal')
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
          setFormData({
            welcomeQuote: data.welcomeQuote || '',
            quoteAuthor: data.quoteAuthor || '',
            authorImageUrl: data.authorImageUrl || '',
            resources: Array.isArray(data.resources) ? data.resources : [],
            contactName: data.contactName || '',
            contactTitle: data.contactTitle || '',
            contactEmail: data.contactEmail || '',
            contactPhone: data.contactPhone || '',
            contactImageUrl: data.contactImageUrl || ''
          })
        }
      } catch (e) {
        setMessage({ type: 'error', text: 'Failed to load settings. Please try again.' })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleInputChange = (field: keyof PortalSettingsFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (message) setMessage(null)
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading portal settings…</div>
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      <div className="p-4 rounded-lg border bg-gray-50 border-gray-200 text-gray-700">
        Portal settings form placeholder. To re-enable full editor, restore this file's previous implementation.
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Welcome Quote</Label>
          <Input value={formData.welcomeQuote} onChange={(e) => handleInputChange('welcomeQuote', e.target.value)} />
        </div>
        <div>
          <Label className="text-sm font-medium">Quote Author</Label>
          <Input value={formData.quoteAuthor} onChange={(e) => handleInputChange('quoteAuthor', e.target.value)} />
        </div>
      </div>
      {message && (
        <div className={`text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message.text}</div>
      )}
      <Button type="submit">Save</Button>
    </form>
  )
}
    }))
  }

  // Uploading state for batch uploads
  const [uploading, setUploading] = useState(false)
  type UploadItem = { id: string; name: string; size: number; progress: number; status: 'uploading' | 'done' | 'error'; error?: string }
  const [uploads, setUploads] = useState<UploadItem[]>([])

  const updateUpload = (id: string, patch: Partial<UploadItem>) => {
    setUploads(prev => prev.map(u => u.id === id ? { ...u, ...patch } : u))
  }

  const uploadFileWithProgress = (file: File, id: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/upload/resource')
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100)
          updateUpload(id, { progress: pct })
        }
      }
      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          try {
            const json = JSON.parse(xhr.responseText || '{}')
            if (xhr.status >= 200 && xhr.status < 300 && json?.success && (json?.url || json?.path)) {
              updateUpload(id, { status: 'done', progress: 100 })
              resolve(json.url || json.path)
            } else {
              const err = json?.error || `Upload failed (${xhr.status})`
              updateUpload(id, { status: 'error', error: err })
              reject(new Error(err))
            }
          } catch (e: any) {
            updateUpload(id, { status: 'error', error: e?.message || 'Upload failed' })
            reject(e)
          }
        }
      }
      xhr.onerror = () => {
        updateUpload(id, { status: 'error', error: 'Network error' })
        reject(new Error('Network error'))
      }
      const fd = new FormData()
      fd.append('file', file)
      xhr.send(fd)
    })
  }

  // Drag-and-drop reordering
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const onDragStart = (idx: number) => (e: React.DragEvent) => {
    setDragIndex(idx)
    e.dataTransfer.effectAllowed = 'move'
  }
  const onDragOver = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  const onDrop = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === idx) return
    setFormData(prev => {
      const next = [...prev.resources]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(idx, 0, moved)
      return { ...prev, resources: next }
    })
    setDragIndex(null)
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
          placeholder="Welcome {first_name}, I am so glad you are here to learn more about {company_name}!"
          required
          className="w-full min-h-[80px]"
          rows={3}
        />
        <p className="text-xs text-gray-500">
          Use variables: {`{first_name}`}, {`{last_name}`}, {`{company_name}`}, {`{industry_name}`}, {`{full_name}`}
        </p>
        <p className="text-xs text-gray-400">
          Variables will be automatically replaced with the analyst's actual information when displayed
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
      </div>

      {/* Company Contact fields */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Contact Name</Label>
          <Input value={formData.contactName || ''} onChange={(e) => handleInputChange('contactName', e.target.value)} placeholder="Jane Doe" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Contact Title</Label>
          <Input value={formData.contactTitle || ''} onChange={(e) => handleInputChange('contactTitle', e.target.value)} placeholder="Director of AR" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Contact Email</Label>
          <Input type="email" value={formData.contactEmail || ''} onChange={(e) => handleInputChange('contactEmail', e.target.value)} placeholder="jane@company.com" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Contact Phone</Label>
          <Input value={formData.contactPhone || ''} onChange={(e) => handleInputChange('contactPhone', e.target.value)} placeholder="+1 (555) 123-4567" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="text-sm font-medium">Contact Photo</Label>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
              {formData.contactImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={formData.contactImageUrl} alt="Contact" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-gray-500">No photo</span>
              )}
            </div>
            <div className="flex-1">
              <Input type="url" value={formData.contactImageUrl || ''} onChange={(e) => handleInputChange('contactImageUrl', e.target.value)} placeholder="https://..." />
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    try {
                      const fd = new FormData()
                      fd.append('file', file)
                      const resp = await fetch('/api/upload/resource', { method: 'POST', body: fd })
                      const json = await resp.json()
                      if (json?.success && (json?.url || json?.path)) {
                        const value = json.url || json.path
                        handleInputChange('contactImageUrl', value)
                      }
                    } catch {}
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resources List */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Resources (shown in the portal Resources tab)</Label>
        {formData.resources.length === 0 && (
          <p className="text-sm text-gray-500">No resources added yet.</p>
        )}
        <div className="space-y-3">
          {formData.resources.map((res, idx) => (
            <div
              key={res.id}
              className="border rounded-lg p-3 grid md:grid-cols-12 gap-3"
              draggable
              onDragStart={onDragStart(idx)}
              onDragOver={onDragOver(idx)}
              onDrop={onDrop(idx)}
            >
              <div className="md:col-span-1 flex items-start pt-5">
                <span className="text-gray-400 cursor-move" title="Drag to reorder">
                  <GripVertical className="w-4 h-4" />
                </span>
              </div>
              <div className="md:col-span-3">
                <Label className="text-xs">Title</Label>
                <Input
                  value={res.title}
                  onChange={(e) => updateResource(idx, 'title', e.target.value)}
                  placeholder="Resource title"
                  className={!res.title?.trim() ? 'border-red-300 focus-visible:ring-red-400' : ''}
                />
                {!res.title?.trim() && (
                  <p className="text-xs text-red-600 mt-1">Required</p>
                )}
              </div>
              <div className="md:col-span-3">
                <Label className="text-xs">Type</Label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={res.kind || 'other'}
                  onChange={(e) => updateResource(idx, 'kind', e.target.value)}
                >
                  {['presentation','guide','demo','case-study','spec','api','whitepaper','video','other'].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3">
                <Label className="text-xs">Category</Label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={res.category || 'misc'}
                  onChange={(e) => updateResource(idx, 'category', e.target.value as any)}
                >
                  <option value="brand">Brand Kit</option>
                  <option value="product">Product</option>
                  <option value="misc">Miscellaneous</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <Label className="text-xs">Size Label</Label>
                <Input value={res.sizeLabel || ''} onChange={(e) => updateResource(idx, 'sizeLabel', e.target.value)} placeholder="e.g., 4.2 MB" />
              </div>
              <div className="md:col-span-10">
                <Label className="text-xs">URL</Label>
                <Input
                  value={res.url}
                  onChange={(e) => updateResource(idx, 'url', e.target.value)}
                  placeholder="resources/<filename> or https://..."
                  className={!res.url?.trim() ? 'border-red-300 focus-visible:ring-red-400' : ''}
                />
                {!res.url?.trim() && (
                  <p className="text-xs text-red-600 mt-1">Required</p>
                )}
              </div>
              <div className="md:col-span-2 flex items-end">
                <Button type="button" variant="outline" className="w-full" onClick={() => removeResource(idx)}>Remove</Button>
              </div>
            </div>
          ))}
        </div>
        <Button type="button" variant="secondary" onClick={addResource}>Add Resource</Button>
      </div>

      {/* Upload helper */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Upload a file and use its URL</Label>
        <input
          type="file"
          multiple
          disabled={uploading}
          onChange={async (e) => {
            const files = Array.from(e.target.files || [])
            if (files.length === 0) return
            setUploading(true)
            // Seed upload list
            const now = Date.now()
            const newUploads: UploadItem[] = files.map((f, i) => ({ id: `up-${now}-${i}`, name: f.name, size: f.size, progress: 0, status: 'uploading' }))
            setUploads(prev => [...prev, ...newUploads])
            try {
              const results = await Promise.allSettled(
                files.map((file, i) => uploadFileWithProgress(file, newUploads[i].id).then((value) => ({ file, value })))
              )

              const successes = results.filter(r => r.status === 'fulfilled') as PromiseFulfilledResult<{ file: File; value: string }>[]
              const failures = results.filter(r => r.status === 'rejected')

              if (successes.length > 0) {
                setFormData(prev => ({
                  ...prev,
                  resources: [
                    ...prev.resources,
                    ...successes.map((s, i) => ({
                      id: `res-${now}-${i}`,
                      title: s.value.file.name.replace(/\.[^.]+$/, ''),
                      url: s.value.value,
                      kind: 'other',
                      category: 'misc',
                      sizeLabel: `${Math.max(1, Math.round(s.value.file.size / (1024 * 1024)))} MB`
                    }))
                  ]
                }))
              }

              if (failures.length > 0) {
                setMessage({ type: 'error', text: `${failures.length} file(s) failed to upload.` })
              } else {
                setMessage({ type: 'success', text: `${successes.length} file(s) uploaded.` })
              }
            } catch (err) {
              setMessage({ type: 'error', text: 'Batch upload failed' })
            } finally {
              setUploading(false)
              // Reset input so same files can be re-selected
              e.currentTarget.value = ''
            }
          }}
          className="block"
        />
        <p className="text-xs text-gray-500">Files are stored privately in Supabase Storage (resources bucket). The portal will generate signed links on download.</p>

        {/* Upload progress list */}
        {uploads.length > 0 && (
          <div className="mt-3 space-y-2">
            {uploads.map(u => (
              <div key={u.id} className="text-xs">
                <div className="flex items-center justify-between">
                  <span className="truncate max-w-[70%]" title={u.name}>{u.name}</span>
                  <span className="text-gray-500">{Math.max(1, Math.round(u.size / (1024 * 1024)))} MB</span>
                </div>
                <div className="h-2 bg-gray-200 rounded mt-1 overflow-hidden">
                  <div className={`h-full ${u.status === 'error' ? 'bg-red-400' : 'bg-blue-500'}`} style={{ width: `${u.progress}%` }} />
                </div>
                {u.status === 'error' && (
                  <div className="text-red-600 mt-1">{u.error || 'Upload failed'}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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

      {/* Save Button with inline success message */
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

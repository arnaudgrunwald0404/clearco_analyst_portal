'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface PortalSettingsFormData {
  welcomeQuote: string
  contactName: string
  contactTitle: string
  contactEmail: string
  contactImageUrl?: string
}

export default function AnalystPortalSettingsForm() {
  const [form, setForm] = useState<PortalSettingsFormData>({ welcomeQuote: '', contactName: '', contactTitle: '', contactEmail: '', contactImageUrl: '' })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  // Web search modal state
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<Array<{ url: string; source: string; title?: string; confidence: number; thumbnail?: string }>>([])

  const isValidEmail = (s: string) => !s || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)

  useEffect(() => {
    ;(async () => {
      try {
        const resp = await fetch('/api/settings/analyst-portal')
        if (resp.ok) {
          const json = await resp.json()
          let contactName = json.contactName || ''
          let contactTitle = json.contactTitle || ''
          let contactEmail = json.contactEmail || ''
          const contactImageUrl = json.contactImageUrl || json.authorImageUrl || ''
          // Back-compat: split legacy quoteAuthor "Name, Title"
          if (!contactName && !contactTitle && typeof json.quoteAuthor === 'string' && json.quoteAuthor) {
            const parts = json.quoteAuthor.split(',')
            contactName = (parts[0] || '').trim()
            contactTitle = parts.slice(1).join(',').trim()
          }
          setForm({ welcomeQuote: json.welcomeQuote || '', contactName, contactTitle, contactEmail, contactImageUrl })
        }
      } catch {}
      finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)

    // Validate email if provided
    if (!isValidEmail(form.contactEmail)) {
      setMessage('Please enter a valid email address (or leave it blank).')
      return
    }

    try {
      const resp = await fetch('/api/settings/analyst-portal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          welcomeQuote: form.welcomeQuote,
          contactName: form.contactName,
          contactTitle: form.contactTitle,
          contactEmail: form.contactEmail,
          contactImageUrl: form.contactImageUrl || '',
        }),
      })
      if (!resp.ok) {
        const j = await resp.json().catch(() => ({} as any))
        throw new Error(j?.error || 'Failed to save')
      }
      setMessage('Saved!')
    } catch (err: any) {
      setMessage(err?.message || 'Failed to save')
    }
  }

  const uploadContactImage = async (file: File) => {
    try {
      const fd = new FormData()
      fd.append('file', file)
      const resp = await fetch('/api/upload/resource', { method: 'POST', body: fd })
      const json = await resp.json().catch(() => null)
      if (json?.success && (json.url || json.path)) {
        const value = json.url || json.path
        setForm((prev) => ({ ...prev, contactImageUrl: value }))
        setMessage('Photo uploaded. Remember to Save!')
      } else if (json?.error) {
        setMessage(`Upload failed: ${json.error}`)
      } else {
        setMessage('Upload failed')
      }
    } catch (e: any) {
      setMessage(e?.message || 'Upload failed')
    }
  }

  const searchWebForPhoto = async () => {
    setSearchOpen(true)
    setSearchLoading(true)
    setSearchResults([])
    try {
      // Try to get company name from general settings to improve relevance
      let company: string | undefined
      try {
        const g = await fetch('/api/settings/general', { cache: 'no-store' })
        if (g.ok) {
          const gj = await g.json().catch(() => null)
          company = gj?.company_name || gj?.companyName || undefined
        }
      } catch {}

      const resp = await fetch('/api/settings/contact-photo/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.contactName || '', title: form.contactTitle || '', company })
      })
      const json = await resp.json().catch(() => null)
      if (resp.ok && json?.success && Array.isArray(json.results)) {
        setSearchResults(json.results)
      } else {
        setMessage(json?.error || 'Search failed')
        setSearchOpen(false)
      }
    } catch (e: any) {
      setMessage(e?.message || 'Search failed')
      setSearchOpen(false)
    } finally {
      setSearchLoading(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">

      <div className="grid md:grid-cols-2 gap-4">

        <div>
          <Label className="text-sm font-medium">Contact Name</Label>
          <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="Jane Doe" />
        </div>
        <div>
          <Label className="text-sm font-medium">Contact Title</Label>
          <Input value={form.contactTitle} onChange={(e) => setForm({ ...form, contactTitle: e.target.value })} placeholder="Director of AR" />
        </div>
        <div>
          <Label className="text-sm font-medium">Contact Email Address</Label>
          <Input
            type="email"
            value={form.contactEmail}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            placeholder="jane@company.com"
            className={!isValidEmail(form.contactEmail) ? 'border-red-300 focus-visible:ring-red-400' : ''}
          />
          {!isValidEmail(form.contactEmail) && (
            <p className="text-xs text-red-600 mt-1">Enter a valid email address or leave this field blank.</p>
          )}
        </div>
        {/* Contact Photo */}
        <div className="md:col-span-2 space-y-2">
          <Label className="text-sm font-medium">Contact Photo</Label>
          <div className="flex items-center gap-3">
            {/* Photo Preview */}
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
              {form.contactImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.contactImageUrl} alt="Contact" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-gray-500">No photo</span>
              )}
            </div>
            
            {/* Search the web */}
            <Button type="button" variant="secondary" size="sm" onClick={searchWebForPhoto} disabled={!form.contactName.trim()}>
              Search the web
            </Button>
            
            <span className="text-gray-400 text-sm">or</span>
            
            {/* Choose file */}
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  await uploadContactImage(file)
                  e.currentTarget.value = ''
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="file-upload"
              />
              <Button type="button" variant="secondary" size="sm" asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                  Choose file
                </label>
              </Button>
            </div>
            
            <span className="text-gray-400 text-sm">or</span>
            
            {/* Enter URL */}
            <Input 
              type="url" 
              value={form.contactImageUrl || ''} 
              onChange={(e) => setForm({ ...form, contactImageUrl: e.target.value })} 
              placeholder="Enter URL" 
              className="flex-1 min-w-0"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">You can paste a public image URL, upload a file, or search the web. Uploaded files are stored privately and referenced as resources/&lt;filename&gt;.</p>
        </div>
        <div className="md:col-span-2">
          <Label className="text-sm font-medium">Welcome Quote</Label>
          <Textarea 
            value={form.welcomeQuote} 
            onChange={(e) => setForm({ ...form, welcomeQuote: e.target.value })} 
            rows={4}
            placeholder="Enter a welcome message or quote for your portal..."
            className="resize-none"
          />
        </div>
      </div>

      {/* Web Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[80vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Select a contact photo</h3>
              <Button type="button" variant="outline" onClick={() => setSearchOpen(false)}>Close</Button>
            </div>
            {searchLoading ? (
              <div className="text-sm text-gray-600">Searching…</div>
            ) : (
              <>
                {searchResults.length === 0 ? (
                  <div className="text-sm text-gray-600">No results found.</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {searchResults.map((r, idx) => (
                      <div key={idx} className="border rounded-lg overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.thumbnail || r.url} alt={r.title || 'result'} className="w-full h-40 object-cover" />
                        <div className="p-2 text-xs text-gray-700 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="truncate" title={r.source}>{r.source}</span>
                            <span className="text-gray-500">{r.confidence}%</span>
                          </div>
                          <Button
                            type="button"
                            className="w-full"
                            onClick={() => {
                              setForm(prev => ({ ...prev, contactImageUrl: r.url }))
                              setSearchOpen(false)
                              setMessage('Photo selected. Remember to Save!')
                            }}
                          >
                            Use this photo
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {message && <div className="text-sm text-gray-600">{message}</div>}
      <Button type="submit">Save</Button>
    </form>
  )
}

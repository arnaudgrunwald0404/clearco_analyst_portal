'use client'

import { useState, useRef, useEffect } from 'react'
import { Briefing } from '../../types'
import { cn } from '@/lib/utils'
import { ExternalLink, Upload, Trash2 } from 'lucide-react'

export default function ContentSection({ briefing, onUpdate }: { briefing: Briefing; onUpdate?: () => void }) {
  const [url, setUrl] = useState<string>((briefing as any).contentUrl || (briefing as any).contenturl || '')
  const [uploading, setUploading] = useState(false)

  // Keep local URL state in sync when the selected briefing changes
  useEffect(() => {
    setUrl(((briefing as any).contentUrl || (briefing as any).contenturl || '') as string)
  }, [ (briefing as any).id, (briefing as any).contentUrl, (briefing as any).contenturl ])
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'url' | 'file'>('url')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const triggerFilePicker = () => fileInputRef.current?.click()

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    const form = new FormData()
    form.append('file', file)
    setUploading(true)
    try {
      const resp = await fetch('/api/upload/briefing-asset', { method: 'POST', body: form })
      const json = await resp.json()
      if (resp.ok && json.success) {
        setUrl(json.url)
      } else {
        alert(json.error || 'Upload failed')
      }
    } catch (err) {
      console.error('Upload failed', err)
      alert('Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }
  const handleSave = async () => {
    setSaving(true)
    try {
      const resp = await fetch(`/api/briefings/${briefing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentUrl: url || null })
      })
      const json = await resp.json().catch(() => ({}))
      if (!resp.ok || json?.success === false) {
        const msg = json?.error || 'Failed to save content URL'
        alert(msg)
        return
      }
      // Notify parent to refresh so reopening shows the saved URL
      onUpdate && onUpdate()
    } catch (err) {
      console.error('Save failed', err)
      alert('Failed to save content URL')
    } finally {
      setSaving(false)
    }
  }
  const handleRemove = async () => {
    if (!confirm('Remove attached content from this briefing?')) return
    setSaving(true)
    try {
      const resp = await fetch(`/api/briefings/${briefing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenturl: null })
      })
      const json = await resp.json().catch(() => ({}))
      if (!resp.ok || json?.success === false) {
        const msg = json?.error || 'Failed to remove content'
        throw new Error(msg)
      }
      setUrl('')
      // Notify parent to refresh so state stays consistent
      onUpdate && onUpdate()
    } catch (e) {
      console.error('Remove content failed', e)
      alert(e instanceof Error ? e.message : 'Failed to remove content')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-3">Materials used during the meeting</h3>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Show tabs only when no content is loaded */}
        {!url && (
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => setTab('url')}
              className={cn(
                'flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border-b-2',
                tab === 'url' ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-gray-600 hover:text-gray-800'
              )}
            >
              <ExternalLink className="w-4 h-4" />
              URL
            </button>
            <button
              onClick={() => setTab('file')}
              className={cn(
                'flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border-b-2',
                tab === 'file' ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-gray-600 hover:text-gray-800'
              )}
            >
              <Upload className="w-4 h-4" />
              File
            </button>
          </div>
        )}
        <div className="p-4 space-y-3">
          {url ? (
            // When content exists, show a simple view (no tabs) with link and remove
            url.startsWith('/uploads/briefings/') ? (
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div>
                  Uploaded file: <a href={url} className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">{url.split('/').pop()}</a>
                </div>
                <button
                  onClick={handleRemove}
                  disabled={saving}
                  className={cn(
                    'inline-flex items-center justify-center p-2 rounded-lg border transition-colors',
                    saving ? 'bg-gray-200 text-gray-400' : 'border-red-300 text-red-600 hover:bg-red-50'
                  )}
                  aria-label="Remove content"
                  title="Remove content"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate flex-1">
                  {url}
                </a>
                <button
                  onClick={handleRemove}
                  disabled={saving}
                  className={cn(
                    'inline-flex items-center justify-center p-2 rounded-lg border transition-colors',
                    saving ? 'bg-gray-200 text-gray-400' : 'border-red-300 text-red-600 hover:bg-red-50'
                  )}
                  aria-label="Remove URL"
                  title="Remove URL"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          ) : (
            // No content: show tabbed UI
            <>
              {tab === 'url' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSave}
                      disabled={!url.trim() || saving}
                      className={cn(
                        'px-3 py-2 text-sm rounded-lg transition-colors',
                        url.trim() && !saving
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      )}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
              {tab === 'file' && (
                <div className="space-y-2">
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={triggerFilePicker}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Choose file
                    </button>
                    <span className="text-xs text-gray-500">PDF, DOCX, or TXT</span>
                  </div>
                  {uploading && <div className="text-sm text-gray-600">Uploading...</div>}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}


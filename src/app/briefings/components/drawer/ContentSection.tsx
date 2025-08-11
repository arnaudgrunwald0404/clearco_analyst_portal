'use client'

import { useState, useRef } from 'react'
import { Briefing } from '../../types'
import { cn } from '@/lib/utils'
import { ExternalLink, Upload } from 'lucide-react'

export default function ContentSection({ briefing }: { briefing: Briefing }) {
  const [url, setUrl] = useState<string>(briefing.contentUrl || '')
  const [uploading, setUploading] = useState(false)
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
        body: JSON.stringify({ contentUrl: url })
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        alert(err.error || 'Failed to save content URL')
      }
    } catch (err) {
      console.error('Save failed', err)
      alert('Failed to save content URL')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-3">Materials used during the meeting</h3>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
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
        <div className="p-4 space-y-3">
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
              {url && url.startsWith('/uploads/briefings/') && (
                <div className="text-sm text-gray-600">
                  Uploaded file: <a href={url} className="text-blue-600 hover:underline" target="_blank">{url.split('/').pop()}</a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


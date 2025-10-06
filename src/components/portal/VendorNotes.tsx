'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import RichNoteEditor from '@/components/ui/RichNoteEditor'
import RichNoteViewer from '@/components/ui/RichNoteViewer'
import { Plus, Trash2, Paperclip, Send, Star, StarOff, Pencil, Check, X, ChevronsLeft, ChevronsRight } from 'lucide-react'
import DOMPurify from 'dompurify'

interface Note {
  id: string
  title?: string | null
  content: string
  noteDate: string
  attachmentUrl?: string | null
  createdAt?: string
  updatedAt?: string
  starred?: boolean
}

export default function VendorNotes() {
  const [vendorName, setVendorName] = useState<string>('Vendor')
  const [vendorDomain, setVendorDomain] = useState<string | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [expanded, setExpanded] = useState<boolean>(false)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState<string>('')
  const [editingContent, setEditingContent] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const resp = await fetch('/api/settings/general', { cache: 'no-store' })
        if (resp.ok) {
          const data = await resp.json()
          const name = data?.company_name || data?.companyName || 'Vendor'
          setVendorName(name)
          const domain = data?.protected_domain || null
          setVendorDomain(domain)
          await fetchNotes(domain)
        } else {
          await fetchNotes(null)
        }
      } catch (e) {
        if (!cancelled) setError('Failed to load vendor info')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Restore persisted expand/collapse state
  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('vendorNotesExpanded') : null
      if (saved === '1') setExpanded(true)
    } catch {}
  }, [])

  // Persist state when it changes
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') localStorage.setItem('vendorNotesExpanded', expanded ? '1' : '0')
    } catch {}
  }, [expanded])

  // Close on Escape when expanded
  useEffect(() => {
    if (!expanded) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [expanded])

  const fetchNotes = async (domain: string | null) => {
    try {
      setError(null)
      const qs = new URLSearchParams()
      if (domain) qs.set('vendorDomain', domain)
      const notesResp = await fetch(`/api/analyst-notes${qs.toString() ? `?${qs.toString()}` : ''}`)
      if (notesResp.ok) {
        const json = await notesResp.json()
        setNotes(json.data || [])
      }
    } catch (e) {
      console.error('Failed to fetch notes', e)
      setError('Failed to fetch notes')
    }
  }

  const resetForm = () => {
    setTitle('')
    setContent('')
    setFile(null)
  }

  const isHtmlEmpty = (html: string) => {
    if (!html) return true
    const text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
    return text.length === 0
  }

  const onAddNote = async () => {
    if (isHtmlEmpty(content)) return
    try {
      setSaving(true)
      setError(null)

      let attachmentUrl: string | undefined
      if (file) {
        const form = new FormData()
        form.append('file', file)
        form.append('type', 'resource')
        const uploadResp = await fetch('/api/upload/resource', { method: 'POST', body: form })
        if (uploadResp.ok) {
          const up = await uploadResp.json()
          attachmentUrl = up?.url
        }
      }

      const payload: any = {
        title: title?.trim() || null,
        content: DOMPurify.sanitize(content || ''),
        attachmentUrl,
        noteDate: new Date().toISOString().split('T')[0],
        vendorDomain: vendorDomain || undefined
      }

      const resp = await fetch('/api/analyst-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!resp.ok) {
        const j = await resp.json().catch(() => null)
        throw new Error(j?.error || 'Failed to save note')
      }

      resetForm()
      await fetchNotes(vendorDomain)
    } catch (e: any) {
      console.error('Failed to add note', e)
      setError(e?.message || 'Failed to add note')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (id: string) => {
    try {
      const confirmed = confirm('Delete this note?')
      if (!confirmed) return
      const resp = await fetch(`/api/analyst-notes/${id}`, { method: 'DELETE' })
      if (!resp.ok) throw new Error('Failed to delete')
      await fetchNotes(vendorDomain)
    } catch (e) {
      console.error('Failed to delete note', e)
      setError('Failed to delete note')
    }
  }

  const onToggleStar = async (note: Note) => {
    try {
      const resp = await fetch(`/api/analyst-notes/${note.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: !note.starred })
      })
      if (!resp.ok) throw new Error('Failed to update')
      await fetchNotes(vendorDomain)
    } catch (e) {
      console.error('Failed to toggle star', e)
      setError('Failed to update note')
    }
  }

  const startEdit = (n: Note) => {
    setEditingId(n.id)
    setEditingTitle(n.title || '')
    setEditingContent(n.content)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingTitle('')
    setEditingContent('')
  }

  const saveEdit = async () => {
    if (!editingId) return
    try {
      setSaving(true)
      const payload: any = {
        title: editingTitle?.trim() || null,
        content: DOMPurify.sanitize(editingContent || '')
      }
      const resp = await fetch(`/api/analyst-notes/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!resp.ok) throw new Error('Failed to save changes')
      cancelEdit()
      await fetchNotes(vendorDomain)
    } catch (e: any) {
      console.error('Failed to edit note', e)
      setError(e?.message || 'Failed to edit note')
    } finally {
      setSaving(false)
    }
  }

  const formatDateTime = (iso?: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleString()
  }

  return (
    <>
      {/* Overlay to dim the rest of the UI when expanded */}
      {expanded && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setExpanded(false)}
          aria-hidden="true"
        />
      )}

      <div
        id="vendor-notes-panel"
        className={
          `bg-white rounded-lg border border-pink-200 shadow-sm flex flex-col h-full ` +
          (expanded
            ? 'fixed inset-y-0 right-0 w-[50vw] max-w-[50vw] z-50 shadow-xl'
            : '')
        }
        role="region"
        aria-label="Notepad"
      >
        {/* Header */}
        <div className="p-6 border-b border-pink-200 pr-10 pl-6 relative">
          {/* Toggle button sits over the left outline of the header */}
          <button
            type="button"
            className="absolute -left-3 top-1/2 -translate-y-1/2 bg-white border border-pink-200 rounded-full p-1 shadow hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 z-10"
            aria-label={expanded ? 'Collapse notepad' : 'Expand notepad'}
            aria-pressed={expanded}
            aria-controls="vendor-notes-panel"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? (
              <ChevronsRight className="w-4 h-4 text-gray-700" />
            ) : (
              <ChevronsLeft className="w-4 h-4 text-gray-700" />
            )}
          </button>
          <h2 className="text-md font-semibold text-gray-900">Notepad for {vendorName}</h2>
        </div>

        {/* Scrollable notes area */}
        <div className="flex-1 overflow-y-auto pr-10 pl-6 py-4">
          {loading ? (
            <div className="text-sm text-gray-500">Loading notes...</div>
          ) : notes.length === 0 ? (
            <div className="h-full min-h-[170px] max-h-[120px] flex items-center justify-center">
              <div className="text-center text-gray-500">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/cupcake_dripping.png"
                  alt="No notes yet"
                  className="mx-auto mb-4 w-16 h-16 object-contain"
                />
                <div className="text-sm">No notes yet. Add your first note below.</div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((n) => {
                const isEditing = editingId === n.id
                const timestamp = n.createdAt || n.noteDate
                return (
                  <div
                    key={n.id}
                    className={`rounded-lg p-4 border ${n.starred ? 'bg-gradient-to-r from-pink-50 to-purple-50 border-pink-300' : 'border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-gray-500">{formatDateTime(timestamp)}</div>
                        {isEditing ? (
                          <Input
                            placeholder="Title (optional)"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            className="mt-1"
                          />
                        ) : (
                          n.title && <div className="font-medium text-gray-900 mt-1">{n.title}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => onToggleStar(n)} aria-label="Star note">
                          {n.starred ? <Star className="w-4 h-4 text-pink-600" /> : <StarOff className="w-4 h-4" />}
                        </Button>
                        {isEditing ? (
                          <>
                            <Button variant="outline" size="icon" onClick={saveEdit} disabled={saving} aria-label="Save">
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={cancelEdit} aria-label="Cancel">
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <Button variant="outline" size="icon" onClick={() => startEdit(n)} aria-label="Edit note">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="outline" size="icon" onClick={() => onDelete(n.id)} aria-label="Delete note">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                  <div className="mt-2">
                    {isEditing ? (
                      <RichNoteEditor
                        value={editingContent}
                        onChange={setEditingContent}
                      />
                    ) : (
                      <RichNoteViewer value={n.content} />
                    )}
                  </div>
                    {n.attachmentUrl && (
                      <a
                        href={n.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mt-2"
                      >
                        <Paperclip className="w-4 h-4 mr-1" />
                        Attachment
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Composer at bottom (ChatGPT-style) */}
        <div className="bg-white pr-10 pl-4">
        <div className="pt-3 ">
          <div className="rte-notes-group overflow-hidden rounded-lg">
            <div className="rte-title ">
              <Input
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <RichNoteEditor
              placeholder="Write a note..."
              value={content}
              onChange={setContent}
            />
          </div>
        </div>
        <div className=" pb-4">
          {/* Toolbar under the box */}
          <div className="mt-2 flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 text-gray-700 cursor-pointer">
                <Plus className="w-4 h-4" />
                <span className="truncate max-w-[220px]">{file ? file.name : 'Add document'}</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
              <div className="flex items-center gap-3">
                {error && <div className="text-sm text-red-600">{error}</div>}
                <Button size="sm" className="bg-pink-600 text-white" onClick={onAddNote} disabled={saving || isHtmlEmpty(content)}>
                  <Send className="w-4 h-4 mr-1 bg-pink-600 text-white" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

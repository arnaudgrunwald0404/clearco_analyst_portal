"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Trash2 } from 'lucide-react'

// Helper type to avoid TSX generic parsing issues
type StringMap = Record<string, string>

interface EventSource {
  id: string
  url: string
  is_active: boolean
  selected_tabs?: string[] | string | null
  created_at: string
  updated_at: string

}

interface SourceMetadata {
  isGoogleSheet: boolean
  url: string
  displayUrl: string
  title: string | null
  owner: string | null
  spreadsheetId?: string
  error?: string
}

export default function EventsSection() {
  const [sources, setSources] = useState<EventSource[]>([])
  const [loading, setLoading] = useState(true)
  const [newUrl, setNewUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Helper function to safely get selected tabs as array
  const getSelectedTabsArray = (selectedTabs: string[] | string | null | undefined): string[] => {
    if (!selectedTabs) return []
    if (Array.isArray(selectedTabs)) return selectedTabs
    if (typeof selectedTabs === 'string') {
      try {
        const parsed = JSON.parse(selectedTabs)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }
    return []
  }

  const [previewOpenFor, setPreviewOpenFor] = useState<string | null>(null)
  const [previews, setPreviews] = useState<any[] | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [metadata, setMetadata] = useState<Record<string, SourceMetadata>>({})

  const loadSources = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/settings/event-sources')
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load')
      setSources(json.data || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSources()
  }, [])

  // Auto-check status and fetch metadata once sources are loaded
  useEffect(() => {
    if (!sources || sources.length === 0) return
    // Stagger checks slightly to avoid bursts
    sources.forEach((src, idx) => {
      if (!statuses[src.id]) {
        setTimeout(() => refreshStatus(src), idx * 150)
      }
      // Fetch metadata if not already loaded
      if (!metadata[src.id]) {
        setTimeout(() => fetchMetadata(src), idx * 200)
      }
    })
  }, [sources])

  const addSource = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUrl.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/settings/event-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: newUrl.trim(), 
          is_active: true 
        })
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to add')
      setSources(prev => [...prev, json.data])
      setNewUrl('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (id: string, is_active: boolean) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/settings/event-sources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active })
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update')
      setSources(prev => prev.map(s => s.id === id ? json.data : s))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const removeSource = async (id: string) => {
    if (!confirm('Remove this source URL?')) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/settings/event-sources/${id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || (json.success === false)) throw new Error(json?.error || 'Failed to delete')
      setSources(prev => prev.filter(s => s.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete')
    } finally {
      setSaving(false)
    }
  }

  const fetchMetadata = async (src: EventSource) => {
    try {
      const res = await fetch('/api/settings/event-sources/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: src.url })
      })
      const json = await res.json()
      if (json.success && json.data) {
        setMetadata(prev => ({ ...prev, [src.id]: json.data }))
      }
    } catch (e) {
      console.warn('Failed to fetch metadata for', src.url, e)
    }
  }

  const [availableTabs, setAvailableTabs] = useState<string[]>([])

  // Per-source status
  type SourceStatus = { ready: boolean; perTab?: { tab: string; ready: boolean; reason?: string }[] }
  const [statuses, setStatuses] = useState<Record<string, SourceStatus | undefined>>({})
  const [statusLoading, setStatusLoading] = useState<Record<string, boolean>>({})
  const [analysisResults, setAnalysisResults] = useState<Record<string, SourceStatus | undefined>>({})



  const refreshStatus = async (src: EventSource) => {
    setStatusLoading(prev => ({ ...prev, [src.id]: true }))
    try {
      console.log('🔍 Starting analysis for:', src.url)
      console.log('🍪 Available cookies:', document.cookie)
      
      const res = await fetch('/api/settings/event-sources/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: src.url }),
        credentials: 'include' // Ensure cookies are sent
      })
      
      console.log('📡 Response status:', res.status)
      console.log('📡 Response headers:', [...res.headers.entries()])
      
      const json = await res.json()
      console.log('📄 Response body:', json)
      
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to check status')
      
      const analysisData = { ready: !!json.ready, perTab: json.perTab || [] }
      setStatuses(prev => ({ ...prev, [src.id]: analysisData }))
      setAnalysisResults(prev => ({ ...prev, [src.id]: analysisData }))
    } catch (e) {
      console.error('❌ Analysis failed:', e)
      const errorData = { ready: false, perTab: [] }
      setStatuses(prev => ({ ...prev, [src.id]: errorData }))
      setAnalysisResults(prev => ({ ...prev, [src.id]: errorData }))
    } finally {
      setStatusLoading(prev => ({ ...prev, [src.id]: false }))
    }
  }

  const openPreview = async (url: string) => {
    setPreviewOpenFor(url)
    setPreviewLoading(true)
    setPreviews(null)
    setError(null)
    try {
      const res = await fetch('/api/settings/event-sources/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load preview')
      setPreviews(json.data || [])
      setAvailableTabs(Array.isArray(json.allSheetTitles) ? json.allSheetTitles : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load preview')
    } finally {
      setPreviewLoading(false)
    }
  }

  const canonicalFields = useMemo(() => ['Date','Days','Event','#Hashtag','Who should attend?','url','Organised by','City','Country','Contact','Participation'], [])



  const saveMapping = async (p: any) => {
    if (!previewOpenFor) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/settings/event-sources/mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: previewOpenFor,
          sheetTitle: p.sheetTitle,
          headerSignature: p.headerSignature,
          mapping: p.mapping
        })
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json.success === false) throw new Error(json.error || 'Failed to save mapping')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save mapping')
    } finally {
      setSaving(false)
    }
  }

  // Safer, balanced modal component
  function PreviewModal() {
    if (!previewOpenFor) return null
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Preview mapping</h3>
            <Button
              variant="outline"
              onClick={() => {
                setPreviewOpenFor(null)
                setPreviews(null)
              }}
            >
              Close
            </Button>
          </div>

          {previewLoading ? (
            <div className="text-gray-600">Loading preview...</div>
          ) : !previews || previews.length === 0 ? (
            <div className="text-gray-600">No readable sheets found.</div>
          ) : (
            <div>
              {/* Tab selection UI */}
              {availableTabs.length > 0 && (
                <div className="mb-4 border rounded-md p-3">
                  <div className="text-sm font-medium mb-2">📑 Select sheet tabs to sync</div>
                  <div className="text-xs text-gray-600 mb-3">Choose which spreadsheet tabs contain event data to import. Leave unchecked to skip tabs.</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availableTabs.map((tab) => {
                      const src = sources.find((s) => s.url === previewOpenFor)
                      const selected = new Set(getSelectedTabsArray(src?.selected_tabs).map((t) => t.toLowerCase()))
                      const isChecked = selected.has(tab.toLowerCase())
                      return (
                        <label key={tab} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const next = new Set(selected)
                              if (e.target.checked) next.add(tab.toLowerCase())
                              else next.delete(tab.toLowerCase())
                              const arr = Array.from(next)
                              setSources((prev) => prev.map((s) => s.url === previewOpenFor ? { ...s, selected_tabs: arr } : s))
                            }}
                          />
                          <span>{tab}</span>
                        </label>
                      )
                    })}
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={async () => {
                        const source = sources.find((s) => s.url === previewOpenFor)
                        const tabs = getSelectedTabsArray(source?.selected_tabs)
                        if (!source) return
                        
                        setSaving(true)
                        setError(null)
                        
                        try {
                          console.log('Saving tabs:', tabs, 'for source:', source.id)
                          const res = await fetch(`/api/settings/event-sources/${source.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ selected_tabs: tabs })
                          })
                          
                          const json = await res.json()
                          if (!res.ok || !json.success) {
                            throw new Error(json.error || 'Failed to save tabs')
                          }
                          
                          console.log('Tabs saved successfully:', json.data)
                          await loadSources()
                        } catch (e) {
                          console.error('Error saving tabs:', e)
                          setError(e instanceof Error ? e.message : 'Failed to save tabs')
                        } finally {
                          setSaving(false)
                        }
                      }}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Selected Tabs'}
                    </Button>
                  </div>
                </div>
              )}

              {(() => {
                const src = sources.find((s) => s.url === previewOpenFor)
                const selectedTabs = new Set(getSelectedTabsArray(src?.selected_tabs).map((t) => t.toLowerCase()))
                const filteredPreviews = previews.filter((p) => selectedTabs.has(p.sheetTitle.toLowerCase()))
                
                if (filteredPreviews.length === 0 && selectedTabs.size > 0) {
                  return (
                    <div className="text-gray-600 text-center py-4">
                      No sheet details to show. Make sure the selected tabs have readable data.
                    </div>
                  )
                }
                
                if (filteredPreviews.length === 0) {
                  return (
                    <div className="text-gray-600 text-center py-4">
                      Select tabs above to preview their data structure.
                    </div>
                  )
                }
                
                return filteredPreviews.map((p, idx) => (
                <div key={idx} className="mb-6 border rounded-md">
                  <div className="px-4 py-2 bg-gray-50 border-b flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Sheet: {p.sheetTitle}</div>
                      <div className="text-xs text-gray-500">Signature: {p.headerSignature}</div>
                    </div>
                    <Button onClick={() => saveMapping(p)} disabled={saving}>Save mapping</Button>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Headers</div>
                      <ul className="list-disc list-inside text-sm text-gray-800">
                        {p.headers.map((h: string, i: number) => (
                          <li key={i}>[{i}] {h}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-1">Sample rows</div>
                      <div className="overflow-auto">
                        <table className="min-w-full text-xs border">
                          <thead className="bg-pink-200 rounded-t-lg">
                            <tr>
                              {p.headers.map((h: string, i: number) => (
                                <th key={i} className="px-2 py-1 border text-left">[{i}] {h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {p.sampleRows.map((r: any[], ri: number) => (
                              <tr key={ri}>
                                {p.headers.map((_: string, ci: number) => (
                                  <td key={ci} className="px-2 py-1 border whitespace-pre-wrap">{String(r?.[ci] ?? '')}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-1">Mapping</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {canonicalFields.map((field) => {
                          const currentIdx = (p.mapping?.[field] ?? null) as number | null
                          return (
                            <div key={field} className="flex items-center justify-between gap-2">
                              <label className="text-sm text-gray-700 w-40">{field}</label>
                              <select
                                className="border rounded px-2 py-1 text-sm flex-1"
                                value={currentIdx ?? ''}
                                onChange={(e) => {
                                  const v = e.target.value === '' ? null : Number(e.target.value)
                                  p.mapping = { ...p.mapping, [field]: v }
                                  setPreviews((prev) => prev ? prev.map((x, i) => i === idx ? { ...p } : x) : prev)
                                }}
                              >
                                <option value="">—</option>
                                {p.headers.map((h: string, i: number) => (
                                  <option value={i} key={i}>[{i}] {h}</option>
                                ))}
                              </select>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                ))
              })()}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Events Sources</h2>
        <p className="text-gray-600">Configure one or more source URLs used to synchronize events.</p>
      </div>

      <form onSubmit={addSource} className="space-y-3">
        <div className="flex gap-3">
          <Input
            className="flex-1"
            placeholder="https://docs.google.com/spreadsheets/d/... or other source URL"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
          />
          <Button type="submit" disabled={saving || !newUrl.trim()}>Add Source</Button>
        </div>
      </form>

      {error && (
        <div role="alert" className="rounded-md border border-red-300 bg-red-50 text-red-800 p-3 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="text-gray-600">Loading...</div>
        ) : sources.length === 0 ? (
          <div className="text-gray-600">No sources configured yet.</div>
        ) : (
          sources.map(src => (
            <div key={src.id} className="bg-white border rounded-md p-3 space-y-3 shadow-sm">
              {/* File URL - Full width row */}
              <div className="w-full">
                <a 
                  href={metadata[src.id]?.displayUrl || src.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline text-sm font-medium block break-all"
                  title={src.url}
                >
                  📄 {src.url}
                </a>
              </div>
              
              {/* Metadata and status info - Full width row */}
              <div className="w-full">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {metadata[src.id]?.title && (
                    <span><span className="text-gray-400">Title:</span> <span className="font-medium text-gray-700">{metadata[src.id].title}</span></span>
                  )}
                  {metadata[src.id]?.owner && (
                    <span><span className="text-gray-400">Owner:</span> <span className="text-gray-700">{metadata[src.id].owner}</span></span>
                  )}
                  <span>{src.is_active ? 'Active' : 'Inactive'}</span>
                  <span>• Added {new Date(src.created_at).toLocaleString()}</span>
                </div>
              </div>
              
              {/* Actions row */}
              <div className="flex items-center justify-end">
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    disabled={!!statusLoading[src.id]}
                    onClick={() => refreshStatus(src)}
                    title="Check if recognized and ready to sync"
                  >
                    {statusLoading[src.id] ? '...' : 'Analyze'}
                  </Button>

                  <Button variant="outline" onClick={() => openPreview(src.url)} disabled={saving}>
                    Preview & Configure
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={src.is_active}
                      onCheckedChange={(checked) => toggleActive(src.id, checked)}
                      disabled={saving}
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </div>
                  
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => removeSource(src.id)} 
                    disabled={saving}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              {/* Show selected tabs as read-only tags if any */}
              {getSelectedTabsArray(src.selected_tabs).length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">Selected tabs:</span>
                  {getSelectedTabsArray(src.selected_tabs).map(tab => (
                    <span key={tab} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 border rounded">
                      {tab}
                    </span>
                  ))}
                </div>
              )}

              {/* Analysis Results */}
              {analysisResults[src.id] && (
                <div className="border-t pt-3 mt-3">
                  <div className="text-sm font-medium mb-2">📊 Analysis Results</div>
                  <div className="space-y-2">
                    {analysisResults[src.id]!.perTab && analysisResults[src.id]!.perTab!.length > 0 ? (
                      <>
                        <div className="text-xs text-gray-600 mb-2">
                          Found <strong>{analysisResults[src.id]!.perTab!.length}</strong> tab{analysisResults[src.id]!.perTab!.length !== 1 ? 's' : ''} to analyze:
                        </div>
                        {analysisResults[src.id]!.perTab!.map((tabResult, idx) => (
                          <div key={idx} className={`p-2 rounded text-xs border ${
                            tabResult.ready 
                              ? 'bg-green-50 border-green-200 text-green-800' 
                              : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="font-medium">📋 {tabResult.tab}</span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                tabResult.ready 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {tabResult.ready ? '✓ Ready' : '⚠ Needs attention'}
                              </span>
                            </div>
                            {tabResult.reason && (
                              <div className="mt-1 text-xs opacity-80">
                                <strong>Issue:</strong> {tabResult.reason}
                              </div>
                            )}
                            {tabResult.ready && (
                              <div className="mt-1 text-xs opacity-80">
                                Contains valid event data with required fields (Date, Event)
                              </div>
                            )}
                          </div>
                        ))}
                        <div className={`mt-2 p-2 rounded text-xs text-center font-medium ${
                          analysisResults[src.id]!.ready 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          Overall Status: {analysisResults[src.id]!.ready ? '✅ Ready for sync' : '❌ Requires fixes before sync'}
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-gray-500 italic">
                        No tabs were analyzed. Make sure you have selected tabs and they contain data.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Go to Events Page button */}
      <div className="flex justify-end mt-6">
        <Button 
          onClick={() => window.location.href = '/events'}
          className="bg-pink-600 hover:bg-pink-700 text-white"
        >
          Go to Events Page
        </Button>
      </div>

      {/* Preview modal */}
      <PreviewModal />
    </div>
  )
}


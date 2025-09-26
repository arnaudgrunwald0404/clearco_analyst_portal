'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Send, Mail, UserCircle2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

type Connection = {
  id: string
  title: string | null
  email: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  newsletterId: string
  onSent?: () => void
}

function parseEmails(input: string): string[] {
  const parts = input
    .split(/[\s,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const unique = Array.from(new Set(parts))
  return unique.filter((e) => emailRegex.test(e))
}

export default function SendNewsletterModal({ isOpen, onClose, newsletterId, onSent }: Props) {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [connections, setConnections] = useState<Connection[]>([])
  const [connectionId, setConnectionId] = useState<string>('')
  const [fromName, setFromName] = useState<string>('')
  const [recipientsInput, setRecipientsInput] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<null | { sentCount: number; failures: number }>(null)

  // Recipient filter state
  const [search, setSearch] = useState('')
  const [companiesText, setCompaniesText] = useState('')
  const [influences, setInfluences] = useState<string[]>([])
  const [statuses, setStatuses] = useState<string[]>([])
  const [types, setTypes] = useState<string[]>([])
  const [relationshipHealths, setRelationshipHealths] = useState<string[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewAnalysts, setPreviewAnalysts] = useState<any[]>([])

  useEffect(() => {
    if (!isOpen) return
    setResults(null)
    setError(null)
    setLoading(true)
    ;(async () => {
      try {
        const res = await fetch('/api/settings/calendar-connections', { cache: 'no-store' })
        const data = await res.json()
        if (res.ok && data.success) {
          const list: Connection[] = (data.data || []).map((c: any) => ({ id: c.id, title: c.title ?? null, email: c.email }))
          setConnections(list)
          if (list.length > 0) {
            setConnectionId((prev) => prev || list[0].id)
            setFromName(list[0].title || '')
          }
        } else {
          setError(data.error || 'Failed to load Google connections. Make sure you are signed in and have a connection configured in Settings.')
        }
      } catch (e) {
        setError('Failed to load Google connections')
      } finally {
        setLoading(false)
      }
    })()
  }, [isOpen])

  const parsedRecipients = useMemo(() => parseEmails(recipientsInput), [recipientsInput])

  const fetchPreview = async () => {
    setPreviewLoading(true)
    setError(null)
    try {
      const companies = companiesText
        .split(/[\s,;\n]+/)
        .map((s) => s.trim())
        .filter(Boolean)
      const res = await fetch('/api/analysts/filtered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companies, influences, statuses, types, relationshipHealths, search, limit: 1000 }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setPreviewAnalysts(Array.isArray(data.data) ? data.data : [])
      } else {
        setError(data.error || 'Failed to filter analysts')
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to filter analysts')
    } finally {
      setPreviewLoading(false)
    }
  }

  const usePreviewAsRecipients = () => {
    if (!previewAnalysts || previewAnalysts.length === 0) return
    const emails = previewAnalysts.map((a: any) => a.email).filter(Boolean)
    const unique = Array.from(new Set(emails))
    setRecipientsInput(unique.join(', '))
  }

  const handleSend = async () => {
    setError(null)
    setResults(null)
    if (!connectionId) {
      setError('Please select a Google connection')
      return
    }
    if (parsedRecipients.length === 0) {
      setError('Please enter at least one valid recipient email')
      return
    }

    setSending(true)
    try {
      const res = await fetch(`/api/newsletters/${newsletterId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId, recipientEmails: parsedRecipients, fromName: fromName || undefined }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        const sent = Number(data.sentCount || 0)
        const failures = Array.isArray(data.results) ? data.results.filter((r: any) => r.status !== 'sent').length : 0
        setResults({ sentCount: sent, failures })
        addToast({ type: 'success', message: `Newsletter sent to ${sent} recipient${sent === 1 ? '' : 's'}${failures ? ` (${failures} failed)` : ''}` })
        onSent?.()
      } else {
        setError(data.error || 'Failed to send newsletter')
        addToast({ type: 'error', message: data.error || 'Failed to send newsletter' })
      }
    } catch (e: any) {
      const msg = e?.message || 'Failed to send newsletter'
      setError(msg)
      addToast({ type: 'error', message: msg })
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    if (sending) return
    setConnectionId('')
    setFromName('')
    setRecipientsInput('')
    setError(null)
    setResults(null)
    onClose()
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-gray-500/50" />
        </Transition.Child>
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button type="button" className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" onClick={handleClose}>
                    <span className="sr-only">Close</span>
                    <X className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 w-full text-left sm:mt-0">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-6 flex items-center gap-2">
                      <Send className="w-5 h-5 text-blue-600" />
                      Send via Gmail
                    </Dialog.Title>

                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Google connection</label>
                        {loading ? (
                          <div className="text-sm text-gray-500">Loading connections…</div>
                        ) : connections.length === 0 ? (
                          <div className="text-sm text-gray-600">
                            No Google connections found. Go to Settings → Add connection to connect your Google account with Gmail send permission.
                          </div>
                        ) : (
                          <select
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={connectionId}
                            onChange={(e) => {
                              const value = e.target.value
                              setConnectionId(value)
                              const conn = connections.find((c) => c.id === value)
                              setFromName(conn?.title || '')
                            }}
                            disabled={sending}
                          >
                            {connections.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.title || 'Google Account'} ({c.email})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <UserCircle2 className="w-4 h-4 text-gray-500" />
                          From name (optional)
                        </label>
                        <input
                          type="text"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="e.g., Your Name or Your Company"
                          value={fromName}
                          onChange={(e) => setFromName(e.target.value)}
                          disabled={sending}
                        />
                      </div>

                      {/* Filter-based recipient selection */}
                      <div className="border rounded-md p-3">
                        <div className="font-medium text-gray-800 mb-2">Select recipients with filters</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
                            <input
                              type="text"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              placeholder="Name, company, email…"
                              value={search}
                              onChange={(e) => setSearch(e.target.value)}
                              disabled={sending}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Companies (comma-separated)</label>
                            <input
                              type="text"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              placeholder="e.g. Gartner, Forrester"
                              value={companiesText}
                              onChange={(e) => setCompaniesText(e.target.value)}
                              disabled={sending}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Influence</label>
                            <div className="flex flex-wrap gap-2">
                              {['LOW','MEDIUM','HIGH'].map((opt) => (
                                <label key={opt} className="inline-flex items-center gap-1 text-xs">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300"
                                    checked={influences.includes(opt)}
                                    onChange={(e) => setInfluences((prev) => e.target.checked ? [...prev, opt] : prev.filter((v) => v !== opt))}
                                    disabled={sending}
                                  />
                                  <span>{opt}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                            <div className="flex flex-wrap gap-2">
                              {['ACTIVE','INACTIVE'].map((opt) => (
                                <label key={opt} className="inline-flex items-center gap-1 text-xs">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300"
                                    checked={statuses.includes(opt)}
                                    onChange={(e) => setStatuses((prev) => e.target.checked ? [...prev, opt] : prev.filter((v) => v !== opt))}
                                    disabled={sending}
                                  />
                                  <span>{opt}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                            <div className="flex flex-wrap gap-2">
                              {['Analyst','Influencer','Journalist'].map((opt) => (
                                <label key={opt} className="inline-flex items-center gap-1 text-xs">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300"
                                    checked={types.includes(opt)}
                                    onChange={(e) => setTypes((prev) => e.target.checked ? [...prev, opt] : prev.filter((v) => v !== opt))}
                                    disabled={sending}
                                  />
                                  <span>{opt}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Relationship Health</label>
                            <div className="flex flex-wrap gap-2">
                              {['GOOD','NEUTRAL','POOR'].map((opt) => (
                                <label key={opt} className="inline-flex items-center gap-1 text-xs">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300"
                                    checked={relationshipHealths.includes(opt)}
                                    onChange={(e) => setRelationshipHealths((prev) => e.target.checked ? [...prev, opt] : prev.filter((v) => v !== opt))}
                                    disabled={sending}
                                  />
                                  <span>{opt}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                            onClick={fetchPreview}
                            disabled={previewLoading || sending}
                          >
                            {previewLoading ? 'Finding recipients…' : 'Preview recipients'}
                          </button>
                          <div className="text-sm text-gray-700">
                            {previewAnalysts.length > 0 ? (
                              <div className="inline-flex items-center gap-2">
                                <span className="font-medium">{previewAnalysts.length}</span>
                                <span>recipients</span>
                                <span className="relative group">
                                  <span className="underline cursor-default">(hover)</span>
                                  <div className="absolute z-10 hidden group-hover:block bg-white border border-gray-200 rounded-md shadow p-2 max-h-48 overflow-auto w-72 text-xs">
                                    {previewAnalysts.slice(0, 200).map((a: any) => (
                                      <div key={a.id || a.email} className="text-gray-800 truncate" title={`${a.firstName || ''} ${a.lastName || ''} <${a.email || ''}>`}>
                                        {a.firstName || ''} {a.lastName || ''} {'<'}{a.email}{'>'}
                                      </div>
                                    ))}
                                    {previewAnalysts.length > 200 && (
                                      <div className="text-gray-500 mt-1">…and {previewAnalysts.length - 200} more</div>
                                    )}
                                  </div>
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-500">No recipients yet</span>
                            )}
                          </div>
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm disabled:bg-blue-300"
                            onClick={usePreviewAsRecipients}
                            disabled={previewAnalysts.length === 0 || sending}
                          >
                            Use these recipients
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          Recipient emails
                        </label>
                        <textarea
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm min-h-[120px]"
                          placeholder="Paste or type emails separated by comma, space, or newline"
                          value={recipientsInput}
                          onChange={(e) => setRecipientsInput(e.target.value)}
                          disabled={sending}
                        />
                        <div className="mt-1 text-xs text-gray-500">Valid recipients detected: {parsedRecipients.length}</div>
                      </div>

                      {error && <div className="text-sm text-red-600">{error}</div>}
                      {results && (
                        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-2">
                          Sent: {results.sentCount} • Failed: {results.failures}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                        onClick={handleClose}
                        disabled={sending}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSend}
                        disabled={sending || loading || !connectionId || parsedRecipients.length === 0}
                        className={`inline-flex items-center px-4 py-2 rounded-md text-white ${sending || loading || !connectionId || parsedRecipients.length === 0 ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {sending ? 'Sending…' : 'Send'}
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}


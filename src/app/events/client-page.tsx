'use client'

import { CalendarDays, Plus, RefreshCw, Search, Filter, Loader, ArrowUpDown, Check, Handshake, Eye, DollarSign, Plane } from 'lucide-react'
import { SpinningCupcake } from '@/components/ui/spinning-cupcake'
import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import EventActionsMenu from '@/components/actions/event-actions-menu'
import AddEventModal from '@/components/modals/add-event-modal'
import SyncDetailsModal from '@/components/modals/sync-details-modal'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface EventItem {
  id: string
  eventName: string
  link?: string | null
  type?: string | null
  audienceGroups?: string | null
  startDate: string
  owner?: string | null
  location?: string | null
  status?: string | null
  notes?: string | null
  createdAt?: string
  updatedAt?: string
  participationStatus?: 'SPONSORING' | 'ATTENDING' | 'CONSIDERING' | null
}

export default function EventsClientPage() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [tagOpen, setTagOpen] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSyncDetailsModal, setShowSyncDetailsModal] = useState(false)
  const [syncDetails, setSyncDetails] = useState<any>(null)

  const handleSync = async () => {
    setIsSyncing(true)
    setSyncMessage('')
    try {
      const response = await fetch('/api/events/sync', { method: 'POST' })
      const data = await response.json()
      if (data.success) {
        setSyncMessage(data.message)
        setSyncDetails(data.details)
        setShowSyncDetailsModal(true)
        await fetchEvents()
      } else {
        setSyncMessage(data.error || 'Failed to sync events.')
      }
    } catch (error) {
      setSyncMessage('An error occurred while syncing events.')
    }
    setIsSyncing(false)
  }

  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/events')
      if (!res.ok) throw new Error('Failed to fetch events')
      const json = await res.json()
      setEvents(json.data || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const filteredEvents = useMemo(() => {
    return (events || []).filter((ev) => {
      const matchesSearch = (ev.eventName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ev.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ev.type || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'ALL' || (ev.status || '') === filterStatus
      return matchesSearch && matchesStatus
    })
  }, [events, searchTerm, filterStatus])

  const groupByParticipation = useMemo(() => {
    const sponsoring = [] as EventItem[]
    const attending = [] as EventItem[]
    const considering = [] as EventItem[]
    const stay = [] as EventItem[]
    for (const e of filteredEvents) {
      switch (e.participationStatus) {
        case 'SPONSORING':
          sponsoring.push(e)
          break
        case 'ATTENDING':
          attending.push(e)
          break
        case 'CONSIDERING':
          considering.push(e)
          break
        default:
          stay.push(e)
      }
    }
    return { sponsoring, attending, considering, stay }
  }, [filteredEvents])

  const sponsoringAttendingSorted = useMemo(() => {
    const rows = [
      ...groupByParticipation.sponsoring,
      ...groupByParticipation.attending,
    ]
    rows.sort((a, b) => {
      const da = a.startDate ? new Date(a.startDate).getTime() : 0
      const db = b.startDate ? new Date(b.startDate).getTime() : 0
      return db - da // descending: most recent first
    })
    return rows
  }, [groupByParticipation])

  const setParticipation = async (id: string, status: 'SPONSORING' | 'ATTENDING' | 'CONSIDERING' | null) => {
    try {
      console.log('Updating participation:', { id, status })
      const res = await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participationStatus: status }),
        credentials: 'include'
      })
      
      console.log('Response status:', res.status)
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API Error:', errorData)
        throw new Error(errorData.error || `HTTP ${res.status}: Failed to update participation`)
      }
      
      const result = await res.json()
      console.log('Update successful:', result)
      await fetchEvents()
    } catch (e) {
      console.error('Participation update error:', e)
      alert(`Failed to update participation: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
  }

  const toggleEventSelection = (id: string) => {
    const s = new Set(selectedEvents)
    if (s.has(id)) s.delete(id); else s.add(id)
    setSelectedEvents(s)
    setShowBulkActions(s.size > 0)
  }
  const toggleAllInSection = (rows: EventItem[]) => {
    if (selectedEvents.size === rows.length) {
      setSelectedEvents(new Set())
      setShowBulkActions(false)
    } else {
      setSelectedEvents(new Set(rows.map(r => r.id)))
      setShowBulkActions(true)
    }
  }
  const clearEventSelection = () => { setSelectedEvents(new Set()); setShowBulkActions(false); setBulkOpen(false); setTagOpen(false) }

  const bulkChangeTag = async (status: 'SPONSORING' | 'ATTENDING' | 'CONSIDERING' | null) => {
    if (selectedEvents.size === 0) return
    await fetch('/api/events/bulk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventIds: Array.from(selectedEvents), action: 'changeTag', participationStatus: status })
    })
    clearEventSelection()
    await fetchEvents()
  }
  const bulkDelete = async () => {
    if (selectedEvents.size === 0) return
    if (!confirm(`Delete ${selectedEvents.size} event(s)?`)) return
    await fetch('/api/events/bulk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventIds: Array.from(selectedEvents), action: 'delete' })
    })
    clearEventSelection()
    await fetchEvents()
  }

  const renderTable = (rows: EventItem[], title: string) => (
    <div className="bg-white shadow rounded-lg mb-8">
      <div className="px-6 py-3 border-b bg-gray-50 font-semibold text-gray-800">{title}</div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3"><input type="checkbox" checked={rows.length>0 && rows.every(r=>selectedEvents.has(r.id))} onChange={()=>toggleAllInSection(rows)} /></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Event</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Audience</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tag</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((ev) => (
              <tr key={ev.id} className="hover:bg-gray-50" data-testid="event-row">
                <td className="px-6 py-4" onClick={(e)=>e.stopPropagation()}>
                  <input type="checkbox" checked={selectedEvents.has(ev.id)} onChange={()=>toggleEventSelection(ev.id)} />
                </td>
                <td className="px-6 py-4 w-1/2 whitespace-normal break-words">
                  <div className="text-sm font-medium text-gray-900">
                    {ev.eventName || 'Untitled Event'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{ev.startDate ? new Date(ev.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ev.location || '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-xs">
                  {(() => {
                    try {
                      const a = ev.audienceGroups ? JSON.parse(ev.audienceGroups) : []
                      return Array.isArray(a) && a.length ? a.join(', ') : '—'
                    } catch {
                      return ev.audienceGroups || '—'
                    }
                  })()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Select 
                    value={ev.participationStatus || 'NOT_ATTENDING'} 
                    onValueChange={(value) => setParticipation(ev.id, value === 'NOT_ATTENDING' ? null : value as 'SPONSORING' | 'ATTENDING' | 'CONSIDERING')}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SPONSORING">
                        <span className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 px-2 py-1">
                            <DollarSign className="w-4 h-4" />
                          </span>
                          Sponsoring
                        </span>
                      </SelectItem>
                      <SelectItem value="ATTENDING">
                        <span className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 px-2 py-1">
                            <Plane className="w-4 h-4" />
                          </span>
                          Attending
                        </span>
                      </SelectItem>
                      <SelectItem value="CONSIDERING">
                        <span className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2 py-1">
                            <Eye className="w-4 h-4" />
                          </span>
                          Considering
                        </span>
                      </SelectItem>
                      <SelectItem value="NOT_ATTENDING">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-gray-700"></span>
                          Not Attending
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm" onClick={(e) => e.stopPropagation()}>
                  <div data-testid="event-actions-menu">
                    <EventActionsMenu
                      eventId={ev.id}
                      eventName={ev.eventName}
                      onDelete={() => fetchEvents()}
                      onEdit={() => { window.location.href = `/events/${ev.id}` }}
                      onView={() => { window.location.href = `/events/${ev.id}` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <div className="text-gray-500">No events in this section.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            {showBulkActions ? (
              <div className="flex items-center gap-3 relative">
                <button onClick={() => setBulkOpen(!bulkOpen)} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center">Actions</button>
                {bulkOpen && (
                  <div className="absolute z-50 mt-12 w-48 bg-white border rounded shadow bulk-actions-dropdown">
                    <div className="py-1">
                      <div className="relative">
                        <button onClick={() => setTagOpen(!tagOpen)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Change tag</button>
                        {tagOpen && (
                          <div className="absolute left-full top-0 ml-1 w-48 bg-white border rounded shadow">
                            <button onClick={() => bulkChangeTag('SPONSORING')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2">
                              <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 px-2 py-1">
                                <DollarSign className="w-4 h-4" />
                              </span>
                              Sponsoring
                            </button>
                            <button onClick={() => bulkChangeTag('ATTENDING')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2">
                              <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 px-2 py-1">
                                <Plane className="w-4 h-4" />
                              </span>
                              Attending
                            </button>
                            <button onClick={() => bulkChangeTag('CONSIDERING')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2">
                              <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2 py-1">
                                <Eye className="w-4 h-4" />
                              </span>
                              Considering
                            </button>
                            <button onClick={() => bulkChangeTag(null)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-gray-700"></span>
                              Not Attending
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="border-t my-1" />
                      <button onClick={bulkDelete} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
                    </div>
                  </div>
                )}
                <button onClick={clearEventSelection} className="text-sm text-gray-600">Clear selection ({selectedEvents.size})</button>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <CalendarDays className="w-8 h-8 mr-3 text-blue-600" />
                  Events
                </h1>
                <p className="mt-2 text-gray-600">Manage your upcoming and past events.</p>
              </>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={handleSync} disabled={isSyncing} className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Events'}
            </button>
            <button onClick={() => setShowAddModal(true)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </button>
          </div>
        </div>
      </div>
      {syncMessage && (<div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">{syncMessage}</div>)}

      {/* Search and Filter Bar */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Search events by name, type, or location..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="ALL">All Status</option>
              <option value="EVALUATING">Evaluating</option>
              <option value="PLANNED">Planned</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="ATTENDED">Attended</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading & Error */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <SpinningCupcake size="lg" />
            <span className="text-gray-600">Loading events...</span>
          </div>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">Error: {error}</div>
      )}

      {!loading && !error && (
        <>
          <Tabs defaultValue="active">
            <TabsList className="mb-4">
              <TabsTrigger value="active">
                Sponsoring ({groupByParticipation.sponsoring.length}) / Attending ({groupByParticipation.attending.length})
              </TabsTrigger>
              <TabsTrigger value="not_attending">
                Not Attending ({groupByParticipation.stay.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="active">
              {renderTable(sponsoringAttendingSorted, 'Sponsoring / Attending')}
            </TabsContent>
            <TabsContent value="not_attending">
              {renderTable(groupByParticipation.stay, 'Not Attending')}
            </TabsContent>
          </Tabs>

          {(groupByParticipation.sponsoring.length === 0 &&
            groupByParticipation.attending.length === 0 &&
            groupByParticipation.stay.length === 0) && (
            <div className="bg-white shadow rounded-lg p-12 text-center text-gray-500">
              No events found matching your criteria.
            </div>
          )}
        </>
      )}
      <AddEventModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onEventAdded={async () => {
          setShowAddModal(false)
          await fetchEvents()
        }}
      />
      
      <SyncDetailsModal
        isOpen={showSyncDetailsModal}
        onClose={() => setShowSyncDetailsModal(false)}
        details={syncDetails}
        message={syncMessage}
      />
    </div>
  )
}


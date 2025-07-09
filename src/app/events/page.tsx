'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Plus, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, X, Loader, ExternalLink, Upload } from 'lucide-react'
import { cn, getStatusColor, getAudienceGroupColor, formatDate } from '@/lib/utils'
import EventDrawer from '@/components/event-drawer'
import AddEventModal from '@/components/add-event-modal'
import EventActionsMenu from '@/components/event-actions-menu'
import BulkUploadModal from '@/components/bulk-upload-modal'
import { useToast } from '@/components/ui/toast'
import { useEventEnums } from '@/hooks/useEventEnums'
import { DebugPanel } from '@/components/debug-panel'

interface Event {
  id: string
  eventName: string
  link?: string
  type: 'CONFERENCE' | 'EXHIBITION' | 'WEBINAR'
  audienceGroups: string[]
  startDate: string
  participationTypes: string[]
  owner?: string
  location?: string
  status: 'EVALUATING' | 'COMMITTED' | 'CONTRACTED' | 'NOT_GOING'
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterType, setFilterType] = useState('ALL')
  const [sortField, setSortField] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { addToast } = useToast()
  const { enums, loading: enumsLoading } = useEventEnums()

  // Fetch events from database
  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/events')
      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }
      
      const result = await response.json()
      if (result.success) {
        setEvents(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch events')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      addToast({ type: 'error', message: 'Failed to load events' })
    } finally {
      setLoading(false)
    }
  }

  // Load events on component mount
  useEffect(() => {
    fetchEvents()
  }, [])

  const handleRowClick = (event: Event) => {
    setSelectedEvent(event)
    setIsDrawerOpen(true)
  }

  const handleEventDeleted = () => {
    // Refresh the list
    fetchEvents()
  }

  const handleEditEvent = (event: Event) => {
    // TODO: Open edit modal with event data
    console.log('Edit event:', event)
  }

  const handleViewEvent = (event: Event) => {
    setSelectedEvent(event)
    setIsDrawerOpen(true)
  }

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Enhanced filtering and sorting
  const filteredAndSortedEvents = useMemo(() => {
    const filtered = events.filter(event => {
      const matchesSearch = event.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.owner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.audienceGroups.some(ag => ag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        event.participationTypes.some(pt => pt.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesStatus = filterStatus === 'ALL' || event.status === filterStatus
      const matchesType = filterType === 'ALL' || event.type === filterType
      
      return matchesSearch && matchesStatus && matchesType
    })

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue: any
        let bValue: any

        switch (sortField) {
          case 'eventName':
            aValue = a.eventName.toLowerCase()
            bValue = b.eventName.toLowerCase()
            break
          case 'startDate':
            aValue = new Date(a.startDate).getTime()
            bValue = new Date(b.startDate).getTime()
            break
          case 'status':
            const statusOrder = { 'CONTRACTED': 4, 'COMMITTED': 3, 'EVALUATING': 2, 'NOT_GOING': 1 }
            aValue = statusOrder[a.status] || 0
            bValue = statusOrder[b.status] || 0
            break
          case 'type':
            aValue = a.type.toLowerCase()
            bValue = b.type.toLowerCase()
            break
          case 'location':
            aValue = (a.location || '').toLowerCase()
            bValue = (b.location || '').toLowerCase()
            break
          default:
            return 0
        }

        if (sortDirection === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
        }
      })
    }

    return filtered
  }, [events, searchTerm, filterStatus, filterType, sortField, sortDirection])

  // Get sort icon for column headers
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-600" />
      : <ArrowDown className="w-4 h-4 text-blue-600" />
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="mt-2 text-gray-600">
            Track and manage your event participation
          </p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setIsBulkUploadOpen(true)} className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search events by name, location, owner, audience, or participation..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            
            {/* Status Filter */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              disabled={enumsLoading}
            >
              <option value="ALL">All Status</option>
              {enums?.eventStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              disabled={enumsLoading}
            >
              <option value="ALL">All Types</option>
              {enums?.eventTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Active Filters Summary */}
        {(filterStatus !== 'ALL' || filterType !== 'ALL' || searchTerm) && (
          <div className="text-sm text-gray-600">
            Showing {filteredAndSortedEvents.length} of {events.length} events
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <Loader className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading events...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-red-600 mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error loading events</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={fetchEvents}
              className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Events Table */}
      {!loading && !error && (
        <div className="bg-white shadow rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('eventName')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Event Name</span>
                      {getSortIcon('eventName')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Link
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Type</span>
                      {getSortIcon('type')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Audience Groups
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('startDate')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Start Date</span>
                      {getSortIcon('startDate')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('location')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Location</span>
                      {getSortIcon('location')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleRowClick(event)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {event.eventName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {event.link ? (
                        <a 
                          href={event.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {event.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {event.audienceGroups.length > 0 ? (
                          event.audienceGroups.map((group, index) => (
                            <span 
                              key={index}
                              className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                getAudienceGroupColor(group)
                              )}
                            >
                              {group}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(event.startDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">
                        {event.participationTypes.length > 0 ? event.participationTypes.join(', ') : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {event.owner || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {event.location || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        getStatusColor(event.status)
                      )}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                      <EventActionsMenu
                        eventId={event.id}
                        eventName={event.eventName}
                        onDelete={handleEventDeleted}
                        onEdit={() => handleEditEvent(event)}
                        onView={() => handleViewEvent(event)}
                      />
                    </td>
                  </tr>
                ))}
                {filteredAndSortedEvents.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center py-12">
                      <div className="text-gray-500">No events found matching your criteria.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <EventDrawer 
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false)
          // Clear selected event after animation completes
          setTimeout(() => setSelectedEvent(null), 300)
        }}
        event={selectedEvent}
      />

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onEventAdded={() => {
          fetchEvents()
          setIsAddModalOpen(false)
        }}
      />

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onItemsAdded={() => {
          fetchEvents()
          setIsBulkUploadOpen(false)
        }}
        type="events"
        apiEndpoint="/api/events/bulk"
        fieldMappings={{
          eventName: ['event name', 'eventname', 'name', 'title', 'event_name', 'event'],
          link: ['link', 'url', 'website', 'event link', 'event_link'],
          type: ['type', 'event type', 'event_type', 'category'],
          audienceGroups: ['audience groups', 'audiencegroups', 'audience', 'target audience', 'audience_groups'],
          startDate: ['start date', 'startdate', 'date', 'event date', 'start_date', 'event_date'],
          participationTypes: ['participation types', 'participationtypes', 'participation', 'participation_types'],
          owner: ['owner', 'responsible', 'contact person', 'manager', 'lead'],
          location: ['location', 'venue', 'city', 'place', 'address'],
          status: ['status', 'state', 'stage', 'event status'],
          notes: ['notes', 'comments', 'additional info', 'description', 'remarks', 'additional_info']
        }}
        requiredFields={['eventName', 'startDate']}
        templateData={[
          {
            eventName: 'Example Conference 2024',
            link: 'https://example-conference.com',
            type: 'CONFERENCE',
            audienceGroups: 'Partners, Prospects',
            startDate: '2024-06-15',
            participationTypes: 'Attending Only, Speaking',
            owner: 'John Doe',
            location: 'San Francisco, CA',
            status: 'EVALUATING',
            notes: 'Annual industry conference'
          }
        ]}
      />
      
      {/* Debug Panel */}
      <DebugPanel 
        title="Events Debug" 
        data={{
          events: events.length,
          loading,
          error,
          enums,
          enumsLoading,
          filters: { searchTerm, filterStatus, filterType },
          filteredCount: filteredAndSortedEvents.length
        }}
      />
    </div>
  )
}

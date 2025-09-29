'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, Plus, Trash2, Settings, Clock, AlertTriangle, RefreshCw, User, Save } from 'lucide-react'
import CalendarSyncOptionsModal from '@/components/modals/calendar-sync-options-modal'

interface CalendarConnection {
  id: string
  title: string
  email: string
  is_active: boolean
  last_sync_at?: string
  created_at: string
}

interface SyncProgress {
  connectionId: string
  isRunning: boolean
  message: string
  relevantMeetingsCount: number
}

interface PersonalDetails {
  firstName: string
  lastName: string
  title: string
  company: string
  email: string
  linkedinUrl: string
  twitterHandle: string
}

export default function PortalSettingsPage() {
  const { user } = useAuth()
  const [calendarConnections, setCalendarConnections] = useState<CalendarConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [syncProgress, setSyncProgress] = useState<Map<string, SyncProgress>>(new Map())
  const [showSyncOptions, setShowSyncOptions] = useState(false)
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  
  // Personal Details state
  const [personalDetails, setPersonalDetails] = useState<PersonalDetails>({
    firstName: '',
    lastName: '',
    title: '',
    company: '',
    email: '',
    linkedinUrl: '',
    twitterHandle: ''
  })
  const [personalDetailsLoading, setPersonalDetailsLoading] = useState(true)
  const [savingPersonalDetails, setSavingPersonalDetails] = useState(false)

  useEffect(() => {
    fetchCalendarConnections()
    fetchPersonalDetails()
  }, [])

  const fetchCalendarConnections = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/calendar-connections')
      if (response.ok) {
        const result = await response.json()
        // API returns { success: boolean, data: CalendarConnection[] }
        const list = Array.isArray(result) ? result : result?.data
        setCalendarConnections(Array.isArray(list) ? list : [])
      } else if (response.status === 401) {
        // Unauthenticated – show empty list rather than crashing
        setCalendarConnections([])
      } else {
        console.error('Failed to fetch calendar connections', response.status, response.statusText)
        setCalendarConnections([])
      }
    } catch (error) {
      console.error('Error fetching calendar connections:', error)
      setCalendarConnections([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPersonalDetails = async () => {
    try {
      setPersonalDetailsLoading(true)
      if (!user?.email) return

      const response = await fetch(`/api/analysts/by-email/${encodeURIComponent(user.email)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          const analyst = data.data
          setPersonalDetails({
            firstName: analyst.firstName || '',
            lastName: analyst.lastName || '',
            title: analyst.title || '',
            company: analyst.company || '',
            email: analyst.email || '',
            linkedinUrl: analyst.linkedinUrl || '',
            twitterHandle: analyst.twitterHandle || ''
          })
        }
      }
    } catch (error) {
      console.error('Error fetching personal details:', error)
    } finally {
      setPersonalDetailsLoading(false)
    }
  }

  const savePersonalDetails = async () => {
    try {
      setSavingPersonalDetails(true)
      
      const response = await fetch('/api/analysts/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(personalDetails)
      })

      if (response.ok) {
        setNotification({
          type: 'success',
          message: 'Personal details updated successfully!'
        })
      } else {
        throw new Error('Failed to update personal details')
      }
    } catch (error) {
      console.error('Error saving personal details:', error)
      setNotification({
        type: 'error',
        message: 'Failed to update personal details. Please try again.'
      })
    } finally {
      setSavingPersonalDetails(false)
    }
  }

  const formatLastSync = (lastSyncAt: string | null) => {
    if (!lastSyncAt) return 'Never'
    const date = new Date(lastSyncAt)
    if (isNaN(date.getTime())) return 'Never'
    return date.toLocaleDateString()
  }

  const startCalendarSync = async (connectionId: string, timeWindowOptions?: any) => {
    if (!user) {
      console.error("User is not authenticated. Cannot start sync.")
      setNotification({
        type: 'error',
        message: 'You must be logged in to sync a calendar.'
      })
      return
    }

    try {
      // Initialize progress state
      setSyncProgress(prev => new Map(prev.set(connectionId, {
        connectionId,
        isRunning: true,
        message: 'Starting sync...',
        relevantMeetingsCount: 0
      })))

      // Start the sync by sending the user_id and time window options in the body
      const response = await fetch(`/api/settings/calendar-connections/${connectionId}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          user_id: user.id,
          timeWindowOptions: timeWindowOptions
        })
      })

      if (!response.ok) {
        throw new Error('Failed to start sync')
      }

      // Connect to SSE for real-time updates, passing user_id in the query
      const eventSource = new EventSource(`/api/settings/calendar-connections/${connectionId}/sync?user_id=${user.id}`)
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'progress') {
            setSyncProgress(prev => new Map(prev.set(connectionId, {
              connectionId,
              isRunning: true,
              message: data.message || 'Syncing...',
              relevantMeetingsCount: data.relevantMeetingsCount || 0
            })))
          } else if (data.type === 'complete') {
            setSyncProgress(prev => {
              const newMap = new Map(prev)
              newMap.delete(connectionId)
              return newMap
            })
            
            setNotification({
              type: 'success',
              message: `Calendar sync completed! Found ${data.relevantMeetingsCount || 0} relevant meetings.`
            })
            
            // Refresh connections to show updated last_sync_at
            fetchCalendarConnections()
            
            eventSource.close()
          } else if (data.type === 'error') {
            setSyncProgress(prev => {
              const newMap = new Map(prev)
              newMap.delete(connectionId)
              return newMap
            })
            
            setNotification({
              type: 'error',
              message: data.message || 'Calendar sync failed.'
            })
            
            eventSource.close()
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error)
        }
      }

      eventSource.onerror = () => {
        setSyncProgress(prev => {
          const newMap = new Map(prev)
          newMap.delete(connectionId)
          return newMap
        })
        
        setNotification({
          type: 'error',
          message: 'Connection lost during sync.'
        })
        
        eventSource.close()
      }

    } catch (error) {
      console.error('Error starting calendar sync:', error)
      setSyncProgress(prev => {
        const newMap = new Map(prev)
        newMap.delete(connectionId)
        return newMap
      })
      
      setNotification({
        type: 'error',
        message: 'Failed to start calendar sync.'
      })
    }
  }

  const handleSyncClick = (connectionId: string) => {
    setSelectedConnectionId(connectionId)
    setShowSyncOptions(true)
  }

  const toggleConnection = async (connectionId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/settings/calendar-connections/${connectionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !isActive })
      })

      if (response.ok) {
        setCalendarConnections(prev => 
          prev.map(conn => 
            conn.id === connectionId 
              ? { ...conn, is_active: !isActive }
              : conn
          )
        )
        setNotification({
          type: 'success',
          message: `Calendar connection ${!isActive ? 'activated' : 'deactivated'}.`
        })
      } else {
        throw new Error('Failed to update connection')
      }
    } catch (error) {
      console.error('Error toggling connection:', error)
      setNotification({
        type: 'error',
        message: 'Failed to update calendar connection.'
      })
    }
  }

  const deleteConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to delete this calendar connection?')) {
      return
    }

    try {
      const response = await fetch(`/api/settings/calendar-connections/${connectionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCalendarConnections(prev => prev.filter(conn => conn.id !== connectionId))
        setNotification({
          type: 'success',
          message: 'Calendar connection deleted.'
        })
      } else {
        throw new Error('Failed to delete connection')
      }
    } catch (error) {
      console.error('Error deleting connection:', error)
      setNotification({
        type: 'error',
        message: 'Failed to delete calendar connection.'
      })
    }
  }

  if (loading || personalDetailsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Settings</h1>
          <p className="text-gray-600">Manage your calendar connections and sync preferences</p>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-lg ${
            notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            notification.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            <div className="flex items-center">
              {notification.type === 'success' && <RefreshCw className="w-5 h-5 mr-2" />}
              {notification.type === 'error' && <AlertTriangle className="w-5 h-5 mr-2" />}
              {notification.type === 'info' && <Settings className="w-5 h-5 mr-2" />}
              {notification.message}
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Personal Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={personalDetails.firstName}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, firstName: e.target.value })}
                  placeholder="Enter your first name"
                />
              </div>
              
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={personalDetails.lastName}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, lastName: e.target.value })}
                  placeholder="Enter your last name"
                />
              </div>
              
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={personalDetails.title}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, title: e.target.value })}
                  placeholder="e.g., Senior Analyst"
                />
              </div>
              
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={personalDetails.company}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, company: e.target.value })}
                  placeholder="e.g., Gartner"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={personalDetails.email}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, email: e.target.value })}
                  placeholder="your.email@company.com"
                />
              </div>
              
              <div>
                <Label htmlFor="linkedinUrl">LinkedIn Profile URL</Label>
                <Input
                  id="linkedinUrl"
                  type="url"
                  value={personalDetails.linkedinUrl}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="twitterHandle">X (Twitter) Handle</Label>
                <Input
                  id="twitterHandle"
                  value={personalDetails.twitterHandle}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, twitterHandle: e.target.value })}
                  placeholder="@yourhandle"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button 
                onClick={savePersonalDetails}
                disabled={savingPersonalDetails}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {savingPersonalDetails ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Connections */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Calendar Connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            {calendarConnections.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No calendar connections</h3>
                <p className="text-gray-600 mb-4">
                  Connect your calendar to automatically sync briefings and meetings.
                </p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Calendar Connection
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {calendarConnections.map((connection) => {
                  const progress = syncProgress.get(connection.id)
                  return (
                    <div key={connection.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-900">{connection.title}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            connection.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {connection.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{connection.email}</p>
                        <p className="text-xs text-gray-500">
                          Last sync: {formatLastSync(connection.last_sync_at)}
                        </p>
                        
                        {/* Progress indicator */}
                        {progress && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                            <div className="flex items-center gap-2">
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              {progress.message}
                              {progress.relevantMeetingsCount > 0 && (
                                <span className="ml-2 font-medium">
                                  ({progress.relevantMeetingsCount} meetings found)
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSyncClick(connection.id)}
                          disabled={!connection.is_active || !!progress}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Sync
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleConnection(connection.id, connection.is_active)}
                        >
                          {connection.is_active ? 'Disable' : 'Enable'}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteConnection(connection.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calendar Sync Options Modal */}
        <CalendarSyncOptionsModal
          isOpen={showSyncOptions}
          onClose={() => {
            setShowSyncOptions(false)
            setSelectedConnectionId(null)
          }}
          onConfirm={(timeWindowOptions) => {
            if (selectedConnectionId) {
              startCalendarSync(selectedConnectionId, timeWindowOptions)
            }
            setShowSyncOptions(false)
            setSelectedConnectionId(null)
          }}
          isStarting={false}
        />
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Calendar, Plus, Trash2, CheckCircle, AlertCircle, Clock, X, RefreshCw, Settings, User, Building, Globe, Image, Tags, Edit, Save, ChevronUp, ChevronDown } from 'lucide-react'
import GeneralSettingsForm from '@/components/general-settings-form'
import TopicsManagement from '@/components/topics-management'

interface CalendarConnection {
  id: string
  title: string
  email: string
  isActive: boolean
  lastSyncAt: string | null
  createdAt: string
}

interface SyncProgress {
  connectionId: string
  isRunning: boolean
  message: string
  relevantMeetingsCount: number
  totalEventsProcessed?: number
  lastAnalystFound?: string
  error?: boolean
  completed?: boolean
}

function SettingsPageContent() {
  const searchParams = useSearchParams()
  const [activeSection, setActiveSection] = useState('general')
  const [calendarConnections, setCalendarConnections] = useState<CalendarConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [showNamingDialog, setShowNamingDialog] = useState(false)
  const [pendingConnection, setPendingConnection] = useState<{
    id: string
    email: string
    calendarName: string
  } | null>(null)
  const [newConnectionTitle, setNewConnectionTitle] = useState('')
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [syncProgress, setSyncProgress] = useState<Map<string, SyncProgress>>(new Map())
  const [eventSources, setEventSources] = useState<Map<string, EventSource>>(new Map())

  useEffect(() => {
    fetchCalendarConnections()
    
    // Handle URL parameters for success/error messages
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    
    if (success === 'calendar_connected') {
      // Get connection details from URL parameters for naming
      const connectionId = searchParams.get('connectionId')
      const email = searchParams.get('email')
      const calendarName = searchParams.get('calendarName')
      
      if (connectionId && email && calendarName) {
        // Show naming dialog
        setPendingConnection({
          id: connectionId,
          email,
          calendarName: decodeURIComponent(calendarName)
        })
        setNewConnectionTitle(decodeURIComponent(calendarName)) // Set default to calendar name
        setShowNamingDialog(true)
      } else {
        // Fallback to old behavior
        setNotification({
          type: 'success',
          message: 'Google Calendar connected successfully!'
        })
      }
      // Clear the URL parameters
      window.history.replaceState({}, '', '/settings')
    } else if (error) {
      let errorMessage = 'An error occurred while connecting to Google Calendar.'
      
      switch (error) {
        case 'google_auth_denied':
          errorMessage = 'Google Calendar access was denied. Please try again and authorize the application.'
          break
        case 'missing_auth_params':
          errorMessage = 'Missing authentication parameters. Please try connecting again.'
          break
        case 'invalid_state':
          errorMessage = 'Invalid authentication state. Please try connecting again.'
          break
        case 'no_access_token':
          errorMessage = 'No access token received from Google. Please try again.'
          break
        case 'no_user_email':
          errorMessage = 'Unable to retrieve user email from Google. Please try again.'
          break
        case 'oauth_callback_failed':
          errorMessage = 'Authentication callback failed. Please try again.'
          break
      }
      
      setNotification({
        type: 'error',
        message: errorMessage
      })
      // Clear the URL parameter
      window.history.replaceState({}, '', '/settings')
    }
  }, [])

  const fetchCalendarConnections = async () => {
    try {
      const response = await fetch('/api/settings/calendar-connections')
      if (response.ok) {
        const connections = await response.json()
        setCalendarConnections(connections)
      }
    } catch (error) {
      console.error('Failed to fetch calendar connections:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddConnection = async () => {
    setAdding(true)
    try {
      // Initiate Google OAuth without requiring a title first
      const response = await fetch('/api/settings/calendar-connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // No title required initially
      })

      if (response.ok) {
        const { authUrl } = await response.json()
        // Redirect to Google OAuth
        window.location.href = authUrl
      }
    } catch (error) {
      console.error('Failed to initiate calendar connection:', error)
      setAdding(false)
    }
  }

  const handleSaveConnectionName = async () => {
    if (!pendingConnection || !newConnectionTitle.trim()) return

    try {
      const response = await fetch(`/api/settings/calendar-connections/${pendingConnection.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newConnectionTitle }),
      })

      if (response.ok) {
        setShowNamingDialog(false)
        setPendingConnection(null)
        setNewConnectionTitle('')
        setNotification({
          type: 'success',
          message: 'Google Calendar connected and named successfully!'
        })
        fetchCalendarConnections() // Refresh the list
      }
    } catch (error) {
      console.error('Failed to save connection name:', error)
    }
  }

  const handleSkipNaming = async () => {
    if (!pendingConnection) return

    setShowNamingDialog(false)
    setPendingConnection(null)
    setNewConnectionTitle('')
    setNotification({
      type: 'success',
      message: 'Google Calendar connected successfully!'
    })
    fetchCalendarConnections() // Refresh the list
  }

  const handleToggleConnection = async (connectionId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/settings/calendar-connections/${connectionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      })

      if (response.ok) {
        setCalendarConnections(connections =>
          connections.map(conn =>
            conn.id === connectionId ? { ...conn, isActive } : conn
          )
        )
      }
    } catch (error) {
      console.error('Failed to toggle connection:', error)
    }
  }

  const handleDeleteConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to delete this calendar connection?')) return

    try {
      const response = await fetch(`/api/settings/calendar-connections/${connectionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setCalendarConnections(connections =>
          connections.filter(conn => conn.id !== connectionId)
        )
      }
    } catch (error) {
      console.error('Failed to delete connection:', error)
    }
  }

  const getConnectionStatus = (connection: CalendarConnection) => {
    const progress = syncProgress.get(connection.id)
    
    if (progress?.isRunning) {
      return { 
        icon: Clock, 
        text: `Syncing... (${progress.relevantMeetingsCount} meetings found)`, 
        color: 'text-blue-600',
        progress: progress
      }
    }
    
    if (!connection.isActive) {
      return { icon: AlertCircle, text: 'Inactive', color: 'text-gray-500' }
    }
    
    if (connection.lastSyncAt) {
      const lastSync = new Date(connection.lastSyncAt)
      const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60)
      if (hoursSinceSync < 24) {
        return { icon: CheckCircle, text: 'Connected', color: 'text-green-600' }
      }
    }
    
    return { icon: Clock, text: 'Ready to sync', color: 'text-yellow-600' }
  }

  const formatLastSync = (lastSyncAt: string | null) => {
    if (!lastSyncAt) return 'Never'
    const date = new Date(lastSyncAt)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`
    return date.toLocaleDateString()
  }

  const startCalendarSync = async (connectionId: string) => {
    try {
      // Initialize progress state
      setSyncProgress(prev => new Map(prev.set(connectionId, {
        connectionId,
        isRunning: true,
        message: 'Starting sync...',
        relevantMeetingsCount: 0
      })))

      // Start the sync
      const response = await fetch(`/api/settings/calendar-connections/${connectionId}/sync`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to start sync')
      }

      // Connect to SSE for real-time updates
      const eventSource = new EventSource(`/api/settings/calendar-connections/${connectionId}/sync`)
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          setSyncProgress(prev => {
            const newMap = new Map(prev)
            const currentProgress = newMap.get(connectionId) || {
              connectionId,
              isRunning: true,
              message: '',
              relevantMeetingsCount: 0
            }
            
            newMap.set(connectionId, {
              ...currentProgress,
              message: data.message,
              relevantMeetingsCount: data.relevantMeetingsCount || currentProgress.relevantMeetingsCount,
              totalEventsProcessed: data.totalEventsProcessed,
              lastAnalystFound: data.lastAnalystFound,
              error: data.error,
              completed: data.completed,
              isRunning: !data.completed && !data.error
            })
            
            return newMap
          })
          
          // If sync completed, refresh connections and clean up
          if (data.completed || data.error) {
            setTimeout(() => {
              eventSource.close()
              setEventSources(prev => {
                const newMap = new Map(prev)
                newMap.delete(connectionId)
                return newMap
              })
              
              if (data.completed) {
                fetchCalendarConnections() // Refresh to show updated lastSyncAt
                // Clear progress after showing completion message briefly
                setTimeout(() => {
                  setSyncProgress(prev => {
                    const newMap = new Map(prev)
                    newMap.delete(connectionId)
                    return newMap
                  })
                }, 3000)
              }
            }, 2000)
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error)
        }
      }
      
      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error)
        eventSource.close()
        setSyncProgress(prev => {
          const newMap = new Map(prev)
          newMap.set(connectionId, {
            connectionId,
            isRunning: false,
            message: 'Sync connection failed',
            relevantMeetingsCount: 0,
            error: true
          })
          return newMap
        })
      }
      
      setEventSources(prev => new Map(prev.set(connectionId, eventSource)))
      
    } catch (error) {
      console.error('Error starting calendar sync:', error)
      setSyncProgress(prev => {
        const newMap = new Map(prev)
        newMap.set(connectionId, {
          connectionId,
          isRunning: false,
          message: 'Failed to start sync',
          relevantMeetingsCount: 0,
          error: true
        })
        return newMap
      })
    }
  }

  // Define menu sections
  const menuSections = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'topics', label: 'Topics', icon: Tags },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
  ]

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">
            Manage your account settings and integrations
          </p>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div className={`mb-6 p-4 rounded-lg border flex items-center justify-between ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-current hover:opacity-70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex gap-8">
          {/* Secondary Menu */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-2">
              {menuSections.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {section.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeSection === 'general' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    General Settings
                  </CardTitle>
                  <CardDescription>
                    Configure your company information and platform settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <GeneralSettingsForm />
                </CardContent>
              </Card>
            )}

            {activeSection === 'topics' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tags className="w-5 h-5" />
                    Topic Management
                  </CardTitle>
                  <CardDescription>
                    Manage predefined topics for analyst expertise areas. Core topics represent Clear Company's key strengths.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TopicsManagement />
                </CardContent>
              </Card>
            )}

            {activeSection === 'calendar' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Calendar Integration
                  </CardTitle>
                  <CardDescription>
                    Connect Google Calendar accounts to track briefings with industry analysts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Instructions */}
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Connect team members' Google Calendars with read-only access</li>
                      <li>• We automatically identify meetings with known industry analysts</li>
                      <li>• Track conversation history and timing with precision</li>
                      <li>• All calendar data is processed securely and privately</li>
                    </ul>
                  </div>

                  {/* Connected Calendars Section */}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium mb-4">Connected Calendars</h3>
                    
                    {loading ? (
                      <div className="text-center py-8 text-gray-500">
                        Loading calendar connections...
                      </div>
                    ) : calendarConnections.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No calendar connections yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {calendarConnections.map((connection) => {
                          const status = getConnectionStatus(connection)
                          const StatusIcon = status.icon
                          
                          return (
                            <div
                              key={connection.id}
                              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-medium text-gray-900">{connection.title}</h4>
                                  <div className={`flex items-center gap-1 text-sm ${status.color}`}>
                                    <StatusIcon className="w-4 h-4" />
                                    {status.text}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600">{connection.email}</p>
                                <p className="text-xs text-gray-500">
                                  Last sync: {formatLastSync(connection.lastSyncAt)}
                                </p>
                                
                                {/* Real-time sync progress */}
                                {(() => {
                                  const progress = syncProgress.get(connection.id)
                                  if (progress?.isRunning) {
                                    return (
                                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                                        <div className="flex items-center gap-2 text-blue-700">
                                          <Clock className="w-3 h-3 animate-spin" />
                                          <span className="font-medium">{progress.message}</span>
                                        </div>
                                        {progress.relevantMeetingsCount > 0 && (
                                          <div className="mt-1 text-blue-600">
                                            <span className="font-semibold">{progress.relevantMeetingsCount}</span> analyst meetings identified
                                            {progress.totalEventsProcessed && (
                                              <span className="text-blue-500"> • {progress.totalEventsProcessed} events processed</span>
                                            )}
                                          </div>
                                        )}
                                        {progress.lastAnalystFound && (
                                          <div className="text-blue-600 mt-1">
                                            Latest: {progress.lastAnalystFound}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  }
                                  
                                  if (progress?.completed) {
                                    return (
                                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                                        <div className="flex items-center gap-2 text-green-700">
                                          <CheckCircle className="w-3 h-3" />
                                          <span>{progress.message}</span>
                                        </div>
                                      </div>
                                    )
                                  }
                                  
                                  if (progress?.error) {
                                    return (
                                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                                        <div className="flex items-center gap-2 text-red-700">
                                          <AlertCircle className="w-3 h-3" />
                                          <span>{progress.message}</span>
                                        </div>
                                      </div>
                                    )
                                  }
                                  
                                  return null
                                })()} 
                              </div>
      
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <Label htmlFor={`active-${connection.id}`} className="text-sm">
                                    Active
                                  </Label>
                                  <Switch
                                    id={`active-${connection.id}`}
                                    checked={connection.isActive}
                                    onCheckedChange={(checked) =>
                                      handleToggleConnection(connection.id, checked)
                                    }
                                  />
                                </div>
                                
                                {connection.isActive && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => startCalendarSync(connection.id)}
                                    disabled={syncProgress.get(connection.id)?.isRunning}
                                    className="bg-blue-50 text-blue-600 hover:bg-blue-100"
                                  >
                                    {syncProgress.get(connection.id)?.isRunning ? (
                                      <Clock className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <RefreshCw className="w-4 h-4" />
                                    )}
                                    <span className="ml-1">
                                      {syncProgress.get(connection.id)?.isRunning ? 'Syncing...' : 'Sync Now'}
                                    </span>
                                  </Button>
                                )}
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteConnection(connection.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Add Calendar Connection Section */}
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <h3 className="text-lg font-medium mb-3">Add Calendar Connection</h3>
                    <div className="text-center">
                      <Button
                        onClick={handleAddConnection}
                        disabled={adding}
                        className="flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        {adding ? 'Connecting...' : 'Connect Google Calendar'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Naming Dialog */}
          {showNamingDialog && pendingConnection && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-medium mb-4">Name Your Calendar Connection</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Connected: <strong>{pendingConnection.email}</strong>
                </p>
                
                <div className="mb-4">
                  <Label htmlFor="connection-name" className="text-sm font-medium text-gray-700">
                    Display Name (optional)
                  </Label>
                  <Input
                    id="connection-name"
                    placeholder="e.g., Chief Product Officer, Marketing Director"
                    value={newConnectionTitle}
                    onChange={(e) => setNewConnectionTitle(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Default: {pendingConnection.calendarName}
                  </p>
                </div>
                
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={handleSkipNaming}
                  >
                    Use Default Name
                  </Button>
                  <Button
                    onClick={handleSaveConnectionName}
                    disabled={!newConnectionTitle.trim()}
                  >
                    Save Custom Name
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Loading component for Suspense fallback
function LoadingSettings() {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Export component with Suspense
export default function SettingsPage() {
  return (
    <Suspense fallback={<LoadingSettings />}>
      <SettingsPageContent />
    </Suspense>
  )
}

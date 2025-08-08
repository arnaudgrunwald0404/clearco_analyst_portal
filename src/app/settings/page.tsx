'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Settings, TrendingUp, Tags, Calendar, Users, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import SidebarNav from './SidebarNav'
import GeneralSection from './GeneralSection'
import TopicsSection from './TopicsSection'
import AnalystPortalSection from './AnalystPortalSection'
import CalendarSection from './CalendarSection'
import InfluenceTiersSection from './InfluenceTiersSection'
import { FloatingHelpText } from '@/components/ui/floating-help-text'
import { useHelpText } from '@/hooks/useHelpText'

interface CalendarConnection {
  id: string
  title: string
  email: string
  is_active: boolean
  last_sync_at: string | null
  created_at: string
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

import { useAuth } from '@/contexts/AuthContext'

function SettingsPageContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [activeSection, setActiveSection] = useState('general')
  const [calendarConnections, setCalendarConnections] = useState<CalendarConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [syncProgress, setSyncProgress] = useState<Map<string, SyncProgress>>(new Map())
  const [eventSources, setEventSources] = useState<Map<string, EventSource>>(new Map())
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showNamingDialog, setShowNamingDialog] = useState(false)
  const [pendingConnection, setPendingConnection] = useState<{ id: string; email: string; calendarName: string } | null>(null)
  const [newConnectionTitle, setNewConnectionTitle] = useState('')
  const { currentHelp, targetElement, showHelp, hideHelp } = useHelpText()

  useEffect(() => {
    fetchCalendarConnections()
    
    // Handle URL parameters for success/error messages and section/tab navigation
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    const section = searchParams.get('section')
    const tab = searchParams.get('tab')
    
    // Set active section and tab based on URL parameters
    if (section) {
      setActiveSection(section)
    }
    
    // For analyst portal section, set the tab if specified
    if (section === 'analyst-portal' && tab) {
      // This will be handled by the AnalystPortalSection component
      // We'll pass the tab parameter to it
    }
    
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
    console.log('\n' + '='.repeat(60))
    console.log('🔄 [Client] fetchCalendarConnections started')
    console.log('🕐 [Client] Timestamp:', new Date().toISOString())
    console.log('👤 [Client] Current user:', user ? { id: user.id, email: user.email } : 'No user')
    
    try {
      console.log('📡 [Client] Making API request to /api/settings/calendar-connections')
      const response = await fetch('/api/settings/calendar-connections')
      
      console.log('📊 [Client] Response received:')
      console.log('  - Status:', response.status)
      console.log('  - StatusText:', response.statusText)
      console.log('  - Headers:', Object.fromEntries(response.headers.entries()))
      console.log('  - OK:', response.ok)
      console.log('  - Content-Type:', response.headers.get('content-type'))
      
      if (response.ok) {
        console.log('✅ [Client] Response is OK, parsing JSON...')
        const result = await response.json()
        console.log('📊 [Client] Parsed result:')
        console.log('  - Success:', result.success)
        console.log('  - Data type:', typeof result.data)
        console.log('  - Data length:', Array.isArray(result.data) ? result.data.length : 'Not array')
        console.log('  - Full result:', JSON.stringify(result, null, 2))
        
        if (result.success && result.data) {
          console.log('✅ [Client] Setting calendar connections:', result.data)
          setCalendarConnections(result.data)
        } else {
          console.log('⚠️ [Client] Result not successful or no data, setting empty array')
          setCalendarConnections([])
        }
      } else {
        const errorText = await response.text()
        console.error('❌ [Client] Response not OK:')
        console.error('  - Error body:', errorText)
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
      }
    } catch (error) {
      console.error('💥 [Client] Failed to fetch calendar connections:')
      console.error('  - Error type:', error instanceof Error ? error.constructor.name : typeof error)
      console.error('  - Error message:', error instanceof Error ? error.message : String(error))
      console.error('  - Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      console.error('  - Full error:', error)
      
      setNotification({
        type: 'error',
        message: `Failed to load calendar connections: ${error instanceof Error ? error.message : String(error)}`
      })
    } finally {
      console.log('🏁 [Client] fetchCalendarConnections completed, setting loading to false')
      setLoading(false)
    }
  }

  const handleAddConnection = async () => {
    console.log('\n' + '='.repeat(60))
    console.log('🔗 [Client] handleAddConnection started')
    console.log('🕐 [Client] Timestamp:', new Date().toISOString())
    console.log('👤 [Client] Current user:', user ? { id: user.id, email: user.email } : 'No user')
    
    setAdding(true)
    try {
      console.log('📡 [Client] Making POST request to initiate OAuth...')
      // Initiate Google OAuth without requiring a title first
      const response = await fetch('/api/settings/calendar-connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // No title required initially
      })

      console.log('📊 [Client] Response received:')
      console.log('  - Status:', response.status)
      console.log('  - StatusText:', response.statusText)
      console.log('  - OK:', response.ok)
      console.log('  - Content-Type:', response.headers.get('content-type'))
      console.log('  - Headers:', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const contentType = response.headers.get('content-type')
        console.log('✅ [Client] Response OK, checking content type...')
        if (contentType && contentType.includes('application/json')) {
          console.log('✅ [Client] Content type is JSON, parsing...')
          const result = await response.json()
          console.log('📊 [Client] Parsed response:')
          console.log('  - Success:', result.success)
          console.log('  - Data keys:', result.data ? Object.keys(result.data) : 'No data')
          console.log('  - Auth URL present:', !!result.data?.authUrl)
          console.log('  - Full result:', JSON.stringify(result, null, 2))
          
          if (result.success && result.data?.authUrl) {
            console.log('✅ [Client] Auth URL received, redirecting to Google OAuth...')
            console.log('🔗 [Client] Auth URL:', result.data.authUrl.substring(0, 100) + '...')
            // Redirect to Google OAuth
            window.location.href = result.data.authUrl
          } else {
            console.error('❌ [Client] Invalid response format - missing success or authUrl')
            throw new Error('Invalid response format from server')
          }
        } else {
          console.error('❌ [Client] Expected JSON but received:', contentType)
          throw new Error('Invalid response format from server')
        }
      } else {
        console.error('❌ [Client] Response not OK:')
        console.error('  - Status:', response.status)
        console.error('  - StatusText:', response.statusText)
        const errorText = await response.text()
        console.error('  - Response body:', errorText)
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
      }
    } catch (error) {
      console.error('💥 [Client] Failed to initiate calendar connection:')
      console.error('  - Error type:', error instanceof Error ? error.constructor.name : typeof error)
      console.error('  - Error message:', error instanceof Error ? error.message : String(error))
      console.error('  - Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      console.error('  - Full error:', error)
      
      setNotification({
        type: 'error',
        message: `Failed to start calendar connection process: ${error instanceof Error ? error.message : String(error)}`
      })
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
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          await response.json() // Consume the response
        }
        setShowNamingDialog(false)
        setPendingConnection(null)
        setNewConnectionTitle('')
        setNotification({
          type: 'success',
          message: 'Google Calendar connected and named successfully!'
        })
        fetchCalendarConnections() // Refresh the list
      } else {
        console.error('Failed to save connection name:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Response body:', errorText)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to save connection name:', error)
      setNotification({
        type: 'error',
        message: 'Failed to save connection name'
      })
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

  const handleToggleConnection = async (connectionId: string, is_active: boolean) => {
    try {
      const response = await fetch(`/api/settings/calendar-connections/${connectionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active }),
      })

      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          await response.json() // Consume the response
        }
        setCalendarConnections(connections =>
          connections.map(conn =>
            conn.id === connectionId ? { ...conn, is_active } : conn
          )
        )
      } else {
        console.error('Failed to toggle connection:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Response body:', errorText)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to toggle connection:', error)
      setNotification({
        type: 'error',
        message: 'Failed to update connection status'
      })
    }
  }

  const handleDeleteConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to delete this calendar connection?')) return

    try {
      const response = await fetch(`/api/settings/calendar-connections/${connectionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          await response.json() // Consume the response
        }
        setCalendarConnections(connections =>
          connections.filter(conn => conn.id !== connectionId)
        )
        setNotification({
          type: 'success',
          message: 'Calendar connection deleted successfully'
        })
      } else {
        console.error('Failed to delete connection:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Response body:', errorText)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to delete connection:', error)
      setNotification({
        type: 'error',
        message: 'Failed to delete connection'
      })
    }
  }

  const getConnectionStatus = (connection: CalendarConnection) => {
    const progress = syncProgress.get(connection.id)
    
    if (progress?.isRunning) {
      return { 
        icon: RefreshCw, 
        text: `Syncing... (${progress.relevantMeetingsCount} meetings found)`, 
        color: 'text-blue-600',
        progress: progress
      }
    }
    
    if (!connection.is_active) {
      return { icon: RefreshCw, text: 'Inactive', color: 'text-gray-500' }
    }
    
    if (connection.last_sync_at) {
      const lastSync = new Date(connection.last_sync_at)
      const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60)
      if (hoursSinceSync < 24) {
        return { icon: RefreshCw, text: 'Connected', color: 'text-green-600' }
      }
    }
    
    return { icon: RefreshCw, text: 'Ready to sync', color: 'text-yellow-600' }
  }

  const formatLastSync = (last_sync_at: string | null) => {
    if (!last_sync_at) return 'Never'
    const date = new Date(last_sync_at)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`
    return date.toLocaleDateString()
  }

  const startCalendarSync = async (connectionId: string) => {
    if (!user) {
      console.error("User is not authenticated. Cannot start sync.");
      setNotification({
        type: 'error',
        message: 'You must be logged in to sync a calendar.'
      });
      return;
    }

    try {
      // Initialize progress state
      setSyncProgress(prev => new Map(prev.set(connectionId, {
        connectionId,
        isRunning: true,
        message: 'Starting sync...',
        relevantMeetingsCount: 0
      })))

      // Start the sync by sending the user_id in the body
      const response = await fetch(`/api/settings/calendar-connections/${connectionId}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: user.id })
      })

      if (!response.ok) {
        throw new Error('Failed to start sync')
      }

      // Connect to SSE for real-time updates, passing user_id in the query
      const eventSource = new EventSource(`/api/settings/calendar-connections/${connectionId}/sync?user_id=${user.id}`)
      
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
                fetchCalendarConnections() // Refresh to show updated last_sync_at
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
    { id: 'influence-tiers', label: 'Analyst Tiers', icon: TrendingUp },
    { id: 'topics', label: 'Topics', icon: Tags },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'analyst-portal', label: 'Analyst Portal', icon: Users },
  ]

  return (
    <div className="p-8">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-3 text-gray-600">
          Manage your account settings and integrations
        </p>
      </div>

      <div className="flex gap-12">
        <SidebarNav activeSection={activeSection} setActiveSection={setActiveSection} menuSections={menuSections} />
        <div className="w-6/12 space-y-8">
          {activeSection === 'general' && <GeneralSection showHelp={showHelp} hideHelp={hideHelp} />}
          {activeSection === 'topics' && <TopicsSection />}
          {activeSection === 'analyst-portal' && (
            <AnalystPortalSection 
              initialTab={searchParams.get('tab') as 'settings' | 'access' || 'settings'} 
            />
          )}
          {activeSection === 'calendar' && (
            <CalendarSection
              calendarConnections={calendarConnections}
              loading={loading}
              adding={adding}
              syncProgress={syncProgress}
              onAddConnection={handleAddConnection}
              onToggleConnection={handleToggleConnection}
              onDeleteConnection={handleDeleteConnection}
              onStartSync={startCalendarSync}
            />
          )}
          {activeSection === 'influence-tiers' && <InfluenceTiersSection />}
        </div>
      </div>

      {/* Floating Help Text */}
      <FloatingHelpText helpText={currentHelp} targetElement={targetElement} />

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

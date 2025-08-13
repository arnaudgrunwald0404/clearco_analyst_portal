import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Calendar, Plus, RefreshCw, Trash2, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import CalendarSyncOptionsModal from '@/components/modals/calendar-sync-options-modal'
import { useState } from 'react'

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

interface CalendarSectionProps {
  calendarConnections: CalendarConnection[]
  loading: boolean
  adding: boolean
  syncProgress: Map<string, SyncProgress>
  onAddConnection: () => void
  onToggleConnection: (connectionId: string, is_active: boolean) => void
  onDeleteConnection: (connectionId: string) => void
  onStartSync: (connectionId: string, timeWindowOptions?: any) => void
}

export default function CalendarSection({
  calendarConnections,
  loading,
  adding,
  syncProgress,
  onAddConnection,
  onToggleConnection,
  onDeleteConnection,
  onStartSync
}: CalendarSectionProps) {
  const [showSyncOptions, setShowSyncOptions] = useState(false)
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null)

  const getConnectionStatus = (connection: CalendarConnection) => {
    if (!connection.is_active) {
      return { icon: AlertCircle, text: 'Inactive', color: 'text-gray-500' }
    }
    
    if (!connection.last_sync_at) {
      return { icon: Clock, text: 'Never synced', color: 'text-yellow-600' }
    }
    
    const lastSync = new Date(connection.last_sync_at)
    const now = new Date()
    const daysSinceSync = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSinceSync <= 1) {
      return { icon: CheckCircle, text: 'Recently synced', color: 'text-green-600' }
    } else if (daysSinceSync <= 7) {
      return { icon: Clock, text: 'Synced recently', color: 'text-blue-600' }
    } else {
      return { icon: AlertCircle, text: 'Sync needed', color: 'text-yellow-600' }
    }
  }

  const formatLastSync = (last_sync_at: string | null) => {
    if (!last_sync_at) return 'Never'
    const date = new Date(last_sync_at)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="pb-6 px-8 pt-8">
        <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
          <Calendar className="w-7 h-7 text-blue-600" />
          Calendar Integration
        </CardTitle>
        <CardDescription className="text-base mt-3 text-gray-600 leading-relaxed">
          Connect Google Calendar accounts to track briefings with industry analysts
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2 px-8 pb-8">
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

        {/* Add Connection Button */}
        <div className="mb-6">
          <Button
            onClick={onAddConnection}
            disabled={adding}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {adding ? 'Connecting...' : 'Connect Google Calendar'}
          </Button>
        </div>

        {/* Calendar Connections List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Loading calendar connections...</span>
          </div>
        ) : calendarConnections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No calendar connections</p>
            <p className="text-sm">Connect your first Google Calendar to start tracking analyst meetings</p>
          </div>
        ) : (
          <div className="space-y-4">
            {calendarConnections.map((connection) => {
              const status = getConnectionStatus(connection)
              const progress = syncProgress.get(connection.id)
              
              return (
                <div
                  key={connection.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {connection.title || 'Untitled Connection'}
                        </h4>
                        <div className="flex items-center gap-1">
                          <status.icon className={`w-4 h-4 ${status.color}`} />
                          <span className={`text-sm ${status.color}`}>{status.text}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{connection.email}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Last sync: {formatLastSync(connection.last_sync_at)}</span>
                        <span>Connected: {new Date(connection.created_at).toLocaleDateString()}</span>
                      </div>

                      {/* Sync Progress */}
                      {progress && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                          <div className="flex items-center gap-2 mb-2">
                            <RefreshCw className={`w-4 h-4 ${progress.isRunning ? 'animate-spin' : ''} text-blue-600`} />
                            <span className="text-sm font-medium text-blue-900">
                              {progress.isRunning ? 'Syncing...' : progress.error ? 'Sync failed' : 'Sync completed'}
                            </span>
                          </div>
                          <p className="text-sm text-blue-800 mb-1">{progress.message}</p>
                          {progress.relevantMeetingsCount > 0 && (
                            <p className="text-sm text-blue-700">
                              Found {progress.relevantMeetingsCount} relevant meetings
                              {progress.lastAnalystFound && ` (latest: ${progress.lastAnalystFound})`}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {/* Active Toggle */}
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={connection.is_active}
                          onCheckedChange={(checked) => onToggleConnection(connection.id, checked)}
                        />
                        <span className="text-xs text-gray-500">Active</span>
                      </div>

                      {/* Sync Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedConnectionId(connection.id)
                          setShowSyncOptions(true)
                        }}
                        disabled={progress?.isRunning}
                        className="flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3 h-3 ${progress?.isRunning ? 'animate-spin' : ''}`} />
                        Sync
                      </Button>

                      {/* Delete Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteConnection(connection.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      {/* Calendar Sync Options Modal */}
      <CalendarSyncOptionsModal
        isOpen={showSyncOptions}
        onClose={() => {
          setShowSyncOptions(false)
          setSelectedConnectionId(null)
        }}
        onConfirm={(timeWindowOptions) => {
          if (selectedConnectionId) {
            onStartSync(selectedConnectionId, timeWindowOptions)
          }
          setShowSyncOptions(false)
          setSelectedConnectionId(null)
        }}
        isStarting={false}
      />
    </Card>
  );
} 
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Bot, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Users,
  FileText,
  RefreshCw,
  Search
} from 'lucide-react'

interface ProgressUpdate {
  type: 'progress' | 'analyst_start' | 'analyst_complete' | 'complete' | 'error'
  data: any
}

interface DiscoveryProgressProps {
  onComplete: (publications: any[]) => void
  onError: (error: string) => void
  autoStart?: boolean
}

export function DiscoveryProgress({ onComplete, onError, autoStart = false }: DiscoveryProgressProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentAnalyst, setCurrentAnalyst] = useState<string>('')
  const [currentMessage, setCurrentMessage] = useState<string>('')
  const [processedAnalysts, setProcessedAnalysts] = useState(0)
  const [totalAnalysts, setTotalAnalysts] = useState(0)
  const [publicationsFound, setPublicationsFound] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [completedAnalysts, setCompletedAnalysts] = useState<Array<{name: string, publicationsFound: number}>>([])
  const [currentAnalystIndex, setCurrentAnalystIndex] = useState(0)

  useEffect(() => {
    if (autoStart) {
      startDiscovery()
    }
  }, [autoStart])

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-4), message]) // Keep last 5 logs
  }

  const startDiscovery = async () => {
    setIsRunning(true)
    setIsCompleted(false)
    setError(null)
    setProgress(0)
    setPublicationsFound(0)
    setLogs([])
    setCompletedAnalysts([])
    setCurrentAnalystIndex(0)
    setCurrentMessage('Starting discovery...')

    try {
      const eventSource = new EventSource('/api/publications/discover-progress')
      
      eventSource.onmessage = (event) => {
        try {
          const update: ProgressUpdate = JSON.parse(event.data)
          
          switch (update.type) {
            case 'progress':
              if (update.data.totalAnalysts) {
                setTotalAnalysts(update.data.totalAnalysts)
                setProcessedAnalysts(update.data.currentAnalyst || 0)
              }
              if (update.data.message) {
                setCurrentMessage(update.data.message)
                addLog(update.data.message)
              }
              if (update.data.progress !== undefined) {
                setProgress(update.data.progress)
              }
              break

            case 'analyst_start':
              setCurrentAnalyst(update.data.analyst)
              const analystIndex = update.data.currentAnalyst || currentAnalystIndex + 1
              setCurrentAnalystIndex(analystIndex)
              const total = update.data.totalAnalysts || totalAnalysts
              if (update.data.totalAnalysts && !totalAnalysts) {
                setTotalAnalysts(update.data.totalAnalysts)
              }
              setCurrentMessage(`Processing analyst ${analystIndex}${total ? `/${total}` : ''}: ${update.data.analyst}`)
              addLog(`🔍 Starting ${update.data.analyst} (${update.data.company || 'Unknown company'})`)
              if (update.data.progress !== undefined) {
                setProgress(update.data.progress)
              }
              if (update.data.currentAnalyst) {
                setProcessedAnalysts(update.data.currentAnalyst)
              }
              break

            case 'analyst_complete':
              const found = update.data.publicationsFound || 0
              addLog(`✅ ${update.data.analyst}: ${found} publications found`)
              setCompletedAnalysts(prev => [...prev, { name: update.data.analyst, publicationsFound: found }])
              setPublicationsFound(prev => prev + found)
              if (update.data.progress !== undefined) {
                setProgress(update.data.progress)
              }
              if (update.data.currentAnalyst) {
                setProcessedAnalysts(update.data.currentAnalyst)
              }
              break

            case 'complete':
              setIsCompleted(true)
              setProgress(100)
              setCurrentMessage(`Discovery completed! Found ${update.data.totalFound} publications.`)
              addLog(`🎉 Discovery completed: ${update.data.totalFound} total publications`)
              onComplete(update.data.publications)
              eventSource.close()
              break

            case 'error':
              setError(update.data.message || 'Unknown error occurred')
              setCurrentMessage('Discovery failed')
              addLog(`❌ Error: ${update.data.message}`)
              onError(update.data.message || 'Discovery failed')
              eventSource.close()
              break
          }
        } catch (err) {
          console.error('Error parsing SSE data:', err)
        }
      }

      eventSource.onerror = (err) => {
        console.error('EventSource failed:', err)
        setError('Connection to discovery service failed')
        setCurrentMessage('Connection failed')
        onError('Connection to discovery service failed')
        eventSource.close()
      }

      // Cleanup on unmount
      return () => {
        eventSource.close()
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start discovery'
      setError(errorMessage)
      setCurrentMessage('Failed to start')
      onError(errorMessage)
    } finally {
      setIsRunning(false)
    }
  }

  const resetDiscovery = () => {
    setIsCompleted(false)
    setError(null)
    setProgress(0)
    setCurrentMessage('')
    setCurrentAnalyst('')
    setProcessedAnalysts(0)
    setTotalAnalysts(0)
    setPublicationsFound(0)
    setLogs([])
    setCompletedAnalysts([])
    setCurrentAnalystIndex(0)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bot className="w-8 h-8 text-blue-600" />
            Publication Discovery
          </h1>
          <p className="mt-1 text-gray-600">
            {isRunning ? 'Discovering publications from analyst websites...' :
             isCompleted ? 'Discovery completed successfully!' :
             error ? 'Discovery encountered an error' :
             'Ready to discover publications'}
          </p>
        </div>
        <div className="flex gap-2">
          {(isCompleted || error) && (
            <Button onClick={resetDiscovery} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Run Again
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {(isRunning || isCompleted || error) && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">Overall Progress</span>
            <span className="text-gray-600">{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
          {currentMessage && (
            <div className="mt-3 text-center">
              <p className="text-sm text-gray-600">{currentMessage}</p>
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      {(isRunning || isCompleted || error) && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-2xl font-bold text-gray-900">
                  {isRunning ? `${currentAnalystIndex}/${totalAnalysts}` : `${processedAnalysts}/${totalAnalysts}`}
                </p>
                <p className="text-sm text-gray-600">
                  {isRunning ? 'Current Analyst' : 'Analysts Processed'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-green-500" />
              <div className="ml-3">
                <p className="text-2xl font-bold text-gray-900">{publicationsFound}</p>
                <p className="text-sm text-gray-600">Publications Found</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <Search className="w-8 h-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-2xl font-bold text-gray-900">{totalAnalysts * 6}</p>
                <p className="text-sm text-gray-600">Sources Checked</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              {isRunning ? <Loader2 className="w-8 h-8 text-orange-500 animate-spin" /> : 
               isCompleted ? <CheckCircle className="w-8 h-8 text-green-500" /> :
               error ? <AlertCircle className="w-8 h-8 text-red-500" /> :
               <Bot className="w-8 h-8 text-gray-400" />}
              <div className="ml-3">
                <p className="text-2xl font-bold text-gray-900">
                  {isRunning ? 'Running' : 
                   isCompleted ? 'Complete' :
                   error ? 'Failed' : 'Ready'}
                </p>
                <p className="text-sm text-gray-600">Status</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Completed Analysts */}
      {completedAnalysts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="px-4 py-3">
              <h3 className="text-sm font-medium text-gray-900">Completed Analysts ({completedAnalysts.length})</h3>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {completedAnalysts.map((analyst, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900">{analyst.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {analyst.publicationsFound} publication{analyst.publicationsFound !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {logs.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="px-4 py-3">
              <h3 className="text-sm font-medium text-gray-900">Recent Activity</h3>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="text-sm text-gray-600 py-1 border-b border-gray-100 last:border-0">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-white rounded-lg border border-red-200 overflow-hidden">
          <div className="bg-red-50 border-b border-red-200">
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <h3 className="font-medium">Discovery Failed</h3>
              </div>
            </div>
          </div>
          <div className="p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  )
}
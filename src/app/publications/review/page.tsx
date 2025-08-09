'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DiscoveryProgress } from '@/components/publications/DiscoveryProgress'
import { 
  Check,
  X,
  ExternalLink,
  AlertCircle,
  Bot,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Archive
} from 'lucide-react'
import { format } from 'date-fns'

interface DiscoveredPublication {
  title: string
  summary?: string
  url: string
  publishedAt: string
  type: 'RESEARCH_REPORT' | 'BLOG_POST' | 'WHITEPAPER' | 'WEBINAR' | 'PODCAST' | 'ARTICLE' | 'OTHER'
  analyst: {
    id: string
    firstName: string
    lastName: string
    company: string
  }
  source?: string
}

interface ReviewDecision {
  publicationId: string
  decision: 'keep' | 'reject' | 'archive'
  reason?: string
}

const typeColors = {
  RESEARCH_REPORT: 'bg-blue-100 text-blue-800',
  BLOG_POST: 'bg-green-100 text-green-800',
  WHITEPAPER: 'bg-purple-100 text-purple-800',
  WEBINAR: 'bg-yellow-100 text-yellow-800',
  PODCAST: 'bg-pink-100 text-pink-800',
  ARTICLE: 'bg-indigo-100 text-indigo-800',
  OTHER: 'bg-gray-100 text-gray-800'
}

export default function PublicationsReviewPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [discovering, setDiscovering] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [publications, setPublications] = useState<DiscoveredPublication[]>([])
  const [decisions, setDecisions] = useState<Record<string, ReviewDecision>>({})
  const [selectedPublication, setSelectedPublication] = useState<DiscoveredPublication | null>(null)

  // Remove auto-discovery on mount, let user trigger it manually

  const handleDiscoveryComplete = (publications: any[]) => {
    setPublications(publications)
    setShowProgress(false)
    setDiscovering(false)
    setError(null)
  }

  const handleDiscoveryError = (errorMessage: string) => {
    setError(errorMessage)
    setShowProgress(false)
    setDiscovering(false)
  }

  const startDiscovery = () => {
    setShowProgress(true)
    setDiscovering(true)
    setError(null)
    setPublications([])
  }

  // Legacy function kept for backward compatibility with existing button
  const discoverPublications = async () => {
    try {
      setDiscovering(true)
      setError(null)
      const response = await fetch('/api/publications/discover')
      if (response.ok) {
        const data = await response.json()
        setPublications(data.data || [])
      } else {
        setError('Failed to discover publications')
      }
    } catch (error) {
      setError('Error discovering publications')
      console.error('Error discovering publications:', error)
    } finally {
      setDiscovering(false)
      setLoading(false)
    }
  }

  const makeDecision = async (publication: DiscoveredPublication, decision: 'keep' | 'reject' | 'archive') => {
    const publicationId = `${publication.url}#${publication.title}#${publication.publishedAt}` // Create unique ID
    
    // Update local state
    setDecisions(prev => ({
      ...prev,
      [publicationId]: {
        publicationId,
        decision,
        reason: decision === 'reject' ? 'Not relevant' : undefined
      }
    }))

    if (decision === 'keep') {
      try {
        // Save to database
        const response = await fetch('/api/publications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...publication,
            isTracked: true,
            status: 'ACTIVE'
          })
        })

        if (!response.ok) {
          throw new Error('Failed to save publication')
        }
      } catch (error) {
        console.error('Error saving publication:', error)
        // Revert decision on error
        setDecisions(prev => {
          const { [publicationId]: _, ...rest } = prev
          return rest
        })
      }
    }

    if (decision === 'reject' || decision === 'archive') {
      // Try to delete if this publication already exists in DB (we need an id; attempt to find by url)
      try {
        const getRes = await fetch(`/api/publications?analystId=${encodeURIComponent(publication.analyst.id)}`)
        if (getRes.ok) {
          const { data } = await getRes.json()
          const match = (data || []).find((p: any) => p.url === publication.url)
          if (match?.id) {
            await fetch(`/api/publications/${match.id}`, { method: 'DELETE' })
          }
        }
      } catch (e) {
        // non-fatal
      }
    }
  }

  const getDecisionIcon = (decision?: ReviewDecision) => {
    if (!decision) return null
    switch (decision.decision) {
      case 'keep':
        return <ThumbsUp className="h-5 w-5 text-green-600" />
      case 'reject':
        return <ThumbsDown className="h-5 w-5 text-red-600" />
      case 'archive':
        return <Archive className="h-5 w-5 text-gray-600" />
    }
  }

  // Show progress tracker if discovery is running
  if (showProgress) {
    return (
      <DiscoveryProgress 
        onComplete={handleDiscoveryComplete}
        onError={handleDiscoveryError}
        autoStart={true}
      />
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Publication Discovery</h1>
          <p className="mt-1 text-gray-600">Review and import discovered analyst publications</p>
        </div>
        <div className="bg-white rounded-lg border border-red-200 overflow-hidden">
          <div className="bg-red-50 border-b border-red-200">
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <h3 className="font-medium">Error discovering publications</h3>
              </div>
            </div>
          </div>
          <div className="p-4">
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <Button 
              onClick={discoverPublications}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Discovery
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Publication Discovery</h1>
            <p className="mt-1 text-gray-600">
              Review and import discovered analyst publications
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={startDiscovery}
              disabled={discovering}
              className="flex items-center gap-2"
            >
              <Bot className="h-4 w-4" />
              {discovering ? 'Discovering...' : 'Start Discovery'}
            </Button>
            <Button 
              onClick={discoverPublications}
              disabled={discovering}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Quick Discover
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Bot className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-gray-900">{publications.length}</p>
              <p className="text-sm text-gray-600">Total Discovered</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <ThumbsUp className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-gray-900">
                {Object.values(decisions).filter(d => d.decision === 'keep').length}
              </p>
              <p className="text-sm text-gray-600">Kept</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <ThumbsDown className="w-8 h-8 text-red-500" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-gray-900">
                {Object.values(decisions).filter(d => d.decision === 'reject').length}
              </p>
              <p className="text-sm text-gray-600">Rejected</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-gray-900">
                {publications.length - Object.keys(decisions).length}
              </p>
              <p className="text-sm text-gray-600">Pending Review</p>
            </div>
          </div>
        </div>
      </div>

      {/* Publications List */}
      <div className="space-y-4">
        {publications.map((publication) => {
          const publicationId = `${publication.url}#${publication.title}#${publication.publishedAt}`
          const decision = decisions[publicationId]
          
          return (
            <Card 
              key={publicationId}
              className={`transition-colors ${
                decision?.decision === 'keep' ? 'bg-green-50' :
                decision?.decision === 'reject' ? 'bg-red-50' :
                decision?.decision === 'archive' ? 'bg-gray-50' :
                'hover:bg-gray-50'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {publication.title}
                      </h3>
                      <Badge className={typeColors[publication.type]}>
                        {publication.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-500 mb-4">
                      by <span className="font-medium text-gray-700">
                        {publication.analyst.firstName} {publication.analyst.lastName}
                      </span>
                      {' '} at {' '}
                      <span className="font-medium text-gray-700">
                        {publication.analyst.company}
                      </span>
                      {' '} • {' '}
                      {format(new Date(publication.publishedAt), 'MMM d, yyyy')}
                    </div>

                    {publication.summary && (
                      <p className="text-gray-600 mb-4">{publication.summary}</p>
                    )}

                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(publication.url, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Source
                      </Button>
                      
                      {publication.source && (
                        <span className="text-sm text-gray-500">
                          Found on: {publication.source}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {decision ? (
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white shadow-sm">
                        {getDecisionIcon(decision)}
                        <span className="text-sm font-medium capitalize">
                          {decision.decision}ed
                        </span>
                      </div>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          className="flex items-center gap-2"
                          onClick={() => makeDecision(publication, 'keep')}
                        >
                          <Check className="h-4 w-4" />
                          Keep
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                          onClick={() => makeDecision(publication, 'reject')}
                        >
                          <X className="h-4 w-4" />
                          Reject
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                          onClick={() => makeDecision(publication, 'archive')}
                        >
                          <Archive className="h-4 w-4" />
                          Archive
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {publications.length === 0 && (
          <div className="text-center py-12">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No publications discovered</h3>
            <p className="text-gray-600 mb-4">
              Try discovering new publications using the button above.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
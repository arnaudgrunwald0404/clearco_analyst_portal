'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [discovering, setDiscovering] = useState(false)
  const [publications, setPublications] = useState<DiscoveredPublication[]>([])
  const [decisions, setDecisions] = useState<Record<string, ReviewDecision>>({})
  const [selectedPublication, setSelectedPublication] = useState<DiscoveredPublication | null>(null)

  useEffect(() => {
    discoverPublications()
  }, [])

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
    const publicationId = publication.url // Use URL as temporary ID
    
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

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Discovering publications...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Publication Discovery</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center text-red-800 mb-2">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p className="font-medium">Error discovering publications</p>
          </div>
          <p className="text-red-600">{error}</p>
        </div>
        <Button 
          onClick={discoverPublications}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Retry Discovery
        </Button>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Publication Discovery</h1>
            <p className="text-gray-600">
              Review and import discovered analyst publications
            </p>
          </div>
          <Button 
            onClick={discoverPublications}
            disabled={discovering}
            className="flex items-center gap-2"
          >
            <Bot className="h-4 w-4" />
            {discovering ? 'Discovering...' : 'Discover New'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Discovered</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publications.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kept</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(decisions).filter(d => d.decision === 'keep').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <ThumbsDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(decisions).filter(d => d.decision === 'reject').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {publications.length - Object.keys(decisions).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Publications List */}
      <div className="space-y-4">
        {publications.map((publication) => {
          const decision = decisions[publication.url]
          
          return (
            <Card 
              key={publication.url}
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
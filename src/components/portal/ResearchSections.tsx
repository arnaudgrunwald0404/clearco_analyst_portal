'use client'

import { useState, useEffect } from 'react'
import { Calendar, FileText, Clock, BookOpen, Plus } from 'lucide-react'

interface Publication {
  id: string
  title: string
  url?: string
  summary?: string
  type: string
  publishedAt: string
  isTracked: boolean
}

interface ResearchSectionsProps {
  analystId?: string
}

export default function ResearchSections({ analystId }: ResearchSectionsProps) {
  const [recentPublications, setRecentPublications] = useState<Publication[]>([])
  const [upcomingResearch, setUpcomingResearch] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!analystId) {
      setLoading(false)
      return
    }
    
    const fetchPublications = async () => {
      try {
        setLoading(true)
        
        // Fetch recent publications (past publications)
        const today = new Date().toISOString()
        const recentResponse = await fetch(`/api/publications?analystId=${analystId}&limit=3`)
        const recentData = await recentResponse.json()
        
        // Filter to only past publications and take first 3
        const pastPublications = (recentData.data || [])
          .filter((pub: Publication) => new Date(pub.publishedAt) <= new Date())
          .slice(0, 3)
        
        // Fetch upcoming publications (future publications)
        const upcomingResponse = await fetch(`/api/publications?analystId=${analystId}&filter=upcoming&limit=3`)
        const upcomingData = await upcomingResponse.json()
        
        // Filter to only future publications and take first 3
        const futurePublications = (upcomingData.data || [])
          .filter((pub: Publication) => new Date(pub.publishedAt) > new Date())
          .slice(0, 3)
        
        setRecentPublications(pastPublications)
        setUpcomingResearch(futurePublications)
      } catch (error) {
        console.error('Error fetching publications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPublications()
  }, [analystId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'RESEARCH_REPORT':
        return <FileText className="w-4 h-4 text-blue-500" />
      case 'WHITEPAPER':
        return <BookOpen className="w-4 h-4 text-green-500" />
      case 'ARTICLE':
        return <FileText className="w-4 h-4 text-purple-500" />
      default:
        return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  const EmptyStateIllustration = ({ type }: { type: 'recent' | 'upcoming' }) => (
    <div className="flex flex-col items-center py-2 text-center">
      <div className="w-16 h-16 mb-3 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/cupcake_dripping.png"
          alt="No publications"
          className="w-16 object-contain"
        />
      </div>
      <p className="text-sm font-normal text-gray-600 mb-3">
        {type === 'recent' ? 'No Recent Publications Logged' : 'No Upcoming Research Logged'}
      </p>
      <a
        href={`/analyst_portal/vendor_profile/publications/add?type=${type === 'recent' ? 'published' : 'upcoming'}`}
        className="inline-flex items-center gap-1 px-3 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
      >
        <Plus className="w-3 h-3" />
        {type === 'recent' ? 'Add Recent Publication' : 'Add Upcoming Research'}
      </a>
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-6 mt-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 mt-6 pt-6 border-t border-gray-200">
      {/* Recent Publications */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Recent Publications
        </h3>
        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
          Help vendors understand your topics of expertise.
        </p>
        {recentPublications.length > 0 ? (
          <div className="space-y-2">
            {recentPublications.map((publication) => (
              <div key={publication.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                {getTypeIcon(publication.type)}
                <div className="min-w-0 flex-1">
                  {publication.url ? (
                    <a
                      href={publication.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-2 break-words"
                    >
                      {publication.title}
                    </a>
                  ) : (
                    <div className="text-sm font-medium text-gray-900 line-clamp-2 break-words">
                      {publication.title}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDate(publication.publishedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyStateIllustration type="recent" />
        )}
      </div>

      {/* Upcoming Research */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Upcoming Research
        </h3>
        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
          Get timely input from vendors on your upcoming research.
        </p>
        {upcomingResearch.length > 0 ? (
          <div className="space-y-2">
            {upcomingResearch.map((publication) => (
              <div key={publication.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                {getTypeIcon(publication.type)}
                <div className="min-w-0 flex-1">
                  {publication.url ? (
                    <a
                      href={publication.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-2 break-words"
                    >
                      {publication.title}
                    </a>
                  ) : (
                    <div className="text-sm font-medium text-gray-900 line-clamp-2 break-words">
                      {publication.title}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    Expected: {formatDate(publication.publishedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyStateIllustration type="upcoming" />
        )}
      </div>
    </div>
  )
}

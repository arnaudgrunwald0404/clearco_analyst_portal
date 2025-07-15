'use client'

import { useState, useEffect } from 'react'
import {
  Newspaper,
  Calendar,
  Tag,
  User,
  Search,
  Filter,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock latest news data
const mockNewsArticles = [
  {
    id: '1',
    title: 'HR Tech Innovation Trends for 2025',
    summary: 'A comprehensive look into the innovative trends shaping the future of HR technology.',
    publishedAt: '2024-11-05',
    author: 'Jessica Adams',
    views: 273,
    tags: ['Innovation', 'Trends', 'HR Tech'],
    image: '/api/placeholder/600/400'
  },
  {
    id: '2',
    title: 'Employee Experience: The New Metrics',
    summary: 'Exploring how companies are redefining employee experience metrics in a remote work era.',
    publishedAt: '2024-11-02',
    author: 'Mark Johnson',
    views: 196,
    tags: ['Employee Experience', 'Metrics', 'Remote Work'],
    image: '/api/placeholder/600/400'
  },
  {
    id: '3',
    title: 'AI in HR: Opportunities and Challenges',
    summary: 'A deep dive into the role of AI in HR and what organizations should prepare for.',
    publishedAt: '2024-10-28',
    author: 'Emily Davis',
    views: 342,
    tags: ['AI', 'HR', 'Opportunities'],
    image: '/api/placeholder/600/400'
  }
]

export default function PortalNewsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Get all unique tags
  const allTags = Array.from(new Set(mockNewsArticles.flatMap(article => article.tags)))

  const filteredArticles = mockNewsArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.author.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => article.tags.includes(tag))
    
    return matchesSearch && matchesTags
  })

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Latest News</h1>
        <p className="mt-2 text-gray-600">
          Stay informed with the latest updates and insights from the HR tech industry
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-4">
        {/* Search and Tags Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search news..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tags Filter */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 py-2">Filter by tags:</span>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={cn(
                'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors',
                selectedTags.includes(tag)
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              )}
            >
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map(article => (
          <div key={article.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <img src={article.image} alt="Article Image" className="w-full h-48 object-cover" />
            <div className="p-6">
              {/* Article Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center">
                  <Newspaper className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {article.author}
                  </span>
                </div>
                <span className="flex items-center text-xs text-gray-500">
                  <Eye className="w-3 h-3 mr-1" />
                  {article.views} views
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {article.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {article.summary}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {article.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Metadata */}
              <div className="text-xs text-gray-500 mb-4">
                <Calendar className="w-3 h-3 mr-1 inline-block" />
                {new Date(article.publishedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>

              {/* Button */}
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
                Read More
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <div className="text-center py-12">
          <Newspaper className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-500">No news articles found matching your criteria.</div>
        </div>
      )}
    </div>
  )
}

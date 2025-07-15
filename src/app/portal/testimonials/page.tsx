'use client'

import { useState } from 'react'
import {
  MessageSquare,
  Quote,
  Star,
  Calendar,
  User,
  Building,
  Search,
  Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock testimonials data
const mockTestimonials = [
  {
    id: '1',
    quote: "Their innovative approach to HR technology has fundamentally changed how we think about talent management. The AI-powered insights have been game-changing for our clients.",
    author: 'Sarah Chen',
    title: 'Vice President Analyst',
    company: 'Gartner',
    date: '2024-10-15',
    rating: 5,
    category: 'Product Innovation',
    verified: true,
    context: 'Magic Quadrant Research',
    image: '/api/placeholder/80/80'
  },
  {
    id: '2',
    quote: "The depth of their market understanding and ability to execute on their vision consistently impresses me. They're setting new standards in the HR tech space.",
    author: 'Michael Rodriguez',
    title: 'Principal Analyst',
    company: 'Forrester',
    date: '2024-10-12',
    rating: 5,
    category: 'Market Leadership',
    verified: true,
    context: 'Wave Analysis',
    image: '/api/placeholder/80/80'
  },
  {
    id: '3',
    quote: "What sets them apart is their genuine commitment to solving real workplace challenges. Their customer-centric approach to product development is exemplary.",
    author: 'Jennifer Thompson',
    title: 'Research Director',
    company: 'IDC',
    date: '2024-10-08',
    rating: 4,
    category: 'Customer Focus',
    verified: true,
    context: 'MarketScape Evaluation',
    image: '/api/placeholder/80/80'
  },
  {
    id: '4',
    quote: "Their platform's integration capabilities and scalability make it a standout choice for enterprise clients. The technical architecture is truly impressive.",
    author: 'David Park',
    title: 'Senior Analyst',
    company: 'Bersin by Deloitte',
    date: '2024-09-28',
    rating: 5,
    category: 'Technical Excellence',
    verified: true,
    context: 'Platform Assessment',
    image: '/api/placeholder/80/80'
  },
  {
    id: '5',
    quote: "The thought leadership they demonstrate in the future of work space is remarkable. Their insights consistently inform our research directions.",
    author: 'Lisa Wang',
    title: 'VP Research',
    company: 'RedThread Research',
    date: '2024-09-20',
    rating: 5,
    category: 'Thought Leadership',
    verified: true,
    context: 'Industry Report',
    image: '/api/placeholder/80/80'
  },
  {
    id: '6',
    quote: "Their commitment to data privacy and security sets them apart in an increasingly regulated environment. This is crucial for enterprise adoption.",
    author: 'Robert Martinez',
    title: 'Research Manager',
    company: 'Nucleus Research',
    date: '2024-09-15',
    rating: 4,
    category: 'Security & Compliance',
    verified: true,
    context: 'Security Assessment',
    image: '/api/placeholder/80/80'
  }
]

const categories = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'Product Innovation', label: 'Product Innovation' },
  { value: 'Market Leadership', label: 'Market Leadership' },
  { value: 'Customer Focus', label: 'Customer Focus' },
  { value: 'Technical Excellence', label: 'Technical Excellence' },
  { value: 'Thought Leadership', label: 'Thought Leadership' },
  { value: 'Security & Compliance', label: 'Security & Compliance' }
]

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={cn(
        'w-4 h-4',
        i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
      )}
    />
  ))
}

export default function PortalTestimonialsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')

  const filteredTestimonials = mockTestimonials.filter(testimonial => {
    const matchesSearch = testimonial.quote.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.context.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'ALL' || testimonial.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analyst Testimonials</h1>
        <p className="mt-2 text-gray-600">
          Verified testimonials and quotes from industry analysts about our platform and services
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search testimonials..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{mockTestimonials.length}</div>
          <div className="text-sm text-gray-600">Total Testimonials</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {mockTestimonials.filter(t => t.verified).length}
          </div>
          <div className="text-sm text-gray-600">Verified</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {(mockTestimonials.reduce((sum, t) => sum + t.rating, 0) / mockTestimonials.length).toFixed(1)}
          </div>
          <div className="text-sm text-gray-600">Average Rating</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {new Set(mockTestimonials.map(t => t.company)).size}
          </div>
          <div className="text-sm text-gray-600">Research Firms</div>
        </div>
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTestimonials.map((testimonial) => (
          <div
            key={testimonial.id}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            {/* Quote */}
            <div className="relative mb-4">
              <Quote className="absolute -top-2 -left-2 w-8 h-8 text-blue-100" />
              <blockquote className="text-gray-700 italic text-lg leading-relaxed pl-6">
                "{testimonial.quote}"
              </blockquote>
            </div>

            {/* Rating */}
            <div className="flex items-center mb-4">
              <div className="flex items-center mr-3">
                {renderStars(testimonial.rating)}
              </div>
              <span className="text-sm text-gray-500">({testimonial.rating}/5)</span>
            </div>

            {/* Author Info */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                  <User className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.author}</div>
                  <div className="text-sm text-gray-600">{testimonial.title}</div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Building className="w-3 h-3 mr-1" />
                    {testimonial.company}
                  </div>
                </div>
              </div>

              {testimonial.verified && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Verified
                </span>
              )}
            </div>

            {/* Metadata */}
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <div className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate(testimonial.date)}
              </div>
              <div className="flex items-center">
                <MessageSquare className="w-3 h-3 mr-1" />
                {testimonial.context}
              </div>
            </div>

            {/* Category Tag */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {testimonial.category}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredTestimonials.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-500">No testimonials found matching your criteria.</div>
        </div>
      )}

      {/* Call to Action */}
      <div className="mt-12 bg-blue-50 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Want to contribute a testimonial?
        </h3>
        <p className="text-gray-600 mb-4">
          Share your experience with our platform and help other analysts understand our value proposition.
        </p>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Submit Testimonial
        </button>
      </div>
    </div>
  )
}

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
import { Caveat } from 'next/font/google'

const caveat = Caveat({ subsets: ['latin'], weight: ['400', '700'] })

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

      {/* Testimonials Grid - Post-it style masonry */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-8">
        {filteredTestimonials.map((t, idx) => {
          const rotations = ['rotate-1', '-rotate-1', 'rotate-2', '-rotate-2']
          const rotation = rotations[idx % rotations.length]
          return (
            <div key={t.id} className="inline-block w-full break-inside-avoid mb-8">
              <div className={cn(
'relative w-full bg-yellow-100 rounded-sm shadow-[0_10px_20px_rgba(0,0,0,0.12)] p-4 border border-yellow-200',
                'transition-transform hover:rotate-0 hover:scale-[1.02]',
                rotation
              )}>
                {/* Tape at top */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-yellow-200/80 rounded-sm shadow-sm" />

                {/* Quote */}
                <div className="h-full flex flex-col">
                  <div className="flex-1">
                    <Quote className="w-6 h-6 text-yellow-500/70 mb-2" />
                    <blockquote className={cn('text-gray-800 text-[1.05rem] leading-relaxed italic', caveat.className)}>
                      “{t.quote}”
                    </blockquote>
                  </div>

                  {/* Bottom area with avatar and name */}
                  <div className="mt-4 pt-3 border-t border-yellow-200 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-yellow-300 flex items-center justify-center">
                      {/* Prefer provided image, fallback to user icon */}
                      {t.image ? (
                        <img src={t.image} alt={t.author} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-yellow-900" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{t.author}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
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

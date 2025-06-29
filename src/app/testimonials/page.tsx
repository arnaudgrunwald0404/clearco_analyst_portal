'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Eye, Edit, Trash2, MessageSquare, Quote } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

// Interface for testimonials
interface Testimonial {
  id: string
  quote: string
  context: string
  isPublished: boolean
  displayOrder: number
  createdAt: string
  analyst: {
    id: string
    firstName: string
    lastName: string
    company: string
    title: string
    profileImageUrl?: string
  }
}

interface Analyst {
  id: string
  firstName: string
  lastName: string
  company: string
  title: string
}

interface TestimonialFormData {
  analystId: string
  quote: string
  context: string
  isPublished: boolean
  displayOrder: number
}

export default function TestimonialsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [showForm, setShowForm] = useState(false)
  const [editingTestimonial, setEditingTestimonial] = useState<string | null>(null)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [analysts, setAnalysts] = useState<Analyst[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<TestimonialFormData>({
    analystId: '',
    quote: '',
    context: '',
    isPublished: false,
    displayOrder: 1
  })

  // Fetch testimonials and analysts from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch analysts first
        const analystsResponse = await fetch('/api/analysts')
        if (analystsResponse.ok) {
          const analystsData = await analystsResponse.json()
          if (analystsData.success) {
            setAnalysts(analystsData.data.map((analyst: any) => ({
              id: analyst.id,
              firstName: analyst.firstName,
              lastName: analyst.lastName,
              company: analyst.company || 'Unknown',
              title: analyst.title || 'Analyst'
            })))
          }
        }
        
        // Fetch testimonials
        const testimonialsResponse = await fetch('/api/testimonials')
        if (testimonialsResponse.ok) {
          const testimonialsData = await testimonialsResponse.json()
          if (testimonialsData.success) {
            setTestimonials(testimonialsData.data)
          } else {
            // If no testimonials API, create empty array
            setTestimonials([])
          }
        } else {
          // If no testimonials API, create empty array
          setTestimonials([])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setTestimonials([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  const filteredTestimonials = testimonials.filter(testimonial => {
    const matchesSearch = 
      testimonial.quote.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.analyst.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.analyst.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.analyst.company.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = 
      filterStatus === 'ALL' || 
      (filterStatus === 'PUBLISHED' && testimonial.isPublished) ||
      (filterStatus === 'DRAFT' && !testimonial.isPublished)
    
    return matchesSearch && matchesFilter
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission (create/update testimonial)
    console.log('Submitting testimonial:', formData)
    setShowForm(false)
    setEditingTestimonial(null)
    setFormData({
      analystId: '',
      quote: '',
      context: '',
      isPublished: false,
      displayOrder: 1
    })
  }

  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial.id)
    setFormData({
      analystId: testimonial.analyst.id,
      quote: testimonial.quote,
      context: testimonial.context,
      isPublished: testimonial.isPublished,
      displayOrder: testimonial.displayOrder
    })
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this testimonial?')) {
      // Handle deletion
      console.log('Deleting testimonial:', id)
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getAvatarColor = (firstName: string, lastName: string) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500']
    const hash = firstName.charCodeAt(0) + lastName.charCodeAt(0)
    return colors[hash % colors.length]
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Testimonials Management</h1>
          <p className="mt-2 text-gray-600">
            Manage analyst testimonials and quotes for the portal
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Testimonial
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search testimonials..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
      </div>

      {/* Testimonial Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="analyst">Analyst</Label>
                <select
                  id="analyst"
                  value={formData.analystId}
                  onChange={(e) => setFormData({ ...formData, analystId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select an analyst...</option>
                  {analysts.map(analyst => (
                    <option key={analyst.id} value={analyst.id}>
                      {analyst.firstName} {analyst.lastName} - {analyst.company}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="quote">Quote</Label>
                <textarea
                  id="quote"
                  value={formData.quote}
                  onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Enter the testimonial quote..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="context">Context (Optional)</Label>
                <Input
                  id="context"
                  type="text"
                  value={formData.context}
                  onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                  placeholder="e.g., Q4 2024 HR Tech Report"
                />
              </div>

              <div>
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  min="1"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublished"
                  checked={formData.isPublished}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                />
                <Label htmlFor="isPublished">Publish immediately</Label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingTestimonial(null)
                    setFormData({
                      analystId: '',
                      quote: '',
                      context: '',
                      isPublished: false,
                      displayOrder: 1
                    })
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTestimonial ? 'Update' : 'Create'} Testimonial
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading testimonials...</span>
        </div>
      )}

      {/* Testimonials Grid */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTestimonials.map((testimonial) => (
          <Card key={testimonial.id} className="p-6 hover:shadow-lg transition-shadow">
            {/* Header with status and actions */}
            <div className="flex justify-between items-start mb-4">
              <span className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                testimonial.isPublished 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              )}>
                {testimonial.isPublished ? 'Published' : 'Draft'}
              </span>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEdit(testimonial)}
                  className="p-1 text-gray-400 hover:text-blue-600"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(testimonial.id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quote */}
            <div className="mb-4">
              <Quote className="w-5 h-5 text-gray-300 mb-2" />
              <p className="text-gray-900 font-medium leading-relaxed">
                "{testimonial.quote}"
              </p>
              {testimonial.context && (
                <p className="text-sm text-gray-500 mt-2 italic">
                  — {testimonial.context}
                </p>
              )}
            </div>

            {/* Analyst Info */}
            <div className="flex items-center">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm",
                getAvatarColor(testimonial.analyst.firstName, testimonial.analyst.lastName)
              )}>
                {getInitials(testimonial.analyst.firstName, testimonial.analyst.lastName)}
              </div>
              <div className="ml-3">
                <p className="font-semibold text-gray-900 text-sm">
                  {testimonial.analyst.firstName} {testimonial.analyst.lastName}
                </p>
                <p className="text-xs text-gray-600">
                  {testimonial.analyst.title}
                </p>
                <p className="text-xs font-medium text-blue-600">
                  {testimonial.analyst.company}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
              Order: {testimonial.displayOrder} • Created: {new Date(testimonial.createdAt).toLocaleDateString()}
            </div>
          </Card>
        ))}
        </div>
      )}

      {!loading && filteredTestimonials.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No testimonials found</h3>
          <p className="mt-2 text-gray-500">
            {searchTerm || filterStatus !== 'ALL' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by adding your first testimonial.'
            }
          </p>
        </div>
      )}
    </div>
  )
}

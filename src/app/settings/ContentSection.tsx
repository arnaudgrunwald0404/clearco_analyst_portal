'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  FileText, 
  Video, 
  Play, 
  Calendar, 
  Download, 
  Edit, 
  Trash2, 
  ExternalLink,
  Search,
  Filter,
  X
} from 'lucide-react'

interface Content {
  id: string
  title: string
  description: string
  type: 'VIDEO' | 'REPORT' | 'DEMO' | 'CASE_STUDY' | 'WEBINAR'
  category: 'brand' | 'product' | 'misc'
  url: string
  fileSize?: string
  createdAt: string
  updatedAt: string
}

const contentTypes = [
  { value: 'VIDEO', label: 'Video', icon: Video },
  { value: 'REPORT', label: 'Report', icon: FileText },
  { value: 'DEMO', label: 'Demo', icon: Play },
  { value: 'CASE_STUDY', label: 'Case Study', icon: FileText },
  { value: 'WEBINAR', label: 'Webinar', icon: Calendar }
]

const contentCategories = [
  { value: 'brand', label: 'Brand Kit' },
  { value: 'product', label: 'Product' },
  { value: 'misc', label: 'Miscellaneous' }
]

export default function ContentSection() {
  const [content, setContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingContent, setEditingContent] = useState<Content | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('ALL')
  const [filterCategory, setFilterCategory] = useState<string>('ALL')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'REPORT' as Content['type'],
    category: 'misc' as Content['category'],
    url: '',
    fileSize: ''
  })

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/portal-content')
      if (response.ok) {
        const data = await response.json()
        setContent(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching content:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingContent ? `/api/portal-content/${editingContent.id}` : '/api/portal-content'
      const method = editingContent ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchContent()
        resetForm()
      }
    } catch (error) {
      console.error('Error saving content:', error)
    }
  }

  const handleEdit = (item: Content) => {
    setEditingContent(item)
    setFormData({
      title: item.title,
      description: item.description,
      type: item.type,
      category: item.category,
      url: item.url,
      fileSize: item.fileSize || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return
    
    try {
      const response = await fetch(`/api/portal-content/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        await fetchContent()
      }
    } catch (error) {
      console.error('Error deleting content:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'REPORT',
      category: 'misc',
      url: '',
      fileSize: ''
    })
    setEditingContent(null)
    setShowForm(false)
  }

  const getTypeIcon = (type: string) => {
    const typeConfig = contentTypes.find(t => t.value === type)
    return typeConfig ? typeConfig.icon : FileText
  }

  const getTypeColor = (type: string) => {
    const colors = {
      VIDEO: 'bg-red-100 text-red-800',
      REPORT: 'bg-blue-100 text-blue-800',
      DEMO: 'bg-green-100 text-green-800',
      CASE_STUDY: 'bg-purple-100 text-purple-800',
      WEBINAR: 'bg-orange-100 text-orange-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'ALL' || item.type === filterType
    const matchesCategory = filterCategory === 'ALL' || item.category === filterCategory
    
    return matchesSearch && matchesType && matchesCategory
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Management</CardTitle>
        <CardDescription>
          Manage the documents and resources available in the analyst portal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            {/* Filters */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="ALL">All Types</option>
                {contentTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="ALL">All Categories</option>
                {contentCategories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Content
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingContent ? 'Edit Content' : 'Add New Content'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Title *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Content title"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label>URL *</Label>
                    <Input
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://... or resources/filename"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label>Type *</Label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as Content['type'] })}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    >
                      {contentTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label>Category *</Label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as Content['category'] })}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    >
                      {contentCategories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label>File Size</Label>
                    <Input
                      value={formData.fileSize}
                      onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                      placeholder="e.g., 4.2 MB"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the content"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingContent ? 'Update' : 'Create'} Content
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Content List */}
        {loading ? (
          <div className="border rounded-lg p-8 text-center">
            <p className="text-gray-500">Loading content...</p>
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="border rounded-lg p-8 text-center">
            <p className="text-gray-500">
              {content.length === 0 ? 'No content added yet.' : 'No content matches your filters.'}
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                <div className="col-span-4">Title</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-2">Size</div>
                <div className="col-span-2">Actions</div>
              </div>
            </div>
            
            <div className="divide-y">
              {filteredContent.map((item) => {
                const IconComponent = getTypeIcon(item.type)
                return (
                  <div key={item.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-4">
                        <div className="flex items-center gap-3">
                          <IconComponent className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">{item.title}</div>
                            {item.description && (
                              <div className="text-sm text-gray-500 mt-1">{item.description}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-2">
                        <Badge className={getTypeColor(item.type)}>
                          {contentTypes.find(t => t.value === item.type)?.label}
                        </Badge>
                      </div>
                      
                      <div className="col-span-2">
                        <span className="text-sm text-gray-600">
                          {contentCategories.find(c => c.value === item.category)?.label}
                        </span>
                      </div>
                      
                      <div className="col-span-2">
                        <span className="text-sm text-gray-500">
                          {item.fileSize || '—'}
                        </span>
                      </div>
                      
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(item.url, '_blank')}
                            title="Open content"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(item)}
                            title="Edit content"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(item.id)}
                            title="Delete content"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

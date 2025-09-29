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
  Users,
  Monitor,
  Palette,
  Package,
  Archive,
  Edit, 
  Trash2, 
  ExternalLink
} from 'lucide-react'
import { EmptyStateTable } from '@/components/content/EmptyStateTable'

interface Content {
  id: string
  vendor_domain_id: string
  title: string
  description: string
  category: 'PRODUCT' | 'DEMOS' | 'VIDEOS' | 'CASE_STUDIES' | 'PRESS_RELEASES' | 'REPORTS' | 'WEBINARS' | 'BRAND_KIT'
  url: string
  createdAt: string
  updatedAt: string
  vendor_domains?: {
    company_name: string
    protected_domain: string
  }
}

const contentCategories = [
  { value: 'PRODUCT', label: 'Product', description: 'overview, roadmap, screenshots', icon: Package },
  { value: 'DEMOS', label: 'Demos', icon: Play },
  { value: 'VIDEOS', label: 'Videos', description: 'CEO address, company presentation', icon: Video },
  { value: 'CASE_STUDIES', label: 'Case Studies', icon: Users },
  { value: 'PRESS_RELEASES', label: 'Press Releases', icon: FileText },
  { value: 'REPORTS', label: 'Reports', description: 'thought leadership, 3rd party reviews', icon: FileText },
  { value: 'WEBINARS', label: 'Webinars', icon: Monitor },
  { value: 'BRAND_KIT', label: 'Brand Kit', icon: Palette }
]

export default function ContentSection() {
  const [content, setContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingContent, setEditingContent] = useState<Content | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'PRODUCT' as Content['category'],
    url: ''
  })

  // Function to extract title from Google Docs URL
  const extractTitleFromUrl = async (url: string) => {
    if (!url) return ''
    
    try {
      // Check if it's a Google Docs URL
      if (url.includes('docs.google.com/document')) {
        // For Google Docs, we can try to extract the document ID and fetch the title
        const docIdMatch = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/)
        if (docIdMatch) {
          // For now, we'll extract a readable title from the URL
          // In a real implementation, you'd make an API call to Google Docs
          const title = url.split('/').pop()?.replace(/\?.*$/, '') || ''
          return title.replace(/-/g, ' ').replace(/_/g, ' ')
        }
      }
      
      // For other URLs, try to extract a meaningful title from the URL
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/').filter(part => part && part !== 'index.html' && part !== 'index.htm')
      const lastPart = pathParts[pathParts.length - 1] || ''
      
      if (lastPart) {
        return lastPart.replace(/\.(pdf|doc|docx|ppt|pptx|xls|xlsx)$/i, '')
                      .replace(/-/g, ' ')
                      .replace(/_/g, ' ')
                      .replace(/\+/g, ' ')
      }
      
      return urlObj.hostname.replace('www.', '')
    } catch (error) {
      console.error('Error extracting title from URL:', error)
      return ''
    }
  }

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
      
      console.log('Submitting form data:', formData)
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()
      console.log('API response:', result)

      if (response.ok) {
        await fetchContent()
        resetForm()
      } else {
        console.error('API error:', result.error)
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error saving content:', error)
      alert('An unexpected error occurred. Please try again.')
    }
  }

  const handleEdit = (item: Content) => {
    setEditingContent(item)
    setFormData({
      title: item.title,
      description: item.description,
      category: item.category,
      url: item.url
    })
    setShowForm(true)
  }

  const handleUrlChange = async (url: string) => {
    setFormData({ ...formData, url })
    
    // Auto-extract title if URL is provided and title is empty
    if (url && !formData.title) {
      const extractedTitle = await extractTitleFromUrl(url)
      if (extractedTitle) {
        setFormData({ ...formData, url, title: extractedTitle })
      }
    }
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
      category: 'PRODUCT',
      url: ''
    })
    setEditingContent(null)
    setShowForm(false)
  }

  const handleAddContentWithCategory = (category: string) => {
    setFormData({
      title: '',
      description: '',
      category: category as Content['category'],
      url: ''
    })
    setEditingContent(null)
    setShowForm(true)
  }

  const getCategoryIcon = (category: string) => {
    const categoryConfig = contentCategories.find(c => c.value === category)
    return categoryConfig ? categoryConfig.icon : FileText
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      PRODUCT: 'bg-orange-100 text-orange-800',
      DEMOS: 'bg-green-100 text-green-800',
      VIDEOS: 'bg-red-100 text-red-800',
      CASE_STUDIES: 'bg-purple-100 text-purple-800',
      PRESS_RELEASES: 'bg-blue-100 text-blue-800',
      REPORTS: 'bg-indigo-100 text-indigo-800',
      WEBINARS: 'bg-cyan-100 text-cyan-800',
      BRAND_KIT: 'bg-pink-100 text-pink-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }


  return (
    <div className="space-y-4"><Card className="shadow-sm border border-gray-200 p-6">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">Content</CardTitle>
        <CardDescription className="text-base  text-gray-600 leading-relaxed">
          Manage the documents and resources available in the analyst portal.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2 pl-4 mr-10">
        {/* Header Actions */}
        <div className="mb-6 flex justify-end">
          <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Add Content
          </Button>
        </div>

        {/* Add/Edit Form - Drawer */}
        {showForm && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={resetForm} />
            <div className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white shadow-xl">
              <div className="h-full flex flex-col">
                <div className="px-6 py-5 border-b">
                  <h2 className="text-2xl font-bold">{editingContent ? 'Edit Content' : 'Add New Content'}</h2>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5">
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
                          onChange={(e) => handleUrlChange(e.target.value)}
                          placeholder="https://... or resources/filename"
                          required
                        />
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
                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        Add content
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Display by Category */}
        {loading ? (
          <div className="border rounded-lg p-8 text-center">
            <p className="text-gray-500">Loading content...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {contentCategories.map((category) => {
              const categoryContent = content.filter(item => item.category === category.value)
              
              return (
                <div key={category.value} className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <category.icon className="w-5 h-5" />
                    {category.label}
                    {category.description && (
                      <span className="text-sm font-normal text-gray-500">
                        ({category.description})
                      </span>
                    )}
                  </h3>
                  
                  {categoryContent.length === 0 ? (
                    <EmptyStateTable 
                      category={category.value} 
                      onAddContent={handleAddContentWithCategory}
                    />
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-6 py-3 border-b">
                        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                          <div className="col-span-6">Content</div>
                          <div className="col-span-3">Updated</div>
                          <div className="col-span-3">Actions</div>
                        </div>
                      </div>
                      
                      <div className="divide-y">
                        {categoryContent.map((item) => {
                          const IconComponent = getCategoryIcon(item.category)
                          return (
                            <div key={item.id} className="px-6 py-4 hover:bg-gray-50">
                              <div className="grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-6">
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
                                
                                <div className="col-span-3">
                                  <div className="text-sm text-gray-500">
                                    {new Date(item.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                                
                                <div className="col-span-3">
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
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  )
}

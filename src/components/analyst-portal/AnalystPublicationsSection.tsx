'use client'

import { useState, useEffect } from 'react'
import { Plus, Check, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { AnalystPublication } from '@/types/analyst-portal'

export function AnalystPublicationsSection() {
  const [publications, setPublications] = useState<AnalystPublication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<AnalystPublication>>({})
  const [isAddingNew, setIsAddingNew] = useState(false)

  useEffect(() => {
    fetchPublications()
  }, [])

  const fetchPublications = async () => {
    try {
      const response = await fetch('/api/analyst-portal/publications')
      const data = await response.json()
      setPublications(data)
    } catch (error) {
      console.error('Error fetching analyst publications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleValidate = async (id: string) => {
    try {
      await fetch(`/api/analyst-portal/publications/${id}/validate`, {
        method: 'POST'
      })
      await fetchPublications()
    } catch (error) {
      console.error('Error validating analyst publication:', error)
    }
  }

  const handleSave = async (id: string | 'new') => {
    try {
      if (id === 'new') {
        await fetch('/api/analyst-portal/publications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm)
        })
      } else {
        await fetch(`/api/analyst-portal/publications/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm)
        })
      }
      
      setEditingId(null)
      setIsAddingNew(false)
      setEditForm({})
      await fetchPublications()
    } catch (error) {
      console.error('Error saving analyst publication:', error)
    }
  }

  const renderPublicationForm = (publication?: AnalystPublication) => {
    return (
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <Input
          placeholder="Publication Title"
          value={editForm.title || ''}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="date"
            placeholder="Expected Publication Date"
            value={editForm.expectedDate || ''}
            onChange={(e) => setEditForm({ ...editForm, expectedDate: e.target.value })}
          />
          
          <select
            className="w-full px-3 py-2 rounded-md border border-gray-300"
            value={editForm.status || 'PLANNED'}
            onChange={(e) => setEditForm({ ...editForm, status: e.target.value as AnalystPublication['status'] })}
          >
            <option value="PLANNED">Planned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="PUBLISHED">Published</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {editForm.status === 'PUBLISHED' && (
          <Input
            placeholder="Publication URL"
            value={editForm.url || ''}
            onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
          />
        )}

        <Textarea
          placeholder="Publication Notes"
          value={editForm.notes || ''}
          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
        />

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setEditingId(null)
              setIsAddingNew(false)
              setEditForm({})
            }}
          >
            Cancel
          </Button>
          <Button onClick={() => handleSave(publication?.id || 'new')}>
            Save Publication
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <section className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Your Analyst Publications
        </h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 h-24 rounded-lg" />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Your Analyst Publications
        </h2>
        <Button
          onClick={() => {
            setIsAddingNew(true)
            setEditForm({})
          }}
          disabled={isAddingNew || editingId !== null}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Publication
        </Button>
      </div>

      <div className="space-y-4">
        {isAddingNew && renderPublicationForm()}

        {publications.map((publication) => (
          <div
            key={publication.id}
            className={cn(
              'border rounded-lg p-4',
              publication.isValidated ? 'border-green-200 bg-green-50' : 'border-gray-200'
            )}
          >
            {editingId === publication.id ? (
              renderPublicationForm(publication)
            ) : (
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">
                    {publication.title}
                  </h3>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs',
                      {
                        'bg-yellow-100 text-yellow-800': publication.status === 'PLANNED',
                        'bg-blue-100 text-blue-800': publication.status === 'IN_PROGRESS',
                        'bg-green-100 text-green-800': publication.status === 'PUBLISHED',
                        'bg-gray-100 text-gray-800': publication.status === 'CANCELLED'
                      }
                    )}>
                      {publication.status}
                    </span>
                    
                    {publication.expectedDate && (
                      <span>Expected Publication: {new Date(publication.expectedDate).toLocaleDateString()}</span>
                    )}
                    
                    {publication.publishedDate && (
                      <span>Published On: {new Date(publication.publishedDate).toLocaleDateString()}</span>
                    )}
                  </div>

                  {publication.notes && (
                    <p className="text-sm text-gray-600">{publication.notes}</p>
                  )}

                  {publication.url && (
                    <a
                      href={publication.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View Published Article
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!publication.isValidated && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleValidate(publication.id)}
                      className="text-green-600 hover:text-green-700"
                      title="Validate Publication Details"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingId(publication.id)
                      setEditForm(publication)
                    }}
                    title="Edit Publication"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
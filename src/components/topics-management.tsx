'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  ChevronUp, 
  ChevronDown,
  Star,
  Sparkles,
  AlertCircle,
  Target
} from 'lucide-react'

interface PredefinedTopic {
  id: string
  name: string
  category: 'CORE' | 'ADDITIONAL'
  description?: string
  order: number
  createdAt: string
  updatedAt: string
}

interface EditingTopic {
  id?: string
  name: string
  category: 'CORE' | 'ADDITIONAL'
  order: number
}

export default function TopicsManagement() {
  const [topics, setTopics] = useState<PredefinedTopic[]>([])
  const [companyName, setCompanyName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingTopic, setEditingTopic] = useState<EditingTopic | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [simplifying, setSimplifying] = useState(false);
  const [simplificationResults, setSimplificationResults] = useState<any | null>(null);
  const [applyToAnalysts, setApplyToAnalysts] = useState(true);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  useEffect(() => {
    fetchTopics()
    fetchCompanyName()
  }, [])

  const fetchTopics = async () => {
    try {
      const response = await fetch('/api/settings/topics')
      if (response.ok) {
        const data = await response.json()
        setTopics(data.sort((a: PredefinedTopic, b: PredefinedTopic) => a.order - b.order))
      } else {
        throw new Error('Failed to fetch topics')
      }
    } catch (error) {
      console.error('Error fetching topics:', error)
      showNotification('error', 'Failed to load topics')
    } finally {
      setLoading(false)
    }
  }

  const fetchCompanyName = async () => {
    try {
      const response = await fetch('/api/settings/general')
      if (response.ok) {
        const data = await response.json()
        setCompanyName(data.companyName || 'Your Company')
      }
    } catch (error) {
      console.error('Error fetching company name:', error)
      setCompanyName('Your Company') // Fallback
    }
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const startCreating = (category: 'CORE' | 'ADDITIONAL') => {
    const nextOrder = Math.max(...topics.map(t => t.order), 0) + 1
    setEditingTopic({
      name: '',
      category,
      order: nextOrder
    })
    setIsCreating(true)
  }

  const startEditing = (topic: PredefinedTopic) => {
    setEditingTopic({
      id: topic.id,
      name: topic.name,
      category: topic.category,
      order: topic.order
    })
    setIsCreating(false)
  }

  const cancelEditing = () => {
    setEditingTopic(null)
    setIsCreating(false)
  }

  const saveTopic = async () => {
    if (!editingTopic || !editingTopic.name.trim()) return

    setSaving(true)
    try {
      const url = isCreating ? '/api/settings/topics' : `/api/settings/topics/${editingTopic.id}`
      const method = isCreating ? 'POST' : 'PUT'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingTopic.name.trim(),
          category: editingTopic.category,
          order: editingTopic.order
        }),
      })

      if (response.ok) {
        await fetchTopics()
        setEditingTopic(null)
        setIsCreating(false)
        showNotification('success', isCreating ? 'Topic created successfully' : 'Topic updated successfully')
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to save topic')
      }
    } catch (error) {
      console.error('Error saving topic:', error)
      showNotification('error', error instanceof Error ? error.message : 'Failed to save topic')
    } finally {
      setSaving(false)
    }
  }

  const deleteTopic = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the topic "${name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/settings/topics/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchTopics()
        showNotification('success', 'Topic deleted successfully')
      } else {
        throw new Error('Failed to delete topic')
      }
    } catch (error) {
      console.error('Error deleting topic:', error)
      showNotification('error', 'Failed to delete topic')
    }
  }

  const moveTopicOrder = async (topicId: string, direction: 'up' | 'down') => {
    const topic = topics.find(t => t.id === topicId)
    if (!topic) return

    const sameCategoryTopics = topics.filter(t => t.category === topic.category).sort((a, b) => a.order - b.order)
    const currentIndex = sameCategoryTopics.findIndex(t => t.id === topicId)
    
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === sameCategoryTopics.length - 1)
    ) {
      return
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const targetTopic = sameCategoryTopics[targetIndex]

    try {
      // Swap orders
      await fetch(`/api/settings/topics/${topic.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...topic, order: targetTopic.order }),
      })

      await fetch(`/api/settings/topics/${targetTopic.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...targetTopic, order: topic.order }),
      })

      await fetchTopics()
    } catch (error) {
      console.error('Error reordering topics:', error)
      showNotification('error', 'Failed to reorder topics')
    }
  }


  const coreTopics = topics.filter(t => t.category === 'CORE')
  const additionalTopics = topics.filter(t => t.category === 'ADDITIONAL')
  
  const runTopicSimplification = async () => {
    setSimplifying(true);
    setSimplificationResults(null);
    setNotification(null);

    try {
      const response = await fetch('/api/settings/topics/simplify', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setSimplificationResults(data);
        showNotification('success', data.message || 'Analysis complete!');
      } else {
        throw new Error(data.error || 'Failed to run simplification');
      }
    } catch (error) {
      console.error('Error running topic simplification:', error);
      showNotification('error', error instanceof Error ? error.message : 'Failed to run simplification');
    } finally {
      setSimplifying(false);
    }
  };

  const applySimplification = async () => {
    if (!simplificationResults?.simplifiedTopics) return;

    setSaving(true);
    try {
      const response = await fetch('/api/settings/topics/simplify', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          simplifiedTopics: simplificationResults.simplifiedTopics,
          applyToAnalysts: applyToAnalysts
        }),
      });

      if (response.ok) {
        await fetchTopics();
        setSimplificationResults(null);
        showNotification('success', 'Topic simplification applied successfully!');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to apply simplification');
      }
    } catch (error) {
      console.error('Error applying topic simplification:', error);
      showNotification('error', error instanceof Error ? error.message : 'Failed to apply simplification');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading topics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-lg border flex items-center justify-between ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <Star className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-current hover:opacity-70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Topic Simplification Section */}
      <div className="p-6 border border-dashed border-gray-300 rounded-lg bg-gray-50">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Run Topic Simplification (GPT-Powered)
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Automatically consolidate and simplify your 'Additional Topics' list using AI, while preserving your 'Core Topics'.
            </p>
          </div>
          <Button 
            onClick={runTopicSimplification}
            disabled={simplifying || saving}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
          >
            {simplifying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {simplificationResults ? 'Re-run Analysis' : 'Run Analysis'}
              </>
            )}
          </Button>
        </div>

        {simplificationResults && (
          <div className="mt-4 space-y-4">
            <div className="p-4 rounded-lg bg-white border border-gray-200">
              <h4 className="font-medium text-gray-800">Analysis Results</h4>
              <p className="text-sm text-gray-600">Original topics: {simplificationResults.stats.originalCount} | Simplified topics: {simplificationResults.stats.suggestedCount} | Reduction: {simplificationResults.stats.reductionPercentage}%</p>
            </div>

            {simplificationResults.suggestions.length > 0 && (
              <div>
                <h5 className="font-medium mb-2">Suggestions:</h5>
                <ul className="space-y-2">
                  {simplificationResults.suggestions.map((s: any, i: number) => (
                    <li key={i} className="p-3 rounded-lg bg-gray-100 text-sm">
                      <p><strong>Action:</strong> <span className="capitalize">{s.action}</span></p>
                      <p><strong>Original:</strong> {s.originalTopics.join(', ')}</p>
                      <p><strong>New:</strong> {s.newTopic}</p>
                      <p><strong>Reason:</strong> {s.reasoning}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-4 pt-4 border-t border-gray-200">
              {/* Option to apply deduplication to analysts */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="apply-to-analysts"
                  checked={applyToAnalysts}
                  onCheckedChange={setApplyToAnalysts}
                />
                <Label htmlFor="apply-to-analysts" className="text-sm">
                  Also remove duplicate topics from existing analysts
                </Label>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setSimplificationResults(null)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={applySimplification} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
                  {saving ? 'Applying...' : 'Apply Simplification'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Core Topics Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Core Topics for {companyName || 'Your Company'}
          </h3>
          <Button
            onClick={() => startCreating('CORE')}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>

        <div className="grid gap-3">
          {coreTopics.map((topic, index) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              isFirst={index === 0}
              isLast={index === coreTopics.length - 1}
              onEdit={startEditing}
              onDelete={deleteTopic}
              onMove={moveTopicOrder}
            />
          ))}
          
          {editingTopic && editingTopic.category === 'CORE' && (
            <TopicEditCard
              topic={editingTopic}
              isCreating={isCreating}
              saving={saving}
              onChange={setEditingTopic}
              onSave={saveTopic}
              onCancel={cancelEditing}
            />
          )}
        </div>
      </div>

      {/* Additional Topics Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            Additional Topics
          </h3>
          <Button
            onClick={() => startCreating('ADDITIONAL')}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>

        <div className="grid gap-3">
          {additionalTopics.map((topic, index) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              isFirst={index === 0}
              isLast={index === additionalTopics.length - 1}
              onEdit={startEditing}
              onDelete={deleteTopic}
              onMove={moveTopicOrder}
            />
          ))}
          
          {editingTopic && editingTopic.category === 'ADDITIONAL' && (
            <TopicEditCard
              topic={editingTopic}
              isCreating={isCreating}
              saving={saving}
              onChange={setEditingTopic}
              onSave={saveTopic}
              onCancel={cancelEditing}
            />
          )}
        </div>
      </div>

    </div>
  )
}

interface TopicCardProps {
  topic: PredefinedTopic
  isFirst: boolean
  isLast: boolean
  onEdit: (topic: PredefinedTopic) => void
  onDelete: (id: string, name: string) => void
  onMove: (id: string, direction: 'up' | 'down') => void
}

function TopicCard({ topic, isFirst, isLast, onEdit, onDelete, onMove }: TopicCardProps) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h4 className="font-medium text-gray-900">
              {topic.name}
            </h4>
            {topic.category === 'CORE' && (
              <Star className="w-4 h-4 text-yellow-500" />
            )}
          </div>
          {topic.description && (
            <p className="text-sm text-gray-600 mt-1">{topic.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Reorder buttons */}
          <div className="flex flex-col">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMove(topic.id, 'up')}
              disabled={isFirst}
              className="h-6 w-6 p-0"
            >
              <ChevronUp className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMove(topic.id, 'down')}
              disabled={isLast}
              className="h-6 w-6 p-0"
            >
              <ChevronDown className="w-3 h-3" />
            </Button>
          </div>

          {/* Edit button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(topic)}
            className="h-8 w-8 p-0"
          >
            <Edit className="w-4 h-4" />
          </Button>

          {/* Delete button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(topic.id, topic.name)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

interface TopicEditCardProps {
  topic: EditingTopic
  isCreating: boolean
  saving: boolean
  onChange: (topic: EditingTopic) => void
  onSave: () => void
  onCancel: () => void
}

function TopicEditCard({ topic, isCreating, saving, onChange, onSave, onCancel }: TopicEditCardProps) {
  return (
    <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
      <div className="space-y-4">
        <div>
          <Label htmlFor="topic-name" className="text-sm font-medium">
            Topic Name *
          </Label>
          <Input
            id="topic-name"
            value={topic.name}
            onChange={(e) => onChange({ ...topic, name: e.target.value })}
            placeholder="Enter topic name"
            className="mt-1"
          />
        </div>


        <div className="flex items-center gap-4">
          <Badge variant="secondary" className={
            topic.category === 'CORE' 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-blue-100 text-blue-800'
          }>
            {topic.category === 'CORE' ? 'Core Topic' : 'Additional Topic'}
          </Badge>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={!topic.name.trim() || saving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : isCreating ? 'Create Topic' : 'Update Topic'}
          </Button>
        </div>
      </div>
    </div>
  )
}

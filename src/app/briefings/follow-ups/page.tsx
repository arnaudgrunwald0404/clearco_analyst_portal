'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  CheckCircle2, 
  Circle, 
  Calendar, 
  User, 
  MessageSquare, 
  Edit3,
  Check,
  X,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FollowUp {
  id: string
  briefingId: string
  briefingTitle: string
  briefingDate: string
  analystName: string
  analystId: string
  description: string
  assignedTo?: string
  comment?: string
  isCompleted: boolean
  completedAt?: string
  createdAt: string
}

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')

  // Load follow-up states from localStorage
  const getFollowUpState = (id: string) => {
    if (typeof window === 'undefined') return { isCompleted: false, comment: '' }
    const saved = localStorage.getItem(`followup-${id}`)
    return saved ? JSON.parse(saved) : { isCompleted: false, comment: '' }
  }

  // Save follow-up state to localStorage
  const saveFollowUpState = (id: string, state: { isCompleted: boolean, comment: string }) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(`followup-${id}`, JSON.stringify(state))
  }

  const fetchFollowUps = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/briefings/follow-ups')
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch follow-ups')
      }

      // Merge with saved states from localStorage
      const followUpsWithState = result.data.map((followUp: FollowUp) => {
        const savedState = getFollowUpState(followUp.id)
        return {
          ...followUp,
          isCompleted: savedState.isCompleted,
          comment: savedState.comment || followUp.comment || ''
        }
      })

      setFollowUps(followUpsWithState)
    } catch (err) {
      console.error('Error fetching follow-ups:', err)
      setError(err instanceof Error ? err.message : 'Failed to load follow-ups')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFollowUps()
  }, [])

  const handleToggleComplete = (id: string) => {
    setFollowUps(prev => prev.map(followUp => {
      if (followUp.id === id) {
        const newState = {
          ...followUp,
          isCompleted: !followUp.isCompleted,
          completedAt: !followUp.isCompleted ? new Date().toISOString() : undefined
        }
        
        // Save to localStorage
        saveFollowUpState(id, {
          isCompleted: newState.isCompleted,
          comment: newState.comment || ''
        })
        
        return newState
      }
      return followUp
    }))
  }

  const handleEditComment = (id: string, currentComment: string) => {
    setEditingComment(id)
    setCommentText(currentComment)
  }

  const handleSaveComment = (id: string) => {
    setFollowUps(prev => prev.map(followUp => {
      if (followUp.id === id) {
        const newState = {
          ...followUp,
          comment: commentText
        }
        
        // Save to localStorage
        saveFollowUpState(id, {
          isCompleted: newState.isCompleted,
          comment: commentText
        })
        
        return newState
      }
      return followUp
    }))
    
    setEditingComment(null)
    setCommentText('')
  }

  const handleCancelComment = () => {
    setEditingComment(null)
    setCommentText('')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Follow Ups
            </h1>
            <p className="mt-2 text-gray-600">Track follow-up items from all briefings</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading follow-ups...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Follow Ups
            </h1>
            <p className="mt-2 text-gray-600">Track follow-up items from all briefings</p>
          </div>
        </div>
        
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <X className="w-12 h-12 mx-auto opacity-50" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Follow Ups</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchFollowUps}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-blue-600" />
            Follow Ups
          </h1>
          <p className="text-gray-600">Track follow-up items from all briefings</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchFollowUps}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle2 className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Follow Ups
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {followUps.length}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Circle className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Pending
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {followUps.filter(f => !f.isCompleted).length}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Completed
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {followUps.filter(f => f.isCompleted).length}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Follow Ups List */}
      {followUps.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Follow Ups Found</h3>
          <p className="text-gray-500">
            Follow-up items will appear here when briefings are transcribed and analyzed.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Follow Up
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Analyst
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Briefing Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comments
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {followUps.map((followUp) => (
                  <tr 
                    key={followUp.id} 
                    className={cn(
                      "group hover:bg-gray-50 transition-colors",
                      followUp.isCompleted && "opacity-75"
                    )}
                  >
                    {/* Status Checkbox */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleComplete(followUp.id)}
                        className={cn(
                          "flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors",
                          followUp.isCompleted
                            ? "bg-green-600 border-green-600 text-white"
                            : "border-gray-300 hover:border-green-500"
                        )}
                      >
                        {followUp.isCompleted && <Check className="w-4 h-4" />}
                      </button>
                    </td>

                    {/* Follow Up Description */}
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <p className={cn(
                          "text-sm text-gray-900",
                          followUp.isCompleted && "line-through text-gray-500"
                        )}>
                          {followUp.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          From: {followUp.briefingTitle}
                        </p>
                      </div>
                    </td>

                    {/* Analyst */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{followUp.analystName}</span>
                      </div>
                    </td>

                    {/* Briefing Date */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{formatDate(followUp.briefingDate)}</span>
                      </div>
                    </td>

                    {/* Assigned To */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "text-sm",
                        followUp.assignedTo ? "text-gray-900" : "text-gray-400 italic"
                      )}>
                        {followUp.assignedTo || 'Unassigned'}
                      </span>
                    </td>

                    {/* Comments */}
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        {editingComment === followUp.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Add a comment..."
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveComment(followUp.id)}
                              className="p-1 text-green-600 hover:text-green-700"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelComment}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-sm flex-1",
                              followUp.comment ? "text-gray-900" : "text-gray-400 italic"
                            )}>
                              {followUp.comment || 'No comments'}
                            </span>
                            <button
                              onClick={() => handleEditComment(followUp.id, followUp.comment || '')}
                              className="p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

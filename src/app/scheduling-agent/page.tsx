'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Calendar, 
  Mail, 
  Clock, 
  User, 
  Building, 
  MessageSquare, 
  Send,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react'

interface SchedulingConversation {
  id: string
  status: string
  subject: string
  createdAt: string
  analyst: {
    firstName: string
    lastName: string
    email: string
    company: string
    influence: string
  }
  emails: Array<{
    direction: 'OUTBOUND' | 'INBOUND'
    content: string
    sentAt: string
  }>
}

export default function SchedulingAgentPage() {
  const [conversations, setConversations] = useState<SchedulingConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAnalyst, setSelectedAnalyst] = useState('')
  const [subject, setSubject] = useState('')
  const [suggestedTimes, setSuggestedTimes] = useState([''])
  const [analysts, setAnalysts] = useState<any[]>([])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchConversations()
    fetchAnalysts()
  }, [])

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/scheduling-agent')
      const data = await response.json()
      if (data.success) {
        setConversations(data.data)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalysts = async () => {
    try {
      const response = await fetch('/api/analysts')
      const data = await response.json()
      if (data.success) {
        setAnalysts(data.data)
      }
    } catch (error) {
      console.error('Error fetching analysts:', error)
    }
  }

  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAnalyst || !subject || suggestedTimes.length === 0) {
      alert('Please fill in all required fields')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/scheduling-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analystId: selectedAnalyst,
          subject,
          suggestedTimes: suggestedTimes.filter(time => time.trim())
        })
      })

      const data = await response.json()
      if (data.success) {
        setSubject('')
        setSuggestedTimes([''])
        setSelectedAnalyst('')
        fetchConversations()
      } else {
        alert(data.error || 'Failed to create conversation')
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
      alert('Failed to create conversation')
    } finally {
      setCreating(false)
    }
  }

  const addTimeSlot = () => {
    setSuggestedTimes([...suggestedTimes, ''])
  }

  const removeTimeSlot = (index: number) => {
    setSuggestedTimes(suggestedTimes.filter((_, i) => i !== index))
  }

  const updateTimeSlot = (index: number, value: string) => {
    const newTimes = [...suggestedTimes]
    newTimes[index] = value
    setSuggestedTimes(newTimes)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'INITIATED': return 'bg-blue-100 text-blue-800'
      case 'WAITING_RESPONSE': return 'bg-yellow-100 text-yellow-800'
      case 'NEGOTIATING': return 'bg-orange-100 text-orange-800'
      case 'CONFIRMED': return 'bg-green-100 text-green-800'
      case 'SCHEDULED': return 'bg-purple-100 text-purple-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'EXPIRED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scheduling Agent</h1>
          <p className="text-gray-600">AI-powered scheduling assistant for analyst briefings</p>
        </div>
        <Button onClick={fetchConversations} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create New Conversation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Start New Conversation
            </CardTitle>
            <CardDescription>
              Initiate a scheduling conversation with an analyst
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateConversation} className="space-y-4">
              <div>
                <Label htmlFor="analyst">Analyst *</Label>
                <Select value={selectedAnalyst} onValueChange={setSelectedAnalyst}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an analyst" />
                  </SelectTrigger>
                  <SelectContent>
                    {analysts.map(analyst => (
                      <SelectItem key={analyst.id} value={analyst.id}>
                        {analyst.firstName} {analyst.lastName} - {analyst.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Briefing subject"
                />
              </div>

              <div>
                <Label>Suggested Times *</Label>
                <div className="space-y-2">
                  {suggestedTimes.map((time, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={time}
                        onChange={(e) => updateTimeSlot(index, e.target.value)}
                        placeholder="e.g., Tuesday 2:00 PM ET"
                      />
                      {suggestedTimes.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeTimeSlot(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTimeSlot}
                  >
                    Add Time Slot
                  </Button>
                </div>
              </div>

              <Button type="submit" disabled={creating} className="w-full">
                {creating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Start Conversation
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Active Conversations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Active Conversations
            </CardTitle>
            <CardDescription>
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {conversations.map(conversation => (
                <div key={conversation.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium">
                        {conversation.analyst.firstName} {conversation.analyst.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{conversation.analyst.company}</p>
                    </div>
                    <Badge className={getStatusColor(conversation.status)}>
                      {conversation.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm mb-2">{conversation.subject}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {conversation.emails.length} emails
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(conversation.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
              
              {conversations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No active conversations
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

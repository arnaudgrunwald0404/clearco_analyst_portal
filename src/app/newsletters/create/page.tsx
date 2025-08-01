'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Send, Users, Eye, EyeOff, Check, ArrowRight, Mail, Target, FileText, Filter, Sparkles } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'

// Email templates with company branding
const EMAIL_TEMPLATES = [
  {
    id: 'newsletter-template-1',
    name: 'ClearCompany Newsletter',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{{subject}}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .logo { max-width: 200px; margin-bottom: 20px; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .merge-tag { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/clearco-logo.png" alt="ClearCompany" class="logo">
          <h1>{{title}}</h1>
        </div>
        <div class="content">
          {{content}}
        </div>
        <div class="footer">
          <p>Best regards,<br>The ClearCompany Team</p>
          <p>© 2024 ClearCompany. All rights reserved.</p>
        </div>
      </body>
      </html>
    `
  },
  {
    id: 'newsletter-template-2',
    name: 'Analyst Update',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{{subject}}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1f2937; color: white; padding: 25px; text-align: center; }
          .logo { max-width: 180px; margin-bottom: 15px; }
          .content { background: white; padding: 25px; border-left: 4px solid #3b82f6; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
          .highlight { background: #eff6ff; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/clearco-logo.png" alt="ClearCompany" class="logo">
          <h2>{{title}}</h2>
        </div>
        <div class="content">
          {{content}}
        </div>
        <div class="footer">
          <p>Thank you for your continued partnership,<br>ClearCompany Team</p>
        </div>
      </body>
      </html>
    `
  }
]

// Merge tags available
const MERGE_TAGS = [
  { tag: '{{analyst.firstName}}', description: 'Analyst first name' },
  { tag: '{{analyst.lastName}}', description: 'Analyst last name' },
  { tag: '{{analyst.company}}', description: 'Analyst company' },
  { tag: '{{analyst.email}}', description: 'Analyst email' },
  { tag: '{{title}}', description: 'Newsletter title' },
  { tag: '{{subject}}', description: 'Email subject' },
  { tag: '{{content}}', description: 'Email content' }
]

function mergeTemplate(html: string, data: any) {
  return html
    .replace(/\{\{title\}\}/g, data.title || '')
    .replace(/\{\{subject\}\}/g, data.subject || '')
    .replace(/\{\{content\}\}/g, data.content || '')
    .replace(/\{\{analyst\.firstName\}\}/g, data.analyst?.firstName || '')
    .replace(/\{\{analyst\.lastName\}\}/g, data.analyst?.lastName || '')
    .replace(/\{\{analyst\.company\}\}/g, data.analyst?.company || '')
    .replace(/\{\{analyst\.email\}\}/g, data.analyst?.email || '')
}

type Step = 1 | 2 | 3

export default function CreateNewsletterPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  
  // Step 1: Newsletter Basics
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [objectives, setObjectives] = useState('')
  
  // Step 2: Audience Selection
  const [audienceDescription, setAudienceDescription] = useState('')
  const [selectedAnalysts, setSelectedAnalysts] = useState<any[]>([])
  const [analysts, setAnalysts] = useState<any[]>([])
  
  // Traditional filter state
  const [filterSearch, setFilterSearch] = useState('')
  const [filterCompanies, setFilterCompanies] = useState<string[]>([])
  const [filterInfluences, setFilterInfluences] = useState<string[]>([])
  const [filterStatuses, setFilterStatuses] = useState<string[]>([])
  const [filterTypes, setFilterTypes] = useState<string[]>([])
  const [filterRelationshipHealths, setFilterRelationshipHealths] = useState<string[]>([])
  const [filterOptions, setFilterOptions] = useState<any>({
    companies: [],
    influences: [],
    statuses: [],
    types: [],
    relationshipHealths: []
  })
  const [filteredAnalysts, setFilteredAnalysts] = useState<any[]>([])
  const [filterLoading, setFilterLoading] = useState(false)
  
  // Step 3: Email Creation
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [templateId, setTemplateId] = useState<string>('')
  const [status, setStatus] = useState<'DRAFT' | 'SCHEDULED'>('DRAFT')
  const [scheduledAt, setScheduledAt] = useState<string>('')
  const [showPreview, setShowPreview] = useState(true)
  const [contentRef, setContentRef] = useState<HTMLTextAreaElement | null>(null)
  const [subjectRef, setSubjectRef] = useState<HTMLInputElement | null>(null)
  const [focusedField, setFocusedField] = useState<'content' | 'subject' | null>(null)
  
  // General state
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // For preview - use first selected analyst as example
  const previewAnalyst = selectedAnalysts[0] || {
    firstName: 'John',
    lastName: 'Doe',
    company: 'Example Corp',
    email: 'john.doe@example.com'
  }

  const selectedTemplate = EMAIL_TEMPLATES.find(t => t.id === templateId)
  const previewHtml = selectedTemplate ? mergeTemplate(selectedTemplate.html, { 
    title, 
    subject, 
    content,
    analyst: previewAnalyst
  }) : ''

  // Function to insert merge tag at cursor position
  const insertMergeTag = (tag: string, field: 'content' | 'subject' = 'content') => {
    const targetRef = field === 'content' ? contentRef : subjectRef
    if (!targetRef) return
    
    const element = targetRef
    const start = element.selectionStart || 0
    const end = element.selectionEnd || 0
    const currentValue = field === 'content' ? content : subject
    
    // Insert the tag at cursor position
    const newValue = currentValue.substring(0, start) + tag + currentValue.substring(end)
    
    if (field === 'content') {
      setContent(newValue)
    } else {
      setSubject(newValue)
    }
    
    // Set cursor position after the inserted tag
    const newCursorPos = start + tag.length
    setTimeout(() => {
      element.focus()
      element.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  useEffect(() => {
    const fetchAnalysts = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/analysts')
        const data = await response.json()
        setAnalysts(data.data || [])
      } catch (e) {
        setError('Failed to load analysts')
      } finally {
        setLoading(false)
      }
    }
    fetchAnalysts()
  }, [])

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const response = await fetch('/api/analysts/filtered', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        })
        const data = await response.json()
        if (data.success) {
          setFilterOptions(data.data.filterOptions || {})
        }
      } catch (e) {
        console.error('Failed to load filter options:', e)
      }
    }
    loadFilterOptions()
  }, [])

  const applyAudienceFilters = async () => {
    if (!audienceDescription.trim()) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/analysts/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audienceDescription })
      })
      const data = await response.json()
      if (data.success) {
        setSelectedAnalysts(data.data || [])
      } else {
        setError(data.error || 'Failed to find analysts')
      }
    } catch (e) {
      setError('Failed to find analysts')
    } finally {
      setLoading(false)
    }
  }

  const applyTraditionalFilters = async () => {
    setFilterLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/analysts/filtered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companies: filterCompanies,
          influences: filterInfluences,
          statuses: filterStatuses,
          types: filterTypes,
          relationshipHealths: filterRelationshipHealths,
          search: filterSearch
        })
      })
      const data = await response.json()
      if (data.success) {
        setFilteredAnalysts(data.data.analysts || [])
        setFilterOptions(data.data.filterOptions || {})
      } else {
        setError(data.error || 'Failed to find analysts')
      }
    } catch (e) {
      setError('Failed to find analysts')
    } finally {
      setFilterLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    
    if (!title.trim() || !subject.trim() || !content.trim() || selectedAnalysts.length === 0) {
      setError('Please fill in all required fields and select at least one recipient.')
      return
    }
    if (status === 'SCHEDULED' && !scheduledAt) {
      setError('Please select a scheduled date and time.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/newsletters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subject,
          content,
          templateId,
          status,
          scheduledAt: status === 'SCHEDULED' && scheduledAt ? new Date(scheduledAt).toISOString() : null,
          recipientAnalystIds: selectedAnalysts.map(a => a.id)
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSuccess(true)
        setTimeout(() => router.push('/newsletters'), 1200)
      } else {
        setError(data.error || 'Failed to create newsletter')
      }
    } catch (e) {
      setError('Failed to create newsletter')
    } finally {
      setSubmitting(false)
    }
  }

  const canProceedToStep2 = title.trim() && description.trim() && objectives.trim()
  const canProceedToStep3 = selectedAnalysts.length > 0
  const canSubmit = subject.trim() && content.trim() && templateId

  const steps = [
    { id: 1, title: 'Newsletter Basics', icon: FileText, description: 'Name and objectives' },
    { id: 2, title: 'Audience Selection', icon: Target, description: 'Choose recipients' },
    { id: 3, title: 'Email Creation', icon: Mail, description: 'Content and template' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-2 sm:px-6">
      <div className="max-w-6xl mx-auto p-8 bg-white rounded-2xl shadow-lg">
        {/* Header */}
        <div className="mb-10">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/newsletters')}
            className="mb-6 px-4 py-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Newsletters
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Newsletter</h1>
          <p className="text-gray-600 mt-2">Step-by-step newsletter creation with intelligent audience selection</p>
        </div>

        {/* Stepper */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`
                      w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all
                      ${isActive ? 'bg-blue-600 border-blue-600 text-white' : ''}
                      ${isCompleted ? 'bg-green-600 border-green-600 text-white' : ''}
                      ${!isActive && !isCompleted ? 'bg-white border-gray-300 text-gray-500' : ''}
                    `}>
                      {isCompleted ? (
                        <Check className="h-7 w-7" />
                      ) : (
                        <StepIcon className="h-7 w-7" />
                      )}
                    </div>
                    <div className="mt-3 text-center">
                      <div className={`text-base font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}> 
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{step.description}</div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-20 h-0.5 mx-6 ${isCompleted ? 'bg-green-600' : 'bg-gray-300'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className={currentStep === 3 ? "space-y-10" : "grid grid-cols-1 lg:grid-cols-3 gap-12"}>
          {/* Main Content */}
          <div className={currentStep === 3 ? "space-y-10" : "lg:col-span-2 space-y-10"}>
            {currentStep === 1 && (
              <Card className="p-2 sm:p-4 md:p-6 lg:p-8">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <FileText className="h-6 w-6" />
                    Newsletter Basics
                  </CardTitle>
                  <CardDescription className="text-base mt-2">Define your newsletter's name, description, and objectives</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-base">Newsletter Name *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., 'Q4 Analyst Update' or 'Product Launch Newsletter'"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="mt-2 px-4 py-3 text-base rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-base">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of what this newsletter is about..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="mt-2 px-4 py-3 text-base rounded-lg min-h-[80px]"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="objectives" className="text-base">Objectives *</Label>
                    <Textarea
                      id="objectives"
                      placeholder="What do you want to achieve with this newsletter? (e.g., 'Update analysts on our latest product features and gather feedback')"
                      value={objectives}
                      onChange={e => setObjectives(e.target.value)}
                      className="mt-2 px-4 py-3 text-base rounded-lg min-h-[100px]"
                      rows={4}
                    />
                  </div>

                  <div className="pt-6">
                    <Button 
                      onClick={() => setCurrentStep(2)}
                      disabled={!canProceedToStep2}
                      className="w-full py-3 text-lg rounded-lg"
                    >
                      Continue to Audience Selection
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card className="p-2 sm:p-4 md:p-6 lg:p-8">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Target className="h-6 w-6" />
                    Audience Selection
                  </CardTitle>
                  <CardDescription className="text-base mt-2">Choose your target audience using AI-powered natural language or traditional filters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-2">
                  <Tabs defaultValue="ai" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="ai" className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        AI-Powered
                      </TabsTrigger>
                      <TabsTrigger value="filters" className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Traditional Filters
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="ai" className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="audience" className="text-base">Audience Description</Label>
                        <Textarea
                          id="audience"
                          placeholder="e.g., 'All Tier 1 HR Technology analysts from Gartner and Forrester who are actively engaged'"
                          value={audienceDescription}
                          onChange={e => setAudienceDescription(e.target.value)}
                          className="mt-2 px-4 py-3 text-base rounded-lg min-h-[80px]"
                          rows={3}
                        />
                        <div className="mt-2 text-sm text-gray-500">
                          Examples: "Tier 1 analysts", "Gartner and Forrester", "HR Technology companies", "Active analysts"
                        </div>
                      </div>
                      
                      <Button 
                        onClick={applyAudienceFilters}
                        disabled={!audienceDescription.trim() || loading}
                        variant="outline"
                        className="w-full py-3 text-lg rounded-lg"
                      >
                        <Users className="mr-2 h-5 w-5" />
                        Apply Filters & Find Analysts
                      </Button>

                      {loading && (
                        <div className="text-center py-8">
                          <p className="text-gray-500">Finding analysts...</p>
                        </div>
                      )}

                      {error && (
                        <div className="text-center py-8 text-red-500">
                          <p>{error}</p>
                        </div>
                      )}

                      {selectedAnalysts.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-base">Selected Recipients ({selectedAnalysts.length})</Label>
                          <div className="mt-2 max-h-60 overflow-y-auto space-y-2 border rounded-lg p-3">
                            {selectedAnalysts.map(analyst => (
                              <div key={analyst.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div>
                                  <div className="font-medium">{analyst.firstName} {analyst.lastName}</div>
                                  <div className="text-sm text-gray-500">{analyst.company}</div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedAnalysts(prev => prev.filter(a => a.id !== analyst.id))}
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="filters" className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="filterSearch" className="text-base">Search</Label>
                          <Input
                            id="filterSearch"
                            placeholder="Search by name, email, company, or title..."
                            value={filterSearch}
                            onChange={e => setFilterSearch(e.target.value)}
                            className="mt-2 px-4 py-3 text-base rounded-lg"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-base">Companies</Label>
                            <div className="mt-2 max-h-32 overflow-y-auto space-y-2 border rounded-lg p-3">
                              {filterOptions.companies.map((company: string) => (
                                <div key={company} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`company-${company}`}
                                    checked={filterCompanies.includes(company)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setFilterCompanies(prev => [...prev, company])
                                      } else {
                                        setFilterCompanies(prev => prev.filter(c => c !== company))
                                      }
                                    }}
                                  />
                                  <Label htmlFor={`company-${company}`} className="text-sm">{company}</Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-base">Influence Levels</Label>
                            <div className="mt-2 max-h-32 overflow-y-auto space-y-2 border rounded-lg p-3">
                              {filterOptions.influences.map((influence: string) => (
                                <div key={influence} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`influence-${influence}`}
                                    checked={filterInfluences.includes(influence)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setFilterInfluences(prev => [...prev, influence])
                                      } else {
                                        setFilterInfluences(prev => prev.filter(i => i !== influence))
                                      }
                                    }}
                                  />
                                  <Label htmlFor={`influence-${influence}`} className="text-sm">{influence}</Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-base">Status</Label>
                            <div className="mt-2 max-h-32 overflow-y-auto space-y-2 border rounded-lg p-3">
                              {filterOptions.statuses.map((status: string) => (
                                <div key={status} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`status-${status}`}
                                    checked={filterStatuses.includes(status)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setFilterStatuses(prev => [...prev, status])
                                      } else {
                                        setFilterStatuses(prev => prev.filter(s => s !== status))
                                      }
                                    }}
                                  />
                                  <Label htmlFor={`status-${status}`} className="text-sm">{status}</Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-base">Types</Label>
                            <div className="mt-2 max-h-32 overflow-y-auto space-y-2 border rounded-lg p-3">
                              {filterOptions.types.map((type: string) => (
                                <div key={type} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`type-${type}`}
                                    checked={filterTypes.includes(type)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setFilterTypes(prev => [...prev, type])
                                      } else {
                                        setFilterTypes(prev => prev.filter(t => t !== type))
                                      }
                                    }}
                                  />
                                  <Label htmlFor={`type-${type}`} className="text-sm">{type}</Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-base">Relationship Health</Label>
                            <div className="mt-2 max-h-32 overflow-y-auto space-y-2 border rounded-lg p-3">
                              {filterOptions.relationshipHealths.map((health: string) => (
                                <div key={health} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`health-${health}`}
                                    checked={filterRelationshipHealths.includes(health)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setFilterRelationshipHealths(prev => [...prev, health])
                                      } else {
                                        setFilterRelationshipHealths(prev => prev.filter(h => h !== health))
                                      }
                                    }}
                                  />
                                  <Label htmlFor={`health-${health}`} className="text-sm">{health}</Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <Button 
                          onClick={applyTraditionalFilters}
                          disabled={filterLoading}
                          variant="outline"
                          className="w-full py-3 text-lg rounded-lg"
                        >
                          <Filter className="mr-2 h-5 w-5" />
                          {filterLoading ? 'Finding Analysts...' : 'Apply Filters & Find Analysts'}
                        </Button>

                        {filterLoading && (
                          <div className="text-center py-8">
                            <p className="text-gray-500">Finding analysts...</p>
                          </div>
                        )}

                        {error && (
                          <div className="text-center py-8 text-red-500">
                            <p>{error}</p>
                          </div>
                        )}

                        {filteredAnalysts.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-base">Filtered Analysts ({filteredAnalysts.length})</Label>
                            <div className="mt-2 max-h-60 overflow-y-auto space-y-2 border rounded-lg p-3">
                              {filteredAnalysts.map(analyst => (
                                <div key={analyst.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div>
                                    <div className="font-medium">{analyst.firstName} {analyst.lastName}</div>
                                    <div className="text-sm text-gray-500">{analyst.company} • {analyst.influence}</div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (!selectedAnalysts.find(a => a.id === analyst.id)) {
                                        setSelectedAnalysts(prev => [...prev, analyst])
                                      }
                                    }}
                                    disabled={selectedAnalysts.find(a => a.id === analyst.id)}
                                  >
                                    {selectedAnalysts.find(a => a.id === analyst.id) ? 'Added' : 'Add'}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="flex gap-3 pt-6">
                    <Button 
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      className="flex-1 py-3 text-lg rounded-lg"
                    >
                      <ArrowLeft className="mr-2 h-5 w-5" />
                      Back
                    </Button>
                    <Button 
                      onClick={() => setCurrentStep(3)}
                      disabled={!canProceedToStep3}
                      className="flex-1 py-3 text-lg rounded-lg"
                    >
                      Continue to Email Creation
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <Card className="p-2 sm:p-4 md:p-6 lg:p-8">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Mail className="h-6 w-6" />
                    Email Creation
                  </CardTitle>
                  <CardDescription className="text-base mt-2">Create your email content and select a template</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-base">Subject Line *</Label>
                      <Input
                        id="subject"
                        placeholder="Email subject line"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        onFocus={() => setFocusedField('subject')}
                        className="mt-2 px-4 py-3 text-base rounded-lg"
                        ref={setSubjectRef}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="template" className="text-base">Email Template</Label>
                      <Select value={templateId} onValueChange={setTemplateId}>
                        <SelectTrigger className="mt-2 px-4 py-3 text-base rounded-lg">
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                        <SelectContent>
                          {EMAIL_TEMPLATES.map(template => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content" className="text-base">Email Content *</Label>
                    <Textarea
                      id="content"
                      placeholder="Write your email content here (use merge tags like {{analyst.firstName}}, {{analyst.company}})"
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      onFocus={() => setFocusedField('content')}
                      className="mt-2 px-4 py-3 text-base rounded-lg min-h-[200px]"
                      ref={setContentRef}
                    />
                    <div className="mt-2 text-sm text-gray-500">
                      {content.length} characters
                    </div>
                  </div>

                  {/* Merge Tags */}
                  <div className="space-y-2">
                    <Label className="text-base">Available Merge Tags</Label>
                    {focusedField && (
                      <div className="mt-2 text-xs text-blue-600 font-medium">
                        📝 Inserting into: {focusedField} field
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {MERGE_TAGS.map(tag => (
                        <Badge 
                          key={tag.tag} 
                          variant="secondary" 
                          className="text-xs cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => insertMergeTag(tag.tag, focusedField || 'content')}
                          title={`Click to insert ${tag.tag} into ${focusedField || 'content'} field`}
                        >
                          {tag.tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {focusedField ? 
                        `Click any tag above to insert it into the ${focusedField} field` : 
                        'Click any tag above to insert it at your cursor position'
                      }
                    </div>
                  </div>

                  {/* Scheduling */}
                  <div className="border-t pt-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <Switch
                        id="scheduled"
                        checked={status === 'SCHEDULED'}
                        onCheckedChange={(checked) => setStatus(checked ? 'SCHEDULED' : 'DRAFT')}
                      />
                      <Label htmlFor="scheduled" className="text-base">Schedule for later</Label>
                    </div>

                    {status === 'SCHEDULED' && (
                      <div className="space-y-2">
                        <Label htmlFor="scheduledAt" className="text-base">Scheduled Date & Time</Label>
                        <Input
                          id="scheduledAt"
                          type="datetime-local"
                          value={scheduledAt}
                          onChange={e => setScheduledAt(e.target.value)}
                          className="mt-2 px-4 py-3 text-base rounded-lg"
                          min={new Date().toISOString().slice(0,16)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-6">
                    <Button 
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                      className="flex-1 py-3 text-lg rounded-lg"
                    >
                      <ArrowLeft className="mr-2 h-5 w-5" />
                      Back
                    </Button>
                    <Button 
                      onClick={handleSubmit}
                      disabled={submitting || !canSubmit}
                      className="flex-1 py-3 text-lg rounded-lg"
                    >
                      <Send className="mr-2 h-5 w-5" />
                      {submitting ? 'Creating...' : 'Create Newsletter'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error/Success Messages */}
            {error && (
              <Card className="border-red-200 bg-red-50 p-2 sm:p-4 md:p-6 lg:p-8">
                <CardContent className="pt-6">
                  <div className="text-red-600 text-sm">{error}</div>
                </CardContent>
              </Card>
            )}
            
            {success && (
              <Card className="border-green-200 bg-green-50 p-2 sm:p-4 md:p-6 lg:p-8">
                <CardContent className="pt-6">
                  <div className="text-green-600 text-sm">Newsletter created successfully! Redirecting...</div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Only show for steps 1 and 2 */}
          {currentStep < 3 && (
            <div className="space-y-6">
              {/* Step Summary */}
              {currentStep > 1 && (
                <Card className="p-2 sm:p-4 md:p-6 lg:p-8">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Step {currentStep} Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentStep === 2 && (
                      <>
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-700">Selected Recipients</div>
                          <div className="text-sm text-gray-600">{selectedAnalysts.length} analysts</div>
                        </div>
                        {selectedAnalysts.length > 0 && (
                          <div className="max-h-40 overflow-y-auto">
                            {selectedAnalysts.slice(0, 5).map(analyst => (
                              <div key={analyst.id} className="text-xs text-gray-600 py-1">
                                • {analyst.firstName} {analyst.lastName} ({analyst.company})
                              </div>
                            ))}
                            {selectedAnalysts.length > 5 && (
                              <div className="text-xs text-gray-500">
                                ...and {selectedAnalysts.length - 5} more
                              </div>
                            )}
                          </div>
                        )}
                        {audienceDescription && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-gray-700">AI Description</div>
                            <div className="text-sm text-gray-600">{audienceDescription}</div>
                          </div>
                        )}
                        {(filterCompanies.length > 0 || filterInfluences.length > 0 || filterStatuses.length > 0 || filterTypes.length > 0 || filterRelationshipHealths.length > 0) && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-gray-700">Active Filters</div>
                            <div className="text-xs text-gray-600 space-y-1">
                              {filterCompanies.length > 0 && (
                                <div>Companies: {filterCompanies.join(', ')}</div>
                              )}
                              {filterInfluences.length > 0 && (
                                <div>Influence: {filterInfluences.join(', ')}</div>
                              )}
                              {filterStatuses.length > 0 && (
                                <div>Status: {filterStatuses.join(', ')}</div>
                              )}
                              {filterTypes.length > 0 && (
                                <div>Types: {filterTypes.join(', ')}</div>
                              )}
                              {filterRelationshipHealths.length > 0 && (
                                <div>Health: {filterRelationshipHealths.join(', ')}</div>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Preview Section - Full Width for Step 3 */}
        {currentStep === 3 && (
          <Card className="p-2 sm:p-4 md:p-6 lg:p-8">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Eye className="h-6 w-6" />
                  Live Preview
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </CardTitle>
              <CardDescription className="text-base">
                Preview using {previewAnalyst.firstName} {previewAnalyst.lastName} from {previewAnalyst.company}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showPreview && selectedTemplate ? (
                <div className="space-y-4">
                  {/* Email Headers */}
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">From:</span>
                        <div className="text-gray-900">ClearCompany Team {'<'}scheduling@clearcompany.com{'>'}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">To:</span>
                        <div className="text-gray-900">{previewAnalyst.firstName} {previewAnalyst.lastName} {'<'}{previewAnalyst.email}{'>'}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Subject:</span>
                        <div className="text-gray-900">{subject || 'No subject'}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Email Content Preview */}
                  <div className="border rounded-lg overflow-hidden">
                    <iframe
                      title="Newsletter Preview"
                      srcDoc={previewHtml}
                      className="w-full h-[600px] bg-white"
                      style={{ border: 'none' }}
                    />
                  </div>
                </div>
              ) : (
                <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                  {!selectedTemplate ? 'Select a template to see preview' : 'Preview hidden'}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 
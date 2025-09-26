'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Save, Send, Mail, FileText, Target, Users, Filter, Check, Eye, EyeOff, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{{title}}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .header { text-align: center; border-bottom: 3px solid #007cba; padding-bottom: 20px; margin-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #007cba; }
          .content { margin-bottom: 30px; }
          .footer { text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">{{title}}</div>
          </div>
          <div class="content">
            {{content}}
          </div>
          <div class="footer">
            <p>This email was sent by ClearCompany</p>
            <p>If you no longer wish to receive these emails, you can unsubscribe.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
]

const MERGE_TAGS = [
  { tag: '{{analyst.firstName}}', description: 'Analyst first name' },
  { tag: '{{analyst.lastName}}', description: 'Analyst last name' },
  { tag: '{{analyst.company}}', description: 'Analyst company' },
  { tag: '{{analyst.email}}', description: 'Analyst email' },
  { tag: '{{title}}', description: 'Newsletter title' },
  { tag: '{{subject}}', description: 'Email subject line' }
]

type Step = 1 | 2 | 3

export default function EditNewsletterPage() {
  const router = useRouter()
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id
  
  // Step navigation
  const [currentStep, setCurrentStep] = useState<Step>(1)
  
  // Step 1: Newsletter Basics
  const [title, setTitle] = useState(() => {
    if (typeof window !== 'undefined' && id) {
      return localStorage.getItem(`newsletter-edit-${id}-title`) || ''
    }
    return ''
  })
  const [description, setDescription] = useState(() => {
    if (typeof window !== 'undefined' && id) {
      return localStorage.getItem(`newsletter-edit-${id}-description`) || ''
    }
    return ''
  })
  
  // Step 2: Audience Selection
  const [audienceDescription, setAudienceDescription] = useState('')
  const [selectedAnalysts, setSelectedAnalysts] = useState<any[]>(() => {
    if (typeof window !== 'undefined' && id) {
      const saved = localStorage.getItem(`newsletter-edit-${id}-selectedAnalysts`)
      return saved ? JSON.parse(saved) : []
    }
    return []
  })
  const [analysts, setAnalysts] = useState<any[]>([])
  
  // Traditional filter state
  const [filterSearch, setFilterSearch] = useState('')
  const [filterCompanies, setFilterCompanies] = useState<string[]>([])
  const [filterInfluences, setFilterInfluences] = useState<string[]>([])
  const [filterStatuses, setFilterStatuses] = useState<string[]>([])
  const [filterTypes, setFilterTypes] = useState<string[]>([])
  const [filterRelationshipHealths, setFilterRelationshipHealths] = useState<string[]>([])
  const DEFAULT_FILTER_OPTIONS = {
    companies: [] as string[],
    influences: [] as string[],
    statuses: [] as string[],
    types: [] as string[],
    relationshipHealths: [] as string[],
  }
  const [filterOptions, setFilterOptions] = useState<any>(DEFAULT_FILTER_OPTIONS)
  const [filteredAnalysts, setFilteredAnalysts] = useState<any[]>([])
  const [filterLoading, setFilterLoading] = useState(false)
  
  // Step 3: Email Creation
  const [subject, setSubject] = useState(() => {
    if (typeof window !== 'undefined' && id) {
      return localStorage.getItem(`newsletter-edit-${id}-subject`) || ''
    }
    return ''
  })
  const [content, setContent] = useState(() => {
    if (typeof window !== 'undefined' && id) {
      return localStorage.getItem(`newsletter-edit-${id}-content`) || ''
    }
    return ''
  })
  const [templateId, setTemplateId] = useState<string>(() => {
    if (typeof window !== 'undefined' && id) {
      return localStorage.getItem(`newsletter-edit-${id}-templateId`) || ''
    }
    return ''
  })
  const [status, setStatus] = useState<'DRAFT' | 'SCHEDULED'>('DRAFT')
  const [scheduledAt, setScheduledAt] = useState<string>('')
  
  // UI state
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [focusedField, setFocusedField] = useState<'subject' | 'content' | null>(null)
  const [contentRef, setContentRef] = useState<HTMLTextAreaElement | null>(null)
  const [subjectRef, setSubjectRef] = useState<HTMLInputElement | null>(null)
  const [showPreview, setShowPreview] = useState(true)

  // Step definitions
  const steps = [
    { id: 1, title: 'Newsletter Basics', icon: FileText, description: 'Name and description' },
    { id: 2, title: 'Audience Selection', icon: Target, description: 'Choose recipients' },
    { id: 3, title: 'Email Creation', icon: Mail, description: 'Content and template' }
  ]

  // Validation
  const canProceedToStep2 = title.trim() && description.trim()
  const canProceedToStep3 = selectedAnalysts.length > 0
  const canSubmit = subject.trim() && content.trim() && templateId

  // For preview - use first selected analyst as example
  const previewAnalyst = selectedAnalysts[0] || {
    firstName: 'John',
    lastName: 'Doe',
    company: 'Example Corp',
    email: 'john.doe@example.com'
  }
  
  const selectedTemplate = EMAIL_TEMPLATES.find(t => t.id === templateId)
  const previewHtml = selectedTemplate ? selectedTemplate.html
    .replace('{{title}}', title)
    .replace('{{subject}}', subject) 
    .replace('{{content}}', content || 'Your email content will appear here...')
    .replace('{{analyst.firstName}}', previewAnalyst.firstName)
    .replace('{{analyst.lastName}}', previewAnalyst.lastName)
    .replace('{{analyst.company}}', previewAnalyst.company) : ''

  // Function to insert merge tag at cursor position
  const insertMergeTag = (tag: string, field: 'content' | 'subject' = 'content') => {
    const targetRef = field === 'content' ? contentRef : subjectRef
    if (!targetRef) return
    
    const element = targetRef
    const start = element.selectionStart || 0
    const end = element.selectionEnd || 0
    const currentValue = field === 'content' ? content : subject
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

  const handleAnalystToggle = (analyst: any, checked: boolean) => {
    if (checked) {
      setSelectedAnalysts(prev => [...prev, analyst])
    } else {
      setSelectedAnalysts(prev => prev.filter(a => a.id !== analyst.id))
    }
  }

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
    
    const filters = {
      companies: filterCompanies,
      influences: filterInfluences,
      statuses: filterStatuses,
      types: filterTypes,
      relationshipHealths: filterRelationshipHealths,
      search: filterSearch
    }
    
    console.log('🔍 Traditional Filters - Applying filters:', filters)
    
    try {
      const response = await fetch('/api/analysts/filtered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      })
      const data = await response.json()
      
      console.log('📡 Traditional Filters - API Response:', { 
        success: data.success, 
        analystCount: data.data?.analysts?.length || 0,
        error: data.error 
      })
      
      if (data.success) {
        setFilteredAnalysts(data.data.analysts || [])
        setFilterOptions({
          ...DEFAULT_FILTER_OPTIONS,
          ...(data.data.filterOptions || {}),
        })
      } else {
        setError(data.error || 'Failed to filter analysts')
      }
    } catch (e) {
      console.error('❌ Traditional Filters - Error:', e)
      setError('Failed to filter analysts')
    } finally {
      setFilterLoading(false)
    }
  }

  // Save form data to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      localStorage.setItem(`newsletter-edit-${id}-title`, title)
    }
  }, [title, id])

  useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      localStorage.setItem(`newsletter-edit-${id}-description`, description)
    }
  }, [description, id])

  useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      localStorage.setItem(`newsletter-edit-${id}-selectedAnalysts`, JSON.stringify(selectedAnalysts))
    }
  }, [selectedAnalysts, id])

  useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      localStorage.setItem(`newsletter-edit-${id}-subject`, subject)
    }
  }, [subject, id])

  useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      localStorage.setItem(`newsletter-edit-${id}-content`, content)
    }
  }, [content, id])

  useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      localStorage.setItem(`newsletter-edit-${id}-templateId`, templateId)
    }
  }, [templateId, id])

  // Load filter options for traditional filters
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        console.log('🔄 Loading filter options...')
        const response = await fetch('/api/analysts/filtered', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        })
        const data = await response.json()
        if (data.success) {
          const options = {
            ...DEFAULT_FILTER_OPTIONS,
            ...(data.data.filterOptions || {}),
          }
          console.log('✅ Filter options loaded:', options)
          setFilterOptions(options)
        } else {
          console.error('❌ Failed to load filter options:', data.error)
        }
      } catch (e) {
        console.error('❌ Failed to load filter options:', e)
      }
    }
    loadFilterOptions()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      // Clear localStorage when loading fresh data from database
      if (typeof window !== 'undefined' && id) {
        localStorage.removeItem(`newsletter-edit-${id}-title`)
        localStorage.removeItem(`newsletter-edit-${id}-description`)
        localStorage.removeItem(`newsletter-edit-${id}-selectedAnalysts`)
        localStorage.removeItem(`newsletter-edit-${id}-subject`)
        localStorage.removeItem(`newsletter-edit-${id}-content`)
        localStorage.removeItem(`newsletter-edit-${id}-templateId`)
      }
      
      try {
        const [newsletterRes, analystsRes] = await Promise.all([
          fetch(`/api/newsletters/${id}`),
          fetch('/api/analysts')
        ])
        
        const newsletterData = await newsletterRes.json()
        const analystsData = await analystsRes.json()
        
        setAnalysts(analystsData.data || [])
        
        if (newsletterData.success && newsletterData.data) {
          const newsletter = newsletterData.data
          // Step 1 data
          setTitle(newsletter.title)
          setDescription(newsletter.description || '')
          
          // Step 2 data - get selected analysts from subscriptions
          if (newsletter.subscriptions) {
            const selectedAnalystIds = newsletter.subscriptions.map((s: any) => s.analystId)
            const selectedAnalystsData = (analystsData.data || []).filter((a: any) => 
              selectedAnalystIds.includes(a.id)
            )
            setSelectedAnalysts(selectedAnalystsData)
          }
          
          // Step 3 data
          setSubject(newsletter.subject)
          setContent(newsletter.content)
          setStatus(newsletter.status)
          setScheduledAt(newsletter.scheduledAt ? new Date(newsletter.scheduledAt).toISOString().slice(0,16) : '')
          setTemplateId(newsletter.templateId || 'newsletter-template-1')
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('Failed to load newsletter data')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchData()
    }
  }, [id])

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
      const response = await fetch(`/api/newsletters/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          subject,
          content,
          templateId,
          status,
          scheduledAt: status === 'SCHEDULED' && scheduledAt ? new Date(scheduledAt).toISOString() : null,
          recipientAnalystIds: selectedAnalysts.map(a => a.id)
        })
      })
      const data = await response.json()
      if (response.ok && data.success) {
        // Clear localStorage on successful update
        if (typeof window !== 'undefined' && id) {
          localStorage.removeItem(`newsletter-edit-${id}-title`)
          localStorage.removeItem(`newsletter-edit-${id}-description`)
          localStorage.removeItem(`newsletter-edit-${id}-selectedAnalysts`)
          localStorage.removeItem(`newsletter-edit-${id}-subject`)
          localStorage.removeItem(`newsletter-edit-${id}-content`)
          localStorage.removeItem(`newsletter-edit-${id}-templateId`)
        }
        setSuccess(true)
        setTimeout(() => router.push('/newsletters'), 1200)
      } else {
        setError(data.error || 'Failed to update newsletter')
      }
    } catch (e) {
      setError('Failed to update newsletter')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-2 sm:px-6">
        <div className="max-w-6xl mx-auto p-8 bg-white rounded-2xl shadow-lg">
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading newsletter...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-2 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Newsletter: {title}</h1>
          </div>
          <Button onClick={() => setSendModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Send className="h-4 w-4 mr-2" /> Send via Gmail
        </Button>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-blue-600 text-white' : 
                      isCompleted ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {isCompleted ? (
                        <Check className="h-6 w-6" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <div className={`text-sm font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}> 
                        {step.title}
                      </div>
                      <div className="mt-1">
                        {step.id === 1 && (
                          <Badge variant={canProceedToStep2 ? "default" : "secondary"} className="text-xs">
                            {canProceedToStep2 ? "Complete" : "Incomplete"}
                          </Badge>
                        )}
                        {step.id === 2 && (
                          <Badge variant={canProceedToStep3 ? "default" : "secondary"} className="text-xs">
                            {canProceedToStep3 ? `${selectedAnalysts.length} selected` : "None selected"}
                          </Badge>
                        )}
                        {step.id === 3 && (
                          <Badge variant={canSubmit ? "default" : "secondary"} className="text-xs">
                            {canSubmit ? "Complete" : "Incomplete"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${isCompleted ? 'bg-green-600' : 'bg-gray-300'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Newsletter Basics */}
            {currentStep === 1 && (
              <Card className="p-2 sm:p-4 md:p-6 lg:p-8">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <FileText className="h-6 w-6" />
                    Newsletter Basics
                  </CardTitle>
                  <CardDescription className="text-base mt-2">Define your newsletter's name and description</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-2">
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
                    <Label htmlFor="description" className="text-base">Description & Objectives *</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of what this newsletter is about and what you want to achieve with it. (e.g., 'Update analysts on our latest product features and gather feedback on our roadmap')"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="mt-2 px-4 py-3 text-base rounded-lg min-h-[120px]"
                      rows={5}
                    />
                  </div>

                  <div className="flex gap-3 pt-6">
                    <Button 
                      variant="outline"
                      onClick={() => router.push('/newsletters')}
                      className="flex-1 py-3 text-lg rounded-lg"
                    >
                      <ArrowLeft className="mr-2 h-5 w-5" />
                      Back to Newsletters
                    </Button>
                    <Button 
                      onClick={() => setCurrentStep(2)}
                      disabled={!canProceedToStep2}
                      className="flex-1 py-3 text-lg rounded-lg"
                    >
                      Continue to Audience Selection
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Audience Selection */}
            {currentStep === 2 && (
              <Card className="p-2 sm:p-4 md:p-6 lg:p-8">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Target className="h-6 w-6" />
                    Audience Selection
                  </CardTitle>
                  <CardDescription className="text-base mt-2">Choose your target audience using AI-powered natural language or traditional filters.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
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

                    <TabsContent value="ai" className="mt-4 space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="audience" className="text-base">Prompt</Label>
                        <Textarea
                          id="audience"
                          placeholder="Examples: 'Tier 1 analysts', 'Gartner and Forrester', 'HR Technology companies', 'Active analysts'"
                          value={audienceDescription}
                          onChange={e => setAudienceDescription(e.target.value)}
                          className="mt-2 px-4 py-3 text-base rounded-lg min-h-[80px]"
                          rows={3}
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          onClick={applyAudienceFilters}
                          disabled={audienceDescription.trim().length < 20 || loading}
                          variant={audienceDescription.trim().length >= 20 ? "default" : "outline"}
                          size="sm"
                          className="rounded-lg"
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Find Analysts
                        </Button>
                      </div>

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
                          <div className="flex items-center justify-between">
                            <Label className="text-base">Selected Recipients ({selectedAnalysts.length})</Label>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedAnalysts([])}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                Reset
                              </Button>
                            </div>
                          </div>
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

                        <div className="flex justify-end">
                          <Button 
                            onClick={applyTraditionalFilters}
                            disabled={filterLoading}
                            variant={
                              filterCompanies.length > 0 || 
                              filterInfluences.length > 0 || 
                              filterStatuses.length > 0 || 
                              filterTypes.length > 0 || 
                              filterRelationshipHealths.length > 0 || 
                              filterSearch.trim().length > 0 
                                ? "default" : "outline"
                            }
                            size="sm"
                            className="px-4 py-2"
                          >
                            <Filter className="mr-2 h-4 w-4" />
                            {filterLoading ? 'Finding...' : 'Find Analysts'}
                          </Button>
                        </div>

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
                            <div className="flex items-center justify-between">
                              <Label className="text-base">Filtered Analysts ({filteredAnalysts.length})</Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setFilteredAnalysts([])}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                Reset
                              </Button>
                            </div>
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

            {/* Step 3: Email Creation */}
            {currentStep === 3 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Form */}
                <Card className="p-2 sm:p-4 md:p-6">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Mail className="h-6 w-6" />
                      Email Creation
                    </CardTitle>
                    <CardDescription className="text-base mt-2">Create your email content and select a template</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="title-step3" className="text-base">Newsletter Name *</Label>
                    <Input
                      id="title-step3"
                      placeholder="e.g., 'Q4 Analyst Update' or 'Product Launch Newsletter'"
              value={title}
              onChange={e => setTitle(e.target.value)}
                      className="mt-2 px-4 py-3 text-base rounded-lg"
                    />
                    <div className="mt-1 text-xs text-gray-500">This populates the {'{{title}}'} merge tag in the template preview.</div>
                  </div>
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
                      <Save className="mr-2 h-5 w-5" />
                      {submitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                  </CardContent>
                </Card>
                
                {/* Right Column - Preview */}
                <Card className="p-2 sm:p-4 md:p-6">
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
                          <div className="grid grid-cols-1 gap-2 text-sm">
                            <div><strong>To:</strong> {previewAnalyst.firstName} {previewAnalyst.lastName} &lt;{previewAnalyst.email}&gt;</div>
                            <div><strong>Subject:</strong> {subject || 'No subject'}</div>
                            <div><strong>Template:</strong> {selectedTemplate?.name || 'None selected'}</div>
                          </div>
                        </div>
                        
                        {/* Email Content Preview */}
                        <div className="border rounded-lg overflow-hidden">
            <iframe
              title="Newsletter Preview"
              srcDoc={previewHtml}
                            className="w-full h-[500px] bg-white"
              style={{ border: 'none' }}
            />
                        </div>
                      </div>
                    ) : (
                      <div className="h-[500px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                        {!selectedTemplate ? 'Select a template to see preview' : 'Preview hidden'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
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
                  <div className="text-green-600 text-sm">Newsletter updated successfully! Redirecting...</div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800">{error}</div>
        </div>
      )}

        {success && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-800">Newsletter updated successfully! Redirecting...</div>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Briefing } from "../../types"
import { cn } from "@/lib/utils"
import { Calendar as CalendarIcon, X, Eye, FileText, Video, Bot, CheckCircle } from "lucide-react"
import ContentSection from "./ContentSection"
import TranscriptTab from "./TranscriptTab"

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString)
  return {
    date: formatDate(dateString),
    time: formatTime(dateString),
  }
}

export default function Drawer({
  briefing,
  activeTab,
  onTabChange,
  onClose,
  onUpdate,
}: {
  briefing: Briefing
  activeTab: "overview" | "transcript"
  onTabChange: (tab: "overview" | "transcript") => void
  onClose: () => void
  onUpdate: () => void
}) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [transcript, setTranscript] = useState(briefing.transcript || "")
  const [notes, setNotes] = useState(briefing.notes || "")
  const [highlightSections, setHighlightSections] = useState(false)
  const { date, time } = formatDateTime(briefing.scheduledAt)

  const handleSaveTranscript = async () => {
    try {
      setIsUpdating(true)
      const response = await fetch(`/api/briefings/${briefing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          notes,
          status: briefing.status === "SCHEDULED" ? "COMPLETED" : briefing.status,
        }),
      })

      const json = await response.json().catch(() => ({} as any))
      if (!response.ok || json?.success === false) {
        const msg = json?.error || 'Failed to save changes'
        alert(msg)
        return
      }

      // Synchronize local state with server-confirmed values if present
      if (json?.data) {
        if (typeof json.data.transcript === 'string') setTranscript(json.data.transcript)
        if (typeof json.data.notes === 'string') setNotes(json.data.notes)
      }

      onUpdate()
    } catch (e) {
      console.error("Error updating briefing:", e)
      alert(e instanceof Error ? e.message : 'Failed to save changes')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleGenerateSummary = async () => {
    // Check if AI summary already exists and confirm overwrite
    if (briefing.ai_summary && briefing.ai_summary.toString().trim()) {
      const confirmed = confirm(
        "This briefing already has an AI summary. Generating a new summary will overwrite the existing one. Do you want to continue?"
      )
      if (!confirmed) {
        return
      }
    }

    try {
      setIsGenerating(true)
      // 1) Request generation
      const genResp = await fetch(`/api/briefings/${briefing.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-summary' })
      })
      const genJson = await genResp.json().catch(() => ({} as any))
      if (!genResp.ok || !genJson.success) {
        const msg = genJson.error || 'Failed to generate summary'
        throw new Error(msg)
      }

      const summary: string = genJson.summary

      // 2) Save generated summary back to briefing
      const patchResp = await fetch(`/api/briefings/${briefing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_summary: summary })
      })
      if (!patchResp.ok) {
        const err = await patchResp.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to save generated summary')
      }

      onUpdate()
      // After generation, switch to Overview and briefly highlight the sections
      onTabChange('overview')
      setHighlightSections(true)
      setTimeout(() => setHighlightSections(false), 3000)
    } catch (e) {
      console.error('Generate summary failed:', e)
      alert(e instanceof Error ? e.message : 'Failed to generate summary')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRemoveBriefing = async () => {
    if (!confirm("Remove this briefing? This will delete it from your briefings.")) return
    try {
      const response = await fetch(`/api/briefings/${briefing.id}`, { method: "DELETE" })
      if (!response.ok) {
        const err = await response.json().catch(() => ({} as any))
        throw new Error(err.error || "Failed to delete briefing")
      }
      onUpdate()
      onClose()
    } catch (e) {
      console.error("Failed to delete briefing:", e)
      alert(e instanceof Error ? e.message : "Failed to delete briefing")
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-gray-900 truncate">{briefing.title}</h2>
          <div className="flex items-center text-sm text-gray-600 mt-1">
            <CalendarIcon className="w-4 h-4 mr-1" />
            {date} at {time}
          </div>
          {/* Analyst Information */}
          {briefing.analysts && briefing.analysts.length > 0 && (
            <div className="flex items-center mt-3">
              {briefing.analysts.map((analyst, index) => (
                <div key={analyst.id} className="flex items-center">
                  {index > 0 && <span className="text-gray-400 mx-2">•</span>}
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">
                      {analyst.firstName} {analyst.lastName}
                    </span>
                    {(analyst.title || analyst.company) && (
                      <span className="text-gray-600 ml-1">
                        {analyst.title}
                        {analyst.title && analyst.company && ' • '}
                        {analyst.company}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={onClose} className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          onClick={() => onTabChange("overview")}
          className={cn(
            "flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors",
            activeTab === "overview" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          <div className="flex items-center justify-center">
            <Eye className="w-4 h-4 mr-2" />
            Overview
          </div>
        </button>
        <button
          onClick={() => onTabChange("transcript")}
          className={cn(
            "flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors",
            activeTab === "transcript" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          <div className="flex items-center justify-center">
            <FileText className="w-4 h-4 mr-2" />
            Transcript
          </div>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "overview" && (
          <OverviewTab
            briefing={briefing}
            onEdit={() => onTabChange("overview")}
            onRemove={handleRemoveBriefing}
            highlightSections={highlightSections}
          />
        )}
        {activeTab === "transcript" && (
          <TranscriptTab
            briefing={briefing}
            transcript={transcript}
            setTranscript={setTranscript}
            notes={notes}
            setNotes={setNotes}
            isUpdating={isUpdating}
            onSave={handleSaveTranscript}
            onGenerate={handleGenerateSummary}
            isGenerating={isGenerating}
          />
        )}
      </div>
    </div>
  )
}

function OverviewTab({ briefing, onEdit, onRemove, highlightSections = false }: { briefing: Briefing; onEdit: () => void; onRemove: () => void; highlightSections?: boolean }) {
  // Extract structured sections from ai_summary (handle both string and object types)
  let ai = ''
  if (typeof briefing.ai_summary === 'string') {
    ai = briefing.ai_summary
  } else if (typeof briefing.ai_summary === 'object' && briefing.ai_summary) {
    // If it's an object, try to extract the content
    ai = JSON.stringify(briefing.ai_summary)
    // If it has a specific property for the content, use that instead
    if (briefing.ai_summary.content) {
      ai = briefing.ai_summary.content
    } else if (briefing.ai_summary.text) {
      ai = briefing.ai_summary.text
    } else if (briefing.ai_summary.summary) {
      ai = briefing.ai_summary.summary
    }
  }
  
  // Debug logging (only if ai_summary exists)
  if (briefing.ai_summary) {
    console.log('🔍 AI Summary Debug:')
    console.log('  - Type:', typeof briefing.ai_summary)
    console.log('  - Processed AI string:', ai)
    console.log('  - AI string length:', ai.length)
  }
  
  const extractSection = (startTag: string, endTag: string, markdownTitle: string) => {
    // Try new delimiter format first
    const startIndex = ai.indexOf(startTag)
    const endIndex = ai.indexOf(endTag)
    
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      const content = ai.substring(startIndex + startTag.length, endIndex).trim()
      console.log(`Extracting ${startTag}:`, 'Found (new format)', `Content: "${content}"`)
      return content
    }
    
    // Fallback to old markdown format
    const sections = ai.split(/^##\s+/gm).filter(section => section.trim())
    const targetSection = sections.find(section => section.toLowerCase().startsWith(markdownTitle.toLowerCase()))
    
    if (targetSection) {
      const lines = targetSection.split('\n')
      const content = lines.slice(1).join('\n').trim()
      console.log(`Extracting ${markdownTitle}:`, 'Found (markdown format)', `Content: "${content}"`)
      return content
    }
    
    console.log(`Extracting ${startTag}/${markdownTitle}:`, 'Not found in either format')
    return ''
  }
  
  const keyTopics = extractSection('[KEY_TOPICS_START]', '[KEY_TOPICS_END]', 'Key topics discussed')
  const followUps = extractSection('[FOLLOW_UP_START]', '[FOLLOW_UP_END]', 'Follow-up items')
  const quotes = extractSection('[QUOTES_START]', '[QUOTES_END]', 'Interesting quotes')
  
  // Debug the extracted content if AI summary exists
  if (briefing.ai_summary) {
    console.log('📋 Extracted Sections:')
    console.log('  - keyTopics:', keyTopics ? `"${keyTopics.substring(0, 50)}..."` : 'EMPTY')
    console.log('  - followUps:', followUps ? `"${followUps.substring(0, 50)}..."` : 'EMPTY')
    console.log('  - quotes:', quotes ? `"${quotes.substring(0, 50)}..."` : 'EMPTY')
  }

  // Helper function to format text into bullet points
  const formatAsBulletPoints = (text: string) => {
    if (!text || text === 'None') return []
    return text.split('\n').filter(line => line.trim()).map(line => line.replace(/^[-*•]\s*/, '').trim()).filter(line => line.length > 0)
  }

  // Helper function to format text into follow-up items
  const formatAsFollowUpItems = (text: string) => {
    if (!text || text === 'None') return []
    return text.split('\n').filter(line => line.trim()).map(line => line.replace(/^[-*•]\s*/, '').trim()).filter(line => line.length > 0)
  }

  // Helper function to format quotes
  const formatAsQuotes = (text: string) => {
    if (!text || text === 'None') return []
    return text.split('\n').filter(line => line.trim()).map(line => {
      const cleanLine = line.replace(/^[-*•]\s*/, '').trim()
      if (cleanLine.length === 0) return ''
      // For quotes that already have speaker names, keep them as-is
      if (cleanLine.includes(': "') || cleanLine.includes(':"')) {
        return cleanLine
      }
      // Add quotes if not already present
      if (!cleanLine.startsWith('"') && !cleanLine.startsWith("'")) {
        return `"${cleanLine}"`
      }
      return cleanLine
    }).filter(line => line.length > 0)
  }

  const keyTopicsList = formatAsBulletPoints(keyTopics)
  const followUpsList = formatAsFollowUpItems(followUps)
  const quotesList = formatAsQuotes(quotes)

  return (
    <div className="p-6 space-y-6">
      {/* Content Section - Moved to top */}
      <ContentSection briefing={briefing} />

      {/* AI-derived Content with specific formatting */}
      <div className="grid grid-cols-1 gap-4">
        <div className={cn("bg-white border rounded-lg p-4", highlightSections && "ring-2 ring-yellow-400")}>
          <h3 className="font-semibold text-gray-900 mb-3">Key Topics</h3>
          {keyTopicsList.length > 0 ? (
            <ul className="space-y-1">
              {keyTopicsList.map((topic, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-gray-600 mr-2 mt-1">•</span>
                  <span className="text-sm text-gray-700">{topic}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 italic">None</p>
          )}
        </div>

        <div className={cn("bg-white border rounded-lg p-4", highlightSections && "ring-2 ring-yellow-400")}>
          <h3 className="font-semibold text-gray-900 mb-3">Follow-up Items</h3>
          {followUpsList.length > 0 ? (
            <ul className="space-y-1">
              {followUpsList.map((item, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 italic">None</p>
          )}
        </div>

        <div className={cn("bg-white border rounded-lg p-4", highlightSections && "ring-2 ring-yellow-400")}>
          <h3 className="font-semibold text-gray-900 mb-3">Interesting Quotes</h3>
          {quotesList.length > 0 ? (
            <ul className="space-y-2">
              {quotesList.map((quote, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-gray-600 mr-2 mt-1">–</span>
                  <span className="text-sm text-gray-700 italic">{quote}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 italic">None</p>
          )}
        </div>
      </div>



      <div className="border-t border-gray-200 pt-6">
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <div className="flex flex-wrap gap-2">
            {briefing.recordingUrl && (
              <a
                href={briefing.recordingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
              >
                <Video className="w-4 h-4 mr-2" />
                View Recording
              </a>
            )}
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
              onClick={onEdit}
              aria-label="Edit details"
            >
              Edit Details
            </button>
            <button
              onClick={onRemove}
              className="px-3 py-2 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors"
              aria-label="Remove briefing"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


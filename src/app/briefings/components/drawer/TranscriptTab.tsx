"use client"

import { Briefing } from "../../types"
import Papa from 'papaparse'
import { Upload, Bot } from 'lucide-react'

export default function TranscriptTab({
  briefing,
  transcript,
  setTranscript,
  notes,
  setNotes,
  isUpdating,
  onSave,
  onGenerate,
  isGenerating,
}: {
  briefing: Briefing
  transcript: string
  setTranscript: (value: string) => void
  notes: string
  setNotes: (value: string) => void
  isUpdating: boolean
  onSave: () => void
  onGenerate: () => void
  isGenerating: boolean
}) {
  return (
    <div className="p-6 space-y-6">
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Transcript Management</h3>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => document.getElementById(`transcript-file-input-${briefing.id}`)?.click()}
              className="flex items-center px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-4 h-4 mr-1" />
              Upload text file
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Upload a CSV or TXT file (Word documents not yet supported), or manually enter the transcript below.
        </p>
        <input
          id={`transcript-file-input-${briefing.id}`}
          type="file"
          accept=".txt,.csv,.doc,.docx"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const ext = file.name.split('.').pop()?.toLowerCase()
            try {
              if (ext === 'txt' || !ext) {
                const text = await file.text()
                setTranscript(text)
              } else if (ext === 'csv') {
                const text = await file.text()
                const parsed = Papa.parse(text, { skipEmptyLines: true })
                const rows = (parsed.data as any[])
                const lines = rows.map((r) => (Array.isArray(r) ? r.join(', ') : String(r)))
                setTranscript(lines.join('\n'))
              } else if (ext === 'docx' || ext === 'doc') {
                alert('DOC/DOCX parsing is not supported yet. Please convert to TXT/CSV or paste the text directly.')
              } else {
                alert('Unsupported file type. Please upload a TXT or CSV file.')
              }
            } catch (err) {
              console.error('Failed to read file', err)
              alert('Failed to read the selected file. Please try a different file.')
            } finally {
              (e.currentTarget as HTMLInputElement).value = ''
            }
          }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Transcript
        </label>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Enter or paste the meeting transcript here..."
          className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any additional notes or observations..."
          className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {briefing.transcript ? 'Last updated: ' + new Date(briefing.updatedAt).toLocaleDateString() : 'No transcript saved yet'}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            disabled={isUpdating}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUpdating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                Saving...
              </>
            ) : (
              <>Save</>
            )}
          </button>
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Bot className="w-4 h-4 mr-2" />
                Generate AI summary
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}


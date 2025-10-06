"use client"

import { useEffect, useState } from 'react'
import { X, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

interface BriefingRatingModalProps {
  isOpen: boolean
  onClose: () => void
  briefingId: string
}

function StarPicker({ value, onChange, required = false, label }: { value: number | null; onChange: (v: number) => void; required?: boolean; label: string }) {
  const filled = value || 0
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium text-gray-800">
        {label} {required && <span className="text-red-500">*</span>}
      </div>
      <div className="flex items-center gap-1">
        {[1,2,3,4,5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${label}: ${n} star${n>1?'s':''}`}
            className="p-1"
            onClick={() => onChange(n)}
          >
            <Star className={n <= filled ? 'w-5 h-5 text-yellow-500 fill-yellow-400' : 'w-5 h-5 text-gray-300'} />
          </button>
        ))}
      </div>
    </div>
  )
}

export function BriefingRatingModal({ isOpen, onClose, briefingId }: BriefingRatingModalProps) {
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)

  const [overall, setOverall] = useState<number | null>(null)
  const [strategy, setStrategy] = useState<number | null>(null)
  const [clarity, setClarity] = useState<number | null>(null)
  const [features, setFeatures] = useState<number | null>(null)
  const [value, setValue] = useState<number | null>(null)
  const [engagement, setEngagement] = useState<number | null>(null)
  const [comments, setComments] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      // reset when closing
      setOverall(null)
      setStrategy(null)
      setClarity(null)
      setFeatures(null)
      setValue(null)
      setEngagement(null)
      setComments('')
      setError(null)
      setSuccess(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const canSubmit = overall !== null && !submitting

  const handleSubmit = async () => {
    if (overall === null) {
      setError('Overall rating is required.')
      return
    }
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      // Resolve analyst headers if user present
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (user?.email) {
        // Try to resolve analyst id for stronger verification
        try {
          const r = await fetch(`/api/analysts/by-email/${encodeURIComponent(user.email)}`)
          if (r.ok) {
            const j = await r.json()
            if (j?.data?.id) {
              headers['x-analyst-email'] = user.email
              headers['x-analyst-id'] = j.data.id
            }
          }
        } catch {}
      }

      const resp = await fetch(`/api/briefings/${encodeURIComponent(briefingId)}/ratings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          overallScore: overall,
          strategyScore: strategy ?? undefined,
          materialsClarityScore: clarity ?? undefined,
          featuresDesignScore: features ?? undefined,
          valueScore: value ?? undefined,
          engagementScore: engagement ?? undefined,
          comments: comments?.trim() || undefined,
        })
      })
      const json = await resp.json()
      if (!resp.ok || !json?.success) {
        throw new Error(json?.error || 'Failed to submit rating')
      }
      setSuccess('Thank you! Your rating was saved.')
      // Close shortly after
      setTimeout(() => onClose(), 800)
    } catch (e: any) {
      setError(e?.message || 'An error occurred while saving your rating.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Rate this briefing</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <StarPicker label="Overall" value={overall} onChange={setOverall} required />
          <StarPicker label="Company & Product Strategy" value={strategy} onChange={setStrategy} />
          <StarPicker label="Clarity of Materials" value={clarity} onChange={setClarity} />
          <StarPicker label="Product Features/Design" value={features} onChange={setFeatures} />
          <StarPicker label="Value to Customer" value={value} onChange={setValue} />
          <StarPicker label="Conversation & Engagement" value={engagement} onChange={setEngagement} />
          <div>
            <div className="text-sm font-medium text-gray-800">Comments</div>
            <textarea
              className="mt-1 w-full border rounded-md p-2 text-sm"
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Any additional feedback for the vendor"
              maxLength={2000}
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          {success && <div className="text-sm text-green-600">{success}</div>}
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>{submitting ? 'Saving…' : 'Save rating'}</Button>
        </div>
      </div>
    </div>
  )
}

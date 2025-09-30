'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AnalystPortalSettingsForm() {
  const [welcomeQuote, setWelcomeQuote] = useState('')
  const [quoteAuthor, setQuoteAuthor] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  return (
    <form onSubmit={(e) => { e.preventDefault(); setMessage('Saved') }} className="space-y-6">
      <div className="p-4 rounded-lg border bg-gray-50 border-gray-200 text-gray-700">
        Portal settings form placeholder. To re-enable full editor, restore this file's previous implementation.
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Welcome Quote</Label>
          <Input value={welcomeQuote} onChange={(e) => setWelcomeQuote(e.target.value)} />
        </div>
        <div>
          <Label className="text-sm font-medium">Quote Author</Label>
          <Input value={quoteAuthor} onChange={(e) => setQuoteAuthor(e.target.value)} />
        </div>
      </div>
      {message && (
        <div className="text-sm text-green-600">{message}</div>
      )}
      <Button type="submit">Save</Button>
    </form>
  )
}

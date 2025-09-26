"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { QuoteDisplay } from "@/components/portal/QuoteDisplay"

interface WelcomeModalProps {
  open: boolean
  onClose: () => void
  quote: {
    text: string
    author: string
    role?: string
    authorImageUrl?: string
  }
  analystProfile?: {
    firstName?: string
    lastName?: string
    company?: string
  }
}

export function WelcomeModal({ open, onClose, quote, analystProfile }: WelcomeModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-xl mx-4 bg-white rounded-xl shadow-xl border border-gray-200">
        {/* Content */}
        <div className="p-6">
          <QuoteDisplay quote={quote} analystProfile={analystProfile} />
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end">
          <Button onClick={onClose}>Got it</Button>
        </div>
      </div>
    </div>
  )
}


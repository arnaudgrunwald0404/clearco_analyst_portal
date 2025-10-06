'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AnalystProfileForm } from '@/components/forms/analyst-profile-form'
import { useToast } from '@/components/ui/toast'
import { X } from 'lucide-react'

export default function EditProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const { addToast } = useToast()
  const [analyst, setAnalyst] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Animate in on mount and add Escape-to-close
  useEffect(() => {
    const t = setTimeout(() => setIsOpen(true), 0)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      router.push('/analyst-login')
      return
    }

    const fetchAnalystData = async () => {
      if (user?.email) {
        try {
          const response = await fetch(`/api/analysts/by-email/${encodeURIComponent(user.email)}`)
          const result = await response.json()

          if (result.success) {
            setAnalyst({
              ...result.data,
              topics: result.data.topics?.join(', ') || ''
            })
          } else {
            addToast({ type: 'error', message: 'Could not fetch your profile data.' })
          }
        } catch (error) {
          console.error('Failed to fetch analyst data', error)
          addToast({ type: 'error', message: 'An unexpected error occurred while fetching your profile.' })
        } finally {
          setLoading(false)
        }
      }
    }

    fetchAnalystData()
  }, [user, router, addToast])

  const handleClose = () => {
    setIsOpen(false)
    // Allow transition to play before navigating away
    setTimeout(() => router.push('/analyst_portal/vendor_profile'), 300)
  }

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/analysts/${analyst.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          topics: values.topics ? values.topics.split(',').map((t: string) => t.trim()) : [],
        }),
      })

      const result = await response.json()

      if (result.success) {
        addToast({ type: 'success', message: 'Your profile has been updated successfully.' })
        router.push('/analyst_portal/vendor_profile')
      } else {
        addToast({ type: 'error', message: result.error || 'Failed to update your profile.' })
      }
    } catch (error) {
      console.error('Failed to submit profile update', error)
      addToast({ type: 'error', message: 'An unexpected error occurred.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!analyst) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Profile not found</h2>
        <p>We couldn't find an analyst profile associated with your account.</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50" aria-modal="true" role="dialog">
      {/* Dim background */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Right-side drawer */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl border-l border-gray-200 flex flex-col transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Edit Your Profile</h2>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5">
            <AnalystProfileForm
              defaultValues={analyst}
              onSubmit={handleSubmit}
              loading={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AnalystProfileForm } from '@/components/forms/analyst-profile-form'
import { useToast } from '@/components/ui/toast'

export default function EditProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [analyst, setAnalyst] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
            toast({
              title: 'Error',
              description: 'Could not fetch your profile data.',
              variant: 'destructive',
            })
          }
        } catch (error) {
          console.error('Failed to fetch analyst data', error)
          toast({
            title: 'Error',
            description: 'An unexpected error occurred while fetching your profile.',
            variant: 'destructive',
          })
        } finally {
          setLoading(false)
        }
      }
    }

    fetchAnalystData()
  }, [user, router, toast])

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
        toast({
          title: 'Success',
          description: 'Your profile has been updated successfully.',
        })
        router.push('/portal')
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update your profile.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to submit profile update', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      })
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Edit Your Profile</h1>
      <div className="bg-white p-8 rounded-lg shadow-md">
        <AnalystProfileForm
          defaultValues={analyst}
          onSubmit={handleSubmit}
          loading={isSubmitting}
        />
      </div>
    </div>
  )
}

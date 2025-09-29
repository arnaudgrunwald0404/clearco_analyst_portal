"use client"

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Mail, Linkedin, X } from 'lucide-react'
import ResearchSections from './ResearchSections'
import { Icons } from '@/components/ui/icons'

interface AnalystProfile {
  id: string
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  company?: string | null
  title?: string | null
  phone?: string | null
  profileImageUrl?: string | null
  linkedinUrl?: string | null
  twitterHandle?: string | null
}

export default function ProfileSummary() {
  const { user } = useAuth()
  const router = useRouter()
  const fallbackName = user?.name || (user?.email ? user.email.split('@')[0] : 'Your Profile')
  const [profile, setProfile] = useState<AnalystProfile | null>(null)
  const [uploading, setUploading] = useState(false)

  const name = useMemo(() => {
    if (profile?.firstName || profile?.lastName) {
      return `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim()
    }
    return fallbackName
  }, [profile?.firstName, profile?.lastName, fallbackName])

  const email = profile?.email || user?.email || ''
  const initials = (name || 'U')
    .split(' ')
    .map((s) => s?.[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        if (!user?.email) return
        const resp = await fetch(`/api/analysts/by-email/${encodeURIComponent(user.email)}`)
        
        // Handle 404 gracefully - user might not be an analyst
        if (resp.status === 404) {
          console.log('User is not an analyst, using fallback profile data')
          if (!cancelled) {
            setProfile({
              id: user?.id || 'admin-user',
              firstName: user?.name?.split(' ')[0] || 'Admin',
              lastName: user?.name?.split(' ').slice(1).join(' ') || 'User',
              email: user?.email || '',
              company: user?.company || 'ClearCompany',
              title: user?.role || 'Administrator',
              phone: null,
              profileImageUrl: user?.profileImageUrl || null,
              linkedinUrl: null,
              twitterHandle: null,
            })
          }
          return
        }
        
        const json = await resp.json().catch(() => null)
        if (!cancelled && json?.success) {
          const d = json.data
          setProfile({
            id: d.id,
            firstName: d.firstName,
            lastName: d.lastName,
            email: d.email || user.email,
            company: d.company,
            title: d.title,
            phone: d.phone,
            profileImageUrl: d.profileImageUrl,
            linkedinUrl: d.linkedinUrl || d.linkedIn,
            twitterHandle: d.twitterHandle || d.twitter,
          })
        }
      } catch (error) {
        console.warn('Error fetching analyst profile:', error)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [user?.email])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile?.id) return
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'profile')
      const uploadResp = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!uploadResp.ok) throw new Error('Upload failed')
      const uploadJson = await uploadResp.json()
      const url = uploadJson.url as string
      if (!url) throw new Error('Missing URL')
      const patch = await fetch(`/api/analysts/${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImageUrl: url }),
      })
      if (!patch.ok) throw new Error('Failed to update profile')
      setProfile((prev) => (prev ? { ...prev, profileImageUrl: url } : prev))
    } catch (err) {
      console.error('Failed to update photo', err)
    } finally {
      setUploading(false)
      // Reset the input value so the same file can be re-selected if needed
      e.currentTarget.value = ''
    }
  }

  const linkToX = (handle?: string | null) => {
    if (!handle) return null
    const clean = handle.startsWith('@') ? handle.slice(1) : handle
    return `https://x.com/${clean}`
  }

return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 flex items-center gap-4">
        {/* Avatar */}
        <div className="relative">
          {profile?.profileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.profileImageUrl}
              alt={name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
              {initials}
            </div>
          )}
        </div>

        {/* Textual info */}
        <div className="min-w-0 flex-1">
          <div className="text-lg font-semibold text-gray-900 leading-tight truncate" title={name}>{name}</div>
          {profile?.title && (
            <div className="text-sm text-gray-700 truncate" title={profile.title}>{profile.title}</div>
          )}
          {profile?.company && (
            <div className="text-sm text-gray-700 truncate" title={profile.company}>{profile.company}</div>
          )}
        </div>
      </div>
      
      {/* Contact and social below the picture */}
      <div className="px-6 pb-6 space-y-3">
        {email ? (
          <div className="flex items-center gap-2 text-sm text-gray-900 min-w-0">
            <Mail className="w-4 h-4 text-gray-400" />
            <a className="hover:text-blue-600 break-words" href={`mailto:${email}`}>{email}</a>
          </div>
        ) : (
          <button
            onClick={() => router.push('/portal/profile/edit')}
            className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
          >
            Add email address
          </button>
        )}

        <div className="flex items-center gap-2 text-sm text-gray-900 min-w-0">
          <Linkedin className="w-4 h-4 text-gray-400" />
          {profile?.linkedinUrl ? (
            <a className="hover:text-blue-600 whitespace-nowrap overflow-hidden text-ellipsis" href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer">LinkedIn</a>
          ) : (
            <button
              onClick={() => router.push('/portal/profile/edit')}
              className="text-blue-600 hover:text-blue-800 hover:underline text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
              title="Add LinkedIn profile"
            >
              Add LinkedIn profile
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-900 min-w-0">
          <Icons.twitter className="w-4 h-4 text-gray-400 fill-current" />
          {profile?.twitterHandle ? (
            <a className="hover:text-blue-600 whitespace-nowrap overflow-hidden text-ellipsis" href={linkToX(profile.twitterHandle) || '#'} target="_blank" rel="noopener noreferrer">{profile.twitterHandle}</a>
          ) : (
            <button
              onClick={() => router.push('/portal/profile/edit')}
              className="text-blue-600 hover:text-blue-800 hover:underline text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
              title="Add X handle"
            >
              Add X handle
            </button>
          )}
        </div>
        
        {/* Research Sections */}
        <ResearchSections analystId={profile?.id} />
      </div>
    </div>
  )
}
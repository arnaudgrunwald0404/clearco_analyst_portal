'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail } from 'lucide-react'

interface PortalSettings {
  contactName?: string
  contactTitle?: string
  contactEmail?: string
  contactPhone?: string
  contactImageUrl?: string
  authorImageUrl?: string
  quoteAuthor?: string
}

interface GeneralSettings {
  company_name?: string
  companyName?: string
  logo_url?: string
}

interface CompanyContactProps {
  selectedVendorName?: string
  onSwitchVendor?: () => void
}

export default function CompanyContact({ selectedVendorName, onSwitchVendor }: CompanyContactProps) {
  const router = useRouter()
  const [portal, setPortal] = useState<PortalSettings | null>(null)
  const [general, setGeneral] = useState<GeneralSettings | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [portalResp, generalResp] = await Promise.all([
          fetch('/api/settings/analyst-portal', { cache: 'no-store' }).catch(() => null),
          fetch('/api/settings/general', { cache: 'no-store' }).catch(() => null),
        ])
        if (!cancelled) {
          const portalJson = portalResp && portalResp.ok ? await portalResp.json().catch(() => null) : null
          const generalJson = generalResp && generalResp.ok ? await generalResp.json().catch(() => null) : null
          setPortal(portalJson)
          setGeneral(generalJson)
        }
      } catch {
        if (!cancelled) {
          setPortal(null)
          setGeneral(null)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const companyName = general?.company_name || general?.companyName || 'Company'
  const displayVendorName = selectedVendorName || companyName
  const logoUrl = general?.logo_url
  const displayHeader = companyName ? `Contact at ${companyName} ` : 'Vendor Contact'

  const handleSwitchVendor = () => {
    if (onSwitchVendor) return onSwitchVendor()
    router.push('/')
  }

  // Defaults
  let contactName: string | null = null
  let contactTitle: string | null = null
  let contactEmail: string | null = null

  if (portal?.contactName && portal?.contactTitle) {
    contactName = portal.contactName
    contactTitle = portal.contactTitle
    contactEmail = portal.contactEmail || null
  } else if (portal?.quoteAuthor) {
    const parts = portal.quoteAuthor.split(',')
    contactName = parts[0]?.trim() || contactName
    contactTitle = parts.slice(1).join(',').trim() || contactTitle
  }

  const contactImageUrl = portal?.contactImageUrl || portal?.authorImageUrl || null

  const initials = useMemo(() => {
    return (contactName || 'U')
      .split(' ')
      .map((s) => s?.[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [contactName])

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      {/* Vendor Profile Header Section */}
      <div className="text-sm text-gray-600 mb-4">
        You are viewing <span className="font-semibold text-gray-900">{displayVendorName}</span>'s vendor profile.
      </div>
      
      {/* Company Logo */}
      <div className="flex justify-center mb-4 mx-4">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={`${displayVendorName} logo`}
            className="h-12 object-contain rounded"
          />
        ) : (
          <div className="w-16 h-12 bg-gray-100 rounded flex items-center justify-center">
            <span className="text-gray-500 font-semibold text-sm">
              {displayVendorName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Contact Information Section */}
      <div className="border-t border-gray-200 pt-4">
        <div className="text-sm font-normal text-gray-600 mb-3">{displayHeader}</div>
        
        <div className="flex items-center gap-4 mb-4">
          {/* Avatar */}
          <div className="relative">
            {contactImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={contactImageUrl} alt={contactName || 'Contact'} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                {initials}
              </div>
            )}
          </div>
          
          {/* Contact Info */}
          <div className="min-w-0 flex-1">
            <div className="text-lg font-semibold text-gray-900 leading-tight break-words">{contactName}</div>
            {contactTitle && (
              <div className="text-sm text-gray-700">{contactTitle}</div>
            )}
          </div>
        </div>

        {/* Email Contact */}
        <div className="flex items-center gap-2 text-sm text-gray-900 mb-4">
          <Mail className="w-4 h-4 text-gray-400" />
          {contactEmail ? (
            <a className="hover:text-blue-600 break-words" href={`mailto:${contactEmail}`}>{contactEmail}</a>
          ) : (
            <span className="text-gray-500">No contact email provided</span>
          )}
        </div>
      </div>

      {/* Switch Vendor Button */}
      <div className="border-t border-gray-200 pt-4 flex justify-center">
        <button
          onClick={handleSwitchVendor}
          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded-lg transition-colors"
        >
          Switch Vendor
        </button>
      </div>
    </div>
  )
}

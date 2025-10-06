'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
        // Fetch general first to get vendorDomain, then fetch portal with vendor scoping
        const generalResp = await fetch('/api/settings/general', { cache: 'no-store' }).catch(() => null)
        const generalJson = generalResp && generalResp.ok ? await generalResp.json().catch(() => null) : null
        const qs = new URLSearchParams()
        if (generalJson?.protected_domain) qs.set('vendorDomain', generalJson.protected_domain)
        const portalResp = await fetch(`/api/settings/analyst-portal${qs.toString() ? `?${qs.toString()}` : ''}`, { cache: 'no-store' }).catch(() => null)
        const portalJson = portalResp && portalResp.ok ? await portalResp.json().catch(() => null) : null
        if (!cancelled) {
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
  const displayHeader = companyName ? `Your Contact at ${companyName} ` : 'Vendor Contact'

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
    if (!contactName) return ''
    return contactName
      .split(' ')
      .map((s) => s?.[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [contactName])

  return (
    <div className="bg-white text-gray-900 rounded-lg border border-gray-200 shadow-sm py-4 pr-6 pl-12">
           {/* Switch Vendor Button */}
           <div className="border-b border-gray-200 pb-4 flex justify-center">
        <button
          onClick={handleSwitchVendor}
          className="px-10 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded-lg transition-colors"
        >
          Switch Vendor
        </button>
      </div>
      {/* Vendor Profile Header Section */}
      <div className="text-sm text-gray-700 my-4">
        You are viewing <span className="font-semibold">{displayVendorName}</span>'s vendor profile.
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
            <span className="font-semibold text-sm">
              {displayVendorName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Contact Information Section */}
      {contactName && (
        <div className=" pt-2">
          <div className="text-sm font-normal text-gray-700 mb-3">{displayHeader}</div>
          
          <div className="flex items-center gap-4 mb-6">
            {/* Avatar */}
            <div className="relative">
              {contactImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={contactImageUrl} alt={contactName || 'Contact'} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-pink-600 text-white flex items-center justify-center font-semibold">
                  {initials}
                </div>
              )}
            </div>
            
            {/* Contact Info */}
            <div className="min-w-0 flex-1">
              <div className="text-lg font-semibold leading-tight break-words">{contactName}</div>
              {contactTitle && (
                <div className="text-sm text-gray-700">{contactTitle}</div>
              )}
              {contactEmail && (
                <div className="mt-2">
                  <Button
                    asChild
                    size="icon"
                    variant="ghost"
                    className="text-gray-600 hover:text-gray-900 bg-transparent hover:bg-transparent"
                    aria-label={`Email ${contactName || 'contact'}`}
                    title={`Email ${contactName || 'contact'}`}
                  >
                    <a href={`mailto:${contactEmail}`}>
                      <Mail className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

 
    </div>
  )
}

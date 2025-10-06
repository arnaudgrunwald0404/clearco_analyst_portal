'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Building2, UserCog, ExternalLink } from 'lucide-react'
import SidebarNav from './SidebarNav'
import VendorAccountsSection from './VendorAccountsSection'
import AnalystAccountsSection from './AnalystAccountsSection'
import { SpinningCupcake } from '@/components/ui/spinning-cupcake'
import { AnalystImpersonationModal } from '@/components/modals/analyst-impersonation-modal'
import { useAuth } from '@/contexts/AuthContext'

interface MenuSection {
  id: string
  label: string
  icon: React.ElementType | null
  isSeparator?: boolean
}

function AdminPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeSection, setActiveSection] = useState('vendor-accounts')
  const [isImpersonationModalOpen, setIsImpersonationModalOpen] = useState(false)
  const { signInAnalyst, user } = useAuth()

  // SECURITY: Block non-super-admins from accessing admin page
  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      console.warn('🚨 SECURITY: Non-super-admin attempted to access admin page. Redirecting.')
      if (user.role === 'ANALYST') {
        router.replace('/analyst_portal/analyst_hub')
      } else {
        router.replace('/')
      }
      return
    }
  }, [user, router])

  // Show loading/redirecting state for non-super-admins
  if (user && user.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Access Denied. Redirecting...</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    const section = searchParams?.get('section')
    if (section) {
      setActiveSection(section)
    }
  }, [searchParams])

  const menuSections: MenuSection[] = [
    { id: 'vendor-accounts', label: 'Vendor Accounts', icon: Building2 },
    { id: 'analyst-accounts', label: 'Analyst Accounts', icon: UserCog },
    { id: 'separator-1', label: '---', icon: null, isSeparator: true },
    { id: 'analyst-portal-impersonation', label: 'Go to Analyst Portal', icon: ExternalLink },
  ]

  const handleAnalystPortalImpersonation = () => {
    // Open impersonation modal to select an analyst
    setIsImpersonationModalOpen(true)
  }

  const handleImpersonate = async (analyst: { id: string; firstName: string; lastName: string; email: string }) => {
    try {
      // Persist selection for any auxiliary logic
      sessionStorage.setItem('impersonatedAnalyst', JSON.stringify(analyst))

      // Programmatic analyst login using shared password (public env for client)
      const password = process.env.NEXT_PUBLIC_DEFAULT_ANALYST_PASSWORD || 'changeme123!'
      const res = await signInAnalyst(analyst.email, password)
      if (res.success) {
        // Include analystId in URL so downstream pages can use it (optional)
        // Navigate to Vendor Portal with analyst impersonation
        router.push(`/analyst_portal/vendor_profile?analystId=${encodeURIComponent(analyst.id)}`)
      } else {
        alert(res.error || 'Failed to open portal as analyst')
      }
    } catch (e) {
      console.error('Impersonation failed', e)
      alert('Impersonation failed')
    } finally {
      setIsImpersonationModalOpen(false)
    }
  }


  return (
    <div className="p-8">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900">Admin</h1>
        <p className="mt-3 text-gray-600">
          Manage vendor accounts, analyst data, and system administration
        </p>
      </div>

      <div className="flex gap-12">
        <SidebarNav
          activeSection={activeSection}
          setActiveSection={(section) => {
            if (section === 'analyst-portal-impersonation') {
              handleAnalystPortalImpersonation()
            } else {
              setActiveSection(section)
            }
          }}
          menuSections={menuSections}
        />
        <div className="w-6/12">
          {activeSection === 'vendor-accounts' && <VendorAccountsSection />}
          {activeSection === 'analyst-accounts' && <AnalystAccountsSection />}
        </div>
      </div>

      {/* Analyst Impersonation Modal */}
      <AnalystImpersonationModal
        isOpen={isImpersonationModalOpen}
        onClose={() => setIsImpersonationModalOpen(false)}
        onImpersonate={handleImpersonate}
      />
    </div>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <SpinningCupcake />
      </div>
    }>
      <AdminPageContent />
    </Suspense>
  )
}

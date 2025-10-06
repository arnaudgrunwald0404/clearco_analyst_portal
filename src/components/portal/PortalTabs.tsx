'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const getBaseTabs = (companyName: string) => [
  { href: '/analyst_portal/vendor_profile', value: 'relationship', label: 'Relationship' },
  { href: '/analyst_portal/vendor_profile/company', value: 'company', label: 'Company' },
  { href: '/analyst_portal/vendor_profile/roadmap', value: 'roadmap', label: 'Product Roadmap' },
  { href: '/analyst_portal/vendor_profile/testimonials', value: 'testimonials', label: 'Analyst Testimonials' },
  { href: '/analyst_portal/vendor_profile/resources', value: 'resources', label: 'Content' },
]

export function PortalTabs() {
  const pathname = usePathname()
  const [companyName, setCompanyName] = useState('Company')
  const [tabs, setTabs] = useState(getBaseTabs('Company'))
  
  const active =
    pathname?.startsWith('/analyst_portal/vendor_profile/company') ? 'company' :
    pathname?.startsWith('/analyst_portal/vendor_profile/roadmap') ? 'roadmap' :
    pathname?.startsWith('/analyst_portal/vendor_profile/testimonials') ? 'testimonials' :
    pathname?.startsWith('/analyst_portal/vendor_profile/research') ? 'research' :
    pathname?.startsWith('/analyst_portal/vendor_profile/resources') ? 'resources' :
    'relationship'

  useEffect(() => {
    const fetchCompanyName = async () => {
      try {
        const response = await fetch('/api/settings/general')
        if (response.ok) {
          const data = await response.json()
          const name = data.company_name || 'Company'
          setCompanyName(name)
          setTabs(getBaseTabs(name))
        }
      } catch (error) {
        console.error('Failed to fetch company name:', error)
      }
    }

    fetchCompanyName()
  }, [])

  return (
    <Tabs value={active}>
      <TabsList className="w-full bg-white border border-gray-200 rounded-lg p-1 shadow-sm flex">
        {tabs.map(t => (
          <TabsTrigger
            key={t.value}
            value={t.value}
            asChild
            className="flex-1 basis-0 text-center data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-700 hover:text-gray-900"
          >
            <Link href={t.href} className="block w-full px-2 py-1">{t.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}


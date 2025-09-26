'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const getBaseTabs = (companyName: string) => [
  { href: '/portal', value: 'relationship', label: 'Relationship' },
  { href: '/portal/company', value: 'company', label: 'Company' },
  { href: '/portal/roadmap', value: 'roadmap', label: 'Product Roadmap' },
  { href: '/portal/testimonials', value: 'testimonials', label: 'Analyst Testimonials' },
  { href: '/portal/resources', value: 'resources', label: 'Resources' },
]

export function PortalTabs() {
  const pathname = usePathname()
  const [companyName, setCompanyName] = useState('Company')
  const [tabs, setTabs] = useState(getBaseTabs('Company'))
  
  const active =
    pathname?.startsWith('/portal/company') ? 'company' :
    pathname?.startsWith('/portal/roadmap') ? 'roadmap' :
    pathname?.startsWith('/portal/testimonials') ? 'testimonials' :
    pathname?.startsWith('/portal/research') ? 'research' :
    pathname?.startsWith('/portal/resources') ? 'resources' :
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
      <TabsList className="w-full justify-start overflow-x-auto">
        {tabs.map(t => (
          <TabsTrigger key={t.value} value={t.value} asChild>
            <Link href={t.href}>{t.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}


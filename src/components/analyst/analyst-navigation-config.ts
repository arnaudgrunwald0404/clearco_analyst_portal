import type React from 'react'
import { Home, Building2, Calendar, FileText, Briefcase, Inbox, PlusCircle, Settings } from 'lucide-react'

export interface AnalystNavItem {
  name: string
  href: string
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  children?: AnalystNavItem[]
}

export const analystNav: AnalystNavItem[] = [
  { name: 'Home', href: '/analyst_portal/analyst_hub', icon: Home },
  {
    name: 'Vendors', href: '/analyst_portal/analyst_hub/vendors', icon: Building2, children: [

      { name: 'Vendor newsfeed', href: '/analyst_portal/analyst_hub/vendors/newsfeed' }
    ]
  },
  { name: 'Briefings', href: '/analyst_portal/analyst_hub/briefings', icon: Calendar },
  {
    name: 'Content', href: '/analyst_portal/analyst_hub/content', icon: FileText, children: [
      { name: 'My publications', href: '/analyst_portal/analyst_hub/content/my-publications' },
      { name: "Vendor's Content", href: '/analyst_portal/analyst_hub/content/vendor-content' }
    ]
  },
  { name: 'My services', href: '/analyst_portal/analyst_hub/services', icon: Briefcase },
  {
    name: 'Requests from vendor(s)', href: '/analyst_portal/analyst_hub/requests', icon: Inbox
  },
  { name: 'Settings', href: '/analyst_portal/settings', icon: Settings }
]

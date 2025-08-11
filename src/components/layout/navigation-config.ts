import {
  Users,
  Mail,
  BarChart3,
  Settings,
  Home,
  User,
  MessageSquare,
  Calendar,
  Award,
  CalendarDays,
  Clock,
  FileText,
  Shield
} from 'lucide-react'

export interface NavigationItem {
  name: string
  href: string
  icon: any
  subItems?: NavigationItem[]
}

// Main navigation items (excluding Analyst Portal)
export const mainNavigation: NavigationItem[] = [
  { name: 'Overview', href: '/', icon: Home },
  { name: 'Analysts', href: '/analysts', icon: Users },
  { name: 'Briefings', href: '/briefings', icon: Calendar },
  { name: 'Briefings due', href: '/briefings/due', icon: Clock },
  { name: 'Newsletters', href: '/newsletters', icon: Mail },
  { name: 'Testimonials', href: '/testimonials', icon: MessageSquare },
  { name: 'Publications', href: '/publications', icon: FileText },
  { name: 'Awards', href: '/awards', icon: Award },
  { name: 'Events', href: '/events', icon: CalendarDays },

  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

// Analyst Portal as separate item (moved to bottom)
export const analystPortalItem: NavigationItem = { 
  name: 'Analyst Portal', 
  href: '/portal', 
  icon: User 
}

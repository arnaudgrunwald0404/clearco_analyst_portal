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
  FileText,
  Shield
} from 'lucide-react'
import { XLogo } from '@/components/ui/x-logo'

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
  { name: 'Follow Ups', href: '/briefings/follow-ups', icon: null },
  { name: 'Briefings Due', href: '/briefings/due', icon: null },
  { name: 'Newsletters', href: '/newsletters', icon: Mail },
  { name: 'Testimonials', href: '/testimonials', icon: MessageSquare },
  { name: 'X Activity', href: '/twitter-activity', icon: XLogo },
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

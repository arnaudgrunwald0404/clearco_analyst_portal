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
  CalendarDays
} from 'lucide-react'

export interface NavigationItem {
  name: string
  href: string
  icon: any
}

// Main navigation items (excluding Analyst Portal)
export const mainNavigation: NavigationItem[] = [
  { name: 'Overview', href: '/', icon: Home },
  { name: 'Analysts', href: '/analysts', icon: Users },
  { name: 'Briefings', href: '/briefings', icon: Calendar },
  { name: 'Newsletters', href: '/newsletters', icon: Mail },
  { name: 'Testimonials', href: '/testimonials', icon: MessageSquare },
  { name: 'Awards', href: '/awards', icon: Award },
  { name: 'Events', href: '/events', icon: CalendarDays },
  { name: 'Analytics (coming soon)', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

// Analyst Portal as separate item (moved to bottom)
export const analystPortalItem: NavigationItem = { 
  name: 'Analyst Portal', 
  href: '/portal', 
  icon: User 
}

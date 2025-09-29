import { 
  Video, 
  FileText, 
  Play, 
  Users, 
  Monitor, 
  Palette, 
  Package, 
  Archive,
  type LucideIcon 
} from 'lucide-react'

export function getCategoryIcon(category: string): LucideIcon {
  switch (category) {
    case 'PRODUCT':
      return Package
    case 'DEMOS':
      return Play
    case 'VIDEOS':
      return Video
    case 'CASE_STUDIES':
      return Users
    case 'PRESS_RELEASES':
      return FileText
    case 'REPORTS':
      return FileText
    case 'WEBINARS':
      return Monitor
    case 'BRAND_KIT':
      return Palette
    default:
      return FileText
  }
}

export function getCategoryColor(category: string): string {
  switch (category) {
    case 'PRODUCT':
      return 'bg-orange-500'
    case 'DEMOS':
      return 'bg-green-500'
    case 'VIDEOS':
      return 'bg-red-500'
    case 'CASE_STUDIES':
      return 'bg-purple-500'
    case 'PRESS_RELEASES':
      return 'bg-blue-500'
    case 'REPORTS':
      return 'bg-indigo-500'
    case 'WEBINARS':
      return 'bg-cyan-500'
    case 'BRAND_KIT':
      return 'bg-pink-500'
    default:
      return 'bg-gray-500'
  }
}

export function getCategoryLabel(category: string): string {
  switch (category) {
    case 'PRODUCT':
      return 'Product'
    case 'DEMOS':
      return 'Demos'
    case 'VIDEOS':
      return 'Videos'
    case 'CASE_STUDIES':
      return 'Case Studies'
    case 'PRESS_RELEASES':
      return 'Press Releases'
    case 'REPORTS':
      return 'Reports'
    case 'WEBINARS':
      return 'Webinars'
    case 'BRAND_KIT':
      return 'Brand Kit'
    default:
      return category
  }
}

'use client'

import Link from 'next/link'
import {
  FileText,
  MessageSquare,
  Newspaper,
  Calendar,
  Video,
  Download,
  ArrowRight,
  Star,
  Clock,
  Users,
  Play,
  ExternalLink,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Priority destinations for analysts
const priorityActions = [
  {
    title: 'Latest Product Roadmap',
    description: 'Exclusive Q4 2024 deep dive into upcoming AI capabilities',
    href: '/portal/content',
    icon: Video,
    badge: 'New',
    badgeColor: 'bg-green-100 text-green-800',
    bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-100',
    iconColor: 'text-blue-600'
  },
  {
    title: 'Schedule Next Briefing',
    description: 'Book your next one-on-one strategy session',
    href: '/portal/briefings',
    icon: Calendar,
    badge: 'Priority',
    badgeColor: 'bg-orange-100 text-orange-800',
    bgColor: 'bg-gradient-to-br from-orange-50 to-red-100',
    iconColor: 'text-orange-600'
  },
  {
    title: 'Market Research Report',
    description: 'Download our proprietary 2025 HR Tech trends analysis',
    href: '/portal/content',
    icon: Download,
    badge: 'Exclusive',
    badgeColor: 'bg-purple-100 text-purple-800',
    bgColor: 'bg-gradient-to-br from-purple-50 to-pink-100',
    iconColor: 'text-purple-600'
  },
  {
    title: 'Beta Platform Access',
    description: 'Early access to our next-generation analytics suite',
    href: '/portal/content',
    icon: ExternalLink,
    badge: 'Beta',
    badgeColor: 'bg-yellow-100 text-yellow-800',
    bgColor: 'bg-gradient-to-br from-yellow-50 to-amber-100',
    iconColor: 'text-yellow-600'
  },
  {
    title: 'Industry Testimonials',
    description: 'See what your peer analysts are saying about our platform',
    href: '/portal/testimonials',
    icon: MessageSquare,
    badge: 'Updated',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    bgColor: 'bg-gradient-to-br from-emerald-50 to-teal-100',
    iconColor: 'text-emerald-600'
  }
]

// Quick stats
const quickStats = [
  { label: 'Exclusive Content Items', value: '24', icon: FileText, color: 'text-blue-600' },
  { label: 'Completed Briefings', value: '8', icon: Calendar, color: 'text-green-600' },
  { label: 'Research Reports', value: '12', icon: Download, color: 'text-purple-600' },
  { label: 'Video Resources', value: '16', icon: Play, color: 'text-orange-600' }
]

export default function AnalystPortalDashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
            <div className="flex-1 mb-6 lg:mb-0">
              <h1 className="text-3xl lg:text-4xl font-bold mb-4">
                It's good to have you here! 👋
              </h1>
              <p className="text-xl text-blue-100 mb-4">
                Welcome to your exclusive analyst portal
              </p>
              <blockquote className="border-l-4 border-blue-300 pl-4 italic text-blue-100">
                "We're excited to share our journey and insights with the industry's most influential voices. Your perspective helps shape the future of HR technology."
              </blockquote>
              <div className="mt-4 flex items-center text-blue-200">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3 overflow-hidden">
                  <img 
                    src="https://media.licdn.com/dms/image/v2/C4E03AQExN7FOgOVffA/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1516217373346?e=1756339200&v=beta&t=duPb2jgDUrrZr1s_ArOPtpfHNDETSM7H31dasVnwNP0"
                    alt="Arnaud Grunwald"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-semibold text-white">Arnaud Grunwald</div>
                  <div className="text-sm text-blue-200">Chief Product Officer, ClearCompany</div>
                </div>
              </div>
            </div>
            
            {/* CPO Photo */}
            <div className="flex-shrink-0 hidden lg:block">
              <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center overflow-hidden">
                <img 
                  src="https://media.licdn.com/dms/image/v2/C4E03AQExN7FOgOVffA/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1516217373346?e=1756339200&v=beta&t=duPb2jgDUrrZr1s_ArOPtpfHNDETSM7H31dasVnwNP0"
                  alt="Arnaud Grunwald, Chief Product Officer"
                  className="w-28 h-28 rounded-full object-cover border-4 border-white border-opacity-30"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center bg-gray-50', stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Priority Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Here's what we'd love you to explore first
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {priorityActions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className="group block"
            >
              <div className={cn(
                'relative p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-1',
                action.bgColor
              )}>
                <div className="flex items-start justify-between mb-4">
                  <div className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center',
                    action.iconColor,
                    'bg-white shadow-sm'
                  )}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    action.badgeColor
                  )}>
                    {action.badge}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {action.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {action.description}
                </p>
                
                <div className="flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
                  <span>Explore</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            <span className="text-gray-600">New content added:</span>
            <span className="font-medium text-gray-900 ml-1">Q4 Product Roadmap</span>
            <span className="text-gray-400 ml-auto">2 hours ago</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            <span className="text-gray-600">Upcoming briefing:</span>
            <span className="font-medium text-gray-900 ml-1">Strategy Session</span>
            <span className="text-gray-400 ml-auto">Tomorrow 2:00 PM</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
            <span className="text-gray-600">New testimonial from:</span>
            <span className="font-medium text-gray-900 ml-1">Forrester Research</span>
            <span className="text-gray-400 ml-auto">1 day ago</span>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { analystNav, type AnalystNavItem } from './analyst-navigation-config'
import { cn } from '@/lib/utils'

function NavItem({ item, depth = 0 }: { item: AnalystNavItem; depth?: number }) {
  const pathname = usePathname()
  const currentPath = pathname || ''
  const isActive = currentPath === item.href || (item.children && currentPath.startsWith(item.href))

  return (
    <div>
      <Link
        href={item.href}
        className={cn(
          'flex items-center rounded-md text-sm font-medium transition-colors',
          depth === 0 ? 'px-3 py-2' : 'pl-9 pr-3 py-1.5',
          isActive ? 'bg-pink-100 text-pink-700' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        )}
      >
        {depth === 0 && item.icon && <item.icon className="w-5 h-5 mr-2" />}
        {item.name}
      </Link>
      {item.children && (
        <div className="mt-1 space-y-1">
          {item.children.map((child) => (
            <NavItem key={child.href} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function AnalystSidebar() {
  return (
    <aside className="w-64 bg-white border-r border-pink-200 h-screen sticky top-0">
     
      <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-68px)]">
        {analystNav.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}
      </nav>
    </aside>
  )}
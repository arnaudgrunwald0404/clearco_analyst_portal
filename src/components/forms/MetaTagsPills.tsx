'use client'

import { Badge } from '@/components/ui/badge'

interface MetaTagsPillsProps {
  onTagClick: (tag: string) => void
}

const metaTagSections = [
  {
    title: 'Analyst Information',
    tags: [
      { tag: '{analyst_first_name}', description: 'Analyst\'s first name' },
      { tag: '{analyst_company}', description: 'Analyst\'s company name' },
      { tag: '{analyst_location}', description: 'Analyst\'s location/office' }
    ]
  },
  {
    title: 'Your Company Information',
    tags: [
      { tag: '{vendor_company_name}', description: 'Your company name' },
      { tag: '{vendor_industry}', description: 'Your company\'s industry' },
      { tag: '{vendor_contact_name}', description: 'Your contact person\'s name' },
      { tag: '{vendor_contact_title}', description: 'Your contact person\'s title' },
      { tag: '{vendor_contact_email}', description: 'Your contact person\'s email' }
    ]
  },
  {
    title: 'Dynamic Content',
    tags: [
      { tag: '{current_year}', description: 'Current year' }
    ]
  }
]

export function MetaTagsPills({ onTagClick }: MetaTagsPillsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Meta Tags:</span>
        <span className="text-xs text-gray-500">Click to insert at cursor position</span>
      </div>
      
      {metaTagSections.map((section, sectionIndex) => (
        <div key={section.title} className="space-y-2">
          <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            {section.title}
          </h4>
          <div className="flex flex-wrap gap-2">
            {section.tags.map(({ tag, description }) => (
              <Badge
                key={tag}
                variant="outline"
                className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors text-xs"
                title={description}
                onClick={() => onTagClick(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

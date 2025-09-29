import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getCategoryIcon, getCategoryColor } from '@/lib/content-utils'

interface EmptyStateTableProps {
  category: string
  onAddContent: (category: string) => void
}

const categoryValuePropositions: Record<string, string> = {
  'PRODUCT': 'Share product overviews, roadmaps, and screenshots to help analysts understand your solutions and future direction',
  'DEMOS': 'Showcase live product demonstrations to help analysts understand your solutions firsthand',
  'VIDEOS': 'Share CEO addresses and company presentations to demonstrate thought leadership and vision',
  'CASE_STUDIES': 'Highlight customer success stories to demonstrate real-world value and impact',
  'PRESS_RELEASES': 'Provide press releases to keep analysts informed about company news and announcements',
  'REPORTS': 'Share thought leadership content and third-party reviews to showcase market expertise',
  'WEBINARS': 'Share educational webinars to position your team as industry thought leaders',
  'BRAND_KIT': 'Provide brand assets to ensure consistent representation in analyst reports and presentations'
}

const categoryButtonLabels: Record<string, string> = {
  'PRODUCT': 'Product File',
  'DEMOS': 'Demo File',
  'VIDEOS': 'Video File',
  'CASE_STUDIES': 'Case Study File',
  'PRESS_RELEASES': 'Press Release File',
  'REPORTS': 'Report File',
  'WEBINARS': 'Webinar File',
  'BRAND_KIT': 'Brand Asset'
}

export function EmptyStateTable({ category, onAddContent }: EmptyStateTableProps) {
  const IconComponent = getCategoryIcon(category)
  const colorClass = getCategoryColor(category)
  const valueProposition = categoryValuePropositions[category] || 'Share valuable content with analysts'
  const buttonLabel = categoryButtonLabels[category] || 'Add File'

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          {/* Category Icon and Title */}
          <div className="flex items-center justify-center space-x-3">
            <div className={`p-3 rounded-lg ${colorClass}`}>
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 capitalize">
              {category.replace('_', ' ').toLowerCase()}
            </h3>
          </div>

          {/* Value Proposition */}
          <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
            {valueProposition}
          </p>

          {/* Add Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddContent(category)}
            className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            {buttonLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

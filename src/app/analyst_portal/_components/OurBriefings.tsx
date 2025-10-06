import React from 'react'

export default function OurBriefings({ analystId }: { analystId?: string }) {
  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="text-sm text-gray-600">Our Briefings{analystId ? ` (Analyst: ${analystId})` : ''}</div>
      <div className="text-xs text-gray-500 mt-1">Placeholder component</div>
    </div>
  )
}

export function OurBriefingsSkeleton() {
  return (
    <div className="border rounded-lg p-4 bg-gray-50 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
    </div>
  )
}
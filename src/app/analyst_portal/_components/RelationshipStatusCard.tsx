import React from 'react'

export default function RelationshipStatusCard() {
  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="font-medium text-gray-900">Relationship Status</div>
      <div className="text-sm text-gray-600">Placeholder summary</div>
    </div>
  )
}

export function RelationshipStatusSkeleton() {
  return (
    <div className="border rounded-lg p-4 bg-gray-50 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
    </div>
  )
}
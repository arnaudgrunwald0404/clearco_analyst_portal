import React from 'react'

export default function BriefingsHeader() {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-900">Briefings</h2>
      <a href="/portal/briefings" className="text-sm text-blue-600 hover:underline">View all</a>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { Plus, Search, Filter, MoreHorizontal } from 'lucide-react'
import { cn, getInfluenceColor, getStatusColor } from '@/lib/utils'

// Mock data for now - will be replaced with actual database queries
const mockAnalysts = [
  {
    id: '1',
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah.chen@gartner.com',
    company: 'Gartner',
    title: 'Vice President Analyst',
    influence: 'VERY_HIGH',
    status: 'ACTIVE',
    expertise: ['HR Technology', 'Talent Management'],
    linkedIn: 'https://linkedin.com/in/sarahchen',
    twitter: '@sarahchen_hr',
    phone: '+1-555-0123'
  },
  {
    id: '2',
    firstName: 'Michael',
    lastName: 'Rodriguez',
    email: 'mrodriguez@forrester.com',
    company: 'Forrester',
    title: 'Principal Analyst',
    influence: 'HIGH',
    status: 'ACTIVE',
    expertise: ['Employee Experience', 'HR Analytics'],
    linkedIn: 'https://linkedin.com/in/michaelrodriguez',
    phone: '+1-555-0124'
  }
]

export default function AnalystsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')

  const filteredAnalysts = mockAnalysts.filter(analyst => {
    const matchesSearch = analyst.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analyst.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analyst.company.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'ALL' || analyst.status === filterStatus
    
    return matchesSearch && matchesFilter
  })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analysts</h1>
          <p className="mt-2 text-gray-600">
            Manage your industry analyst relationships
          </p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Analyst
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search analysts..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Analysts Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Analyst
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company & Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expertise
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Influence
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAnalysts.map((analyst) => (
              <tr key={analyst.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-800">
                          {analyst.firstName.charAt(0)}{analyst.lastName.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {analyst.firstName} {analyst.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{analyst.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{analyst.company}</div>
                  <div className="text-sm text-gray-500">{analyst.title}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {analyst.expertise.map((area, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getInfluenceColor(analyst.influence)
                  )}>
                    {analyst.influence.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getStatusColor(analyst.status)
                  )}>
                    {analyst.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredAnalysts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No analysts found matching your criteria.</div>
          </div>
        )}
      </div>
    </div>
  )
}

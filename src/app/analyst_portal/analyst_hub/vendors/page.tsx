'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, X, Loader, Check, ChevronDown, Building2, ExternalLink, RefreshCw } from 'lucide-react'
import { SpinningCupcake } from '@/components/ui/spinning-cupcake'
import { cn } from '@/lib/utils'
import VendorDrawer from '@/components/drawers/vendor-drawer'
import { useToast } from '@/components/ui/toast'

interface Vendor {
  id: string
  companyName: string
  website?: string
  category: string
  tier: 'STRATEGIC' | 'IMPORTANT' | 'STANDARD' | 'LOW'
  description?: string
  lastBriefingDate?: string
  relationshipHealth?: string
  createdAt: string
  updatedAt: string
  logoUrl?: string
  analystCount?: number
}

export default function VendorsListPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTier, setFilterTier] = useState('ALL')
  const [filterCategory, setFilterCategory] = useState('ALL')
  const [sortField, setSortField] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { addToast } = useToast()
  const tierDropdownRef = useRef<HTMLDivElement | null>(null)
  const [openTierFor, setOpenTierFor] = useState<string | null>(null)

  // Load vendors on component mount
  const fetchVendors = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/vendors')
      if (!response.ok) {
        throw new Error('Failed to fetch vendors')
      }
      
      const result = await response.json()
      if (result.success && result.data) {
        setVendors(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch vendors')
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch vendors')
      setVendors([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVendors()
  }, [])

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = vendors.map(v => v.category).filter(Boolean)
    return Array.from(new Set(cats)).sort()
  }, [vendors])

  // Filter and sort vendors
  const filteredAndSortedVendors = useMemo(() => {
    let filtered = vendors.filter(vendor => {
      const matchesSearch = !searchTerm || 
        vendor.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.category.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesTier = filterTier === 'ALL' || vendor.tier === filterTier
      const matchesCategory = filterCategory === 'ALL' || vendor.category === filterCategory
      
      return matchesSearch && matchesTier && matchesCategory
    })

    if (sortField) {
      filtered.sort((a, b) => {
        let aValue: any = ''
        let bValue: any = ''

        switch (sortField) {
          case 'name':
            aValue = a.companyName
            bValue = b.companyName
            break
          case 'category':
            aValue = a.category
            bValue = b.category
            break
          case 'tier':
            const tierOrder = { 'STRATEGIC': 4, 'IMPORTANT': 3, 'STANDARD': 2, 'LOW': 1 }
            aValue = tierOrder[a.tier]
            bValue = tierOrder[b.tier]
            break
          case 'lastBriefing':
            aValue = a.lastBriefingDate ? new Date(a.lastBriefingDate).getTime() : 0
            bValue = b.lastBriefingDate ? new Date(b.lastBriefingDate).getTime() : 0
            break
          default:
            return 0
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        }

        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      })
    }

    return filtered
  }, [vendors, searchTerm, filterTier, filterCategory, sortField, sortDirection])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3" />
    return sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
  }

  const handleRowClick = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setIsDrawerOpen(true)
  }

  const handleVendorProfileClick = (vendor: Vendor, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click from triggering
    // Navigate to vendor profile with vendor context
    router.push(`/analyst_portal/vendor_profile?vendor=${encodeURIComponent(vendor.companyName)}`)
  }

  const updateVendorTier = async (vendorId: string, newTier: Vendor['tier']) => {
    try {
      // Update local state immediately for better UX
      setVendors(vendors.map(vendor => 
        vendor.id === vendorId ? { ...vendor, tier: newTier } : vendor
      ))
      setOpenTierFor(null)
      
      // TODO: Make API call to update vendor tier
      // const response = await fetch(`/api/vendors/${vendorId}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ tier: newTier })
      // })
      
      addToast({ type: 'success', message: 'Vendor tier updated successfully' })
    } catch (error) {
      console.error('Failed to update vendor tier:', error)
      addToast({ type: 'error', message: 'Failed to update vendor tier' })
      // Revert the change on error
      // fetchVendors()
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'STRATEGIC': return 'bg-purple-100 text-purple-800'
      case 'IMPORTANT': return 'bg-blue-100 text-blue-800'
      case 'STANDARD': return 'bg-green-100 text-green-800'
      case 'LOW': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Close tier dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tierDropdownRef.current && !tierDropdownRef.current.contains(event.target as Node)) {
        setOpenTierFor(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-600">Manage your vendor relationships and track engagement activities.</p>
        </div>
        <button
          onClick={fetchVendors}
          disabled={loading}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
            />
          </div>
        </div>

        {/* Tier Filter */}
        <div className="sm:w-48">
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
          >
            <option value="ALL">All Tiers</option>
            <option value="STRATEGIC">Strategic</option>
            <option value="IMPORTANT">Important</option>
            <option value="STANDARD">Standard</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="sm:w-48">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
          >
            <option value="ALL">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters */}
      {(searchTerm || filterTier !== 'ALL' || filterCategory !== 'ALL') && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>Showing {filteredAndSortedVendors.length} of {vendors.length} vendors</span>
          {searchTerm && (
            <span> matching "{searchTerm}"</span>
          )}
          {filterTier !== 'ALL' && (
            <span> in {filterTier} tier</span>
          )}
          {filterCategory !== 'ALL' && (
            <span> in {filterCategory} category</span>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <SpinningCupcake size="lg" />
            <span className="text-gray-600">Loading vendors...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-red-600 mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error loading vendors</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Vendors Table */}
      {!loading && !error && (
        <div className="bg-white shadow rounded-lg">
          <div className="overflow-x-auto">
            {/* Grid Header */}
            <div className="grid grid-cols-13 gap-4 bg-pink-200 px-6 py-3 border-b border-pink-200 font-medium text-xs text-gray-900 text-bold uppercase tracking-wider rounded-t-lg">
              <div 
                className="col-span-4 cursor-pointer hover:bg-gray-100 transition-colors flex items-center space-x-1 rounded px-2 py-1"
                onClick={() => handleSort('name')}
              >
                <span>Company Name</span>
                {getSortIcon('name')}
              </div>
              <div 
                className="col-span-3 cursor-pointer hover:bg-gray-100 transition-colors flex items-center space-x-1 rounded px-2 py-1"
                onClick={() => handleSort('category')}
              >
                <span>Category</span>
                {getSortIcon('category')}
              </div>
              <div 
                className="col-span-2 cursor-pointer hover:bg-gray-100 transition-colors flex items-center space-x-1 rounded px-2 py-1"
                onClick={() => handleSort('tier')}
              >
                <span>Tier</span>
                {getSortIcon('tier')}
              </div>
              <div 
                className="col-span-3 cursor-pointer hover:bg-gray-100 transition-colors flex items-center space-x-1 rounded px-2 py-1"
                onClick={() => handleSort('lastBriefing')}
              >
                <span>Last Briefing</span>
                {getSortIcon('lastBriefing')}
              </div>
              <div className="col-span-1 flex items-center justify-center">
                <span>Actions</span>
              </div>
            </div>
            
            {/* Grid Body */}
            <div className="divide-y divide-gray-200">
              {filteredAndSortedVendors.map((vendor) => (
                <div key={vendor.id} className="grid grid-cols-13 gap-4 px-6 py-4 hover:bg-gray-50">
                  {/* Company Name - 4/13 */}
                  <div className="col-span-4 cursor-pointer" onClick={() => handleRowClick(vendor)}>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {vendor.logoUrl ? (
                          <img 
                            src={vendor.logoUrl} 
                            alt={`${vendor.companyName} logo`}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-blue-600" />
                          </div>
                        )}
                      </div>
                      <div className="ml-3 min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {vendor.companyName}
                        </div>
                        {vendor.website && (
                          <div className="text-sm text-gray-500 truncate">{vendor.website}</div>
                        )}
                        {vendor.analystCount !== undefined && (
                          <div className="text-xs text-gray-400">
                            {vendor.analystCount} analyst{vendor.analystCount !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Category - 3/13 */}
                  <div className="col-span-3 cursor-pointer" onClick={() => handleRowClick(vendor)}>
                    <div className="text-sm text-gray-900">{vendor.category}</div>
                  </div>
                  
                  {/* Tier - inline editable pill - 2/13 */}
                  <div className="col-span-2 relative">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setOpenTierFor(openTierFor === vendor.id ? null : vendor.id) }}
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent hover:opacity-90',
                        getTierColor(vendor.tier)
                      )}
                      aria-haspopup="listbox"
                      aria-expanded={openTierFor === vendor.id}
                      aria-label="Change tier"
                    >
                      {vendor.tier}
                    </button>
                    {openTierFor === vendor.id && (
                      <div
                        ref={tierDropdownRef}
                        className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                        role="listbox"
                      >
                        {([
                          ['STRATEGIC', 'Strategic'],
                          ['IMPORTANT', 'Important'],
                          ['STANDARD', 'Standard'],
                          ['LOW', 'Low']
                        ] as const).map(([value, label]) => (
                          <button
                            key={value}
                            className={cn(
                              'w-full text-left px-3 py-2 text-sm hover:bg-gray-50',
                              value === vendor.tier ? 'font-semibold text-gray-900' : 'text-gray-700'
                            )}
                            onClick={(e) => { e.stopPropagation(); updateVendorTier(vendor.id, value) }}
                            role="option"
                            aria-selected={value === vendor.tier}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Last Briefing - 3/13 */}
                  <div className="col-span-3 cursor-pointer" onClick={() => handleRowClick(vendor)}>
                    <div className="text-sm text-gray-900">
                      {vendor.lastBriefingDate ? new Date(vendor.lastBriefingDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : (
                        <span className="text-gray-500">Never</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions - 1/13 */}
                  <div className="col-span-1 flex items-center justify-center">
                    <button
                      onClick={(e) => handleVendorProfileClick(vendor, e)}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 hover:border-blue-300 transition-colors"
                      title="Go to Vendor Profile"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Profile
                    </button>
                  </div>
                </div>
              ))}
              
              {filteredAndSortedVendors.length === 0 && !loading && (
                <div className="grid grid-cols-13 gap-4 px-6 py-12">
                  <div className="col-span-13 text-center">
                    <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {vendors.length === 0 ? 'No vendors available' : 'No vendors found matching your criteria'}
                    </h3>
                    <p className="text-gray-500">
                      {vendors.length === 0 
                        ? 'There are no vendors configured in the system yet.' 
                        : 'Try adjusting your search or filter criteria.'
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vendor Drawer */}
      {selectedVendor && (
        <VendorDrawer 
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false)
            // Clear selected vendor after animation completes
            setTimeout(() => setSelectedVendor(null), 300)
          }}
          vendor={selectedVendor}
        />
      )}
    </div>
  )
}

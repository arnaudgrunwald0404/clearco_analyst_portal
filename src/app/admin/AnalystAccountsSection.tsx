'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, UserCog, UserPlus, Trash2, AlertTriangle } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface AnalystAccount {
  id: string
  firstName: string
  lastName: string
  email: string
  company: string | null
  title: string | null
  linkedinUrl: string | null
  personalWebsite: string | null
  type: string
  influence: string
  status: string
  vendor_domain_id: string | null
  vendor_domain?: {
    company_name: string
    protected_domain: string
  }
  createdAt: string
  updatedAt: string
}


interface AnalystOption {
  id: string
  firstName: string
  lastName: string
  email: string
  company: string | null
  hasLoginAccess: boolean
}

export default function AnalystAccountsSection() {
  const [analysts, setAnalysts] = useState<AnalystAccount[]>([])
  const [allAnalysts, setAllAnalysts] = useState<AnalystOption[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showAddAccessModal, setShowAddAccessModal] = useState(false)
  const [selectedAnalystId, setSelectedAnalystId] = useState<string>('')
  const [granting, setGranting] = useState(false)
  
  // Bulk selection state
  const [selectedAnalysts, setSelectedAnalysts] = useState<Set<string>>(new Set())
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchAnalysts()
    fetchAllAnalysts()
  }, [])

  const fetchAnalysts = async () => {
    try {
      console.log('🔄 [AnalystAccountsSection] Starting fetch to /api/admin/analysts')
      const response = await fetch('/api/admin/analysts')
      console.log('📡 [AnalystAccountsSection] Response status:', response.status)
      console.log('📡 [AnalystAccountsSection] Response ok:', response.ok)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [AnalystAccountsSection] Error response:', errorText)
        throw new Error(`Failed to fetch analysts: ${response.status} ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('✅ [AnalystAccountsSection] Successfully fetched analysts:', result.data?.length || 0)
      setAnalysts(result.data || [])
    } catch (error) {
      console.error('❌ [AnalystAccountsSection] Error fetching analysts:', error)
    } finally {
      setLoading(false)
    }
  }


  const fetchAllAnalysts = async () => {
    try {
      console.log('🔄 [AnalystAccountsSection] Fetching all analysts for access management...')
      const response = await fetch('/api/admin/all-analysts')
      if (!response.ok) throw new Error('Failed to fetch all analysts')
      const result = await response.json()
      
      console.log('✅ [AnalystAccountsSection] Received all analysts:', result.data?.length || 0)
      setAllAnalysts(result.data || [])
    } catch (error) {
      console.error('❌ [AnalystAccountsSection] Error fetching all analysts:', error)
    }
  }

  const handleGrantAccess = async () => {
    if (!selectedAnalystId) {
      toast.error('Please select an analyst')
      return
    }

    try {
      setGranting(true)
      console.log('🔄 [AnalystAccountsSection] Granting access to analyst:', selectedAnalystId)
      
      const response = await fetch('/api/admin/grant-analyst-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analystId: selectedAnalystId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to grant access')
      }

      const result = await response.json()
      console.log('✅ [AnalystAccountsSection] Access granted successfully')
      
      toast.success('Analyst access granted successfully!')
      setShowAddAccessModal(false)
      setSelectedAnalystId('')
      
      // Refresh the data
      fetchAnalysts()
      fetchAllAnalysts()
    } catch (error) {
      console.error('❌ [AnalystAccountsSection] Error granting access:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to grant access')
    } finally {
      setGranting(false)
    }
  }

  // Bulk selection handlers
  const toggleAnalystSelection = (analystId: string) => {
    const newSelected = new Set(selectedAnalysts)
    if (newSelected.has(analystId)) {
      newSelected.delete(analystId)
    } else {
      newSelected.add(analystId)
    }
    setSelectedAnalysts(newSelected)
  }

  const toggleAllAnalysts = () => {
    if (selectedAnalysts.size === filteredAnalysts.length && filteredAnalysts.length > 0) {
      setSelectedAnalysts(new Set())
    } else {
      setSelectedAnalysts(new Set(filteredAnalysts.map(a => a.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedAnalysts.size === 0) {
      toast.error('Please select analysts to remove')
      return
    }

    try {
      setDeleting(true)
      console.log('🔄 [AnalystAccountsSection] Removing access for analysts:', Array.from(selectedAnalysts))
      
      const response = await fetch('/api/admin/remove-analyst-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analystIds: Array.from(selectedAnalysts) }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove access')
      }

      const result = await response.json()
      console.log('✅ [AnalystAccountsSection] Access removed successfully')
      
      toast.success(`Successfully removed access for ${selectedAnalysts.size} analyst${selectedAnalysts.size > 1 ? 's' : ''}`)
      setShowBulkDeleteModal(false)
      setSelectedAnalysts(new Set())
      
      // Refresh the data
      fetchAnalysts()
      fetchAllAnalysts()
    } catch (error) {
      console.error('❌ [AnalystAccountsSection] Error removing access:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to remove access')
    } finally {
      setDeleting(false)
    }
  }

  const filteredAnalysts = analysts.filter((analyst) => {
    const matchesSearch = 
      analyst.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analyst.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analyst.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (analyst.company && analyst.company.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = selectedStatus === 'all' || analyst.status === selectedStatus

    return matchesSearch && matchesStatus
  })
  const activeFilteredCount = filteredAnalysts.filter(a => a.status === 'ACTIVE').length


  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'INACTIVE': return 'bg-red-100 text-red-800'
      case 'PROSPECT': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analyst accounts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analyst Accounts</h2>
          <p className="text-gray-600 mt-1">
            Manage analyst accounts that have access to sign in to the platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Bulk Actions */}
          {selectedAnalysts.size > 0 && (
            <Dialog open={showBulkDeleteModal} onOpenChange={setShowBulkDeleteModal}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm" className="text-white">

                  Remove Access ({selectedAnalysts.size})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Remove Analyst Access
                  </DialogTitle>
                  <DialogDescription>
                    Are you sure you want to remove login access for {selectedAnalysts.size} analyst{selectedAnalysts.size > 1 ? 's' : ''}? 
                    This will prevent them from signing in to the platform, but their data will remain in the system.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowBulkDeleteModal(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={handleBulkDelete}
                    disabled={deleting}
                    className="text-white"
                  >

                    {deleting ? 'Removing Access...' : 'Remove Access'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          
          <Dialog open={showAddAccessModal} onOpenChange={setShowAddAccessModal}>
          <DialogTrigger asChild>
            <Button className="bg-pink-600 hover:bg-pink-700 ml-12">
              <UserPlus className="w-4 h-4 mr-2" />
              Grant Access
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grant Analyst Access</DialogTitle>
              <DialogDescription>
                Select an analyst from the database to grant login access to the platform.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Select Analyst
                </label>
                <Select value={selectedAnalystId} onValueChange={setSelectedAnalystId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an analyst to grant access..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allAnalysts
                      .filter(analyst => !analyst.hasLoginAccess)
                      .map((analyst) => (
                        <SelectItem key={analyst.id} value={analyst.id}>
                          {analyst.firstName} {analyst.lastName} ({analyst.email})
                          {analyst.company && ` - ${analyst.company}`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {allAnalysts.filter(a => !a.hasLoginAccess).length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    All analysts already have login access to the platform.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddAccessModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleGrantAccess}
                disabled={!selectedAnalystId || granting}
                className="bg-green-600 hover:bg-green-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {granting ? 'Granting Access...' : 'Grant Access'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Removed Stats Cards */}

      {/* Filters - admin vendor-agnostic: only search and status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative col-span-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by name, email, company"
            aria-label="Search analysts by name, email, company"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger aria-label="Filter by status" title="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="PROSPECT">Prospect</SelectItem>
          </SelectContent>
        </Select>

      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredAnalysts.length} of {analysts.length} analysts, {activeFilteredCount} active
          {selectedAnalysts.size > 0 && (
            <span className="ml-2 text-blue-600 font-medium">
              • {selectedAnalysts.size} selected
            </span>
          )}
        </p>
        {selectedAnalysts.size > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedAnalysts(new Set())}
          >
            Clear Selection
          </Button>
        )}
      </div>

      {/* Analysts Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-pink-200 rounded-t-lg">
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedAnalysts.size === filteredAnalysts.length && filteredAnalysts.length > 0}
                      onChange={toggleAllAnalysts}
                      className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 focus:ring-2"
                    />
                  </TableHead>
                  <TableHead className="font-medium text-xs text-gray-900 text-bold uppercase tracking-wider">Analyst</TableHead>
                  <TableHead className="font-medium text-xs text-gray-900 text-bold uppercase tracking-wider">Company</TableHead>
                  <TableHead className="font-medium text-xs text-gray-900 text-bold uppercase tracking-wider">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnalysts.map((analyst) => (
                  <TableRow key={analyst.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedAnalysts.has(analyst.id)}
                        onChange={() => toggleAnalystSelection(analyst.id)}
                        className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 focus:ring-2"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {analyst.firstName} {analyst.lastName}
                        </div>
                        <div className="text-sm text-gray-600">{analyst.title}</div>
                      </div>
                    </TableCell>
                    <TableCell>{analyst.company || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(analyst.status)}>
                        {analyst.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredAnalysts.length === 0 && (
            <div className="text-center py-12">
              <UserCog className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No analysts found</h3>
              <p className="text-gray-600">Try adjusting your search criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

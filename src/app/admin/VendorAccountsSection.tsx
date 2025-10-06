'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Building2, Users, Trash2, Eye, Mail } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

interface VendorDomain {
  id: string
  company_name: string
  protected_domain: string
  logo_url: string
  industry_name: string
  created_at: string
  updated_at: string
  user_count?: number
}

interface VendorUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  created_at: string
  last_sign_in_at?: string
  isFirstAdmin?: boolean
}

export default function VendorAccountsSection() {
  const [vendorDomains, setVendorDomains] = useState<VendorDomain[]>([])
  const [selectedDomain, setSelectedDomain] = useState<VendorDomain | null>(null)
  const [domainUsers, setDomainUsers] = useState<VendorUser[]>([])
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(false)
  const [showNewVendorModal, setShowNewVendorModal] = useState(false)
  const [showUsersModal, setShowUsersModal] = useState(false)
  const [newVendorData, setNewVendorData] = useState({
    domain: '',
    adminEmail: ''
  })

  useEffect(() => {
    fetchVendorDomains()
  }, [])

  const fetchVendorDomains = async () => {
    try {
      console.log('🔄 [VendorAccountsSection] Fetching vendor domains...')
      const response = await fetch('/api/admin/vendor-domains')
      console.log('📡 [VendorAccountsSection] Response status:', response.status)
      
      if (!response.ok) throw new Error('Failed to fetch vendor domains')
      const result = await response.json()
      
      console.log('✅ [VendorAccountsSection] Received vendor domains:', result.data?.length || 0)
      console.log('📋 [VendorAccountsSection] Domain list:', result.data?.map((d: VendorDomain) => `${d.company_name} (${d.protected_domain})`) || [])
      
      setVendorDomains(result.data || [])
    } catch (error) {
      console.error('❌ [VendorAccountsSection] Error fetching vendor domains:', error)
      toast.error('Failed to load vendor domains')
    } finally {
      setLoading(false)
    }
  }

  const fetchDomainUsers = async (domainId: string) => {
    setUsersLoading(true)
    try {
      const response = await fetch(`/api/admin/vendor-domains/${domainId}/users`)
      if (!response.ok) throw new Error('Failed to fetch users')
      const result = await response.json()
      setDomainUsers(result.data || [])
    } catch (error) {
      console.error('Error fetching domain users:', error)
      toast.error('Failed to load users')
    } finally {
      setUsersLoading(false)
    }
  }

  const handleViewUsers = async (domain: VendorDomain) => {
    setSelectedDomain(domain)
    setShowUsersModal(true)
    await fetchDomainUsers(domain.id)
  }

  const handleCreateVendor = async () => {
    if (!newVendorData.domain || !newVendorData.adminEmail) {
      toast.error('Please fill in all fields')
      return
    }

    // Validate that email domain matches the domain
    const emailDomain = newVendorData.adminEmail.split('@')[1]
    if (emailDomain !== newVendorData.domain) {
      toast.error('Admin email domain must match the vendor domain')
      return
    }

    try {
      const response = await fetch('/api/admin/create-vendor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newVendorData),
      })

      if (!response.ok) throw new Error('Failed to create vendor')
      
      const result = await response.json()
      toast.success('Vendor account created successfully!')
      setShowNewVendorModal(false)
      setNewVendorData({ domain: '', adminEmail: '' })
      fetchVendorDomains()
    } catch (error) {
      console.error('Error creating vendor:', error)
      toast.error('Failed to create vendor account')
    }
  }

  const handleDeleteUser = async (userId: string, isFirstAdmin: boolean) => {
    if (isFirstAdmin) {
      toast.error('Cannot delete the first admin user')
      return
    }

    if (!confirm('Are you sure you want to delete this user?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete user')
      
      toast.success('User deleted successfully')
      if (selectedDomain) {
        await fetchDomainUsers(selectedDomain.id)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vendor accounts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vendor Accounts</h2>
          <p className="text-gray-600 mt-1">
            Manage vendor domains and their associated users
          </p>
        </div>
        <Dialog open={showNewVendorModal} onOpenChange={setShowNewVendorModal}>
          <DialogTrigger asChild>
            <Button className="bg-pink-600 hover:bg-pink-700">
              <Plus className="w-4 h-4 mr-2" />
              New Vendor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Vendor Account</DialogTitle>
              <DialogDescription>
                Create a new vendor account with a domain admin. The admin email domain must match the vendor domain.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={newVendorData.domain}
                  onChange={(e) => setNewVendorData({ ...newVendorData, domain: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="adminEmail">Admin Email</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  placeholder="admin@example.com"
                  value={newVendorData.adminEmail}
                  onChange={(e) => setNewVendorData({ ...newVendorData, adminEmail: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewVendorModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateVendor}>
                Create Vendor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Vendor Domains Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-pink-200 rounded-t-lg">
            <TableRow>
              <TableHead className="font-medium text-xs text-gray-900 text-bold uppercase tracking-wider">Company</TableHead>
              <TableHead className="font-medium text-xs text-gray-900 text-bold uppercase tracking-wider">Industry</TableHead>
              <TableHead className="font-medium text-xs text-gray-900 text-bold uppercase tracking-wider">Users</TableHead>
              <TableHead className="font-medium text-xs text-gray-900 text-bold uppercase tracking-wider">Created</TableHead>
              <TableHead className="font-medium text-xs text-gray-900 text-bold uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendorDomains.map((domain) => (
              <TableRow key={domain.id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="flex items-center">
                    <div>
                      <div className="font-medium text-gray-900">{domain.company_name}</div>
                      <div className="font-mono text-sm text-gray-700">{domain.protected_domain}</div>
                      {domain.logo_url && (
                        <div className="text-xs text-gray-500">Has logo</div>
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge variant="secondary">{domain.industry_name || 'Technology'}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm text-gray-600">
                  
                    {domain.user_count || 0}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-500">
                    {new Date(domain.created_at).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewUsers(domain)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Users
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {vendorDomains.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No vendor accounts yet</h3>
          <p className="text-gray-600 mb-4">Create your first vendor account to get started</p>
          <Button onClick={() => setShowNewVendorModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Vendor Account
          </Button>
        </div>
      )}

      {/* Users Modal */}
      <Dialog open={showUsersModal} onOpenChange={setShowUsersModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Users for {selectedDomain?.company_name}
            </DialogTitle>
            <DialogDescription>
              Manage users for the {selectedDomain?.protected_domain} domain
            </DialogDescription>
          </DialogHeader>
          
          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Last Sign In</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domainUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        {user.firstName} {user.lastName}
                        {user.isFirstAdmin && (
                          <Badge variant="secondary" className="ml-2">First Admin</Badge>
                        )}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'VENDOR_ADMIN' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.last_sign_in_at 
                          ? new Date(user.last_sign_in_at).toLocaleDateString()
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell>
                        {!user.isFirstAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, user.isFirstAdmin || false)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {domainUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No users found for this domain
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUsersModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

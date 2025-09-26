'use client'

import { useState, useEffect } from 'react'
import { Users, RefreshCw, Mail, User, Shield, XCircle, Clock, Plus, Save, X, AlertTriangle, Globe, CheckCircle, Trash2 } from 'lucide-react'
import { SpinningCupcake } from '@/components/ui/spinning-cupcake'

interface AdminUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role?: string
  createdAt: string
  updatedAt: string
  emailConfirmed: boolean
  lastSignIn: string | null
  provider: string
  hasProfile: boolean
  company?: string | null
}

interface NewUser {
  firstName: string
  lastName: string
  email: string
}

export default function AdminUsersSection() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [domain, setDomain] = useState<string>('')
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [newUser, setNewUser] = useState<NewUser>({ firstName: '', lastName: '', email: '' })
  const [saving, setSaving] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 [AdminUsersSection] Fetching users...')
      const response = await fetch('/api/admin/users')
      console.log('📊 [AdminUsersSection] Response status:', response.status)
      console.log('📊 [AdminUsersSection] Response headers:', Object.fromEntries(response.headers.entries()))

      let result
      try {
        result = await response.json()
        console.log('📊 [AdminUsersSection] Response data:', result)
      } catch (jsonError) {
        console.error('❌ [AdminUsersSection] Failed to parse JSON:', jsonError)
        const textResponse = await response.text()
        console.error('❌ [AdminUsersSection] Raw response:', textResponse)
        throw new Error(`Invalid JSON response: ${textResponse.substring(0, 200)}`)
      }

      if (!response.ok || !result.success) {
        const errorMessage = result.error || `HTTP ${response.status}: ${response.statusText}`
        console.error('❌ [AdminUsersSection] API Error:', errorMessage)
        throw new Error(errorMessage)
      }

      console.log('✅ [AdminUsersSection] Successfully fetched users:', result.data?.length || 0)
      setUsers(result.data || [])
      setDomain(result.domain || '')
    } catch (err) {
      console.error('❌ [AdminUsersSection] Error fetching users:', err)
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleAddUser = () => {
    setIsAddingUser(true)
    setNewUser({ firstName: '', lastName: '', email: '' })
  }

  const handleCancelAdd = () => {
    setIsAddingUser(false)
    setNewUser({ firstName: '', lastName: '', email: '' })
  }

  const handleSaveUser = async () => {
    // Validate all fields are filled
    if (!newUser.firstName.trim() || !newUser.lastName.trim() || !newUser.email.trim()) {
      return // Don't save if any field is empty
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newUser.email)) {
      setError('Please enter a valid email address')
      return
    }

    // Validate email domain matches protected domain
    const emailDomain = newUser.email.split('@')[1]?.toLowerCase()
    if (emailDomain !== domain.toLowerCase()) {
      setError(`Email must be from the ${domain} domain`)
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create user')
      }

      // Refresh the users list
      await fetchUsers()
      
      // Reset the form
      setIsAddingUser(false)
      setNewUser({ firstName: '', lastName: '', email: '' })
    } catch (err) {
      console.error('Error creating user:', err)
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof NewUser, value: string) => {
    setNewUser(prev => ({ ...prev, [field]: value }))
    if (error) setError(null) // Clear error when user starts typing
  }

  const isFormValid = newUser.firstName.trim() && newUser.lastName.trim() && newUser.email.trim()

  const handleDeleteUser = async (userId: string) => {
    setDeletingUserId(userId)
    setError(null)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete user')
      }

      // Refresh the users list
      await fetchUsers()
      setShowDeleteConfirm(null)
    } catch (err) {
      console.error('Error deleting user:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setDeletingUserId(null)
    }
  }

  const handleDeleteConfirm = (userId: string) => {
    setShowDeleteConfirm(userId)
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            Admin Users
          </h2>
          <p className="mt-2 text-gray-600">Manage system users and their access</p>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <SpinningCupcake size="lg" />
          <span className="ml-2 text-gray-600">Loading users...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            Admin Users
          </h2>
          <p className="mt-2 text-gray-600">Manage system users and their access</p>
        </div>
        
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <Users className="w-12 h-12 mx-auto opacity-50" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Users</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchUsers}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            Admin Users
          </h2>
          
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleAddUser}
            disabled={isAddingUser}
            className="inline-flex items-center px-4 py-2 bg-transparent text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </button>
          <button
            onClick={fetchUsers}
            className="inline-flex items-center px-4 py-2 bg-transparent text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      
        {/* Domain Users */}
       
          <div className="flex items-center">
           
            <div className="ml-2 w-0 flex-1">
              <dl>
                
                <p className="text-sm text-gray-600">
            Users from domain:{domain && (
              <span className="inline-flex gap-1 py-1 text-sm font-semibold rounded-md ml-2">
                {domain}
              </span>
            )}
          </p>
                
                <dd className="text-2xl font-semibold text-gray-900">
                  {users.length}
                </dd>
              </dl>
            </div>
          </div>
        
      

      {/* Users List */}
      {users.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
          <p className="text-gray-500">
            No users are currently registered in the system.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">
                    User
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Dates
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Add User Row */}
                {isAddingUser && (
                  <tr className="bg-blue-50 border-l-4 border-blue-400">
                    {/* User Name & Email - Combined Column */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="First name"
                            value={newUser.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 w-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            placeholder="Last name"
                            value={newUser.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 w-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 text-gray-400 mr-2" />
                          <input
                            type="email"
                            placeholder={`user@${domain}`}
                            value={newUser.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="text-sm text-gray-900 border border-gray-300 rounded px-2 py-1 w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            <Shield className="w-3 h-3" />
                            User
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-orange-500 text-white" title="User will have no profile data initially">
                            <AlertTriangle className="w-3 h-3" />
                            No Profile
                          </span>
                        </div>
                      </div>
                    </td>


                    {/* Dates */}
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div className="text-xs font-medium text-gray-700">Created</div>
                        <div className="text-xs text-gray-500">Now</div>
                        <div className="text-xs font-medium text-gray-700 mt-1">Last Login</div>
                        <div className="text-xs text-gray-500">Never</div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSaveUser}
                          disabled={!isFormValid || saving}
                          className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded transition-colors ${
                            isFormValid && !saving
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <Save className="w-3 h-3 mr-1" />
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={handleCancelAdd}
                          disabled={saving}
                          className="inline-flex items-center px-3 py-1 text-xs font-medium rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    {/* User Name & Email - Combined Column */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="flex items-center mt-1">
                          <Mail className="w-3 h-3 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-500">{user.email}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            <Shield className="w-3 h-3" />
                            {user.role || 'User'}
                          </span>
                          {user.hasProfile ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-500 text-white" title="User has profile data">
                              <User className="w-3 h-3" />
                              Profile Complete
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-orange-500 text-white" title="User has no profile data">
                              <AlertTriangle className="w-3 h-3" />
                              No Profile
                            </span>
                          )}
                        </div>
                      </div>
                    </td>


                    {/* Dates */}
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div className="text-xs font-medium text-gray-700">Created</div>
                        <div className="text-xs text-gray-500">{formatDate(user.createdAt)}</div>
                        <div className="text-xs font-medium text-gray-700 mt-1">Last Login</div>
                        <div className="text-xs text-gray-500">{user.lastSignIn ? formatDate(user.lastSignIn) : 'Never'}</div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {!user.hasProfile ? (
                          <>
                            {showDeleteConfirm === user.id ? (
                              <>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  disabled={deletingUserId === user.id}
                                  className="inline-flex items-center px-3 py-1 text-xs font-medium rounded bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  {deletingUserId === user.id ? 'Deleting...' : 'Confirm'}
                                </button>
                                <button
                                  onClick={handleDeleteCancel}
                                  disabled={deletingUserId === user.id}
                                  className="inline-flex items-center px-3 py-1 text-xs font-medium rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50"
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleDeleteConfirm(user.id)}
                                disabled={deletingUserId !== null}
                                className="inline-flex items-center px-3 py-1 text-xs font-medium rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
                                title="Delete user (no profile data)"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded bg-gray-100 text-gray-500" title="Cannot delete user with profile data">
                            <Shield className="w-3 h-3 mr-1" />
                            Protected
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

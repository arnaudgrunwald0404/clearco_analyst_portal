'use client'

import { useState, useEffect } from 'react'
import { Users, RefreshCw, Mail, User, Shield, CheckCircle, XCircle, Clock, Globe, Plus, Save, X } from 'lucide-react'

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
  const [totalAuthUsers, setTotalAuthUsers] = useState<number>(0)
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [newUser, setNewUser] = useState<NewUser>({ firstName: '', lastName: '', email: '' })
  const [saving, setSaving] = useState(false)

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
      setTotalAuthUsers(result.totalAuthUsers || 0)
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
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
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
          <p className="text-gray-600">
            Users from authenticated domain {domain && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md ml-2">
                <Globe className="w-3 h-3" />
                {domain}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleAddUser}
            disabled={isAddingUser}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </button>
          <button
            onClick={fetchUsers}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Domain Users */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Domain Users
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {users.length}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Email Confirmed */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Email Confirmed
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {users.filter(user => user.emailConfirmed).length}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Total Auth Users */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Globe className="h-8 w-8 text-gray-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Auth Users
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {totalAuthUsers}
                </dd>
              </dl>
            </div>
          </div>
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
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Sign In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Add User Row */}
                {isAddingUser && (
                  <tr className="bg-blue-50 border-l-4 border-blue-400">
                    {/* User Name - Input Fields */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <Plus className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                        <div className="ml-4 flex gap-2">
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
                      </div>
                    </td>

                    {/* Email - Input Field */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                        <input
                          type="email"
                          placeholder={`user@${domain}`}
                          value={newUser.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="text-sm text-gray-900 border border-gray-300 rounded px-2 py-1 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3" />
                        Pending
                      </span>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        <Shield className="w-3 h-3" />
                        User
                      </span>
                    </td>

                    {/* Last Sign In */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        Never
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    {/* User Name */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{user.email}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {user.emailConfirmed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            <XCircle className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                          {user.provider}
                        </span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        <Shield className="w-3 h-3" />
                        {user.role || 'User'}
                      </span>
                    </td>

                    {/* Last Sign In */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {user.lastSignIn ? formatDate(user.lastSignIn) : 'Never'}
                      </div>
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
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

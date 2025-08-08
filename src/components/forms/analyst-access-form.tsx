'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Loader2, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'

interface Analyst {
  id: string
  firstName: string
  lastName: string
  email: string
  company: string | null
}

interface AnalystAccess {
  id: string
  analyst_id: string
  is_active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
  analysts: Analyst
}

interface AnalystAccessFormProps {
  analystId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function AnalystAccessForm({ analystId, onSuccess, onCancel }: AnalystAccessFormProps) {
  const [analysts, setAnalysts] = useState<Analyst[]>([])
  const [selectedAnalystId, setSelectedAnalystId] = useState(analystId || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [existingAccess, setExistingAccess] = useState<AnalystAccess | null>(null)

  // Fetch analysts
  useEffect(() => {
    const fetchAnalysts = async () => {
      try {
        const response = await fetch('/api/analysts')
        const result = await response.json()
        if (result.data) {
          setAnalysts(result.data)
        }
      } catch (error) {
        console.error('Error fetching analysts:', error)
      }
    }

    fetchAnalysts()
  }, [])

  // Fetch existing access if analystId is provided
  useEffect(() => {
    if (analystId) {
      const fetchExistingAccess = async () => {
        try {
          const response = await fetch(`/api/analyst-access?analystId=${analystId}`)
          const result = await response.json()
          if (result.data && result.data.length > 0) {
            setExistingAccess(result.data[0])
            setIsActive(result.data[0].is_active)
          }
        } catch (error) {
          console.error('Error fetching existing access:', error)
        }
      }

      fetchExistingAccess()
    }
  }, [analystId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!selectedAnalystId) {
      setError('Please select an analyst')
      setLoading(false)
      return
    }

    if (!password) {
      setError('Password is required')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/analyst-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analystId: selectedAnalystId,
          password,
          isActive
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(result.message)
        setPassword('')
        setConfirmPassword('')
        if (onSuccess) {
          setTimeout(() => onSuccess(), 2000)
        }
      } else {
        setError(result.error || 'Failed to create analyst access')
      }
    } catch (error) {
      setError('An unexpected error occurred')
      console.error('Error creating analyst access:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!existingAccess) return

    if (!confirm('Are you sure you want to delete this analyst access?')) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/analyst-access?analystId=${existingAccess.analyst_id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        setSuccess('Analyst access deleted successfully')
        setExistingAccess(null)
        if (onSuccess) {
          setTimeout(() => onSuccess(), 2000)
        }
      } else {
        setError(result.error || 'Failed to delete analyst access')
      }
    } catch (error) {
      setError('An unexpected error occurred')
      console.error('Error deleting analyst access:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedAnalyst = analysts.find(a => a.id === selectedAnalystId)

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Analyst Portal Access</CardTitle>
        <CardDescription>
          {existingAccess ? 'Update analyst portal access credentials' : 'Create analyst portal access credentials'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Analyst Selection */}
          <div className="space-y-2">
            <Label htmlFor="analyst">Analyst</Label>
            <select
              id="analyst"
              value={selectedAnalystId}
              onChange={(e) => setSelectedAnalystId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!!analystId}
            >
              <option value="">Select an analyst</option>
              {analysts.map((analyst) => (
                <option key={analyst.id} value={analyst.id}>
                  {analyst.firstName} {analyst.lastName} ({analyst.email})
                </option>
              ))}
            </select>
          </div>

          {/* Selected Analyst Info */}
          {selectedAnalyst && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">{selectedAnalyst.firstName} {selectedAnalyst.lastName}</h4>
              <p className="text-sm text-gray-600">{selectedAnalyst.email}</p>
              {selectedAnalyst.company && (
                <p className="text-sm text-gray-600">{selectedAnalyst.company}</p>
              )}
            </div>
          )}

          {/* Password Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
              />
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          {/* Existing Access Info */}
          {existingAccess && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Current Access Status</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center space-x-2">
                  <span>Status:</span>
                  {existingAccess.is_active ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      <XCircle className="w-3 h-3 mr-1" />
                      Inactive
                    </Badge>
                  )}
                </div>
                {existingAccess.last_login && (
                  <div>
                    <span>Last Login:</span> {new Date(existingAccess.last_login).toLocaleString()}
                  </div>
                )}
                <div>
                  <span>Created:</span> {new Date(existingAccess.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                existingAccess ? 'Update Access' : 'Create Access'
              )}
            </Button>

            {existingAccess && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete Access
              </Button>
            )}

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 
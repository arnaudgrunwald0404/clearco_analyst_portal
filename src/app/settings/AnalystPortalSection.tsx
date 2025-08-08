'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, Clock, Plus, Settings } from 'lucide-react';
import AnalystPortalSettingsForm from '@/components/forms/analyst-portal-settings-form';
import { AnalystAccessForm } from '@/components/forms/analyst-access-form';

interface AnalystAccess {
  id: string
  analyst_id: string
  is_active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
  analysts: {
    id: string
    firstName: string
    lastName: string
    email: string
    company: string | null
  }
}

interface AnalystPortalSectionProps {
  initialTab?: 'settings' | 'access'
}

export default function AnalystPortalSection({ initialTab = 'settings' }: AnalystPortalSectionProps) {
  const [analystAccess, setAnalystAccess] = useState<AnalystAccess[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedAnalystId, setSelectedAnalystId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'settings' | 'access'>(initialTab)

  const fetchAnalystAccess = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analyst-access')
      const result = await response.json()
      
      if (result.data) {
        setAnalystAccess(result.data)
      }
    } catch (error) {
      console.error('Error fetching analyst access:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalystAccess()
  }, [])

  const handleCreateAccess = () => {
    setSelectedAnalystId(null)
    setShowForm(true)
  }

  const handleEditAccess = (analystId: string) => {
    setSelectedAnalystId(analystId)
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setSelectedAnalystId(null)
    fetchAnalystAccess()
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setSelectedAnalystId(null)
  }

  const activeAccess = analystAccess.filter(access => access.is_active)
  const inactiveAccess = analystAccess.filter(access => !access.is_active)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Users className="w-7 h-7 text-blue-600" />
          Analyst Portal
        </h2>
        <p className="text-gray-600 mt-2">
          Configure the analyst portal experience and manage access credentials
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Portal Settings
          </button>
          <button
            onClick={() => setActiveTab('access')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'access'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Access Management
            {analystAccess.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {analystAccess.length}
              </Badge>
            )}
          </button>
        </nav>
      </div>

      {/* Portal Settings Tab */}
      {activeTab === 'settings' && (
        <Card className="shadow-sm border border-gray-200">
          <CardHeader className="pb-6 px-8 pt-8">
            <CardTitle className="text-xl font-bold text-gray-900">
              Portal Configuration
            </CardTitle>
            <CardDescription className="text-base mt-3 text-gray-600 leading-relaxed">
              Configure the analyst portal welcome experience and content
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 px-8 pb-8">
            <AnalystPortalSettingsForm />
          </CardContent>
        </Card>
      )}

      {/* Access Management Tab */}
      {activeTab === 'access' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Access</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analystAccess.length}</div>
                <p className="text-xs text-muted-foreground">
                  Analyst portal accounts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Access</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeAccess.length}</div>
                <p className="text-xs text-muted-foreground">
                  Currently enabled accounts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Logins</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analystAccess.filter(access => access.last_login).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Analysts who have logged in
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Add Access Button */}
          <div className="flex justify-end">
            <Button onClick={handleCreateAccess} className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Access</span>
            </Button>
          </div>

          {/* Access Lists */}
          <div className="space-y-6">
            {/* Active Access */}
            {activeAccess.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span>Active Access</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {activeAccess.length}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Analysts with active portal access
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeAccess.map((access) => (
                      <div
                        key={access.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {access.analysts.firstName} {access.analysts.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">{access.analysts.email}</p>
                          {access.analysts.company && (
                            <p className="text-sm text-gray-500">{access.analysts.company}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>Created: {new Date(access.created_at).toLocaleDateString()}</span>
                            {access.last_login && (
                              <span>Last Login: {new Date(access.last_login).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Active
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAccess(access.analyst_id)}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Inactive Access */}
            {inactiveAccess.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <span>Inactive Access</span>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                      {inactiveAccess.length}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Disabled analyst portal access
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {inactiveAccess.map((access) => (
                      <div
                        key={access.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {access.analysts.firstName} {access.analysts.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">{access.analysts.email}</p>
                          {access.analysts.company && (
                            <p className="text-sm text-gray-500">{access.analysts.company}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>Created: {new Date(access.created_at).toLocaleDateString()}</span>
                            {access.last_login && (
                              <span>Last Login: {new Date(access.last_login).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                            Inactive
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAccess(access.analyst_id)}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!loading && analystAccess.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Analyst Access Configured</h3>
                  <p className="text-gray-600 text-center mb-4">
                    No analysts have portal access credentials set up yet.
                  </p>
                  <Button onClick={handleCreateAccess}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Access
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Loading State */}
            {loading && (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading analyst access...</span>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <AnalystAccessForm
              analystId={selectedAnalystId || undefined}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
} 
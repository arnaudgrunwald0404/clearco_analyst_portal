'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, Save, AlertCircle, Building2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

// Vendor tier values
const VENDOR_TIER_VALUES = ['STRATEGIC', 'IMPORTANT', 'STANDARD', 'LOW'] as const
type VendorTierValue = typeof VENDOR_TIER_VALUES[number]

interface VendorTier {
  id: string
  name: string
  briefingFrequency: number // in days, -1 means "Never"
  touchpointFrequency: number // in days, -1 means "Never"
  isActive: boolean
}

interface VendorTiersConfig {
  tiers: VendorTier[]
  maxTiers: number
}

export default function VendorTiersSection() {
  const [tiers, setTiers] = useState<VendorTier[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingTier, setEditingTier] = useState<string | null>(null)
  const { addToast } = useToast()

  // Default tier templates
  const defaultTiers: VendorTier[] = [
    {
      id: 'tier-1',
      name: 'STRATEGIC',
      briefingFrequency: 30,
      touchpointFrequency: 14,
      isActive: true
    },
    {
      id: 'tier-2',
      name: 'IMPORTANT',
      briefingFrequency: 60,
      touchpointFrequency: 30,
      isActive: true
    },
    {
      id: 'tier-3',
      name: 'STANDARD',
      briefingFrequency: 90,
      touchpointFrequency: 45,
      isActive: true
    },
    {
      id: 'tier-4',
      name: 'LOW',
      briefingFrequency: -1, // Never
      touchpointFrequency: -1, // Never
      isActive: true
    }
  ]

  useEffect(() => {
    fetchVendorTiers()
  }, [])

  const fetchVendorTiers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/vendor-tiers')
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setTiers(result.data.tiers || defaultTiers)
        } else {
          setTiers(defaultTiers)
        }
      } else {
        setTiers(defaultTiers)
      }
    } catch (error) {
      console.error('Failed to fetch vendor tiers:', error)
      setTiers(defaultTiers)
      addToast({ type: 'error', message: 'Failed to load vendor tiers' })
    } finally {
      setLoading(false)
    }
  }

  const saveVendorTiers = async () => {
    try {
      setSaving(true)
      
      const response = await fetch('/api/settings/vendor-tiers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tiers }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          addToast({ type: 'success', message: 'Vendor tiers saved successfully' })
          setEditingTier(null)
        } else {
          throw new Error(result.error || 'Failed to save vendor tiers')
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to save vendor tiers:', error)
      addToast({ type: 'error', message: 'Failed to save vendor tiers' })
    } finally {
      setSaving(false)
    }
  }

  const addTier = () => {
    if (tiers.length >= 5) {
      addToast({ type: 'error', message: 'Maximum 5 tiers allowed' })
      return
    }

    // Find an available tier value that's not already used
    const usedNames = tiers.map(tier => tier.name)
    const availableName = VENDOR_TIER_VALUES.find(value => !usedNames.includes(value)) || 'STANDARD'

    const newTier: VendorTier = {
      id: `tier-${Date.now()}`,
      name: availableName,
      briefingFrequency: 90,
      touchpointFrequency: 45,
      isActive: true
    }

    setTiers([...tiers, newTier])
    setEditingTier(newTier.id)
  }

  const removeTier = (tierId: string) => {
    if (tiers.length <= 2) {
      addToast({ type: 'error', message: 'Minimum 2 tiers required' })
      return
    }

    setTiers(tiers.filter(tier => tier.id !== tierId))
  }

  const updateTier = (tierId: string, updates: Partial<VendorTier>) => {
    setTiers(tiers.map(tier => 
      tier.id === tierId ? { ...tier, ...updates } : tier
    ))
  }

  const toggleTierActive = (tierId: string) => {
    updateTier(tierId, { isActive: !tiers.find(t => t.id === tierId)?.isActive })
  }

  const formatFrequency = (days: number) => {
    if (days === -1) return 'Never'
    if (days === 1) return 'Daily'
    if (days === 7) return 'Weekly'
    if (days === 14) return 'Bi-weekly'
    if (days === 30) return 'Monthly'
    if (days === 60) return 'Bi-monthly'
    if (days === 90) return 'Quarterly'
    return `Every ${days} days`
  }

  const getTierColor = (tierName: string) => {
    switch (tierName) {
      case 'STRATEGIC': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'IMPORTANT': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'STANDARD': return 'bg-green-100 text-green-800 border-green-200'
      case 'LOW': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Vendor Tiers</span>
          </CardTitle>
          <CardDescription>
            Configure vendor relationship tiers and engagement frequencies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building2 className="h-5 w-5" />
          <span>Vendor Tiers</span>
        </CardTitle>
        <CardDescription>
          Configure vendor relationship tiers and engagement frequencies. These tiers help prioritize vendor relationships and set appropriate engagement schedules.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tier Configuration */}
        <div className="space-y-4">
          {tiers.map((tier) => (
            <div key={tier.id} className={`border rounded-lg p-4 ${tier.isActive ? 'bg-white' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getTierColor(tier.name)}`}>
                    {tier.name}
                  </span>
                  <Switch
                    checked={tier.isActive}
                    onCheckedChange={() => toggleTierActive(tier.id)}
                  />
                  <span className="text-sm text-gray-500">
                    {tier.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingTier(editingTier === tier.id ? null : tier.id)}
                  >
                    {editingTier === tier.id ? 'Cancel' : 'Edit'}
                  </Button>
                  {tiers.length > 2 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeTier(tier.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {editingTier === tier.id ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`tier-name-${tier.id}`}>Tier Name</Label>
                    <Select
                      value={tier.name}
                      onValueChange={(value) => updateTier(tier.id, { name: value as VendorTierValue })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VENDOR_TIER_VALUES.map((value) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor={`briefing-freq-${tier.id}`}>Briefing Frequency (days)</Label>
                    <Input
                      id={`briefing-freq-${tier.id}`}
                      type="number"
                      min="-1"
                      value={tier.briefingFrequency}
                      onChange={(e) => updateTier(tier.id, { briefingFrequency: parseInt(e.target.value) || 0 })}
                      placeholder="Days between briefings (-1 for never)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formatFrequency(tier.briefingFrequency)}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor={`touchpoint-freq-${tier.id}`}>Touchpoint Frequency (days)</Label>
                    <Input
                      id={`touchpoint-freq-${tier.id}`}
                      type="number"
                      min="-1"
                      value={tier.touchpointFrequency}
                      onChange={(e) => updateTier(tier.id, { touchpointFrequency: parseInt(e.target.value) || 0 })}
                      placeholder="Days between touchpoints (-1 for never)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formatFrequency(tier.touchpointFrequency)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Briefing Frequency:</span>
                    <span className="ml-2 font-medium">{formatFrequency(tier.briefingFrequency)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Touchpoint Frequency:</span>
                    <span className="ml-2 font-medium">{formatFrequency(tier.touchpointFrequency)}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Tier Button */}
        {tiers.length < 5 && (
          <Button
            variant="outline"
            onClick={addTier}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor Tier
          </Button>
        )}

        {/* Save Button */}
        <div className="flex justify-end space-x-2">
          <Button
            onClick={saveVendorTiers}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Vendor Tiers
              </>
            )}
          </Button>
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Vendor Tier Guidelines:</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>Strategic:</strong> Key partnerships requiring frequent engagement</li>
                <li>• <strong>Important:</strong> Significant vendors with regular touchpoints</li>
                <li>• <strong>Standard:</strong> Regular vendor relationships with periodic check-ins</li>
                <li>• <strong>Low:</strong> Minimal engagement vendors or inactive relationships</li>
                <li>• Use -1 for frequency to indicate "Never" for that engagement type</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

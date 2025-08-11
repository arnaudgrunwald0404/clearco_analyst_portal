'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, Save, AlertCircle, TrendingUp } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

// Influence enum values from the database
const INFLUENCE_VALUES = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'] as const
type InfluenceValue = typeof INFLUENCE_VALUES[number]

interface InfluenceTier {
  id: string
  name: string
  briefingFrequency: number // in days, -1 means "Never"
  touchpointFrequency: number // in days, -1 means "Never"
  isActive: boolean
}

interface InfluenceTiersConfig {
  tiers: InfluenceTier[]
  minTiers: number
  maxTiers: number
}

export default function InfluenceTiersSection() {
  const [tiers, setTiers] = useState<InfluenceTier[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingTier, setEditingTier] = useState<string | null>(null)
  const { addToast } = useToast()

  // Default tier templates
  const defaultTiers: InfluenceTier[] = [
    {
      id: 'tier-1',
      name: 'VERY_HIGH',
      briefingFrequency: 60,
      touchpointFrequency: 30,
      isActive: true
    },
    {
      id: 'tier-2',
      name: 'HIGH',
      briefingFrequency: 90,
      touchpointFrequency: 45,
      isActive: true
    },
    {
      id: 'tier-3',
      name: 'MEDIUM',
      briefingFrequency: 120,
      touchpointFrequency: 60,
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
    fetchInfluenceTiers()
  }, [])

  const fetchInfluenceTiers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/influence-tiers')
      
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
      console.error('Failed to fetch analyst tiers:', error)
      setTiers(defaultTiers)
      addToast({ type: 'error', message: 'Failed to load analyst tiers' })
    } finally {
      setLoading(false)
    }
  }

  const saveInfluenceTiers = async () => {
    try {
      setSaving(true)
      
      const response = await fetch('/api/settings/influence-tiers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tiers }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
                  addToast({ type: 'success', message: 'Analyst tiers saved successfully' })
        setEditingTier(null)
      } else {
        throw new Error(result.error || 'Failed to save analyst tiers')
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to save analyst tiers:', error)
      addToast({ type: 'error', message: 'Failed to save analyst tiers' })
    } finally {
      setSaving(false)
    }
  }

  const addTier = () => {
    if (tiers.length >= 5) {
      addToast({ type: 'error', message: 'Maximum 5 tiers allowed' })
      return
    }

    // Find an available influence value that's not already used
    const usedNames = tiers.map(tier => tier.name)
    const availableName = INFLUENCE_VALUES.find(value => !usedNames.includes(value)) || 'MEDIUM'

    const newTier: InfluenceTier = {
      id: `tier-${Date.now()}`,
      name: availableName,
      briefingFrequency: 120,
      touchpointFrequency: 60,
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

  const updateTier = (tierId: string, updates: Partial<InfluenceTier>) => {
    setTiers(tiers.map(tier => 
      tier.id === tierId ? { ...tier, ...updates } : tier
    ))
  }

  const toggleTierActive = (tierId: string) => {
    const activeTiers = tiers.filter(tier => tier.isActive)
    const tier = tiers.find(t => t.id === tierId)
    
    if (!tier?.isActive && activeTiers.length >= 5) {
      addToast({ type: 'error', message: 'Maximum 5 active tiers allowed' })
      return
    }

    updateTier(tierId, { isActive: !tier?.isActive })
  }



  const getFrequencyText = (days: number) => {
    if (days === -1) return 'Never'
    if (days === 1) return 'Daily'
    if (days === 7) return 'Weekly'
    if (days === 14) return 'Bi-weekly'
    if (days === 30) return 'Monthly'
    if (days === 60) return 'Bi-monthly'
    if (days === 90) return 'Quarterly'
    if (days === 180) return 'Semi-annually'
    if (days === 365) return 'Annually'
    return `Every ${days} days`
  }

  const formatInfluenceName = (name: string) => {
    return name.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardContent className="px-8 py-12">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading analyst tiers...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="pb-6 px-8 pt-8">
        <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
          <TrendingUp className="w-7 h-7 text-blue-600" />
          Analyst Tiers
        </CardTitle>
        <CardDescription className="text-base mt-3 text-gray-600 leading-relaxed">
          Tiers allow to prioritize communication to the most influential analysts. We recommend 2-5 tiers, each with target briefing frequencies and touchpoint frequencies.
        </CardDescription>
        <div className="mt-2 text-gray-600">
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Analysts tier assignment is based on their "influence" field</li>
            <li>System will suggest next contact dates based on tier frequencies</li>
          </ul>
        </div>
      </CardHeader>
      <CardContent className="pt-2 px-8 pb-8">
        {/* Tiers List */}
        <div className="space-y-6">
          <div className="flex items-center justify-end">
            <div className="flex gap-2">
              <Button
                onClick={addTier}
                disabled={tiers.length >= 5}
                variant="outline"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Tier
              </Button>
              <Button
                onClick={saveInfluenceTiers}
                disabled={saving}
                size="sm"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>

          {tiers.map((tier, index) => (
            <Card key={tier.id} className={`shadow-sm border border-gray-200 ${!tier.isActive ? 'opacity-60' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <Select
                    value={tier.name}
                    onValueChange={(value) => updateTier(tier.id, { name: value as InfluenceValue })}
                  >
                    <SelectTrigger className="w-40 font-medium">
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      {INFLUENCE_VALUES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {formatInfluenceName(value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={tier.isActive}
                        onCheckedChange={() => toggleTierActive(tier.id)}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {tier.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <Button
                      onClick={() => removeTier(tier.id)}
                      variant="outline"
                      size="sm"
                      disabled={tiers.length <= 2}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Briefing Frequency
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      {tier.briefingFrequency === -1 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 px-2 py-1 bg-gray-100 rounded">Never</span>
                          <button
                            onClick={() => updateTier(tier.id, { briefingFrequency: 90 })}
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            Set Frequency
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={tier.briefingFrequency}
                            onChange={(e) => updateTier(tier.id, { briefingFrequency: Number(e.target.value) })}
                            className="w-20"
                          />
                          <span className="text-sm text-gray-600">days</span>
                          <span className="text-xs text-gray-500">
                            ({getFrequencyText(tier.briefingFrequency)})
                          </span>
                          <button
                            onClick={() => updateTier(tier.id, { briefingFrequency: -1 })}
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            Never
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Touchpoint Frequency
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      {tier.touchpointFrequency === -1 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 px-2 py-1 bg-gray-100 rounded">Never</span>
                          <button
                            onClick={() => updateTier(tier.id, { touchpointFrequency: 60 })}
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            Set Frequency
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={tier.touchpointFrequency}
                            onChange={(e) => updateTier(tier.id, { touchpointFrequency: Number(e.target.value) })}
                            className="w-20"
                          />
                          <span className="text-sm text-gray-600">days</span>
                          <span className="text-xs text-gray-500">
                            ({getFrequencyText(tier.touchpointFrequency)})
                          </span>
                          <button
                            onClick={() => updateTier(tier.id, { touchpointFrequency: -1 })}
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            Never
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 
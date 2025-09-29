'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

// Data model for company profile
export interface CompanyProfile {
  mission?: string
  vision?: string
  values?: string
  yearFounded?: string
  history?: string
  // Team
  ceo?: string
  cmo?: string
  cpo?: string
  numberOfEmployees?: string
  percentRD?: string
  percentCustomerSupport?: string
  percentSalesMarketing?: string
  keyInvestors?: string
  totalFundingToDate?: string
  // Business
  arrRange?: string
  acvAverage?: string
  packagingPricingModel?: string
  numberOfCustomers?: string
  targetMarket?: 'SMB' | 'Mid Market' | 'Enterprise' | 'Large Enterprise' | ''
  targetVerticals?: string[]
  targetGeographies?: string[]
  marqueeCustomers?: string
  partnerEcosystem?: string
  // Offerings
  keyProducts?: string
  keyIntegrations?: string
  keyServices?: string
  keyComplianceCertifications?: string
}

const INDUSTRIES: string[] = [
  'Aerospace & Defense','Automotive','Banking','Capital Markets','Insurance','Retail','E-commerce','Consumer Goods','Hospitality','Travel','Logistics','Manufacturing','Energy','Utilities','Telecommunications','Media & Entertainment','Healthcare Providers','Pharmaceuticals','Biotechnology','Public Sector','Education','Nonprofit','Real Estate','Construction','Professional Services','Technology (Software)','Technology (Hardware)','Cybersecurity','Financial Services','Agriculture'
]

const CONTINENTS: string[] = [
  'North America','South America','Europe','Africa','Asia','Oceania'
]

export default function CompanyProfileForm() {
  const searchParams = useSearchParams()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [form, setForm] = useState<CompanyProfile>({ targetMarket: '', targetVerticals: [], targetGeographies: [] })
  const [loading, setLoading] = useState(true)

  // Years from current year back to 1995
  const years = useMemo(() => {
    const current = new Date().getFullYear()
    const arr: number[] = []
    for (let y = current; y >= 1995; y--) arr.push(y)
    return arr
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const qs = new URLSearchParams()
        const vendorId = searchParams.get('vendorId')
        const vendorDomain = searchParams.get('vendorDomain')
        if (vendorId) qs.set('vendorId', vendorId)
        if (vendorDomain) qs.set('vendorDomain', vendorDomain)
        const resp = await fetch(`/api/settings/analyst-portal${qs.toString() ? `?${qs.toString()}` : ''}`, { cache: 'no-store' })
        if (resp.ok) {
          const json = await resp.json()
          const cp = (json?.company_profile || json?.companyProfile || {}) as CompanyProfile
          setForm({
            targetMarket: '',
            targetVerticals: [],
            targetGeographies: [],
            ...cp,
          })
        }
      } catch {}
      finally {
        setLoading(false)
      }
    })()
  }, [])

  const toggleArrayValue = (key: 'targetVerticals' | 'targetGeographies', value: string) => {
    setForm(prev => {
      const current = new Set(prev[key] || [])
      if (current.has(value)) current.delete(value)
      else current.add(value)
      return { ...prev, [key]: Array.from(current) }
    })
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)
    setSaving(true)
    try {
      const qs = new URLSearchParams()
      const vendorId = searchParams.get('vendorId')
      const vendorDomain = searchParams.get('vendorDomain')
      if (vendorId) qs.set('vendorId', vendorId)
      if (vendorDomain) qs.set('vendorDomain', vendorDomain)
      const resp = await fetch(`/api/settings/analyst-portal${qs.toString() ? `?${qs.toString()}` : ''}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyProfile: form })
      })
      if (!resp.ok) {
        const j = await resp.json().catch(() => ({} as any))
        throw new Error(j?.error || 'Failed to save')
      }
      setMessage('Saved!')
    } catch (e: any) {
      setMessage(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      {message && (
        <div className={`text-sm rounded-md border px-3 py-2 ${message === 'Saved!' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>{message}</div>
      )}

      {/* Company Overview */}
      <section>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Mission</Label>
            <Textarea rows={3} value={form.mission || ''} onChange={(e) => setForm({ ...form, mission: e.target.value })} placeholder="State your mission…" />
          </div>
          <div className="md:col-span-2">
            <Label>Vision</Label>
            <Textarea rows={3} value={form.vision || ''} onChange={(e) => setForm({ ...form, vision: e.target.value })} placeholder="State your vision…" />
          </div>
          <div className="md:col-span-2">
            <Label>Values</Label>
            <Textarea rows={3} value={form.values || ''} onChange={(e) => setForm({ ...form, values: e.target.value })} placeholder="Describe your values…" />
          </div>
          <div>
            <Label>Year Founded</Label>
            <select
              className="mt-2 block w-full border rounded px-3 py-2"
              value={form.yearFounded || ''}
              onChange={(e) => setForm({ ...form, yearFounded: e.target.value })}
            >
              <option value="">Select year…</option>
              {years.map(y => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <Label>Brief History</Label>
            <Textarea rows={3} className="resize-y" value={form.history || ''} onChange={(e) => setForm({ ...form, history: e.target.value })} placeholder="3+ rows, expandable" />
          </div>
        </div>
      </section>

      {/* Team */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <Label>CEO</Label>
            <Input value={form.ceo || ''} onChange={(e) => setForm({ ...form, ceo: e.target.value })} />
          </div>
          <div className="md:col-span-3">
            <Label>CMO</Label>
            <Input value={form.cmo || ''} onChange={(e) => setForm({ ...form, cmo: e.target.value })} />
          </div>
          <div className="md:col-span-3">
            <Label>CPO</Label>
            <Input value={form.cpo || ''} onChange={(e) => setForm({ ...form, cpo: e.target.value })} />
          </div>
          <div>
            <Label>Number of Employees</Label>
            <Input type="text" inputMode="numeric" value={form.numberOfEmployees || ''} onChange={(e) => setForm({ ...form, numberOfEmployees: e.target.value })} />
          </div>
          <div className="md:col-span-3">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>% R&D</Label>
                <Input type="text" inputMode="numeric" placeholder="e.g., 35" value={form.percentRD || ''} onChange={(e) => setForm({ ...form, percentRD: e.target.value })} />
              </div>
              <div>
                <Label>% Customer Support</Label>
                <Input type="text" inputMode="numeric" placeholder="e.g., 20" value={form.percentCustomerSupport || ''} onChange={(e) => setForm({ ...form, percentCustomerSupport: e.target.value })} />
              </div>
              <div>
                <Label>% Sales & Marketing</Label>
                <Input type="text" inputMode="numeric" placeholder="e.g., 25" value={form.percentSalesMarketing || ''} onChange={(e) => setForm({ ...form, percentSalesMarketing: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="md:col-span-3">
            <Label>Key Investors</Label>
            <Textarea rows={2} value={form.keyInvestors || ''} onChange={(e) => setForm({ ...form, keyInvestors: e.target.value })} placeholder="Comma-separated list or free text" />
          </div>
          <div className="md:col-span-3">
            <Label>Total Funding to Date</Label>
            <Input placeholder="e.g., $150M" value={form.totalFundingToDate || ''} onChange={(e) => setForm({ ...form, totalFundingToDate: e.target.value })} />
          </div>
        </div>
      </section>

      {/* Offerings */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Offerings</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Key Products</Label>
            <Textarea rows={2} value={form.keyProducts || ''} onChange={(e) => setForm({ ...form, keyProducts: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Key Integrations</Label>
            <Textarea rows={2} value={form.keyIntegrations || ''} onChange={(e) => setForm({ ...form, keyIntegrations: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Key Services</Label>
            <Textarea rows={2} value={form.keyServices || ''} onChange={(e) => setForm({ ...form, keyServices: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Key Compliance Certifications</Label>
            <Textarea rows={2} value={form.keyComplianceCertifications || ''} onChange={(e) => setForm({ ...form, keyComplianceCertifications: e.target.value })} />
          </div>
        </div>
      </section>

      {/* Business */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Business</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Annual Recurring Revenue (range)</Label>
            <Input placeholder="e.g., $10M - $25M" value={form.arrRange || ''} onChange={(e) => setForm({ ...form, arrRange: e.target.value })} />
          </div>
          <div>
            <Label>Annual Contract Value (average)</Label>
            <Input placeholder="e.g., $48,000" value={form.acvAverage || ''} onChange={(e) => setForm({ ...form, acvAverage: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Packaging & Pricing Model</Label>
            <Textarea rows={3} className="resize-y" placeholder="Describe your packaging/pricing (3+ rows)" value={form.packagingPricingModel || ''} onChange={(e) => setForm({ ...form, packagingPricingModel: e.target.value })} />
          </div>
          <div>
            <Label>Number of Customers</Label>
            <Input type="text" inputMode="numeric" value={form.numberOfCustomers || ''} onChange={(e) => setForm({ ...form, numberOfCustomers: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Target Market</Label>
            <select
              className="mt-2 block w-full border rounded px-3 py-2 text-sm"
              value={form.targetMarket || ''}
              onChange={(e) => setForm({ ...form, targetMarket: e.target.value as CompanyProfile['targetMarket'] })}
            >
              <option value="">Select target market…</option>
              <option value="SMB">SMB</option>
              <option value="Mid Market">Mid Market</option>
              <option value="Enterprise">Enterprise</option>
              <option value="Large Enterprise">Large Enterprise</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <Label>Target Verticals</Label>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-auto p-2 border rounded">
              {INDUSTRIES.map(ind => (
                <label key={ind} className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!form.targetVerticals?.includes(ind)} onChange={() => toggleArrayValue('targetVerticals', ind)} />
                  <span className="truncate" title={ind}>{ind}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <Label>Target Geographies (Continents)</Label>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              {CONTINENTS.map(c => (
                <label key={c} className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={!!form.targetGeographies?.includes(c)} onChange={() => toggleArrayValue('targetGeographies', c)} />
                  <span>{c}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <Label>Marquee Customers</Label>
            <Textarea rows={2} value={form.marqueeCustomers || ''} onChange={(e) => setForm({ ...form, marqueeCustomers: e.target.value })} placeholder="List marquee customers (comma-separated or free text)" />
          </div>
          <div className="md:col-span-2">
            <Label>Partner Ecosystem</Label>
            <Textarea rows={2} value={form.partnerEcosystem || ''} onChange={(e) => setForm({ ...form, partnerEcosystem: e.target.value })} placeholder="Describe key partners" />
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Company Profile'}</Button>
      </div>
    </form>
  )
}

'use client'

import React, { useState } from 'react'
import GeneralSection from './GeneralSection'
import AnalystPortalSection from './AnalystPortalSection'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface HelpText {
  title: string
  content: string
}

interface CompanySectionProps {
  showHelp?: (helpText: HelpText) => void
  hideHelp?: () => void
}

export default function CompanySection({ showHelp, hideHelp }: CompanySectionProps) {
  const [tab, setTab] = useState<'overview' | 'contact' | 'details' | 'resources'>('overview')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Company</h2>
        <p className="text-gray-600 mt-2">Set your company profile and the analyst-facing information.</p>
      </div>

      {/* Simple tabs using shadcn tabs (already in project) */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>

          <TabsTrigger value="details">Profile</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="resources">Content</TabsTrigger>
        </TabsList>

        {/* Overview: reuse General section but with title override; hide gear icon */}
        <TabsContent value="overview">
          <GeneralSection 
            showHelp={showHelp} 
            hideHelp={hideHelp} 
            titleOverride="Overview" 
            descriptionOverride="Name, protected domain, logo, and industry."
            showIcon={false}
          />
        </TabsContent>

        {/* Contact: vendor contact form from Analyst Portal settings */}
        <TabsContent value="contact">
          <AnalystPortalSection initialTab="settings" showAccessTab={false} />
        </TabsContent>

        {/* Details for analysts: company profile shown in portal */}
        <TabsContent value="details">
          <AnalystPortalSection initialTab="company" showAccessTab={false} />
        </TabsContent>

        {/* Content: portal content manager */}
        <TabsContent value="resources">
          <AnalystPortalSection initialTab="content" showAccessTab={false} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

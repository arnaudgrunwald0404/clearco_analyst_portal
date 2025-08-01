import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import AnalystPortalSettingsForm from '@/components/forms/analyst-portal-settings-form';

export default function AnalystPortalSection() {
  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="pb-6 px-8 pt-8">
        <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
          <Users className="w-7 h-7 text-blue-600" />
          Analyst Portal
        </CardTitle>
        <CardDescription className="text-base mt-3 text-gray-600 leading-relaxed">
          Configure the analyst portal welcome experience and content
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2 px-8 pb-8">
        <AnalystPortalSettingsForm />
      </CardContent>
    </Card>
  );
} 
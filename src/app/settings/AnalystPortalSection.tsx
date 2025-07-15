import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import AnalystPortalSettingsForm from '@/components/analyst-portal-settings-form';

export default function AnalystPortalSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Analyst Portal
        </CardTitle>
        <CardDescription>
          Configure the analyst portal welcome experience and content
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AnalystPortalSettingsForm />
      </CardContent>
    </Card>
  );
} 
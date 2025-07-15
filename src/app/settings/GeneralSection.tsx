import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import GeneralSettingsForm from '@/components/general-settings-form';

export default function GeneralSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          General Settings
        </CardTitle>
        <CardDescription>
          Configure your company information and platform settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <GeneralSettingsForm />
      </CardContent>
    </Card>
  );
} 
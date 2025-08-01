import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import GeneralSettingsForm from '@/components/forms/general-settings-form';

interface HelpText {
  title: string;
  content: string;
}

interface GeneralSectionProps {
  showHelp?: (helpText: HelpText) => void;
  hideHelp?: () => void;
}

export default function GeneralSection({ showHelp, hideHelp }: GeneralSectionProps) {
  return (
    <Card className="shadow-sm border border-gray-200 p-6">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
          <Settings className="w-7 h-7 text-blue-600" />
          General Settings
        </CardTitle>
        <CardDescription className="text-base ml-10 text-gray-600 leading-relaxed">
          Configure your company information and platform settings
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2 pl-4 mr-10">
        <GeneralSettingsForm showHelp={showHelp} hideHelp={hideHelp} />
      </CardContent>
    </Card>
  );
} 
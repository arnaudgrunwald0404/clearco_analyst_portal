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
  titleOverride?: string;
  descriptionOverride?: string;
  showIcon?: boolean;
}

export default function GeneralSection({ showHelp, hideHelp, titleOverride, descriptionOverride, showIcon = true }: GeneralSectionProps) {
  return (
    <Card className="shadow-sm border border-gray-200 p-6">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
          {'Overview'}
        </CardTitle>
        <CardDescription className="text-base  text-gray-600 leading-relaxed">
          {'Name, protected domain, logo, and industry.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2 pl-4 mr-10">
<GeneralSettingsForm showHelp={showHelp ? ((helpText: any, _el: any) => showHelp({ title: helpText?.title ?? '', content: helpText?.content ?? '' })) : undefined} hideHelp={hideHelp} />
      </CardContent>
    </Card>
  );
} 

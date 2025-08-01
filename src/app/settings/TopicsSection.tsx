import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tags } from 'lucide-react';
import TopicsManagement from '@/components/settings/topics-management';

export default function TopicsSection() {
  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="pb-6 px-8 pt-8">
        <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
          <Tags className="w-7 h-7 text-blue-600" />
          Topic Management
        </CardTitle>
        <CardDescription className="text-base mt-3 text-gray-600 leading-relaxed">
          Manage predefined topics for analyst expertise areas.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2 px-8 pb-8">
        <TopicsManagement />
      </CardContent>
    </Card>
  );
} 
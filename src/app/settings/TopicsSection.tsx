import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tags } from 'lucide-react';
import TopicsManagement from '@/components/topics-management';

export default function TopicsSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tags className="w-5 h-5" />
          Topic Management
        </CardTitle>
        <CardDescription>
          Manage predefined topics for analyst expertise areas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TopicsManagement />
      </CardContent>
    </Card>
  );
} 
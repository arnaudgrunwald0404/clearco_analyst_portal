'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function ContentSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Management</CardTitle>
        <CardDescription>
          Manage the documents and resources available in the analyst portal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add New Content
          </Button>
        </div>
        <div className="border rounded-lg p-8 text-center">
          <p className="text-gray-500">Content table will be displayed here.</p>
        </div>
      </CardContent>
    </Card>
  )
}

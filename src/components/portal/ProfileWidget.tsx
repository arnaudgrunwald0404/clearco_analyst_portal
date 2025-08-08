'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Edit } from 'lucide-react'

interface ProfileWidgetProps {
  analyst: {
    name: string
    profileImageUrl?: string | null
    topics: string[]
  }
}

export function ProfileWidget({ analyst }: ProfileWidgetProps) {
  const getInitials = (name: string) => {
    const names = name.split(' ')
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`
    }
    return names[0] ? names[0][0] : 'A'
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Your Profile</CardTitle>
        <Link href="/portal/profile/edit" passHref>
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="flex items-center space-x-4 pt-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={analyst.profileImageUrl || undefined} alt={analyst.name} />
          <AvatarFallback>{getInitials(analyst.name)}</AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{analyst.name}</h3>
          <div className="flex flex-wrap gap-2">
            {analyst.topics.map((topic) => (
              <Badge key={topic} variant="secondary">
                {topic}
              </Badge>
            ))}
            {analyst.topics.length === 0 && (
              <p className="text-sm text-gray-500">No topics specified.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

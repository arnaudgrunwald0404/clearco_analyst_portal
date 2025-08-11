'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Edit, Linkedin, Twitter } from 'lucide-react'

interface ProfileWidgetProps {
  analyst: {
    id: string
    firstName: string
    lastName: string
    company?: string | null
    profileImageUrl?: string | null
    twitter?: string | null
    linkedIn?: string | null
    topics: string[]
  }
  publications?: {
    past: Array<{ id: string; title: string; url?: string | null; publishedAt?: string | null }>
    upcoming: Array<{ id: string; title: string; url?: string | null; publishedAt?: string | null }>
  }
}

export function ProfileWidget({ analyst, publications }: ProfileWidgetProps) {
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
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={analyst.profileImageUrl || undefined} alt={`${analyst.firstName} ${analyst.lastName}`} />
              <AvatarFallback>{getInitials(`${analyst.firstName} ${analyst.lastName}`)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold">{analyst.firstName} {analyst.lastName}</h3>
              {analyst.company && (
                <div className="text-sm text-gray-600">{analyst.company}</div>
              )}
              <div className="flex items-center gap-3 mt-1">
                {analyst.twitter && (
                  <a
                    href={`https://twitter.com/${analyst.twitter.replace('@','')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900"
                    aria-label="Twitter profile"
                  >
                    <Twitter className="w-4 h-4" />
                    {analyst.twitter}
                  </a>
                )}
                {analyst.linkedIn && (
                  <a
                    href={analyst.linkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900"
                    aria-label="LinkedIn profile"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </a>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
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
          </div>

          {/* Publications summary */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-2">Past Publications</div>
              <ul className="space-y-1 text-sm text-gray-700">
                {(publications?.past || []).slice(0, 3).map(pub => (
                  <li key={pub.id} className="truncate">
                    {pub.url ? (
                      <a href={pub.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {pub.title}
                      </a>
                    ) : (
                      pub.title
                    )}
                  </li>
                ))}
                {(!publications?.past || publications.past.length === 0) && (
                  <li className="text-gray-500">No past publications.</li>
                )}
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-2">Upcoming Publications</div>
              <ul className="space-y-1 text-sm text-gray-700">
                {(publications?.upcoming || []).slice(0, 3).map(pub => (
                  <li key={pub.id} className="truncate">
                    {pub.url ? (
                      <a href={pub.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {pub.title}
                      </a>
                    ) : (
                      pub.title
                    )}
                  </li>
                ))}
                {(!publications?.upcoming || publications.upcoming.length === 0) && (
                  <li className="text-gray-500">No upcoming publications.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

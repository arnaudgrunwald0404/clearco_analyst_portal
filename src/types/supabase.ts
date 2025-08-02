export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      User: {
        Row: {
          id: string
          email: string
          name: string
          role: 'ADMIN' | 'EDITOR' | 'ANALYST'
          password: string | null
          profileImageUrl: string | null
          company: string | null
          title: string | null
          isActive: boolean
          lastLoginAt: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role?: 'ADMIN' | 'EDITOR' | 'ANALYST'
          password?: string | null
          profileImageUrl?: string | null
          company?: string | null
          title?: string | null
          isActive?: boolean
          lastLoginAt?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'ADMIN' | 'EDITOR' | 'ANALYST'
          password?: string | null
          profileImageUrl?: string | null
          company?: string | null
          title?: string | null
          isActive?: boolean
          lastLoginAt?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      influence_tiers: {
        Row: {
          id: string
          name: string
          color: string
          briefingFrequency: number | null
          touchpointFrequency: number | null
          order: number
          isActive: boolean
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          name: string
          color: string
          briefingFrequency?: number | null
          touchpointFrequency?: number | null
          order: number
          isActive?: boolean
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          briefingFrequency?: number | null
          touchpointFrequency?: number | null
          order?: number
          isActive?: boolean
          createdAt?: string
          updatedAt?: string
        }
      }
      GeneralSettings: {
        Row: {
          id: string
          companyName: string
          protectedDomain: string
          logoUrl: string
          industryName: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          companyName?: string
          protectedDomain?: string
          logoUrl?: string
          industryName?: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          companyName?: string
          protectedDomain?: string
          logoUrl?: string
          industryName?: string
          createdAt?: string
          updatedAt?: string
        }
      }
      analysts: {
        Row: {
          id: string
          firstName: string
          lastName: string
          email: string
          company: string | null
          title: string | null
          phone: string | null
          linkedIn: string | null
          twitter: string | null
          website: string | null
          bio: string | null
          profileImageUrl: string | null
          type: string
          eligibleNewsletters: string | null
          influenceScore: number
          lastContactDate: string | null
          nextContactDate: string | null
          communicationCadence: number | null
          relationshipHealth: string
          recentSocialSummary: string | null
          socialSummaryUpdatedAt: string | null
          keyThemes: string | null
          upcomingPublications: string | null
          recentPublications: string | null
          speakingEngagements: string | null
          awards: string | null
          influence: string
          status: string
          notes: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          firstName: string
          lastName: string
          email: string
          company?: string | null
          title?: string | null
          phone?: string | null
          linkedIn?: string | null
          twitter?: string | null
          website?: string | null
          bio?: string | null
          profileImageUrl?: string | null
          type?: string
          eligibleNewsletters?: string | null
          influenceScore?: number
          lastContactDate?: string | null
          nextContactDate?: string | null
          communicationCadence?: number | null
          relationshipHealth?: string
          recentSocialSummary?: string | null
          socialSummaryUpdatedAt?: string | null
          keyThemes?: string | null
          upcomingPublications?: string | null
          recentPublications?: string | null
          speakingEngagements?: string | null
          awards?: string | null
          influence?: string
          status?: string
          notes?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          firstName?: string
          lastName?: string
          email?: string
          company?: string | null
          title?: string | null
          phone?: string | null
          linkedIn?: string | null
          twitter?: string | null
          website?: string | null
          bio?: string | null
          profileImageUrl?: string | null
          type?: string
          eligibleNewsletters?: string | null
          influenceScore?: number
          lastContactDate?: string | null
          nextContactDate?: string | null
          communicationCadence?: number | null
          relationshipHealth?: string
          recentSocialSummary?: string | null
          socialSummaryUpdatedAt?: string | null
          keyThemes?: string | null
          upcomingPublications?: string | null
          recentPublications?: string | null
          speakingEngagements?: string | null
          awards?: string | null
          influence?: string
          status?: string
          notes?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      briefings: {
        Row: {
          id: string
          title: string
          description: string | null
          scheduledAt: string
          completedAt: string | null
          status: string
          agenda: string | null
          notes: string | null
          outcomes: string | null
          followUpActions: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          scheduledAt: string
          completedAt?: string | null
          status?: string
          agenda?: string | null
          notes?: string | null
          outcomes?: string | null
          followUpActions?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          scheduledAt?: string
          completedAt?: string | null
          status?: string
          agenda?: string | null
          notes?: string | null
          outcomes?: string | null
          followUpActions?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      briefing_analysts: {
        Row: {
          id: string
          briefingId: string
          analystId: string
          createdAt: string
        }
        Insert: {
          id?: string
          briefingId: string
          analystId: string
          createdAt?: string
        }
        Update: {
          id?: string
          briefingId?: string
          analystId?: string
          createdAt?: string
        }
      }
      social_posts: {
        Row: {
          id: string
          analystId: string
          platform: string
          content: string
          url: string | null
          engagements: number
          postedAt: string
          isRelevant: boolean
          sentiment: string | null
          themes: string | null
          createdAt: string
        }
        Insert: {
          id?: string
          analystId: string
          platform: string
          content: string
          url?: string | null
          engagements?: number
          postedAt: string
          isRelevant?: boolean
          sentiment?: string | null
          themes?: string | null
          createdAt?: string
        }
        Update: {
          id?: string
          analystId?: string
          platform?: string
          content?: string
          url?: string | null
          engagements?: number
          postedAt?: string
          isRelevant?: boolean
          sentiment?: string | null
          themes?: string | null
          createdAt?: string
        }
      }
      ActionItem: {
        Row: {
          id: string
          title: string
          description: string | null
          status: string
          priority: string
          dueDate: string | null
          completedAt: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: string
          priority?: string
          dueDate?: string | null
          completedAt?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: string
          priority?: string
          dueDate?: string | null
          completedAt?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      CalendarConnection: {
        Row: {
          id: string
          userId: string
          provider: string
          email: string
          accessToken: string
          refreshToken: string | null
          expiresAt: string | null
          calendarId: string | null
          calendarName: string | null
          status: string
          isActive: boolean
          lastSync: string | null
          syncInProgress: boolean
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          userId: string
          provider?: string
          email: string
          accessToken: string
          refreshToken?: string | null
          expiresAt?: string | null
          calendarId?: string | null
          calendarName?: string | null
          status?: string
          isActive?: boolean
          lastSync?: string | null
          syncInProgress?: boolean
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          userId?: string
          provider?: string
          email?: string
          accessToken?: string
          refreshToken?: string | null
          expiresAt?: string | null
          calendarId?: string | null
          calendarName?: string | null
          status?: string
          isActive?: boolean
          lastSync?: string | null
          syncInProgress?: boolean
          createdAt?: string
          updatedAt?: string
        }
      }
      calendar_meetings: {
        Row: {
          id: string
          analystId: string
          calendarConnectionId: string
          googleEventId: string
          title: string
          startTime: string
          endTime: string
          attendees: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          analystId: string
          calendarConnectionId: string
          googleEventId: string
          title: string
          startTime: string
          endTime: string
          attendees?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          analystId?: string
          calendarConnectionId?: string
          googleEventId?: string
          title?: string
          startTime?: string
          endTime?: string
          attendees?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      influence: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
      status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
      analyst_type: 'Analyst' | 'Press' | 'Investor' | 'Practitioner' | 'Influencer'
      relationship_health: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL'
      briefing_status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'
      social_platform: 'TWITTER' | 'LINKEDIN' | 'MEDIUM' | 'BLOG' | 'OTHER'
      action_item_status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
      action_item_priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 
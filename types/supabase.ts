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
      analysts: {
        Row: {
          id: string
          firstName: string
          lastName: string
          email: string
          company: string
          title: string | null
          type: 'Analyst' | 'Press' | 'Investor' | 'Practitioner' | 'Influencer'
          influence: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
          status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
          relationshipHealth: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL'
          keyThemes: string | null
          bio: string | null
          location: string | null
          profileImageUrl: string | null
          linkedinUrl: string | null
          twitterHandle: string | null
          personalWebsite: string | null
          lastContactDate: string | null
          nextContactDate: string | null
          notes: string | null
          tags: string[] | null
          isArchived: boolean
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          firstName: string
          lastName: string
          email: string
          company: string
          title?: string | null
          type?: 'Analyst' | 'Press' | 'Investor' | 'Practitioner' | 'Influencer'
          influence?: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
          status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
          relationshipHealth?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL'
          keyThemes?: string | null
          bio?: string | null
          location?: string | null
          profileImageUrl?: string | null
          linkedinUrl?: string | null
          twitterHandle?: string | null
          personalWebsite?: string | null
          lastContactDate?: string | null
          nextContactDate?: string | null
          notes?: string | null
          tags?: string[] | null
          isArchived?: boolean
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          firstName?: string
          lastName?: string
          email?: string
          company?: string
          title?: string | null
          type?: 'Analyst' | 'Press' | 'Investor' | 'Practitioner' | 'Influencer'
          influence?: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
          status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
          relationshipHealth?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL'
          keyThemes?: string | null
          bio?: string | null
          location?: string | null
          profileImageUrl?: string | null
          linkedinUrl?: string | null
          twitterHandle?: string | null
          personalWebsite?: string | null
          lastContactDate?: string | null
          nextContactDate?: string | null
          notes?: string | null
          tags?: string[] | null
          isArchived?: boolean
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
      briefings: {
        Row: {
          id: string
          title: string
          description: string | null
          scheduledAt: string
          duration: number
          status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'
          location: string | null
          meetingUrl: string | null
          agenda: string | null
          notes: string | null
          followUpItems: string[] | null
          recordingUrl: string | null
          isRecurring: boolean
          recurringPattern: string | null
          reminderSent: boolean
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          scheduledAt: string
          duration?: number
          status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'
          location?: string | null
          meetingUrl?: string | null
          agenda?: string | null
          notes?: string | null
          followUpItems?: string[] | null
          recordingUrl?: string | null
          isRecurring?: boolean
          recurringPattern?: string | null
          reminderSent?: boolean
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          scheduledAt?: string
          duration?: number
          status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'
          location?: string | null
          meetingUrl?: string | null
          agenda?: string | null
          notes?: string | null
          followUpItems?: string[] | null
          recordingUrl?: string | null
          isRecurring?: boolean
          recurringPattern?: string | null
          reminderSent?: boolean
          createdAt?: string
          updatedAt?: string
        }
      }
      briefing_analysts: {
        Row: {
          id: string
          briefingId: string
          analystId: string
          role: string | null
          responseStatus: string | null
          createdAt: string
        }
        Insert: {
          id?: string
          briefingId: string
          analystId: string
          role?: string | null
          responseStatus?: string | null
          createdAt?: string
        }
        Update: {
          id?: string
          briefingId?: string
          analystId?: string
          role?: string | null
          responseStatus?: string | null
          createdAt?: string
        }
      }
      social_posts: {
        Row: {
          id: string
          analystId: string
          platform: 'TWITTER' | 'LINKEDIN' | 'MEDIUM' | 'BLOG' | 'OTHER'
          content: string
          url: string
          postedAt: string
          engagements: number | null
          likes: number | null
          shares: number | null
          comments: number | null
          sentiment: string | null
          themes: string[] | null
          isRelevant: boolean
          responseGenerated: boolean
          responseContent: string | null
          createdAt: string
        }
        Insert: {
          id?: string
          analystId: string
          platform: 'TWITTER' | 'LINKEDIN' | 'MEDIUM' | 'BLOG' | 'OTHER'
          content: string
          url: string
          postedAt: string
          engagements?: number | null
          likes?: number | null
          shares?: number | null
          comments?: number | null
          sentiment?: string | null
          themes?: string[] | null
          isRelevant?: boolean
          responseGenerated?: boolean
          responseContent?: string | null
          createdAt?: string
        }
        Update: {
          id?: string
          analystId?: string
          platform?: 'TWITTER' | 'LINKEDIN' | 'MEDIUM' | 'BLOG' | 'OTHER'
          content?: string
          url?: string
          postedAt?: string
          engagements?: number | null
          likes?: number | null
          shares?: number | null
          comments?: number | null
          sentiment?: string | null
          themes?: string[] | null
          isRelevant?: boolean
          responseGenerated?: boolean
          responseContent?: string | null
          createdAt?: string
        }
      }
      action_items: {
        Row: {
          id: string
          title: string
          description: string | null
          status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
          priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
          dueDate: string | null
          assignedTo: string | null
          analystId: string | null
          briefingId: string | null
          tags: string[] | null
          completedAt: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
          priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
          dueDate?: string | null
          assignedTo?: string | null
          analystId?: string | null
          briefingId?: string | null
          tags?: string[] | null
          completedAt?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
          priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
          dueDate?: string | null
          assignedTo?: string | null
          analystId?: string | null
          briefingId?: string | null
          tags?: string[] | null
          completedAt?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      calendar_connections: {
        Row: {
          id: string
          userId: string
          provider: string
          email: string
          accessToken: string
          refreshToken: string | null
          expiresAt: string | null
          calendarId: string | null
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
          calendarConnectionId: string
          externalId: string
          title: string
          description: string | null
          startTime: string
          endTime: string
          location: string | null
          attendees: string[] | null
          isAllDay: boolean
          status: string | null
          briefingId: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          calendarConnectionId: string
          externalId: string
          title: string
          description?: string | null
          startTime: string
          endTime: string
          location?: string | null
          attendees?: string[] | null
          isAllDay?: boolean
          status?: string | null
          briefingId?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          calendarConnectionId?: string
          externalId?: string
          title?: string
          description?: string | null
          startTime?: string
          endTime?: string
          location?: string | null
          attendees?: string[] | null
          isAllDay?: boolean
          status?: string | null
          briefingId?: string | null
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
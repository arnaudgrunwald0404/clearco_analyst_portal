export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      ActionItem: {
        Row: {
          actionStatus: string | null
          actionType: string | null
          analystId: string | null
          assignedBy: string | null
          assignedTo: string | null
          briefingId: string | null
          category: string | null
          completedAt: string | null
          completedBy: string | null
          createdAt: string
          description: string
          dueDate: string | null
          id: string
          isCompleted: boolean
          notes: string | null
          priority: string
          tags: string[] | null
          title: string | null
          updatedAt: string
          userId: string | null
        }
        Insert: {
          actionStatus?: string | null
          actionType?: string | null
          analystId?: string | null
          assignedBy?: string | null
          assignedTo?: string | null
          briefingId?: string | null
          category?: string | null
          completedAt?: string | null
          completedBy?: string | null
          createdAt?: string
          description: string
          dueDate?: string | null
          id: string
          isCompleted?: boolean
          notes?: string | null
          priority?: string
          tags?: string[] | null
          title?: string | null
          updatedAt: string
          userId?: string | null
        }
        Update: {
          actionStatus?: string | null
          actionType?: string | null
          analystId?: string | null
          assignedBy?: string | null
          assignedTo?: string | null
          briefingId?: string | null
          category?: string | null
          completedAt?: string | null
          completedBy?: string | null
          createdAt?: string
          description?: string
          dueDate?: string | null
          id?: string
          isCompleted?: boolean
          notes?: string | null
          priority?: string
          tags?: string[] | null
          title?: string | null
          updatedAt?: string
          userId?: string | null
        }
        Relationships: []
      }
      Alert: {
        Row: {
          actionTaken: boolean
          analystId: string
          createdAt: string
          dueDate: string | null
          id: string
          isRead: boolean
          message: string
          priority: string
          title: string
          type: Database["public"]["Enums"]["AlertType"]
        }
        Insert: {
          actionTaken?: boolean
          analystId: string
          createdAt?: string
          dueDate?: string | null
          id: string
          isRead?: boolean
          message: string
          priority?: string
          title: string
          type: Database["public"]["Enums"]["AlertType"]
        }
        Update: {
          actionTaken?: boolean
          analystId?: string
          createdAt?: string
          dueDate?: string | null
          id?: string
          isRead?: boolean
          message?: string
          priority?: string
          title?: string
          type?: Database["public"]["Enums"]["AlertType"]
        }
        Relationships: []
      }
      analyst_domains: {
        Row: {
          created_at: string
          id: string
          name: string | null
          protected_domain: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          name?: string | null
          protected_domain?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          protected_domain?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      analyst_notes: {
        Row: {
          analyst_id: string
          attachment_url: string | null
          content: string
          created_at: string
          id: string
          note_date: string
          title: string | null
          updated_at: string
          vendor_domain_id: string | null
        }
        Insert: {
          analyst_id: string
          attachment_url?: string | null
          content: string
          created_at?: string
          id?: string
          note_date?: string
          title?: string | null
          updated_at?: string
          vendor_domain_id?: string | null
        }
        Update: {
          analyst_id?: string
          attachment_url?: string | null
          content?: string
          created_at?: string
          id?: string
          note_date?: string
          title?: string | null
          updated_at?: string
          vendor_domain_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analyst_notes_analyst_id_fkey"
            columns: ["analyst_id"]
            isOneToOne: false
            referencedRelation: "analysts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyst_notes_vendor_domain_id_fkey"
            columns: ["vendor_domain_id"]
            isOneToOne: false
            referencedRelation: "vendor_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      analyst_portal_settings: {
        Row: {
          authorImageUrl: string
          contactEmail: string | null
          contactImageUrl: string | null
          contactName: string | null
          contactPhone: string | null
          contactTitle: string | null
          createdAt: string
          id: string
          quoteAuthor: string
          updatedAt: string
          vendor_domain_id: string | null
          welcomeQuote: string
        }
        Insert: {
          authorImageUrl?: string
          contactEmail?: string | null
          contactImageUrl?: string | null
          contactName?: string | null
          contactPhone?: string | null
          contactTitle?: string | null
          createdAt?: string
          id: string
          quoteAuthor?: string
          updatedAt: string
          vendor_domain_id?: string | null
          welcomeQuote?: string
        }
        Update: {
          authorImageUrl?: string
          contactEmail?: string | null
          contactImageUrl?: string | null
          contactName?: string | null
          contactPhone?: string | null
          contactTitle?: string | null
          createdAt?: string
          id?: string
          quoteAuthor?: string
          updatedAt?: string
          vendor_domain_id?: string | null
          welcomeQuote?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyst_portal_settings_vendor_fk"
            columns: ["vendor_domain_id"]
            isOneToOne: false
            referencedRelation: "vendor_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      AnalystAccess: {
        Row: {
          analystId: string
          createdAt: string
          id: string
          isActive: boolean
          lastLogin: string | null
          password: string
          updatedAt: string
        }
        Insert: {
          analystId: string
          createdAt?: string
          id: string
          isActive?: boolean
          lastLogin?: string | null
          password: string
          updatedAt: string
        }
        Update: {
          analystId?: string
          createdAt?: string
          id?: string
          isActive?: boolean
          lastLogin?: string | null
          password?: string
          updatedAt?: string
        }
        Relationships: []
      }
      AnalystCoveredTopic: {
        Row: {
          analystId: string
          id: string
          topic: string
        }
        Insert: {
          analystId: string
          id: string
          topic: string
        }
        Update: {
          analystId?: string
          id?: string
          topic?: string
        }
        Relationships: []
      }
      AnalystPortalSession: {
        Row: {
          analystId: string
          id: string
          ipAddress: string | null
          loginAt: string
          logoutAt: string | null
          sessionId: string
          userAgent: string | null
        }
        Insert: {
          analystId: string
          id: string
          ipAddress?: string | null
          loginAt?: string
          logoutAt?: string | null
          sessionId: string
          userAgent?: string | null
        }
        Update: {
          analystId?: string
          id?: string
          ipAddress?: string | null
          loginAt?: string
          logoutAt?: string | null
          sessionId?: string
          userAgent?: string | null
        }
        Relationships: []
      }
      influence_tiers: {
        Row: {
          briefingFrequency: number | null
          color: string
          createdAt: string
          id: string
          isActive: boolean
          name: string
          order: number
          touchpointFrequency: number | null
          updatedAt: string
          vendor_domain_id: string | null
        }
        Insert: {
          briefingFrequency?: number | null
          color: string
          createdAt?: string
          id?: string
          isActive?: boolean
          name: string
          order: number
          touchpointFrequency?: number | null
          updatedAt?: string
          vendor_domain_id?: string | null
        }
        Update: {
          briefingFrequency?: number | null
          color?: string
          createdAt?: string
          id?: string
          isActive?: boolean
          name?: string
          order?: number
          touchpointFrequency?: number | null
          updatedAt?: string
          vendor_domain_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "influence_tiers_vendor_fk"
            columns: ["vendor_domain_id"]
            isOneToOne: false
            referencedRelation: "vendor_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_domains: {
        Row: {
          company_name: string
          company_profile: Json | null
          created_at: string
          id: string
          industry_name: string
          logo_url: string
          portal_contact_email: string | null
          portal_contact_image_url: string | null
          portal_contact_name: string | null
          portal_contact_phone: string | null
          portal_contact_title: string | null
          portal_welcome_quote: string | null
          protected_domain: string
          updated_at: string
        }
        Insert: {
          company_name: string
          company_profile?: Json | null
          created_at?: string
          id: string
          industry_name: string
          logo_url: string
          portal_contact_email?: string | null
          portal_contact_image_url?: string | null
          portal_contact_name?: string | null
          portal_contact_phone?: string | null
          portal_contact_title?: string | null
          portal_welcome_quote?: string | null
          protected_domain: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          company_profile?: Json | null
          created_at?: string
          id?: string
          industry_name?: string
          logo_url?: string
          portal_contact_email?: string | null
          portal_contact_image_url?: string | null
          portal_contact_name?: string | null
          portal_contact_phone?: string | null
          portal_contact_title?: string | null
          portal_welcome_quote?: string | null
          protected_domain?: string
          updated_at?: string
        }
        Relationships: []
      }
      GeneralSettings: {
        Row: {
          companyName: string
          createdAt: string
          id: string
          industryName: string
          logoUrl: string
          protectedDomain: string
          updatedAt: string
        }
        Insert: {
          companyName: string
          createdAt?: string
          id: string
          industryName: string
          logoUrl: string
          protectedDomain: string
          updatedAt?: string
        }
        Update: {
          companyName?: string
          createdAt?: string
          id?: string
          industryName?: string
          logoUrl?: string
          protectedDomain?: string
          updatedAt?: string
        }
        Relationships: []
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
          linkedinUrl: string | null
          twitterHandle: string | null
          personalWebsite: string | null
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
          vendor_domain_id: string | null
        }
        Insert: {
          id?: string
          firstName: string
          lastName: string
          email: string
          company?: string | null
          title?: string | null
          phone?: string | null
          linkedinUrl?: string | null
          twitterHandle?: string | null
          personalWebsite?: string | null
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
          vendor_domain_id?: string | null
        }
        Update: {
          id?: string
          firstName?: string
          lastName?: string
          email?: string
          company?: string | null
          title?: string | null
          phone?: string | null
          linkedinUrl?: string | null
          twitterHandle?: string | null
          personalWebsite?: string | null
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
          vendor_domain_id?: string | null
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
          contentUrl: string | null
          transcript: string | null
          ai_summary: Json | null
          attendees: string[][] | null
          createdAt: string
          updatedAt: string
          vendor_domain_id: string | null
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
          contentUrl?: string | null
          transcript?: string | null
          ai_summary?: Json | null
          attendees?: string[][] | null
          createdAt?: string
          updatedAt?: string
          vendor_domain_id?: string | null
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
          contentUrl?: string | null
          transcript?: string | null
          ai_summary?: Json | null
          attendees?: string[][] | null
          createdAt?: string
          updatedAt?: string
          vendor_domain_id?: string | null
        }
      }
      briefing_analysts: {
        Row: {
          id: string
          briefingId: string
          analystId: string
          vendor_domain_id: string | null
          createdAt: string
        }
        Insert: {
          id?: string
          briefingId: string
          analystId: string
          vendor_domain_id?: string | null
          createdAt?: string
        }
        Update: {
          id?: string
          briefingId?: string
          analystId?: string
          vendor_domain_id?: string | null
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
      calendar_connections: {
        Row: {
          id: string
          user_id: string
          title: string
          email: string
          google_account_id: string
          access_token: string
          refresh_token: string | null
          token_expiry: string | null
          is_active: boolean
          last_sync_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          email: string
          google_account_id: string
          access_token: string
          refresh_token?: string | null
          token_expiry?: string | null
          is_active?: boolean
          last_sync_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          email?: string
          google_account_id?: string
          access_token?: string
          refresh_token?: string | null
          token_expiry?: string | null
          is_active?: boolean
          last_sync_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      calendar_meetings: {
        Row: {
          id: string
          calendar_connection_id: string
          google_event_id: string
          title: string
          description: string | null
          start_time: string
          end_time: string
          attendees: string | null
          analyst_id: string | null
          is_analyst_meeting: boolean
          confidence: number | null
          tags: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          calendar_connection_id: string
          google_event_id: string
          title: string
          description?: string | null
          start_time: string
          end_time: string
          attendees?: string | null
          analyst_id?: string | null
          is_analyst_meeting?: boolean
          confidence?: number | null
          tags?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          calendar_connection_id?: string
          google_event_id?: string
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string
          attendees?: string | null
          analyst_id?: string | null
          is_analyst_meeting?: boolean
          confidence?: number | null
          tags?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      testimonials: {
        Row: {
          id: string
          text: string
          author: string
          company: string | null
          rating: number | null
          created_at: string
          updated_at: string
          is_published: boolean | null
          display_order: number | null
          analyst_id: string | null
          vendor_domain_id: string | null
        }
        Insert: {
          id?: string
          text: string
          author: string
          company?: string | null
          rating?: number | null
          created_at?: string
          updated_at?: string
          is_published?: boolean | null
          display_order?: number | null
          analyst_id?: string | null
          vendor_domain_id?: string | null
        }
        Update: {
          id?: string
          text?: string
          author?: string
          company?: string | null
          rating?: number | null
          created_at?: string
          updated_at?: string
          is_published?: boolean | null
          display_order?: number | null
          analyst_id?: string | null
          vendor_domain_id?: string | null
        }
      }
      awards: {
        Row: {
          id: string
          name: string | null
          link: string | null
          organization: string | null
          product_topics: string | null
          priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null
          submission_date: string
          publication_date: string
          owner: string | null
          status: 'EVALUATING' | 'SUBMITTED' | 'UNDER_REVIEW' | 'WINNER' | 'FINALIST' | 'NOT_SELECTED' | 'WITHDRAWN' | null
          cost: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
          vendor_domain_id: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          link?: string | null
          organization?: string | null
          product_topics?: string | null
          priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null
          submission_date: string
          publication_date: string
          owner?: string | null
          status?: 'EVALUATING' | 'SUBMITTED' | 'UNDER_REVIEW' | 'WINNER' | 'FINALIST' | 'NOT_SELECTED' | 'WITHDRAWN' | null
          cost?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          vendor_domain_id?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          link?: string | null
          organization?: string | null
          product_topics?: string | null
          priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null
          submission_date?: string
          publication_date?: string
          owner?: string | null
          status?: 'EVALUATING' | 'SUBMITTED' | 'UNDER_REVIEW' | 'WINNER' | 'FINALIST' | 'NOT_SELECTED' | 'WITHDRAWN' | null
          cost?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          vendor_domain_id?: string | null
        }
      }
      newsletters: {
        Row: {
          id: string
          title: string
          subject: string | null
          content: string | null
          htmlContent: string | null
          status: string | null
          templateId: string | null
          recipientCount: number | null
          openCount: number | null
          clickCount: number | null
          scheduledAt: string | null
          sentAt: string | null
          createdAt: string | null
          updatedAt: string | null
          createdBy: string | null
          tags: string[] | null
          description: string | null
          vendor_domain_id: string | null
        }
        Insert: {
          id?: string
          title: string
          subject?: string | null
          content?: string | null
          htmlContent?: string | null
          status?: string | null
          templateId?: string | null
          recipientCount?: number | null
          openCount?: number | null
          clickCount?: number | null
          scheduledAt?: string | null
          sentAt?: string | null
          createdAt?: string | null
          updatedAt?: string | null
          createdBy?: string | null
          tags?: string[] | null
          description?: string | null
          vendor_domain_id?: string | null
        }
        Update: {
          id?: string
          title?: string
          subject?: string | null
          content?: string | null
          htmlContent?: string | null
          status?: string | null
          templateId?: string | null
          recipientCount?: number | null
          openCount?: number | null
          clickCount?: number | null
          scheduledAt?: string | null
          sentAt?: string | null
          createdAt?: string | null
          updatedAt?: string | null
          createdBy?: string | null
          tags?: string[] | null
          description?: string | null
          vendor_domain_id?: string | null
        }
      }
      newsletter_subscriptions: {
        Row: {
          id: string
          newsletterId: string
          analystId: string
          email: string | null
          subscribedAt: string | null
          unsubscribedAt: string | null
          opened: boolean | null
          openedAt: string | null
          clicked: boolean | null
          clickedAt: string | null
          createdAt: string | null
          vendor_domain_id: string | null
        }
        Insert: {
          id?: string
          newsletterId: string
          analystId: string
          email?: string | null
          subscribedAt?: string | null
          unsubscribedAt?: string | null
          opened?: boolean | null
          openedAt?: string | null
          clicked?: boolean | null
          clickedAt?: string | null
          createdAt?: string | null
          vendor_domain_id?: string | null
        }
        Update: {
          id?: string
          newsletterId?: string
          analystId?: string
          email?: string | null
          subscribedAt?: string | null
          unsubscribedAt?: string | null
          opened?: boolean | null
          openedAt?: string | null
          clicked?: boolean | null
          clickedAt?: string | null
          createdAt?: string | null
          vendor_domain_id?: string | null
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
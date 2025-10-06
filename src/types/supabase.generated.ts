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
          analyst_domain_id: string | null
          bio: string | null
          company: string
          createdAt: string
          email: string
          firstName: string
          id: string
          influence: Database["public"]["Enums"]["influence"]
          isArchived: boolean
          keyThemes: string | null
          lastContactDate: string | null
          lastName: string
          linkedinUrl: string | null
          location: string | null
          nextContactDate: string | null
          notes: string | null
          personalWebsite: string | null
          profileImageUrl: string | null
          relationshipHealth: Database["public"]["Enums"]["relationship_health"]
          status: Database["public"]["Enums"]["status"]
          tags: string[] | null
          title: string | null
          twitterHandle: string | null
          type: Database["public"]["Enums"]["analyst_type"]
          updatedAt: string
          vendor_domain_id: string | null
        }
        Insert: {
          analyst_domain_id?: string | null
          bio?: string | null
          company: string
          createdAt?: string
          email: string
          firstName: string
          id?: string
          influence?: Database["public"]["Enums"]["influence"]
          isArchived?: boolean
          keyThemes?: string | null
          lastContactDate?: string | null
          lastName: string
          linkedinUrl?: string | null
          location?: string | null
          nextContactDate?: string | null
          notes?: string | null
          personalWebsite?: string | null
          profileImageUrl?: string | null
          relationshipHealth?: Database["public"]["Enums"]["relationship_health"]
          status?: Database["public"]["Enums"]["status"]
          tags?: string[] | null
          title?: string | null
          twitterHandle?: string | null
          type?: Database["public"]["Enums"]["analyst_type"]
          updatedAt?: string
          vendor_domain_id?: string | null
        }
        Update: {
          analyst_domain_id?: string | null
          bio?: string | null
          company?: string
          createdAt?: string
          email?: string
          firstName?: string
          id?: string
          influence?: Database["public"]["Enums"]["influence"]
          isArchived?: boolean
          keyThemes?: string | null
          lastContactDate?: string | null
          lastName?: string
          linkedinUrl?: string | null
          location?: string | null
          nextContactDate?: string | null
          notes?: string | null
          personalWebsite?: string | null
          profileImageUrl?: string | null
          relationshipHealth?: Database["public"]["Enums"]["relationship_health"]
          status?: Database["public"]["Enums"]["status"]
          tags?: string[] | null
          title?: string | null
          twitterHandle?: string | null
          type?: Database["public"]["Enums"]["analyst_type"]
          updatedAt?: string
          vendor_domain_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysts_analyst_domain_id_fkey"
            columns: ["analyst_domain_id"]
            isOneToOne: false
            referencedRelation: "analyst_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysts_vendor_fk"
            columns: ["vendor_domain_id"]
            isOneToOne: false
            referencedRelation: "vendor_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_slots: {
        Row: {
          booked_by_analyst_id: string | null
          briefing_id: string | null
          created_at: string
          end_time: string
          id: string
          is_booked: boolean
          start_time: string
          updated_at: string
        }
        Insert: {
          booked_by_analyst_id?: string | null
          briefing_id?: string | null
          created_at?: string
          end_time: string
          id?: string
          is_booked?: boolean
          start_time: string
          updated_at?: string
        }
        Update: {
          booked_by_analyst_id?: string | null
          briefing_id?: string | null
          created_at?: string
          end_time?: string
          id?: string
          is_booked?: boolean
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_booked_by_analyst_id_fkey"
            columns: ["booked_by_analyst_id"]
            isOneToOne: false
            referencedRelation: "analysts"
            referencedColumns: ["id"]
          },
        ]
      }
      awards: {
        Row: {
          awardName: string
          contactInfo: string
          createdAt: string
          id: string
          priority: Database["public"]["Enums"]["AwardPriority"]
          processStartDate: string
          publicationDate: string
          topics: string
          updatedAt: string
          vendor_domain_id: string | null
        }
        Insert: {
          awardName: string
          contactInfo: string
          createdAt?: string
          id: string
          priority?: Database["public"]["Enums"]["AwardPriority"]
          processStartDate: string
          publicationDate: string
          topics: string
          updatedAt: string
          vendor_domain_id?: string | null
        }
        Update: {
          awardName?: string
          contactInfo?: string
          createdAt?: string
          id?: string
          priority?: Database["public"]["Enums"]["AwardPriority"]
          processStartDate?: string
          publicationDate?: string
          topics?: string
          updatedAt?: string
          vendor_domain_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "awards_vendor_fk"
            columns: ["vendor_domain_id"]
            isOneToOne: false
            referencedRelation: "vendor_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      briefing_analysts: {
        Row: {
          analystId: string
          briefingId: string
          createdAt: string
          id: string
          responseStatus: string | null
          role: string | null
          vendor_domain_id: string | null
        }
        Insert: {
          analystId: string
          briefingId: string
          createdAt?: string
          id?: string
          responseStatus?: string | null
          role?: string | null
          vendor_domain_id?: string | null
        }
        Update: {
          analystId?: string
          briefingId?: string
          createdAt?: string
          id?: string
          responseStatus?: string | null
          role?: string | null
          vendor_domain_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "briefing_analysts_analystId_fkey"
            columns: ["analystId"]
            isOneToOne: false
            referencedRelation: "analysts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "briefing_analysts_briefingId_fkey"
            columns: ["briefingId"]
            isOneToOne: false
            referencedRelation: "briefings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "briefing_analysts_vendor_domain_fk"
            columns: ["vendor_domain_id"]
            isOneToOne: false
            referencedRelation: "vendor_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "briefing_analysts_vendor_fk"
            columns: ["vendor_domain_id"]
            isOneToOne: false
            referencedRelation: "vendor_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      briefing_ratings: {
        Row: {
          analystId: string
          briefingId: string
          comments: string | null
          createdAt: string
          engagementScore: number | null
          featuresDesignScore: number | null
          id: string
          materialsClarityScore: number | null
          overallScore: number
          strategyScore: number | null
          updatedAt: string
          valueScore: number | null
          vendor_domain_id: string | null
        }
        Insert: {
          analystId: string
          briefingId: string
          comments?: string | null
          createdAt?: string
          engagementScore?: number | null
          featuresDesignScore?: number | null
          id: string
          materialsClarityScore?: number | null
          overallScore: number
          strategyScore?: number | null
          updatedAt?: string
          valueScore?: number | null
          vendor_domain_id?: string | null
        }
        Update: {
          analystId?: string
          briefingId?: string
          comments?: string | null
          createdAt?: string
          engagementScore?: number | null
          featuresDesignScore?: number | null
          id?: string
          materialsClarityScore?: number | null
          overallScore?: number
          strategyScore?: number | null
          updatedAt?: string
          valueScore?: number | null
          vendor_domain_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "briefing_ratings_analystId_fkey"
            columns: ["analystId"]
            isOneToOne: false
            referencedRelation: "analysts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "briefing_ratings_briefingId_fkey"
            columns: ["briefingId"]
            isOneToOne: false
            referencedRelation: "briefings"
            referencedColumns: ["id"]
          },
        ]
      }
      briefings: {
        Row: {
          agenda: string | null
          ai_summary: Json | null
          attendees: Json | null
          contenturl: string | null
          createdAt: string
          description: string | null
          duration: number
          followUpItems: string[] | null
          id: string
          isRecurring: boolean
          location: string | null
          meetingUrl: string | null
          notes: string | null
          recordingUrl: string | null
          recurringPattern: string | null
          reminderSent: boolean
          scheduledAt: string
          status: Database["public"]["Enums"]["briefing_status"]
          title: string
          transcript: string | null
          updatedAt: string
          vendor_domain_id: string | null
        }
        Insert: {
          agenda?: string | null
          ai_summary?: Json | null
          attendees?: Json | null
          contenturl?: string | null
          createdAt?: string
          description?: string | null
          duration?: number
          followUpItems?: string[] | null
          id?: string
          isRecurring?: boolean
          location?: string | null
          meetingUrl?: string | null
          notes?: string | null
          recordingUrl?: string | null
          recurringPattern?: string | null
          reminderSent?: boolean
          scheduledAt: string
          status?: Database["public"]["Enums"]["briefing_status"]
          title: string
          transcript?: string | null
          updatedAt?: string
          vendor_domain_id?: string | null
        }
        Update: {
          agenda?: string | null
          ai_summary?: Json | null
          attendees?: Json | null
          contenturl?: string | null
          createdAt?: string
          description?: string | null
          duration?: number
          followUpItems?: string[] | null
          id?: string
          isRecurring?: boolean
          location?: string | null
          meetingUrl?: string | null
          notes?: string | null
          recordingUrl?: string | null
          recurringPattern?: string | null
          reminderSent?: boolean
          scheduledAt?: string
          status?: Database["public"]["Enums"]["briefing_status"]
          title?: string
          transcript?: string | null
          updatedAt?: string
          vendor_domain_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "briefings_vendor_fk"
            columns: ["vendor_domain_id"]
            isOneToOne: false
            referencedRelation: "vendor_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_connections: {
        Row: {
          access_token: string
          created_at: string
          email: string
          expires_at: string | null
          google_account_id: string
          id: string
          is_active: boolean
          last_sync_at: string | null
          refresh_token: string | null
          title: string
          token_expiry: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          email: string
          expires_at?: string | null
          google_account_id: string
          id: string
          is_active?: boolean
          last_sync_at?: string | null
          refresh_token?: string | null
          title: string
          token_expiry?: string | null
          updated_at: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          email?: string
          expires_at?: string | null
          google_account_id?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          refresh_token?: string | null
          title?: string
          token_expiry?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_meetings: {
        Row: {
          analystId: string | null
          attendees: string | null
          calendarConnectionId: string
          confidence: number | null
          createdAt: string
          description: string | null
          endTime: string
          googleEventId: string
          id: string
          isAnalystMeeting: boolean
          startTime: string
          tags: string | null
          title: string
          updatedAt: string
          vendor_domain_id: string | null
        }
        Insert: {
          analystId: string | null
          attendees: string | null
          calendarConnectionId: string
          confidence: number | null
          createdAt: string
          description: string | null
          endTime: string
          googleEventId: string
          id: string
          isAnalystMeeting: boolean
          startTime: string
          tags: string | null
          title: string
          updatedAt: string
          vendor_domain_id: string | null
        }
        Update: {
          analystId?: string | null
          attendees?: string | null
          calendarConnectionId?: string
          confidence?: number | null
          createdAt?: string
          description?: string | null
          endTime?: string
          googleEventId?: string
          id?: string
          isAnalystMeeting?: boolean
          startTime?: string
          tags?: string | null
          title?: string
          updatedAt?: string
          vendor_domain_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_meetings_calendar_connection_id_fkey"
            columns: ["calendarConnectionId"]
            isOneToOne: false
            referencedRelation: "calendar_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_meetings_vendor_fk"
            columns: ["vendor_domain_id"]
            isOneToOne: false
            referencedRelation: "vendor_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      CompanyVision: {
        Row: {
          content: string
          createdAt: string
          id: string
          isPublished: boolean
          order: number
          title: string
          type: string
          updatedAt: string
        }
        Insert: {
          content: string
          createdAt: string
          id: string
          isPublished: boolean
          order: number
          title: string
          type: string
          updatedAt: string
        }
        Update: {
          content?: string
          createdAt?: string
          id?: string
          isPublished?: boolean
          order?: number
          title?: string
          type?: string
          updatedAt?: string
        }
        Relationships: []
      }
      Content: {
        Row: {
          createdAt: string
          description: string | null
          filePath: string | null
          id: string
          isExclusive: boolean
          isPublished: boolean
          title: string
          type: Database["public"]["Enums"]["ContentType"]
          updatedAt: string
          url: string | null
        }
        Insert: {
          createdAt: string
          description?: string | null
          filePath?: string | null
          id: string
          isExclusive: boolean
          isPublished: boolean
          title: string
          type: Database["public"]["Enums"]["ContentType"]
          updatedAt: string
          url?: string | null
        }
        Update: {
          createdAt?: string
          description?: string | null
          filePath?: string | null
          id?: string
          isExclusive?: boolean
          isPublished?: boolean
          title?: string
          type?: Database["public"]["Enums"]["ContentType"]
          updatedAt?: string
          url?: string | null
        }
        Relationships: []
      }
      ConversationSummary: {
        Row: {
          actionItems: string | null
          analystId: string
          createdAt: string
          date: string
          duration: number | null
          id: string
          keyPoints: string | null
          recordingUrl: string | null
          summary: string
          title: string
          transcriptUrl: string | null
          updatedAt: string
        }
        Insert: {
          actionItems: string | null
          analystId: string
          createdAt: string
          date: string
          duration: number | null
          id: string
          keyPoints: string | null
          recordingUrl: string | null
          summary: string
          title: string
          transcriptUrl: string | null
          updatedAt: string
        }
        Update: {
          actionItems?: string | null
          analystId?: string
          createdAt?: string
          date?: string
          duration?: number | null
          id?: string
          keyPoints?: string | null
          recordingUrl?: string | null
          summary?: string
          title?: string
          transcriptUrl?: string | null
          updatedAt?: string
        }
        Relationships: []
      }
      covered_topics: {
        Row: {
          analystId: string
          createdAt: string | null
          id: string
          topic: string
        }
        Insert: {
          analystId: string
          createdAt: string | null
          id: string
          topic: string
        }
        Update: {
          analystId?: string
          createdAt?: string | null
          id?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "covered_topics_analystId_fkey"
            columns: ["analystId"]
            isOneToOne: false
            referencedRelation: "analysts"
            referencedColumns: ["id"]
          },
        ]
      }
      EmailTemplate: {
        Row: {
          createdAt: string
          description: string | null
          html: string
          id: string
          name: string
          updatedAt: string
        }
        Insert: {
          createdAt: string
          description: string | null
          html: string
          id: string
          name: string
          updatedAt: string
        }
        Update: {
          createdAt?: string
          description?: string | null
          html?: string
          id?: string
          name?: string
          updatedAt?: string
        }
        Relationships: []
      }
      Event: {
        Row: {
          audienceGroups: string | null
          createdAt: string
          eventName: string
          id: string
          link: string | null
          location: string | null
          notes: string | null
          owner: string | null
          participationStatus: string | null
          startDate: string
          status: string
          type: string
          updatedAt: string
          vendor_domain_id: string | null
        }
        Insert: {
          audienceGroups: string | null
          createdAt: string
          eventName: string
          id: string
          link: string | null
          location: string | null
          notes: string | null
          owner: string | null
          participationStatus: string | null
          startDate: string
          status: string
          type: string
          updatedAt: string
          vendor_domain_id: string | null
        }
        Update: {
          audienceGroups?: string | null
          createdAt?: string
          eventName?: string
          id?: string
          link?: string | null
          location?: string | null
          notes?: string | null
          owner?: string | null
          participationStatus?: string | null
          startDate?: string
          status?: string
          type?: string
          updatedAt?: string
          vendor_domain_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_vendor_fk"
            columns: ["vendor_domain_id"]
            isOneToOne: false
            referencedRelation: "vendor_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      event_source_mappings: {
        Row: {
          confidence: number | null
          created_at: string
          header_signature: string
          id: string
          mapping: Json
          sheet_title: string | null
          source_url: string
          updated_at: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          header_signature: string
          id: string
          mapping: Json
          sheet_title?: string | null
          source_url: string
          updated_at?: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          header_signature?: string
          id?: string
          mapping?: Json
          sheet_title?: string | null
          source_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_sync_sources: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          selected_tabs: Json | null
          status: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id: string
          is_active?: boolean
          selected_tabs?: Json | null
          status?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          selected_tabs?: Json | null
          status?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      ExclusiveContent: {
        Row: {
          accessLevel: string
          content: string
          createdAt: string
          description: string | null
          downloadUrl: string | null
          id: string
          isActive: boolean
          targetAudience: string | null
          title: string
          type: Database["public"]["Enums"]["ContentType"]
          updatedAt: string
          viewCount: number
        }
        Insert: {
          accessLevel: string
          content: string
          createdAt: string
          description: string | null
          downloadUrl: string | null
          id: string
          isActive: boolean
          targetAudience: string | null
          title: string
          type: Database["public"]["Enums"]["ContentType"]
          updatedAt: string
          viewCount: number
        }
        Update: {
          accessLevel?: string
          content?: string
          createdAt?: string
          description?: string | null
          downloadUrl?: string | null
          id?: string
          isActive?: boolean
          targetAudience?: string | null
          title?: string
          type?: Database["public"]["Enums"]["ContentType"]
          updatedAt?: string
          viewCount?: number
        }
        Relationships: []
      }
      GongConfig: {
        Row: {
          apiKey: string
          createdAt: string
          id: string
          isActive: boolean
          lastSyncAt: string | null
          subdomain: string
          updatedAt: string
        }
        Insert: {
          apiKey: string
          createdAt: string
          id: string
          isActive: boolean
          lastSyncAt: string | null
          subdomain: string
          updatedAt: string
        }
        Update: {
          apiKey?: string
          createdAt?: string
          id?: string
          isActive?: boolean
          lastSyncAt?: string | null
          subdomain?: string
          updatedAt?: string
        }
        Relationships: []
      }
      interaction: never
      newsletter_subscriptions: {
        Row: {
          analystId: string
          clicked: boolean | null
          clickedAt: string | null
          createdAt: string | null
          email: string
          id: string
          newsletterId: string
          opened: boolean | null
          openedAt: string | null
          subscribedAt: string | null
          unsubscribedAt: string | null
          vendor_domain_id: string | null
        }
        Insert: {
          analystId: string
          clicked?: boolean | null
          clickedAt?: string | null
          createdAt?: string | null
          email: string
          id?: string
          newsletterId: string
          opened?: boolean | null
          openedAt?: string | null
          subscribedAt?: string | null
          unsubscribedAt?: string | null
          vendor_domain_id?: string | null
        }
        Update: {
          analystId?: string
          clicked?: boolean | null
          clickedAt?: string | null
          createdAt?: string | null
          email?: string
          id?: string
          newsletterId?: string
          opened?: boolean | null
          openedAt?: string | null
          subscribedAt?: string | null
          unsubscribedAt?: string | null
          vendor_domain_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_subscriptions_analystId_fkey"
            columns: ["analystId"]
            isOneToOne: false
            referencedRelation: "analysts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_subscriptions_newsletterId_fkey"
            columns: ["newsletterId"]
            isOneToOne: false
            referencedRelation: "newsletters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_subscriptions_vendor_fk"
            columns: ["vendor_domain_id"]
            isOneToOne: false
            referencedRelation: "vendor_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletters: {
        Row: {
          clickCount: number | null
          content: string | null
          createdAt: string | null
          createdBy: string | null
          description: string | null
          id: string
          openCount: number | null
          recipientCount: number | null
          scheduledAt: string | null
          sentAt: string | null
          status: string | null
          subject: string | null
          tags: string[] | null
          templateId: string | null
          title: string
          updatedAt: string | null
          vendor_domain_id: string | null
        }
        Insert: {
          clickCount?: number | null
          content?: string | null
          createdAt?: string | null
          createdBy?: string | null
          description?: string | null
          id?: string
          openCount?: number | null
          recipientCount?: number | null
          scheduledAt?: string | null
          sentAt?: string | null
          status?: string | null
          subject?: string | null
          tags?: string[] | null
          templateId?: string | null
          title: string
          updatedAt?: string | null
          vendor_domain_id?: string | null
        }
        Update: {
          clickCount?: number | null
          content?: string | null
          createdAt?: string | null
          createdBy?: string | null
          description?: string | null
          id?: string
          openCount?: number | null
          recipientCount?: number | null
          scheduledAt?: string | null
          sentAt?: string | null
          status?: string | null
          subject?: string | null
          tags?: string[] | null
          templateId?: string | null
          title?: string
          updatedAt?: string | null
          vendor_domain_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletters_vendor_fk"
            columns: ["vendor_domain_id"]
            isOneToOne: false
            referencedRelation: "vendor_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      PredefinedTopic: {
        Row: {
          category: Database["public"]["Enums"]["TopicCategory"]
          createdAt: string
          description: string | null
          id: string
          name: string
          order: number
          updatedAt: string
        }
        Insert: {
          category: Database["public"]["Enums"]["TopicCategory"]
          createdAt: string
          description: string | null
          id: string
          name: string
          order: number
          updatedAt: string
        }
        Update: {
          category?: Database["public"]["Enums"]["TopicCategory"]
          createdAt?: string
          description?: string | null
          id?: string
          name?: string
          order?: number
          updatedAt?: string
        }
        Relationships: []
      }
      Publication: {
        Row: {
          analystId: string
          createdAt: string
          id: string
          isTracked: boolean
          publishedAt: string
          summary: string | null
          title: string
          type: Database["public"]["Enums"]["PublicationType"]
          updatedAt: string
          url: string | null
        }
        Insert: {
          analystId: string
          createdAt: string
          id: string
          isTracked: boolean
          publishedAt: string
          summary: string | null
          title: string
          type: Database["public"]["Enums"]["PublicationType"]
          updatedAt: string
          url: string | null
        }
        Update: {
          analystId?: string
          createdAt?: string
          id?: string
          isTracked?: boolean
          publishedAt?: string
          summary?: string | null
          title?: string
          type?: Database["public"]["Enums"]["PublicationType"]
          updatedAt?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Publication_analystId_fkey"
            columns: ["analystId"]
            isOneToOne: false
            referencedRelation: "analysts"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduling_conversations: {
        Row: {
          agreedTime: string | null
          analystId: string
          calendarEventId: string | null
          createdAt: string
          id: string
          lastEmailSentAt: string | null
          lastResponseAt: string | null
          subject: string
          suggestedTimes: string | null
          threadId: string | null
          updatedAt: string
          zoomLink: string | null
        }
        Insert: {
          agreedTime: string | null
          analystId: string
          calendarEventId: string | null
          createdAt: string
          id: string
          lastEmailSentAt: string | null
          lastResponseAt: string | null
          subject: string
          suggestedTimes: string | null
          threadId: string | null
          updatedAt: string
          zoomLink: string | null
        }
        Update: {
          agreedTime?: string | null
          analystId?: string
          calendarEventId?: string | null
          createdAt?: string
          id?: string
          lastEmailSentAt?: string | null
          lastResponseAt?: string | null
          subject?: string
          suggestedTimes?: string | null
          threadId?: string | null
          updatedAt?: string
          zoomLink?: string | null
        }
        Relationships: []
      }
      scheduling_emails: {
        Row: {
          content: string
          conversationId: string
          createdAt: string
          id: string
          messageId: string | null
          sentAt: string
          subject: string
          threadId: string | null
        }
        Insert: {
          content: string
          conversationId: string
          createdAt: string
          id: string
          messageId: string | null
          sentAt: string
          subject: string
          threadId: string | null
        }
        Update: {
          content?: string
          conversationId?: string
          createdAt?: string
          id?: string
          messageId?: string | null
          sentAt?: string
          subject?: string
          threadId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduling_emails_conversationId_fkey"
            columns: ["conversationId"]
            isOneToOne: false
            referencedRelation: "scheduling_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      SchedulingConversation: {
        Row: {
          agreedTime: string | null
          analystId: string
          calendarEventId: string | null
          createdAt: string
          id: string
          lastEmailSentAt: string | null
          lastResponseAt: string | null
          status: Database["public"]["Enums"]["SchedulingStatus"]
          subject: string
          suggestedTimes: string | null
          threadId: string | null
          updatedAt: string
          zoomLink: string | null
        }
        Insert: {
          agreedTime: string | null
          analystId: string
          calendarEventId: string | null
          createdAt: string
          id: string
          lastEmailSentAt: string | null
          lastResponseAt: string | null
          status: Database["public"]["Enums"]["SchedulingStatus"]
          subject: string
          suggestedTimes: string | null
          threadId: string | null
          updatedAt: string
          zoomLink: string | null
        }
        Update: {
          agreedTime?: string | null
          analystId?: string
          calendarEventId?: string | null
          createdAt?: string
          id?: string
          lastEmailSentAt?: string | null
          lastResponseAt?: string | null
          status?: Database["public"]["Enums"]["SchedulingStatus"]
          subject?: string
          suggestedTimes?: string | null
          threadId?: string | null
          updatedAt?: string
          zoomLink?: string | null
        }
        Relationships: []
      }
      SchedulingEmail: {
        Row: {
          content: string
          conversationId: string
          createdAt: string
          direction: Database["public"]["Enums"]["EmailDirection"]
          id: string
          messageId: string | null
          sentAt: string
          subject: string
          threadId: string | null
        }
        Insert: {
          content: string
          conversationId: string
          createdAt: string
          direction: Database["public"]["Enums"]["EmailDirection"]
          id: string
          messageId: string | null
          sentAt: string
          subject: string
          threadId: string | null
        }
        Update: {
          content?: string
          conversationId?: string
          createdAt?: string
          direction?: Database["public"]["Enums"]["EmailDirection"]
          id?: string
          messageId?: string | null
          sentAt?: string
          subject?: string
          threadId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "SchedulingEmail_conversationId_fkey"
            columns: ["conversationId"]
            isOneToOne: false
            referencedRelation: "SchedulingConversation"
            referencedColumns: ["id"]
          },
        ]
      }
      SchedulingTemplate: {
        Row: {
          content: string
          createdAt: string
          description: string | null
          id: string
          isActive: boolean
          name: string
          subject: string
          updatedAt: string
        }
        Insert: {
          content: string
          createdAt: string
          description: string | null
          id: string
          isActive: boolean
          name: string
          subject: string
          updatedAt: string
        }
        Update: {
          content?: string
          createdAt?: string
          description?: string | null
          id?: string
          isActive?: boolean
          name?: string
          subject?: string
          updatedAt?: string
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          analystId: string
          comments: number | null
          content: string
          createdAt: string
          engagements: number | null
          id: string
          isRelevant: boolean
          likes: number | null
          platform: Database["public"]["Enums"]["social_platform"]
          postedAt: string
          responseContent: string | null
          responseGenerated: boolean
          sentiment: string | null
          shares: number | null
          themes: string[] | null
          url: string
          vendor_domain_id: string | null
        }
        Insert: {
          analystId: string
          comments?: number | null
          content: string
          createdAt: string
          engagements?: number | null
          id: string
          isRelevant: boolean
          likes?: number | null
          platform: Database["public"]["Enums"]["social_platform"]
          postedAt: string
          responseContent?: string | null
          responseGenerated?: boolean
          sentiment?: string | null
          shares?: number | null
          themes?: string[] | null
          url: string
          vendor_domain_id?: string | null
        }
        Update: {
          analystId?: string
          comments?: number | null
          content?: string
          createdAt?: string
          engagements?: number | null
          id?: string
          isRelevant?: boolean
          likes?: number | null
          platform?: Database["public"]["Enums"]["social_platform"]
          postedAt?: string
          responseContent?: string | null
          responseGenerated?: boolean
          sentiment?: string | null
          shares?: number | null
          themes?: string[] | null
          url?: string
          vendor_domain_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_social_posts_analyst"
            columns: ["analystId"]
            isOneToOne: false
            referencedRelation: "analysts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_analystId_fkey"
            columns: ["analystId"]
            isOneToOne: false
            referencedRelation: "analysts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_vendor_fk"
            columns: ["vendor_domain_id"]
            isOneToOne: false
            referencedRelation: "vendor_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      SocialHandle: {
        Row: {
          analystId: string
          createdAt: string
          displayName: string | null
          handle: string
          id: string
          isActive: boolean
          lastCrawledAt: string | null
          platform: Database["public"]["Enums"]["SocialPlatform"]
          updatedAt: string
        }
        Insert: {
          analystId: string
          createdAt: string
          displayName: string | null
          handle: string
          id: string
          isActive: boolean
          lastCrawledAt: string | null
          platform: Database["public"]["Enums"]["SocialPlatform"]
          updatedAt: string
        }
        Update: {
          analystId?: string
          createdAt?: string
          displayName?: string | null
          handle?: string
          id?: string
          isActive?: boolean
          lastCrawledAt?: string | null
          platform?: Database["public"]["Enums"]["SocialPlatform"]
          updatedAt?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          analyst_id: string | null
          author: string
          company: string | null
          created_at: string
          display_order: number | null
          id: string
          is_published: boolean | null
          rating: number | null
          text: string
          updated_at: string
          vendor_domain_id: string | null
        }
        Insert: {
          analyst_id: string | null
          author: string
          company: string | null
          created_at: string
          display_order: number | null
          id: string
          is_published: boolean | null
          rating: number | null
          text: string
          updated_at: string
          vendor_domain_id: string | null
        }
        Update: {
          analyst_id?: string | null
          author?: string
          company?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_published?: boolean | null
          rating?: number | null
          text?: string
          updated_at?: string
          vendor_domain_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_analyst_id_fkey"
            columns: ["analyst_id"]
            isOneToOne: false
            referencedRelation: "analysts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonials_vendor_fk"
            columns: ["vendor_domain_id"]
            isOneToOne: false
            referencedRelation: "vendor_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          category: string | null
          createdAt: string | null
          description: string | null
          id: string
          isActive: boolean | null
          name: string
          order: number | null
          updatedAt: string | null
        }
        Insert: {
          category: string | null
          createdAt: string | null
          description: string | null
          id: string
          isActive: boolean | null
          name: string
          order: number | null
          updatedAt: string | null
        }
        Update: {
          category?: string | null
          createdAt?: string | null
          description?: string | null
          id?: string
          isActive?: boolean | null
          name?: string
          order?: number | null
          updatedAt?: string | null
        }
        Relationships: []
      }
      twitter_api_usage: {
        Row: {
          analyst_id: string | null
          created_at: string | null
          date: string
          endpoint: string
          id: string
          requests_used: number
          user_id: string | null
        }
        Insert: {
          analyst_id: string | null
          created_at: string | null
          date: string
          endpoint: string
          id: string
          requests_used: number
          user_id: string | null
        }
        Update: {
          analyst_id?: string | null
          created_at?: string | null
          date?: string
          endpoint?: string
          id?: string
          requests_used?: number
          user_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          company: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          name: string | null
          password: string
          role: Database["public"]["Enums"]["Role"]
          updated_at: string
        }
        Insert: {
          company: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          name: string | null
          password: string
          role: Database["public"]["Enums"]["Role"]
          updated_at: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          name?: string | null
          password?: string
          role?: Database["public"]["Enums"]["Role"]
          updated_at?: string
        }
        Relationships: []
      }
      vendor_portal_content: {
        Row: {
          category: string
          createdAt: string | null
          description: string | null
          id: string
          title: string
          updatedAt: string | null
          url: string
          vendor_domain_id: string
        }
        Insert: {
          category: string
          createdAt: string | null
          description: string | null
          id: string
          title: string
          updatedAt: string | null
          url: string
          vendor_domain_id: string
        }
        Update: {
          category?: string
          createdAt?: string | null
          description?: string | null
          id?: string
          title?: string
          updatedAt?: string | null
          url?: string
          vendor_domain_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_portal_content_vendor_domain_id_fkey"
            columns: ["vendor_domain_id"]
            isOneToOne: false
            referencedRelation: "vendor_domains"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_analyst_domain_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      current_analyst_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      current_user_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      current_user_vendor_domain_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_vendor_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      action_item_priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
      action_item_status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
      AlertType:
        | "COMMUNICATION_OVERDUE"
        | "BRIEFING_DUE"
        | "RELATIONSHIP_HEALTH"
        | "SOCIAL_MENTION"
        | "PUBLICATION_ALERT"
        | "ENGAGEMENT_OPPORTUNITY"
      analyst_type:
        | "Analyst"
        | "Press"
        | "Investor"
        | "Practitioner"
        | "Influencer"
      AnalystType:
        | "Analyst"
        | "Press"
        | "Investor"
        | "Practitioner"
        | "Influencer"
      AwardPriority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
      briefing_status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED"
      BriefingStatus: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED"
      ContentType:
        | "ARTICLE"
        | "WHITEPAPER"
        | "DEMO"
        | "VIDEO"
        | "WEBINAR"
        | "REPORT"
        | "OTHER"
      EmailDirection: "OUTBOUND" | "INBOUND"
      influence: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH"
      Influence: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH"
      InteractionType: "EMAIL" | "CALL" | "MEETING" | "DEMO" | "EVENT" | "OTHER"
      NewsletterStatus: "DRAFT" | "SCHEDULED" | "SENT" | "CANCELLED"
      PublicationType:
        | "RESEARCH_REPORT"
        | "BLOG_POST"
        | "WHITEPAPER"
        | "WEBINAR"
        | "PODCAST"
        | "ARTICLE"
        | "OTHER"
      relationship_health: "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "CRITICAL"
      RelationshipHealth: "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "CRITICAL"
      Role:
        | "ADMIN"
        | "EDITOR"
        | "SUPER_ADMIN"
        | "VENDOR_ADMIN"
        | "VENDOR_USER"
        | "ANALYST"
      Role_new: "SUPER_ADMIN" | "VENDOR_ADMIN" | "VENDOR_USER" | "ANALYST"
      SchedulingStatus:
        | "INITIATED"
        | "WAITING_RESPONSE"
        | "NEGOTIATING"
        | "CONFIRMED"
        | "SCHEDULED"
        | "CANCELLED"
        | "EXPIRED"
      social_platform: "TWITTER" | "LINKEDIN" | "MEDIUM" | "BLOG" | "OTHER"
      SocialPlatform: "TWITTER" | "LINKEDIN" | "MEDIUM" | "BLOG" | "OTHER"
      status: "ACTIVE" | "INACTIVE" | "ARCHIVED"
      Status: "ACTIVE" | "INACTIVE" | "ARCHIVED"
      TopicCategory: "CORE" | "ADDITIONAL"
      user_role: "SUPER_ADMIN" | "VENDOR_ADMIN" | "VENDOR_USER" | "ANALYST"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      action_item_priority: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      action_item_status: ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      AlertType: [
        "COMMUNICATION_OVERDUE",
        "BRIEFING_DUE",
        "RELATIONSHIP_HEALTH",
        "SOCIAL_MENTION",
        "PUBLICATION_ALERT",
        "ENGAGEMENT_OPPORTUNITY",
      ],
      analyst_type: [
        "Analyst",
        "Press",
        "Investor",
        "Practitioner",
        "Influencer",
      ],
      AnalystType: [
        "Analyst",
        "Press",
        "Investor",
        "Practitioner",
        "Influencer",
      ],
      AwardPriority: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      briefing_status: ["SCHEDULED", "COMPLETED", "CANCELLED", "RESCHEDULED"],
      BriefingStatus: ["SCHEDULED", "COMPLETED", "CANCELLED", "RESCHEDULED"],
      ContentType: [
        "ARTICLE",
        "WHITEPAPER",
        "DEMO",
        "VIDEO",
        "WEBINAR",
        "REPORT",
        "OTHER",
      ],
      EmailDirection: ["OUTBOUND", "INBOUND"],
      influence: ["LOW", "MEDIUM", "HIGH", "VERY_HIGH"],
      Influence: ["LOW", "MEDIUM", "HIGH", "VERY_HIGH"],
      InteractionType: ["EMAIL", "CALL", "MEETING", "DEMO", "EVENT", "OTHER"],
      NewsletterStatus: ["DRAFT", "SCHEDULED", "SENT", "CANCELLED"],
      PublicationType: [
        "RESEARCH_REPORT",
        "BLOG_POST",
        "WHITEPAPER",
        "WEBINAR",
        "PODCAST",
        "ARTICLE",
        "OTHER",
      ],
      relationship_health: ["EXCELLENT", "GOOD", "FAIR", "POOR", "CRITICAL"],
      RelationshipHealth: ["EXCELLENT", "GOOD", "FAIR", "POOR", "CRITICAL"],
      Role: [
        "ADMIN",
        "EDITOR",
        "SUPER_ADMIN",
        "VENDOR_ADMIN",
        "VENDOR_USER",
        "ANALYST",
      ],
      Role_new: ["SUPER_ADMIN", "VENDOR_ADMIN", "VENDOR_USER", "ANALYST"],
      SchedulingStatus: [
        "INITIATED",
        "WAITING_RESPONSE",
        "NEGOTIATING",
        "CONFIRMED",
        "SCHEDULED",
        "CANCELLED",
        "EXPIRED",
      ],
      social_platform: ["TWITTER", "LINKEDIN", "MEDIUM", "BLOG", "OTHER"],
      SocialPlatform: ["TWITTER", "LINKEDIN", "MEDIUM", "BLOG", "OTHER"],
      status: ["ACTIVE", "INACTIVE", "ARCHIVED"],
      Status: ["ACTIVE", "INACTIVE", "ARCHIVED"],
      TopicCategory: ["CORE", "ADDITIONAL"],
      user_role: ["SUPER_ADMIN", "VENDOR_ADMIN", "VENDOR_USER", "ANALYST"],
    },
  },
} as const

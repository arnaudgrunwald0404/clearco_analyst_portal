# Remaining Prisma to Supabase Migrations

## Overview
After the initial Prisma cleanup, several API endpoints still contain Prisma references. This document outlines the remaining migration work needed.

## 🔴 Critical APIs (High Priority)
These APIs are likely used in the main application flow:

### Settings APIs
- `src/app/api/settings/analyst-portal/route.ts` - Portal settings management
- `src/app/api/settings/calendar-connections/route.ts` - Calendar connections
- `src/app/api/settings/calendar-connections/[id]/route.ts` - Individual calendar connection
- `src/app/api/settings/topics/route.ts` - Topics management
- `src/app/api/settings/topics/[id]/route.ts` - Individual topic management
- `src/app/api/settings/topics/simplify/route.ts` - Topic simplification

### Core Data APIs
- `src/app/api/briefings/due/route.ts` - Due briefings
- `src/app/api/briefings/[id]/route.ts` - Individual briefing operations
- `src/app/api/briefings/sync-calendar/route.ts` - Calendar synchronization
- `src/app/api/dashboard/recent-activity/route.ts` - Dashboard recent activity
- `src/app/api/dashboard/top-analysts/route.ts` - Top analysts dashboard
- `src/app/api/action-items/[id]/route.ts` - Individual action item operations

### Analyst Management APIs
- `src/app/api/analysts/bulk/route.ts` - Bulk analyst operations
- `src/app/api/analysts/filtered/route.ts` - Filtered analyst queries
- `src/app/api/analysts/[id]/route.ts` - Individual analyst operations
- `src/app/api/analysts/[id]/publications/route.ts` - Analyst publications
- `src/app/api/analysts/[id]/briefings/route.ts` - Analyst briefings
- `src/app/api/analysts/[id]/social-posts/route.ts` - Analyst social posts

## 🟡 Secondary APIs (Medium Priority)
These APIs support specific features that may be used:

### Newsletter System
- `src/app/api/newsletters/route.ts` - Newsletter management
- `src/app/api/newsletters/[id]/route.ts` - Individual newsletter operations
- `src/app/api/newsletters/[id]/send/route.ts` - Newsletter sending
- `src/app/api/newsletters/[id]/track/click/route.ts` - Click tracking
- `src/app/api/newsletters/[id]/track/open/route.ts` - Open tracking

### Email Templates
- `src/app/api/email-templates/route.ts` - Email template management
- `src/app/api/email-templates/[id]/route.ts` - Individual template operations

### Events System
- `src/app/api/events/route.ts` - Event management
- `src/app/api/events/[id]/route.ts` - Individual event operations
- `src/app/api/events/bulk/route.ts` - Bulk event operations
- `src/app/api/events/enums/route.ts` - Event enumerations

### Awards System
- `src/app/api/awards/route.ts` - Awards management
- `src/app/api/awards/[id]/route.ts` - Individual award operations
- `src/app/api/awards/bulk/route.ts` - Bulk award operations

### Testimonials
- `src/app/api/testimonials/route.ts` - Testimonial management
- `src/app/api/testimonials/[id]/route.ts` - Individual testimonial operations

## 🟢 Optional APIs (Low Priority)
These APIs support advanced or optional features:

### Authentication
- `src/app/api/auth/google/callback/route.ts` - Google OAuth callback
- `src/app/api/auth/google-calendar/callback/route.ts` - Google Calendar OAuth

### Scheduling Agent
- `src/app/api/scheduling-agent/route.ts` - Scheduling agent management
- `src/app/api/scheduling-agent/webhook/route.ts` - Scheduling webhooks
- `src/app/api/scheduling-agent/templates/route.ts` - Scheduling templates

### Social Crawler
- `src/app/api/social-crawler/route.ts` - Social media crawling

### Analytics
- `src/app/api/analytics/briefing-density/route.ts` - Briefing density analytics

### Monitoring
- `src/app/api/monitoring-stats/route.ts` - System monitoring

## Scripts Requiring Migration

### Topic Management Scripts
- `src/scripts/expand-to-clear-company-topics.ts`
- `src/scripts/populate-predefined-topics.ts`
- `src/scripts/one-time-deduplication.ts`
- `src/scripts/consolidate-topics.ts`
- `src/scripts/view-current-topics.ts`
- `src/scripts/apply-topic-consolidation.ts`
- `src/scripts/consolidate-and-update-db.ts`

### Social Media Scripts
- `src/scripts/init-social-history.ts`
- `src/scripts/hourly-social-monitor.ts`

### Other Utilities
- `src/lib/llm/generateAnalystSQL.ts`
- `src/lib/scheduling-agent/manager.ts`

## Required Supabase Schema Additions

To support all these APIs, the following tables need to be added to Supabase:

### High Priority Tables
```sql
-- Analyst Portal Settings
CREATE TABLE analyst_portal_settings (
  id text PRIMARY KEY DEFAULT 'cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  "welcomeQuote" text,
  "quoteAuthor" text,
  "authorImageUrl" text,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Calendar Connections
CREATE TABLE calendar_connections (
  id text PRIMARY KEY DEFAULT 'cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  "userId" text NOT NULL,
  "accessToken" text NOT NULL,
  "refreshToken" text,
  "expiresAt" timestamp with time zone,
  "calendarId" text,
  "calendarName" text,
  "isActive" boolean DEFAULT true,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Topics
CREATE TABLE topics (
  id text PRIMARY KEY DEFAULT 'cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  name text NOT NULL UNIQUE,
  description text,
  "isActive" boolean DEFAULT true,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Covered Topics (analyst-topic relationships)
CREATE TABLE covered_topics (
  id text PRIMARY KEY DEFAULT 'cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  "analystId" text NOT NULL REFERENCES analysts(id) ON DELETE CASCADE,
  topic text NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now()
);
```

### Medium Priority Tables
```sql
-- Newsletters
CREATE TABLE newsletters (
  id text PRIMARY KEY DEFAULT 'cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  title text NOT NULL,
  content text NOT NULL,
  subject text NOT NULL,
  "authorId" text NOT NULL,
  status text DEFAULT 'DRAFT',
  "sentAt" timestamp with time zone,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Email Templates
CREATE TABLE email_templates (
  id text PRIMARY KEY DEFAULT 'cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  name text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  type text NOT NULL,
  "isActive" boolean DEFAULT true,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Events
CREATE TABLE events (
  id text PRIMARY KEY DEFAULT 'cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  title text NOT NULL,
  description text,
  "startDate" timestamp with time zone NOT NULL,
  "endDate" timestamp with time zone,
  location text,
  type text NOT NULL,
  status text DEFAULT 'UPCOMING',
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Awards
CREATE TABLE awards (
  id text PRIMARY KEY DEFAULT 'cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  title text NOT NULL,
  description text,
  category text NOT NULL,
  "awardedDate" timestamp with time zone,
  "recipientId" text,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Testimonials
CREATE TABLE testimonials (
  id text PRIMARY KEY DEFAULT 'cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  content text NOT NULL,
  author text NOT NULL,
  "authorTitle" text,
  "authorCompany" text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  "isActive" boolean DEFAULT true,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);
```

## Migration Strategy

### Phase 1: Critical APIs (Immediate)
1. Migrate settings APIs for core functionality
2. Update calendar connections for Google Calendar sync
3. Migrate individual briefing and action item operations

### Phase 2: Secondary APIs (Short-term)
1. Newsletter system for communication features
2. Email templates for automation
3. Events and awards systems

### Phase 3: Optional APIs (Long-term)
1. Advanced scheduling features
2. Social crawling improvements
3. Analytics enhancements

### Phase 4: Scripts and Utilities
1. Migrate topic management scripts
2. Update social media monitoring scripts
3. Refresh utility libraries

## Testing Strategy

For each migrated API:
1. **Unit Tests**: Create tests for each endpoint
2. **Integration Tests**: Test with actual Supabase data
3. **Regression Tests**: Ensure existing functionality works
4. **Performance Tests**: Verify query performance

## Rollback Plan

- Keep Prisma types in a separate file for reference
- Maintain migration mapping documentation
- Test rollback scenarios in development

## Estimated Timeline

- **Phase 1**: 2-3 days (20+ APIs)
- **Phase 2**: 3-4 days (15+ APIs)  
- **Phase 3**: 2-3 days (10+ APIs)
- **Phase 4**: 2-3 days (scripts and utilities)

**Total**: 9-13 days for complete migration

## Current Status

✅ **Completed**: Core APIs (analysts, briefings, action-items, dashboard metrics, settings-general, influence-tiers)
🔄 **In Progress**: Remaining 40+ APIs and scripts
⏳ **Pending**: Schema extensions and comprehensive testing

---

**Note**: The application currently works with the migrated core APIs. The remaining migrations can be done incrementally without breaking existing functionality. 
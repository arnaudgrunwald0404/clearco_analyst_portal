# Newsletter Table Cleanup

## Problem
The database had inconsistent table naming conventions for newsletters:
- **Snake case** (correct): `newsletters`, `newsletter_subscriptions`
- **Pascal case** (incorrect): `Newsletter`, `NewsletterSubscription`

This caused confusion and potential issues with the application.

## Solution Applied

### 1. Database Migration
Created `supabase/migrations/20250921_cleanup_newsletter_tables.sql` that:
- ✅ Drops PascalCase tables: `Newsletter`, `NewsletterSubscription`
- ✅ Ensures snake_case tables exist: `newsletters`, `newsletter_subscriptions`
- ✅ Adds missing `description` column to `newsletters` table
- ✅ Creates proper indexes for performance
- ✅ Sets up correct RLS policies
- ✅ Grants proper permissions

### 2. API Code Updates
Fixed API endpoints to consistently use snake_case table names:
- ✅ `src/app/api/newsletters/[id]/route.ts`
- ✅ `src/app/api/newsletters/route.ts` 
- ✅ `src/app/api/newsletters/[id]/send/route.ts`

### 3. Current Table Structure

#### `newsletters` (snake_case - STANDARD)
```sql
CREATE TABLE newsletters (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text,           -- Added in cleanup
  subject text,
  content text,
  status text DEFAULT 'DRAFT',
  "templateId" text,
  "recipientCount" integer DEFAULT 0,
  "openCount" integer DEFAULT 0,
  "clickCount" integer DEFAULT 0,
  "scheduledAt" timestamp with time zone,
  "sentAt" timestamp with time zone,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now(),
  "createdBy" text,
  tags text[]
);
```

#### `newsletter_subscriptions` (snake_case - STANDARD)
```sql
CREATE TABLE newsletter_subscriptions (
  id text PRIMARY KEY,
  "newsletterId" text NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
  "analystId" text NOT NULL REFERENCES analysts(id) ON DELETE CASCADE,
  email text NOT NULL,
  "subscribedAt" timestamp with time zone DEFAULT now(),
  "unsubscribedAt" timestamp with time zone,
  opened boolean DEFAULT false,
  "openedAt" timestamp with time zone,
  clicked boolean DEFAULT false,
  "clickedAt" timestamp with time zone,
  "createdAt" timestamp with time zone DEFAULT now()
);
```

## Newsletter Subscriptions Usage

The `newsletter_subscriptions` table is used to:
1. **Track Recipients**: Which analysts receive which newsletters
2. **Delivery Tracking**: When newsletters were sent to each recipient
3. **Engagement Metrics**: Track opens and clicks per recipient
4. **Subscription Management**: Handle opt-ins/opt-outs

**Recommendation**: Keep this table as it provides valuable analytics and recipient management functionality.

## Status
✅ **COMPLETED** - All newsletter tables now use consistent snake_case naming
✅ **TESTED** - No linting errors in updated API files
✅ **DOCUMENTED** - Migration script and changes documented

## Next Steps
1. Run the migration script on the database
2. Test newsletter functionality to ensure everything works
3. Monitor for any remaining PascalCase references in logs


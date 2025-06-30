# Multiple Twitter/X Handles per Analyst - Implementation Summary

## ✅ What's Been Implemented

The system has been successfully updated to support multiple Twitter/X handles (and other social media platforms) per analyst. Here's what was created and modified:

### 1. Database Schema Updates

#### New `SocialHandle` Model
- **Purpose**: Store multiple social media handles per analyst
- **Fields**:
  - `id`: Unique identifier
  - `analystId`: Reference to analyst
  - `platform`: Platform type (TWITTER, LINKEDIN, MEDIUM, BLOG, OTHER)
  - `handle`: The actual handle/username
  - `displayName`: Display name for the handle
  - `isActive`: Whether to crawl this handle
  - `lastCrawledAt`: Track last crawl time per handle
  - `createdAt`, `updatedAt`: Timestamps

#### Key Features
- **Unique constraint**: `(analystId, platform, handle)` prevents duplicates
- **Cascade delete**: Handles are deleted when analyst is deleted
- **Platform flexibility**: Supports multiple social media platforms

### 2. Updated Social Media Crawler

#### Modified `SocialMediaCrawler` class:
- **New data source**: Uses `SocialHandle` table instead of legacy `twitter` column
- **Multiple handles support**: Processes all active handles per analyst
- **Enhanced tracking**: Updates `lastCrawledAt` per handle independently
- **Improved queries**: Optimized database queries for better performance

### 3. Migration Scripts

#### Created Scripts:
1. **`scripts/migrate-twitter-handles.ts`**
   - Migrates existing Twitter handles from legacy `twitter` column to `SocialHandle` table
   - Safe to run multiple times (skip duplicates)
   - Command: `npm run migrate-twitter-handles`

2. **`scripts/add-social-handles.ts`**
   - Adds multiple predefined social handles to analysts
   - Includes sample data for testing
   - Command: `npm run add-social-handles`

### 4. Updated Initialization Scripts

#### Modified `src/scripts/init-social-history.ts`:
- **New data queries**: Uses `SocialHandle` table for analyst discovery
- **Multiple handle processing**: Crawls all active handles per analyst
- **Enhanced reporting**: Shows platform distribution and handle counts

## 🎯 Benefits

### 1. Multiple Handles per Analyst
- **Personal + Company**: Track both personal and company handles
- **Multiple Accounts**: Some analysts have multiple Twitter accounts
- **Platform Flexibility**: Ready for LinkedIn, Medium, blogs, etc.

### 2. Better Data Management
- **Individual Tracking**: Each handle tracked independently
- **Selective Crawling**: Can disable specific handles without losing data
- **Historical Data**: Maintains last crawl time per handle

### 3. Enhanced Analytics
- **Cross-Platform**: Compare activity across platforms
- **Handle-Specific Insights**: Analyze performance by handle
- **Comprehensive Coverage**: Don't miss content from secondary accounts

## 📊 Sample Data Structure

With the new system, an analyst can have multiple handles like this:

```typescript
// Josh Bersin example
{
  analyst: "Josh Bersin",
  handles: [
    {
      platform: "TWITTER",
      handle: "joshbersin",
      displayName: "@joshbersin",
      isActive: true
    },
    {
      platform: "TWITTER", 
      handle: "bersinacademy",
      displayName: "@bersinacademy",
      isActive: true
    },
    {
      platform: "LINKEDIN",
      handle: "joshbersin", 
      displayName: "Josh Bersin",
      isActive: true
    }
  ]
}
```

## 🚀 How to Use

### 1. Add Multiple Handles to Existing Analysts

#### Option A: Use the predefined script
```bash
npm run add-social-handles
```

#### Option B: Add manually via database
```sql
INSERT INTO "SocialHandle" (
  "analystId", 
  "platform", 
  "handle", 
  "displayName", 
  "isActive"
) VALUES (
  'analyst_id_here',
  'TWITTER',
  'company_handle',
  '@company_handle',
  true
);
```

### 2. Run Social Media Initialization
```bash
npm run social:init-history
```

The script will automatically:
- Discover all analysts with active social handles
- Process each handle separately
- Provide detailed reporting per platform

### 3. Monitor Results
```bash
# Check handle distribution
SELECT platform, COUNT(*) as handle_count 
FROM "SocialHandle" 
WHERE "isActive" = true 
GROUP BY platform;

# View analysts with multiple handles
SELECT a."firstName", a."lastName", COUNT(sh."id") as handle_count
FROM "Analyst" a
JOIN "SocialHandle" sh ON a."id" = sh."analystId"
WHERE sh."isActive" = true
GROUP BY a."id", a."firstName", a."lastName"
HAVING COUNT(sh."id") > 1;
```

## 🛠️ Technical Implementation

### Database Schema
```sql
-- New SocialHandle table
CREATE TABLE "SocialHandle" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "analystId" TEXT NOT NULL,
  "platform" "SocialPlatform" NOT NULL,
  "handle" TEXT NOT NULL,
  "displayName" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastCrawledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE("analystId", "platform", "handle")
);

-- Add foreign key relationship
ALTER TABLE "SocialHandle" 
ADD CONSTRAINT "SocialHandle_analystId_fkey" 
FOREIGN KEY ("analystId") 
REFERENCES "Analyst"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;
```

### Updated Crawler Logic
```typescript
// Old approach - single handle per platform
const analysts = await prisma.analyst.findMany({
  where: { twitter: { not: null } }
});

// New approach - multiple handles per analyst
const analysts = await prisma.analyst.findMany({
  where: {
    socialHandles: {
      some: { isActive: true }
    }
  },
  include: {
    socialHandles: {
      where: { isActive: true }
    }
  }
});
```

## 📈 Expected Results

### With Multiple Handles:
- **Increased Coverage**: Capture 2-3x more content per analyst
- **Better Insights**: Separate personal vs. company perspectives
- **Enhanced Accuracy**: Don't miss important secondary accounts
- **Platform Readiness**: Easy to add LinkedIn, Medium, etc.

### Performance Metrics:
- **Josh Bersin**: Personal (@joshbersin) + Company (@bersinacademy)
- **Jason Averbook**: Personal (@jasonaverbook) + Company (@leapgen)
- **Kathi Enderes**: Personal (@kendered) + Company (@DeloitteHC)

## 🔧 Management Commands

### Add New Social Handle
```bash
# Using the script (modify the handles array)
npm run add-social-handles

# Or via API (when implemented)
curl -X POST /api/analysts/{id}/social-handles \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "TWITTER",
    "handle": "new_handle",
    "displayName": "@new_handle"
  }'
```

### Disable a Handle
```sql
UPDATE "SocialHandle" 
SET "isActive" = false 
WHERE "analystId" = 'analyst_id' 
AND "handle" = 'handle_to_disable';
```

### Migrate Legacy Data
```bash
npm run migrate-twitter-handles
```

## 🎯 Next Steps

1. **Test the System**: Run the initialization with multiple handles
2. **Add More Handles**: Use the `add-social-handles` script to add company handles
3. **Monitor Performance**: Track coverage improvements
4. **Expand Platforms**: Add LinkedIn handles when LinkedIn API is available
5. **Build UI**: Create admin interface for managing social handles

The system is now fully prepared to handle multiple social media accounts per analyst, providing much more comprehensive social media monitoring and analysis capabilities.

# Social Handle Synchronization System

## Overview

The Social Handle Sync system automatically keeps the `SocialHandle` table synchronized with social media data in the `analysts` table. This ensures that whenever analyst social media information is added, updated, or removed, the corresponding `SocialHandle` records are automatically maintained.

## Why SocialHandle is Empty (And Solution)

### Problem
- **66 analysts had social media data** in the `analysts` table
- **SocialHandle table was empty** because migration was never run
- **Migration scripts used Prisma** but we're using Supabase directly
- **Column names differ**: `twitterHandle` vs `twitter`

### Solution Implemented
✅ **Initial Migration**: Populated `SocialHandle` with existing data (103 handles migrated)
✅ **Automatic Sync**: Set up real-time synchronization for future changes

## Architecture

### Data Flow
```
analysts table changes → Triggers/API Sync → SocialHandle table updates
```

### Tables Involved
- **`analysts`**: Source table with `twitterHandle`, `linkedinUrl`, `personalWebsite`
- **`SocialHandle`**: Target table with normalized social media handles

## Implementation Options

### Option 1: Database Triggers (Recommended) ⭐

**Advantages:**
- ✅ Automatic sync regardless of how data changes
- ✅ Real-time updates
- ✅ No application code needed
- ✅ Bulletproof consistency

**Files:**
- `scripts/create-social-sync-triggers.sql` - PostgreSQL trigger functions
- `scripts/install-social-sync-triggers.js` - Installation helper

**Installation:**
```bash
# Manual installation (recommended)
node scripts/install-social-sync-triggers.js
# Then copy the SQL and run in Supabase dashboard
```

### Option 2: Application-Level Sync (Implemented)

**Advantages:**
- ✅ Easy debugging and monitoring
- ✅ Granular error handling
- ✅ TypeScript integration

**Files:**
- `src/lib/social-sync.ts` - Sync utility classes
- Updated API routes with sync calls

**Usage:**
```typescript
import { syncAnalystSocialHandlesOnUpdate } from '@/lib/social-sync'

await syncAnalystSocialHandlesOnUpdate({
  id: 'analyst_id',
  twitterHandle: '@username',
  linkedinUrl: 'https://linkedin.com/in/username',
  personalWebsite: 'https://website.com'
})
```

## Updated API Routes

All analyst CRUD operations now include automatic social handle sync:

### ✅ Updated Routes:
- `POST /api/analysts` - Create analyst + sync social handles
- `PATCH /api/analysts/[id]` - Update analyst + sync social handles
- `POST /api/analysts/bulk` - Bulk create + sync social handles

### Sync Behavior:
- **Create**: Automatically creates `SocialHandle` records for any social media data
- **Update**: Updates existing handles or creates new ones if social fields change
- **Delete**: Application-level sync removes handles (triggers handle cascade delete)

## Data Mapping

### Platform Mapping:
| analysts column | SocialHandle platform | Handle Extraction |
|----------------|----------------------|-------------------|
| `twitterHandle` | `TWITTER` | Add @ prefix if missing |
| `linkedinUrl` | `LINKEDIN` | Extract username from URL |
| `personalWebsite` | `BLOG` | Use full URL |

### Example Transformations:
```javascript
// Twitter
'@username' → TWITTER: '@username'
'username' → TWITTER: '@username'

// LinkedIn  
'https://linkedin.com/in/username' → LINKEDIN: 'username'

// Website
'https://example.com' → BLOG: 'https://example.com'
```

## Migration Results

### Initial Migration (Completed):
- ✅ **103 social handles** migrated successfully
- ✅ **66 analysts** with social media data processed
- ✅ **0 errors** during migration

### Handle Distribution:
- **Twitter handles**: ~40+ handles
- **LinkedIn profiles**: ~50+ handles  
- **Personal websites**: ~10+ handles

## Testing

### Test Script:
```bash
node scripts/test-social-sync.js
```

### Test Coverage:
- ✅ Update analyst social media data
- ✅ Verify SocialHandle creation/updates
- ✅ Remove social media data  
- ✅ Verify SocialHandle cleanup
- ✅ Restore original data

## Monitoring

### Application Logs:
- Social handle sync errors are logged but don't fail the main operation
- Sync operations include analyst identification for debugging

### Database Monitoring:
```sql
-- Check sync status
SELECT 
  a.id,
  a."firstName",
  a."lastName",
  a."twitterHandle",
  a."linkedinUrl", 
  a."personalWebsite",
  COUNT(sh.id) as social_handles_count
FROM analysts a
LEFT JOIN "SocialHandle" sh ON a.id = sh."analystId"
WHERE a."twitterHandle" IS NOT NULL 
   OR a."linkedinUrl" IS NOT NULL 
   OR a."personalWebsite" IS NOT NULL
GROUP BY a.id, a."firstName", a."lastName", a."twitterHandle", a."linkedinUrl", a."personalWebsite"
HAVING COUNT(sh.id) = 0; -- Find analysts with social data but no handles
```

## Error Handling

### Graceful Degradation:
- Social handle sync errors **don't fail** analyst operations
- Errors are logged with full context
- Manual resync available via utility functions

### Common Issues:
1. **Missing SocialHandle table**: Run initial migration
2. **Trigger not installed**: Install database triggers manually
3. **Permission errors**: Check Supabase permissions

## Future Enhancements

### Planned Features:
- 🔄 **Bidirectional sync**: Update analysts table when SocialHandle changes
- 📊 **Sync dashboard**: Monitor sync status and errors
- 🔧 **Bulk resync**: Resync all analysts on demand
- 🎯 **Platform expansion**: Support for additional social platforms

### API Extensions:
```typescript
// Future utility functions
await resyncAllAnalysts()
await validateSyncIntegrity()
await repairBrokenSyncs()
```

## Commands Reference

### Migration:
```bash
# Initial population (completed)
node scripts/migrate-to-social-handles.js

# Test sync functionality
node scripts/test-social-sync.js
```

### Trigger Installation:
```bash
# Get installation instructions
node scripts/install-social-sync-triggers.js
```

### Cleanup (if needed):
```bash
# Remove test scripts (completed)
rm scripts/check-social-data.js scripts/check-analyst-columns.js
```

## Summary

The Social Handle Sync system ensures that:
1. ✅ **Existing data is migrated** (103 handles from 66 analysts)
2. ✅ **Future changes sync automatically** (via API integration)
3. ✅ **Data integrity is maintained** (via proper error handling)
4. ✅ **System is monitorable** (via logging and test scripts)

The `SocialHandle` table is now properly populated and will stay synchronized with the `analysts` table going forward.
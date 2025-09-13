# Twitter API Setup - Rate Limited (500 requests/month)

This guide covers the conservative implementation of Twitter API integration designed for the 500 requests/month limit.

## 🚨 Important Rate Limit Information

- **Monthly Limit**: 500 requests total
- **Daily Safe Limit**: 16 requests (leaving buffer for month variations)
- **Weekly Budget**: 115 requests (conservative weekly allocation)
- **Each API call = 1 request** (regardless of tweet count returned)

## 📊 Usage Strategy

### Weekly Sync (Recommended)
- Run automated sync **once per week** on Sundays
- Process **8-10 analysts maximum** per week
- Fetch **10 tweets per analyst** (total: ~10 requests per week)
- Leaves room for manual testing and emergency fetches

### Manual Testing
- Limit to **2-3 requests per day maximum**
- Use the dry-run mode whenever possible
- Always check usage dashboard before making requests

## 🛠 Setup Instructions

### 1. Database Migration

Run the migration to create the usage tracking table:

```bash
# Apply the migration
supabase db push

# Or manually run:
psql -h [your-db-host] -U [user] -d [database] -f supabase/migrations/035_create_twitter_usage_table.sql
```

### 2. Environment Variables

```bash
# Add to your .env.local
RAPIDAPI_TWITTER_KEY=3f2e665f7amshf6272adc6282602p136bb9jsn731ef45f1658

# For production, also add:
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

### 3. Weekly Cron Job Setup

Add to your server's crontab or use a service like GitHub Actions:

```bash
# Run every Sunday at 2 AM
0 2 * * 0 cd /path/to/analyst-portal && node scripts/cron/weekly-twitter-sync.js

# Or with logging:
0 2 * * 0 cd /path/to/analyst-portal && node scripts/cron/weekly-twitter-sync.js >> logs/twitter-sync.log 2>&1
```

### 4. GitHub Actions (Alternative)

Create `.github/workflows/weekly-twitter-sync.yml`:

```yaml
name: Weekly Twitter Sync
on:
  schedule:
    - cron: '0 2 * * 0'  # Every Sunday at 2 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: node scripts/cron/weekly-twitter-sync.js
        env:
          RAPIDAPI_TWITTER_KEY: ${{ secrets.RAPIDAPI_TWITTER_KEY }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

## 📈 Usage Monitoring

### Dashboard Access
Visit `/twitter-fetch` in your application to see:
- Real-time usage statistics
- Monthly/weekly consumption
- Usage warnings and projections
- Safe usage recommendations

### API Endpoints
```bash
# Check current usage
GET /api/social-media/twitter-usage

# Reset usage (for new month)
POST /api/social-media/twitter-usage
Body: { "action": "reset", "confirmation": "RESET_TWITTER_USAGE" }
```

## 🧪 Testing

### Conservative Test Script
```bash
# Safe testing (no actual API calls)
node scripts/test-twitter-api.js

# To make actual API calls, edit the script and uncomment testSingleFetch()
```

### Manual Testing
```bash
# Check service status (no API usage)
curl "http://localhost:3000/api/social-media/twitter-sync"

# Fetch tweets (uses 1 request)
curl "http://localhost:3000/api/social-media/twitter-fetch?userId=2455740283&count=5"

# Dry run weekly sync (no API usage)
node scripts/cron/weekly-twitter-sync.js --dry-run
```

## 📋 Weekly Sync Process

### Automatic Sync
The weekly sync script will:
1. Check current usage against weekly/monthly limits
2. Find analysts who haven't been synced recently
3. Process up to 10 analysts (configurable)
4. Fetch 10 tweets per analyst
5. Store tweets in the database
6. Update analyst sync timestamps
7. Log all activity

### Manual Sync
```bash
# Dry run to see what would happen
node scripts/cron/weekly-twitter-sync.js --dry-run

# Run with custom analyst limit
node scripts/cron/weekly-twitter-sync.js --max-analysts=5

# Live run
node scripts/cron/weekly-twitter-sync.js
```

## ⚠️ Usage Warnings

The system will warn you when:
- **80% of monthly limit used** (400+ requests)
- **Daily safe limit exceeded** (16+ requests in one day)
- **Weekly budget exceeded** (115+ requests in one week)
- **Projected monthly usage > 500** (based on current pace)

## 🔧 Configuration

### Adjusting Limits
Edit these values in the usage tracker:

```typescript
// src/lib/social-crawler/twitter-usage-tracker.ts
private readonly MONTHLY_LIMIT = 500
private readonly DAILY_SAFE_LIMIT = 16
private readonly WEEKLY_BUDGET = 115
```

### Weekly Sync Settings
```javascript
// scripts/cron/weekly-twitter-sync.js
const WEEKLY_BUDGET = 100
const TWEETS_PER_ANALYST = 10
const MAX_ANALYSTS_PER_WEEK = 10
```

## 📊 Expected Monthly Usage

With conservative settings:
- **Weekly syncs**: ~40 requests/month (10 requests × 4 weeks)
- **Manual testing**: ~60 requests/month (2 requests × 30 days)
- **Buffer for issues**: ~400 requests remaining
- **Total**: ~100 requests/month (well under 500 limit)

## 🚨 Emergency Procedures

### If You Hit the Limit
1. Stop all automated syncs
2. Check usage dashboard for details
3. Wait until next month for reset
4. Consider upgrading RapidAPI plan

### Reset Usage Data
```bash
# Only do this at the start of a new month
curl -X POST http://localhost:3000/api/social-media/twitter-usage \
  -H "Content-Type: application/json" \
  -d '{"action":"reset","confirmation":"RESET_TWITTER_USAGE"}'
```

## 🎯 Best Practices

1. **Monitor Daily**: Check usage dashboard every few days
2. **Batch Operations**: Use weekly sync instead of individual fetches
3. **Test Conservatively**: Use dry-run mode for testing
4. **Plan Ahead**: Don't use more than 100 requests in the first week
5. **Emergency Reserve**: Keep 100+ requests for urgent needs
6. **Documentation**: Log all manual API usage

## 📞 Support

If you need to increase usage:
1. Upgrade your RapidAPI plan
2. Update the `MONTHLY_LIMIT` constant
3. Adjust daily/weekly budgets proportionally
4. Test with higher limits

## 🔍 Troubleshooting

### Common Issues

**"API usage limit reached"**
- Check usage dashboard
- Wait until next day/week/month
- Use dry-run mode for testing

**"Usage tracking unavailable"**
- Check database connection
- Verify `twitter_api_usage` table exists
- Check Supabase permissions

**Weekly sync not running**
- Verify cron job setup
- Check environment variables
- Review sync logs

**High usage warnings**
- Reduce manual testing
- Skip weekly sync if near limit
- Wait for month reset

This setup ensures you stay well within the 500 request limit while still getting valuable Twitter data for your analysts!

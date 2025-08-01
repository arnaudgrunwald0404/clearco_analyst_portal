# Social Media Monitoring System Setup

## Overview

The social media monitoring system has been successfully set up to run automatically every hour and track what the analyst community is discussing. The system includes:

- **Hourly automated monitoring** via cron job
- **Timestamped statistics** stored in the database
- **Real-time logging** for monitoring and debugging
- **API endpoints** for retrieving historical monitoring data
- **Twitter and LinkedIn integration** (requires API keys)

## ✅ What's Already Set Up

### 1. Cron Job Configuration
- ✅ Cron job runs every hour at minute 0 (1:00, 2:00, 3:00, etc.)
- ✅ Logs are written to `/logs/social-cron.log`
- ✅ Error logs are written to `/logs/social-cron-error.log`
- ✅ Automatic timestamping of all activities

### 2. Database Schema
- ✅ `monitoring_stats` table created for tracking crawler runs
- ✅ Timestamped statistics for each monitoring session
- ✅ Error tracking and reporting

### 3. Monitoring Scripts
- ✅ Hourly monitoring script (`src/scripts/hourly-social-monitor.ts`)
- ✅ Enhanced logging and statistics collection
- ✅ Database storage of monitoring metrics

### 4. Management Tools
- ✅ Setup script: `scripts/setup-social-cron.sh`
- ✅ Monitoring dashboard: `scripts/monitor-social-logs.sh`
- ✅ API endpoint: `/api/monitoring-stats`

## ⚠️ What Needs to be Configured

### 1. API Keys Required

To enable actual social media crawling, you need to configure API keys in the `.env` file:

#### Twitter API Setup
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app or use existing one
3. Generate a Bearer Token
4. Add to `.env`:
```bash
TWITTER_BEARER_TOKEN=your-actual-twitter-bearer-token-here
```

#### LinkedIn API Setup
1. Go to [LinkedIn Developer Portal](https://developer.linkedin.com/)
2. Create a new app
3. Request access to LinkedIn Marketing API (needed for post access)
4. Generate an Access Token
5. Add to `.env`:
```bash
LINKEDIN_ACCESS_TOKEN=your-actual-linkedin-access-token-here
```

### 2. Analyst Data
Currently there are 0 priority analysts in the system. You'll need to:
- Add analysts to the database with their social media handles
- Set analyst influence levels (VERY_HIGH, HIGH, etc.)
- Configure Twitter and LinkedIn handles for each analyst

## 🚀 How to Use the System

### Run Once Manually
```bash
cd /Users/arnaudgrunwald/AGcodework/analyst-portal
npm run social:hourly
```

### Monitor the System
```bash
# View dashboard with recent stats
./scripts/monitor-social-logs.sh

# View cron job status
crontab -l

# Tail logs live
tail -f logs/social-cron.log
```

### View Historical Data
```bash
# Last 24 hours of monitoring stats
curl "http://localhost:3000/api/monitoring-stats?hours=24"

# Only hourly monitoring runs
curl "http://localhost:3000/api/monitoring-stats?type=HOURLY_MONITORING"
```

### Database Queries
```bash
# View recent monitoring stats
sqlite3 prisma/dev.db "SELECT datetime(timestamp, 'localtime'), type, analysts_checked, posts_found, posts_stored FROM monitoring_stats ORDER BY timestamp DESC LIMIT 10;"

# View today's statistics
sqlite3 prisma/dev.db "SELECT * FROM monitoring_stats WHERE date(timestamp) = date('now');"
```

## 📊 Monitoring Statistics

Each hourly run collects and stores:

- **Timestamp**: Exact time of the monitoring run
- **Analysts Checked**: Number of analysts processed
- **Posts Found**: Total posts discovered
- **Posts Stored**: Posts that met relevance criteria
- **New Mentions**: Posts mentioning your company
- **High Relevance Posts**: Posts with relevance score ≥ 80
- **Error Count**: Number of errors encountered
- **Duration**: Time taken for the monitoring run

## 🔧 Management Commands

### View Current Cron Jobs
```bash
crontab -l
```

### Remove Social Media Cron Job
```bash
crontab -l | grep -v 'social:hourly' | crontab -
```

### Reinstall Cron Job
```bash
./scripts/setup-social-cron.sh
```

### View Logs
```bash
# Main logs
tail -f logs/social-cron.log

# Error logs
tail -f logs/social-cron-error.log

# Dashboard view
./scripts/monitor-social-logs.sh
```

## 📈 API Endpoints

### GET /api/monitoring-stats
Retrieve monitoring statistics with timestamps

**Parameters:**
- `hours` - Number of hours to look back (default: 24)
- `type` - Filter by monitoring type (optional)
- `limit` - Maximum records to return (default: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": [...],
    "summary": {
      "total_runs": 24,
      "total_posts_found": 156,
      "total_posts_stored": 42,
      "avg_posts_per_run": 6.5
    },
    "hourlyBreakdown": [...]
  }
}
```

### POST /api/monitoring-stats
Store monitoring statistics (used internally by scripts)

## 🎯 Next Steps

1. **Configure API Keys**: Add real Twitter and LinkedIn API credentials to `.env`
2. **Add Analyst Data**: Populate the database with analyst information and social handles
3. **Test the System**: Run manual crawls to verify everything works
4. **Monitor Results**: Use the dashboard to track system performance
5. **Set Up Alerts**: Configure notifications for important findings

## 🔍 Troubleshooting

### No Posts Found
- Check if API keys are configured correctly
- Verify analyst social handles are valid
- Check if analysts have recent posts

### Cron Job Not Running
- Verify cron job is installed: `crontab -l`
- Check system logs: `grep CRON /var/log/system.log`
- Test manual execution: `npm run social:hourly`

### API Errors
- Twitter: Verify Bearer Token has read permissions
- LinkedIn: Ensure app has necessary scopes and permissions
- Check rate limits aren't exceeded

The system is now ready to provide continuous monitoring of analyst social media activity with full timestamp tracking and historical data storage.

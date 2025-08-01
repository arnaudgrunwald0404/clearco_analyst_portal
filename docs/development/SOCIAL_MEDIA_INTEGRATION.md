# Social Media Analysis Integration

## 🎯 Overview

Your existing social media analysis tool has been successfully integrated into the analyst portal with enhanced dashboard visibility, improved analyst-level views, and automated hourly monitoring.

## ✅ What's Already Built (Your Existing System)

- ✅ **Comprehensive Social Media Crawler** - LinkedIn & Twitter scraping
- ✅ **AI-Powered Content Analysis** - Relevance scoring, sentiment analysis, theme extraction
- ✅ **Database Schema** - Complete SocialPost model with relationships
- ✅ **Rate-Limited Scraping** - Respectful API usage with intelligent delays
- ✅ **Duplicate Prevention** - Smart filtering to avoid storing duplicates
- ✅ **Manual Triggers** - API endpoints for on-demand crawling

## 🆕 New Integration Features Added

### 1. Dashboard Social Media Activity Widget
**Location:** Main dashboard (`/src/components/social-media-activity.tsx`)

**Features:**
- 📊 **Quick Stats**: Posts today, weekly totals, avg relevance score, trending themes
- 🔍 **Recent Posts Feed**: Latest 10 posts with analyst attribution
- 🏷️ **Advanced Tagging**: Theme tags, sentiment indicators, relevance scores
- ⭐ **Company Mentions**: Highlighted posts that mention your company
- 🔗 **Direct Links**: Click-through to original posts and analyst profiles

**API Endpoint:** `/api/social-media/recent-activity`

### 2. Enhanced Analyst Social Media Tab
**Location:** Analyst drawer social media tab

**Improvements:**
- 🎨 **Better Visual Design**: Cards with platform icons, engagement metrics
- 🏷️ **Theme Analysis**: AI-extracted themes displayed as colored tags
- 📊 **Sentiment Analysis**: Visual sentiment indicators (positive/negative/neutral)
- ⚡ **Relevance Scoring**: Shows how relevant each post is to HR tech
- 📈 **Activity Summary**: Statistics showing recent posts, mentions, avg relevance
- 🔄 **Real-time Refresh**: Manual refresh button for latest data

### 3. Hourly Monitoring System
**Location:** `/src/scripts/hourly-social-monitor.ts`

**Features:**
- ⏰ **Automated Hourly Checks**: Runs every hour via cron job
- 🎯 **Priority Targeting**: Focuses on high-influence analysts and recent activity
- 🚨 **Smart Alerting**: Notifies on company mentions, high-relevance posts
- 📊 **Monitoring Stats**: Tracks performance and error rates
- 🔧 **Error Handling**: Graceful failure with detailed logging

## 🚀 Setup Instructions

### 1. Run Database Migration (Optional - New Schema)
If you want enhanced analysis features:
```bash
# Apply the new social media analysis schema
npx supabase migration up
# OR manually run the SQL in supabase/migrations/003_social_media_analysis.sql
```

### 2. Set Up Hourly Cron Job
Add to your server's crontab:
```bash
# Edit crontab
crontab -e

# Add this line for hourly monitoring (runs at the top of every hour)
0 * * * * cd /path/to/analyst-portal && npm run social:hourly >> /var/log/social-hourly.log 2>&1

# Optional: Daily comprehensive crawl (runs at 2 AM)
0 2 * * * cd /path/to/analyst-portal && npm run social:daily >> /var/log/social-daily.log 2>&1
```

### 3. Environment Variables
Ensure these are set in your `.env.local`:
```env
# Already required for your existing system
TWITTER_BEARER_TOKEN="your_bearer_token"
LINKEDIN_ACCESS_TOKEN="your_access_token"

# Optional: For monitoring alerts
ALERT_WEBHOOK_URL="your_slack_webhook_or_email_endpoint"
```

## 🎛️ Usage

### Manual Commands
```bash
# Run hourly monitoring manually
npm run social:hourly

# Run daily comprehensive crawl
npm run social:daily

# Start development server with new components
npm run dev
```

### API Endpoints
- `GET /api/social-media/recent-activity` - Dashboard activity feed
- `GET /api/analysts/[id]/social-posts` - Analyst-specific posts (existing)
- `POST /api/social-crawler` - Manual crawl triggers (existing)

## 📊 Dashboard Integration

The social media activity widget appears on your main dashboard alongside:
- Total Analysts stats
- Recent Activity feed
- **NEW:** Social Media Activity (third column)

**Key Features:**
- Shows latest posts from all analysts
- Highlights company mentions with special badges
- Color-coded by platform (LinkedIn blue, Twitter light blue)
- Theme tags show AI-detected topics
- Relevance scores help prioritize attention

## 🔍 Analyst-Level View

Enhanced social media tab in analyst drawer shows:
- **Better Layout**: Clean cards with platform branding
- **Rich Metadata**: Engagement counts, publication dates, analysis timestamps
- **AI Analysis**: Theme extraction, sentiment analysis, relevance scoring
- **Company Mentions**: Special highlighting when analysts mention your company
- **Activity Summary**: Overview stats for quick insights

## ⚡ Automated Monitoring

The hourly monitoring system:
- **Smart Targeting**: Focuses on high-influence analysts and recent activity
- **Alert System**: Console alerts (TODO: integrate with Slack/email)
- **Performance Tracking**: Monitors success rates and errors
- **Graceful Degradation**: Continues working even if some sources fail

## 🎯 Priority Detection

The system automatically prioritizes:
1. **Very High & High influence analysts**
2. **Analysts with recent social media activity** 
3. **Analysts with upcoming briefings**
4. **Analysts who frequently mention your company**

## 📈 Monitoring & Alerts

Current alerting triggers:
- 🚨 **New company mentions** found
- 📈 **High-relevance posts** (multiple posts >80% relevance)
- ⚠️ **High error rates** (>30% failures)
- 💥 **Critical system errors**

## 🔮 Future Enhancements Ready

Your existing system already supports:
- **Additional platforms** (Medium, YouTube, blogs)
- **Advanced AI analysis** with GPT integration
- **Real-time webhooks** for instant notifications
- **Custom filtering rules** per analyst

## 📝 Configuration

### Relevance Threshold
Adjust in `/src/lib/social-crawler/config.ts`:
```typescript
export const MIN_RELEVANCE_SCORE = 30 // 0-100
```

### Monitoring Frequency
The hourly script can be adjusted to run more/less frequently by modifying the cron schedule.

### Alert Thresholds
Modify alert conditions in `hourly-social-monitor.ts`:
```typescript
// Alert on company mentions (currently: any new mentions)
if (stats.newMentions > 0) { ... }

// Alert on high-relevance posts (currently: >2 posts)
if (stats.highRelevancePosts > 2) { ... }
```

## 🎉 Summary

Your social media analysis tool is now fully integrated with:
- **Enhanced dashboard visibility** showing recent activity highlights
- **Improved analyst-level views** with rich tagging and analysis
- **Automated hourly monitoring** for timely alerts and insights
- **Smart prioritization** focusing on your most important analysts
- **Comprehensive error handling** and monitoring

The system builds on your existing robust foundation while adding the visibility and automation you requested! 🚀

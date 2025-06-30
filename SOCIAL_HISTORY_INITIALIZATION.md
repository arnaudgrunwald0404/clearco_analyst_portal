# Social Media History Initialization Guide

This guide walks you through setting up and running a one-time initialization to build a 7-day social media history for industry analysts.

## Overview

The social media history initialization script performs a comprehensive crawl of the past 7 days to build an initial dataset of analyst social media activity. This provides a foundation for ongoing monitoring and analysis.

## Features

- ✅ **7-Day Historical Crawl**: Retrieves posts from the past week for all analysts
- ✅ **Multi-Platform Support**: Supports Twitter and LinkedIn (with API keys)
- ✅ **Intelligent Analysis**: AI-powered content analysis for relevance and themes
- ✅ **Duplicate Prevention**: Safely skips posts that already exist in the database
- ✅ **Comprehensive Reporting**: Detailed statistics and progress tracking
- ✅ **Safe Re-runs**: Can be run multiple times without creating duplicates

## Prerequisites

### 1. Database Setup
Ensure your database is set up and accessible:
```bash
# Check database connection
npm run db:generate
```

### 2. API Keys (Optional but Recommended)

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
3. Request access to LinkedIn Marketing API
4. Generate an Access Token
5. Add to `.env`:
```bash
LINKEDIN_ACCESS_TOKEN=your-actual-linkedin-access-token-here
```

### 3. Test Data
Add some sample analysts with social handles for testing:
```bash
npm run add-sample-analysts
```

This adds 5 industry analysts with real Twitter handles for testing purposes.

## Running the Initialization

### Step 1: Check Current State
```bash
# Check how many analysts you have
npx tsx scripts/check-analysts.js
```

### Step 2: Add Sample Data (if needed)
```bash
# Add sample analysts with Twitter handles
npm run add-sample-analysts
```

### Step 3: Run the Initialization
```bash
# Start the 7-day history build
npm run social:init-history
```

## What the Script Does

### 1. Environment Check
- ✅ Validates required environment variables
- ✅ Tests database connection
- ✅ Reports API key configuration status

### 2. Analyst Discovery
- 📊 Counts total analysts in database
- 🔗 Identifies analysts with social media handles
- 📱 Shows platform distribution (Twitter, LinkedIn)

### 3. Historical Crawling
- 📅 Crawls posts from the past 7 days
- 🔍 Processes each analyst's social handles
- ⏳ Implements rate limiting to respect API limits
- 🔄 Provides real-time progress updates

### 4. Content Analysis
- 🤖 AI-powered relevance scoring
- 🏷️ Theme extraction and categorization
- 😊 Sentiment analysis (positive, negative, neutral)
- 📈 Engagement tracking

### 5. Data Storage
- 💾 Stores only relevant, high-quality posts
- ⏭️ Skips duplicates automatically
- 🚫 Filters out irrelevant content
- 📝 Records processing statistics

## Sample Output

```
🚀 Starting One-Time Social Media History Initialization
=====================================

⏰ Started at: 2025-06-29T13:14:45.000Z
📅 Building history for past 7 days

🔍 Checking prerequisites...
   📱 Twitter API: ✅ Configured
   📱 LinkedIn API: ⚠️  Not configured
   💾 Database: ✅ Connected
✅ Prerequisites check passed

🔧 Initializing social media crawler...
📊 Total analysts in database: 5
🔗 Analysts with social handles: 5

📱 Platform Distribution:
   twitter: 5 analysts

📅 Crawling posts since: 2025-06-22T13:14:45.000Z

🔄 Processing 5 analysts...

[1/5] Processing: Josh Bersin
   🔍 Crawling twitter: joshbersin
   ✅ Found: 12, Stored: 8, Skipped: 4
   ⏳ Waiting 5 seconds before next analyst...

[2/5] Processing: Jason Averbook
   🔍 Crawling twitter: jasonaverbook
   ✅ Found: 8, Stored: 5, Skipped: 3
   ...

📊 INITIALIZATION REPORT
========================

📈 Overall Statistics:
   📋 Total Analysts: 5
   🔗 Analysts with Social Handles: 5
   📱 Platforms Processed: twitter
   📄 Total Posts Found: 42
   💾 Total Posts Stored: 28
   ⏭️  Duplicates Skipped: 0
   🚫 Irrelevant Posts Skipped: 14
   ❌ Failed Analysts: 0
   ✅ Success Rate: 100%
   📊 Average Relevance Score: 67
   📈 Storage Rate: 67% (relevant posts)
   ⏱️  Processing Time: 45 seconds

🔥 Top Themes Discovered:
   1. HR Technology (12 posts)
   2. Future of Work (8 posts)
   3. Employee Experience (6 posts)
   4. Digital Transformation (4 posts)
   5. Talent Management (3 posts)

💡 Next Steps:
   - Review the stored posts in your application
   - Set up hourly monitoring: npm run social:hourly
   - Configure alerts for important analyst activity
   - Analyze trending themes and engagement patterns

✅ Social media history initialization completed successfully!
```

## Post-Initialization

### 1. Review Results
Check the stored posts in your application:
- Navigate to the social media section
- Review the discovered themes and sentiment analysis
- Examine high-engagement posts

### 2. Set Up Ongoing Monitoring
```bash
# Set up hourly monitoring (if not already configured)
npm run social:hourly
```

### 3. Monitor System Health
```bash
# Check monitoring statistics
curl "http://localhost:3000/api/monitoring-stats?hours=24"
```

## Troubleshooting

### No Analysts Found
```
⚠️  No analysts found in database. Please add analysts first.
💡 You can use: npm run add-sample-analysts
```
**Solution**: Add analysts to your database using the sample script or manually.

### No Social Handles
```
⚠️  No analysts have social media handles configured.
💡 Add Twitter handles to analyst profiles to enable crawling.
```
**Solution**: Update analyst profiles to include Twitter or LinkedIn handles.

### API Rate Limits
```
❌ Failed: Twitter API error: 429
```
**Solution**: The script includes automatic rate limiting, but if you hit limits:
- Wait for the rate limit window to reset (15 minutes for Twitter)
- Re-run the script (it will skip already processed posts)

### Missing API Keys
```
⚠️  No social media API tokens configured. Crawling will be limited.
```
**Solution**: Add API keys to your `.env` file as described in the prerequisites.

## Rate Limiting

The script implements respectful rate limiting:
- **3 seconds** between social handle requests
- **5 seconds** between analysts
- Automatic retry with exponential backoff
- Respects platform API limits

## Data Quality

The script ensures high-quality data through:
- **Relevance scoring**: Only stores posts with sufficient relevance (threshold: 30/100)
- **Duplicate detection**: Prevents storing the same post multiple times
- **Theme extraction**: Categorizes posts into industry-relevant themes
- **Sentiment analysis**: Determines positive, negative, or neutral sentiment

## Storage Efficiency

- Only relevant posts are stored (typically 60-80% of discovered posts)
- Metadata is stored separately for analytics
- Processing statistics are tracked for monitoring

## Next Steps

1. **Ongoing Monitoring**: Set up the hourly crawler for continuous monitoring
2. **Alert Configuration**: Configure alerts for high-impact analyst activity
3. **Theme Analysis**: Use the trending themes data for competitive intelligence
4. **Dashboard Integration**: Build dashboards around the collected data

The initialization provides a solid foundation for analyst social media monitoring and intelligence gathering.

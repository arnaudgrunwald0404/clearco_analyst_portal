# Publication Discovery Setup - Quick Start Guide

## Overview

This guide will help you set up the publication discovery system to automatically find analyst publications daily using Google Search API.

## Prerequisites

- Google account
- Access to Google Cloud Console
- This Analyst Portal project

## Step 1: Get Google Search API (Required)

Follow the detailed instructions in `GOOGLE_SEARCH_API_SETUP.md` or these quick steps:

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Create/select a project**
3. **Enable Custom Search API**:
   - APIs & Services > Library > Search "Custom Search API" > Enable
4. **Create API Key**:
   - APIs & Services > Credentials > Create Credentials > API Key
5. **Create Custom Search Engine**:
   - Go to [Google Custom Search](https://cse.google.com/cse/)
   - Create new search engine
   - Set to search entire web (`*`)
   - Get your Search Engine ID

## Step 2: Configure Environment Variables

Add to your `.env.local` file:

```bash
# Google Search API Configuration
GOOGLE_SEARCH_API_KEY=your_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
```

## Step 3: Test the Publication Discovery

Run the publication discovery script manually to test:

```bash
# Run publication discovery once
npm run discover:daily
```

You should see output like:
```
🔍 Starting daily publication discovery job...
📊 Found X active analysts to process
🔍 Processing John Doe...
   🔎 Searching for: John Doe
   📄 Found X potential publications
   ✅ X results passed analysis
   💾 Stored X significant publications
```

## Step 4: Set Up Daily Cron Job

Run the automated setup script:

```bash
# Set up daily cron job (runs at 2:00 AM daily)
./setup-cron.sh
```

This will:
- Create a wrapper script for the cron job
- Set up logging
- Install a daily cron job at 2:00 AM
- Provide management commands

## Step 5: Verify Setup

Check that everything is working:

```bash
# View installed cron jobs
crontab -l

# Test the cron wrapper manually
./cron-publication-discovery.sh

# View logs
tail -f logs/publication-discovery.log
```

## Management Commands

### Run Publication Discovery Manually
```bash
npm run discover:daily
```

### View Cron Jobs
```bash
crontab -l
```

### Edit Cron Schedule
```bash
crontab -e
```

### Remove Cron Job
```bash
crontab -l | grep -v 'publication-discovery' | crontab -
```

### View Logs
```bash
# View recent logs
tail -20 logs/publication-discovery.log

# Follow logs in real-time
tail -f logs/publication-discovery.log

# View all logs
cat logs/publication-discovery.log
```

## What the System Does

### Daily Discovery Process:
1. **Fetches all active analysts** from the database
2. **Generates search queries** for each analyst:
   - `"Analyst Name" Magic Quadrant 2024`
   - `"Analyst Name" research report 2024`
   - `site:linkedin.com "Analyst Name" "research shows"`
   - Domain-specific searches (gartner.com, forrester.com, etc.)
3. **Searches across multiple sources**:
   - Google Search API
   - Bing Search API (if configured)
   - LinkedIn-specific searches
4. **Analyzes results** for relevance and significance
5. **Stores significant publications** in the database
6. **Logs statistics** and results

### Rate Limiting:
- Respects API rate limits (10 queries/second max)
- Adds delays between analysts (5 seconds)
- Adds delays between queries (2 seconds)
- Daily quota management

### Content Discovery:
- Research reports and Magic Quadrants
- Blog posts and articles
- Webinars and podcasts
- LinkedIn posts and updates
- Whitepapers and analysis

## Monitoring and Maintenance

### Daily Statistics
The system logs detailed statistics:
- Total analysts processed
- Searches performed
- Publications found and stored
- Success/failure rates
- Top sources discovered

### Error Handling
- Graceful failure for individual analysts
- Continues processing if one search fails
- Logs all errors for debugging
- Sends alerts for high failure rates

### Storage
Publications are stored in the `Publication` table with:
- Analyst association
- Publication metadata
- Relevance and significance scores
- Publication type classification

## Troubleshooting

### Common Issues:

1. **No publications found**:
   - Check API keys are correct
   - Verify search engine ID
   - Ensure you have active analysts in database

2. **API quota exceeded**:
   - You've hit 100 free searches/day limit
   - Consider upgrading to paid tier
   - Monitor usage in Google Cloud Console

3. **Cron job not running**:
   - Check cron service is running: `sudo service cron status`
   - Verify cron job exists: `crontab -l`
   - Check logs for errors: `tail logs/publication-discovery.log`

4. **Permission errors**:
   - Ensure scripts are executable: `chmod +x *.sh`
   - Check file permissions on log directory

### Getting Help:

- **API Issues**: See `GOOGLE_SEARCH_API_SETUP.md`
- **Cron Issues**: Check system cron logs: `tail /var/log/cron`
- **Application Logs**: `tail logs/publication-discovery.log`

## Cost Considerations

### Google Search API Pricing:
- **Free**: 100 queries/day
- **Paid**: $5 per 1,000 queries

### Estimated Usage:
- ~15 queries per analyst
- 87 analysts = ~1,305 queries/day
- Daily cost: ~$6.50 (after free tier)
- Monthly cost: ~$195

### Cost Optimization:
- Reduce search queries per analyst
- Filter by high-influence analysts only
- Implement smart caching
- Use free tier for testing

## Next Steps

After setup, consider:
1. **Configure Bing Search API** as backup
2. **Set up email/Slack alerts** for failures
3. **Create publication analytics dashboard**
4. **Implement AI-powered content analysis**
5. **Add automated quality scoring**

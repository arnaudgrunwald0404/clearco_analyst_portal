# Social Media Crawler System

The Social Media Crawler is an automated system that tracks and analyzes social media posts from industry analysts on Twitter/X and LinkedIn. It provides intelligent content analysis, tagging, and storage for building comprehensive analyst intelligence.

## 🚀 Features

- **Multi-Platform Support**: Crawls both Twitter/X and LinkedIn
- **Intelligent Analysis**: AI-powered content analysis for relevance, sentiment, and themes
- **Smart Filtering**: Only stores relevant posts based on configurable relevance scores
- **Theme Extraction**: Automatically categorizes posts into HR/Tech industry themes
- **Sentiment Analysis**: Determines positive, negative, or neutral sentiment
- **Rate Limiting**: Respects API rate limits with intelligent delays
- **Duplicate Detection**: Prevents storing duplicate posts
- **Comprehensive Logging**: Detailed logging for monitoring and debugging

## 🏗️ Architecture

### Core Components

1. **Crawler Engine** (`src/lib/social-crawler/crawler.ts`)
   - Main orchestrator for all crawling operations
   - Manages multiple platform crawlers
   - Handles job scheduling and monitoring

2. **Platform Crawlers** (`src/lib/social-crawler/platforms/`)
   - `TwitterCrawler`: Twitter/X API v2 integration
   - `LinkedInCrawler`: LinkedIn API integration
   - `BasePlatformCrawler`: Abstract base class for platform implementations

3. **Content Analyzer** (`src/lib/social-crawler/analyzer.ts`)
   - Analyzes post content for relevance and sentiment
   - Extracts themes and key entities
   - Calculates relevance scores

4. **Configuration** (`src/lib/social-crawler/config.ts`)
   - Industry keywords and themes
   - Rate limiting settings
   - Relevance thresholds

## 🛠️ Setup

### 1. API Credentials

#### Twitter/X API
1. Create a Twitter Developer account at https://developer.twitter.com/
2. Create a new app and generate a Bearer Token
3. Add the token to your environment variables:
   ```env
   TWITTER_BEARER_TOKEN="your_bearer_token_here"
   ```

#### LinkedIn API
1. Create a LinkedIn Developer account at https://www.linkedin.com/developers/
2. Create a new app with the required permissions
3. Generate an access token
4. Add the token to your environment variables:
   ```env
   LINKEDIN_ACCESS_TOKEN="your_access_token_here"
   ```

### 2. Database Setup

The crawler uses the existing Prisma schema. The `SocialPost` model is already defined in `prisma/schema.prisma`.

### 3. Environment Configuration

Copy the example environment file:
```bash
cp .env.crawler.example .env.local
```

Fill in your API credentials and configuration options.

## 🔧 Usage

### Manual Crawling

#### Start Daily Crawl (All Analysts)
```bash
# Via API
curl -X POST http://localhost:3000/api/social-crawler \
  -H "Content-Type: application/json" \
  -d '{"action": "start_daily_crawl"}'

# Via Script
npm run crawl:daily
# or
node src/scripts/daily-crawler.ts
```

#### Crawl Specific Analyst
```bash
curl -X POST http://localhost:3000/api/social-crawler \
  -H "Content-Type: application/json" \
  -d '{
    "action": "crawl_analyst",
    "analystId": "analyst_id_here",
    "platform": "twitter",
    "handle": "@username"
  }'
```

#### Add Social Handle for Analyst
```bash
curl -X POST http://localhost:3000/api/social-crawler \
  -H "Content-Type: application/json" \
  -d '{
    "action": "add_social_handle",
    "analystId": "analyst_id_here",
    "platform": "linkedin",
    "handle": "linkedin-vanity-name"
  }'
```

### Automated Crawling

Set up a daily cron job to run the crawler automatically:

```bash
# Edit crontab
crontab -e

# Add this line to run daily at 2 AM
0 2 * * * cd /path/to/analyst-portal && npm run crawl:daily >> /var/log/social-crawler.log 2>&1
```

### Querying Posts

#### Get Analyst Posts
```bash
curl "http://localhost:3000/api/social-crawler?analystId=analyst_id&platform=twitter&limit=20"
```

#### Get Posts by Theme
```bash
curl "http://localhost:3000/api/social-crawler?analystId=analyst_id&themes=AI%20and%20Automation,Future%20of%20Work"
```

#### Get Posts by Sentiment
```bash
curl "http://localhost:3000/api/social-crawler?analystId=analyst_id&sentiment=POSITIVE"
```

#### Get Trending Themes
```bash
curl -X POST http://localhost:3000/api/social-crawler \
  -H "Content-Type: application/json" \
  -d '{"action": "get_trending_themes"}'
```

## 📊 Analytics & Insights

### Content Analysis Features

1. **Relevance Scoring** (0-100)
   - Industry keyword matching
   - Company/product mentions
   - Engagement metrics
   - Content length and quality

2. **Theme Extraction**
   - AI and Automation
   - Employee Experience
   - Talent Acquisition
   - Future of Work
   - Analytics and Insights
   - Diversity and Inclusion
   - Performance Management
   - Learning and Development
   - HR Technology Platforms
   - Digital Transformation
   - Compliance and Legal
   - Workplace Culture
   - Remote and Hybrid Work
   - Data Privacy and Security
   - Compensation and Benefits

3. **Sentiment Analysis**
   - POSITIVE: Enthusiastic, supportive content
   - NEGATIVE: Critical, concerning content  
   - NEUTRAL: Informational, balanced content

4. **Entity Extraction**
   - Company mentions (Workday, SAP, etc.)
   - Technology references (AI, ML, Cloud, etc.)
   - Industry terms and concepts

## 🔧 Configuration

### Relevance Filtering

Adjust the minimum relevance score in `config.ts`:
```typescript
export const MIN_RELEVANCE_SCORE = 30 // 0-100
```

### Rate Limiting

Configure API rate limits:
```typescript
export const PLATFORM_CONFIGS = {
  twitter: {
    rateLimit: 180, // requests per 15-minute window
    searchDelay: 5000, // 5 seconds between requests
  },
  linkedin: {
    rateLimit: 100, // requests per hour
    searchDelay: 10000, // 10 seconds between requests
  }
}
```

### Industry Keywords

Add or modify industry keywords in `config.ts`:
```typescript
export const INDUSTRY_KEYWORDS = [
  'hr tech', 'hrtech', 'human resources',
  // ... add more keywords
]
```

## 📈 Monitoring

### Logging

The crawler provides comprehensive logging:
- Crawl statistics and progress
- Error messages with stack traces
- API rate limiting notifications
- Post analysis results

### Alerts

Configure alerting for:
- High failure rates (>50% failed jobs)
- Critical errors that stop the crawler
- API rate limit violations
- Database connection issues

Example alerting integration points in `daily-crawler.ts`:
```typescript
await sendFailureAlert(stats)
await sendCriticalErrorAlert(error)
```

## 🚦 Rate Limiting & Best Practices

### Twitter/X
- 180 requests per 15-minute window (user context)
- 5-second delays between requests
- Graceful handling of rate limit responses

### LinkedIn
- Conservative 100 requests per hour
- 10-second delays between requests
- Limited to individual user posts (no public search)

### Best Practices
1. Run crawls during off-peak hours (2-4 AM)
2. Monitor API usage and adjust delays as needed
3. Implement exponential backoff for errors
4. Respect platform terms of service
5. Store only relevant, high-quality content

## 🔍 Troubleshooting

### Common Issues

1. **Missing API Tokens**
   ```
   Error: Twitter Bearer Token not configured
   ```
   Solution: Add valid API credentials to environment variables

2. **Rate Limit Errors**
   ```
   Error: Twitter API error: 429
   ```
   Solution: Wait for rate limit reset or increase delays

3. **Invalid Handles**
   ```
   Error: Handle @username not found on twitter
   ```
   Solution: Verify handle exists and is public

4. **Database Connection**
   ```
   Error: Can't reach database server
   ```
   Solution: Check DATABASE_URL and database availability

### Debug Mode

Enable verbose logging by setting:
```env
DEBUG=social-crawler:*
```

## 🔮 Future Enhancements

1. **Additional Platforms**
   - Medium blog posts
   - YouTube comments/descriptions
   - Conference speaking abstracts

2. **Advanced AI Analysis**
   - GPT-powered content summarization
   - Trend prediction algorithms
   - Competitive intelligence insights

3. **Real-time Features**
   - WebSocket notifications for new posts
   - Live sentiment tracking dashboards
   - Instant alerts for high-impact posts

4. **Enhanced Filtering**
   - Machine learning relevance models
   - Custom keyword rules per analyst
   - Industry-specific scoring algorithms

## 📄 License

This social media crawler is part of the Analyst Portal project and follows the same licensing terms.

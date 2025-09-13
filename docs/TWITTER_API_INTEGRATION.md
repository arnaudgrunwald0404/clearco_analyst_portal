# Twitter API Integration

This document describes the new Twitter API integration using RapidAPI's Twitter241 service.

## Overview

The integration provides a complete solution for fetching Twitter posts from specific users and integrating them with the existing social media functionality in the analyst portal.

## Components

### 1. Core Service (`src/lib/social-crawler/rapidapi-twitter.ts`)

The `RapidAPITwitterService` class handles direct communication with the Twitter241 API:

- **Rate limiting**: Enforces 1-second delays between requests
- **Error handling**: Comprehensive error handling and response validation
- **Data transformation**: Converts Twitter API responses to internal format
- **Configuration**: Environment variable support for API keys

### 2. API Endpoints

#### Individual Tweet Fetch (`/api/social-media/twitter-fetch`)

**GET Parameters:**
- `userId` (required): Numeric Twitter user ID
- `count` (optional): Number of tweets to fetch (default: 20, max: 100)
- `store` (optional): Whether to store tweets in database (default: false)
- `analystId` (optional): Associate tweets with specific analyst

**Example:**
```
GET /api/social-media/twitter-fetch?userId=2455740283&count=20&store=true&analystId=analyst-123
```

**POST for Batch Operations:**
```json
{
  "userIds": ["2455740283", "123456789"],
  "count": 20,
  "store": true,
  "analystMapping": {
    "2455740283": "analyst-1",
    "123456789": "analyst-2"
  }
}
```

#### Analyst Integration (`/api/social-media/twitter-sync`)

**POST**: Sync tweets for all analysts with Twitter handles
**GET**: Get Twitter summary for specific analyst

### 3. UI Components

#### TwitterPostsFetcher (`src/components/features/twitter-posts-fetcher.tsx`)

Interactive React component for fetching and displaying Twitter posts:

- Input for Twitter User ID and tweet count
- Real-time fetching with loading states
- Tweet display with engagement metrics
- Option to store tweets in database
- Error handling and user feedback

#### Page (`/twitter-fetch`)

Dedicated page showcasing the Twitter fetcher functionality.

### 4. Integration Service (`src/lib/social-crawler/twitter-integration.ts`)

The `TwitterIntegrationService` provides higher-level functionality:

- Bulk processing of analyst Twitter data
- Database integration for storing tweets
- Analytics and summary generation
- Job tracking and error reporting

## Setup

### 1. Environment Variables

Add your RapidAPI key to your environment:

```bash
RAPIDAPI_TWITTER_KEY=your_rapidapi_key_here
```

### 2. Database Schema

The integration uses the existing `social_media_posts` table. Ensure it has these columns:

- `id`: Tweet ID (string, primary key)
- `content`: Tweet text content
- `platform`: 'TWITTER'
- `url`: Link to the tweet
- `engagement_metrics`: JSON with likes, retweets, replies, quotes
- `published_at`: When the tweet was posted
- `created_at`: When the record was created
- `analyst_id`: Associated analyst ID (optional)
- `user_data`: JSON with user information

## Usage Examples

### 1. Fetch Tweets Programmatically

```javascript
import { rapidApiTwitterService } from '@/lib/social-crawler/rapidapi-twitter'

// Fetch tweets for a user
const result = await rapidApiTwitterService.fetchUserTweets('2455740283', 20)

if (result.success) {
  console.log(`Fetched ${result.data.length} tweets`)
  
  // Transform to internal format
  const tweets = rapidApiTwitterService.transformToInternalFormat(result.data)
}
```

### 2. Use the React Component

```jsx
import TwitterPostsFetcher from '@/components/features/twitter-posts-fetcher'

function MyPage() {
  return (
    <div>
      <h1>Fetch Twitter Posts</h1>
      <TwitterPostsFetcher />
    </div>
  )
}
```

### 3. API Calls

```javascript
// Fetch tweets via API
const response = await fetch('/api/social-media/twitter-fetch?userId=2455740283&count=20')
const result = await response.json()

// Batch fetch
const batchResponse = await fetch('/api/social-media/twitter-fetch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userIds: ['2455740283', '123456789'],
    count: 20,
    store: true
  })
})
```

### 4. Sync All Analysts

```javascript
// Sync tweets for all analysts with Twitter handles
const syncResponse = await fetch('/api/social-media/twitter-sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    maxAnalysts: 10,
    tweetsPerAnalyst: 20
  })
})
```

## Features

### Rate Limiting
- Automatic 1-second delays between requests
- Configurable request intervals
- Request timing tracking

### Error Handling
- Network error recovery
- API error response handling
- Timeout protection (30 seconds)
- Graceful degradation

### Data Storage
- Optional database storage
- Duplicate prevention using upserts
- Engagement metrics tracking
- User data preservation

### Analytics
- Tweet engagement summaries
- Top post identification
- Historical data analysis
- Analyst performance metrics

## Testing

Run the test script to verify functionality:

```bash
node scripts/test-twitter-api.js
```

## Limitations

1. **User ID Requirement**: The API requires numeric Twitter user IDs, not usernames
2. **Rate Limits**: RapidAPI has usage limits based on your subscription
3. **Recent Tweets Only**: The API typically returns recent tweets (last few days/weeks)
4. **Public Tweets Only**: Only public tweets are accessible

## Future Enhancements

1. **Username to User ID Conversion**: Implement Twitter user lookup functionality
2. **Advanced Filtering**: Add content filtering based on relevance and sentiment
3. **Scheduled Syncing**: Implement cron jobs for regular data updates
4. **Analytics Dashboard**: Create comprehensive Twitter analytics views
5. **Webhook Support**: Real-time tweet notifications

## Troubleshooting

### Common Issues

1. **"Twitter API service not properly configured"**
   - Ensure `RAPIDAPI_TWITTER_KEY` is set in environment variables
   - Verify the API key is valid and has sufficient credits

2. **"Username lookup not implemented"**
   - The current implementation requires numeric user IDs
   - Consider implementing user lookup functionality

3. **Rate limiting errors**
   - The service automatically handles rate limiting
   - Consider reducing request frequency for large batches

4. **Database storage failures**
   - Check database connection and table schema
   - Verify the `social_media_posts` table exists and has correct columns

### Debug Mode

Enable debug logging by setting:

```bash
NODE_ENV=development
```

This will show detailed request/response information in the console.

## Support

For issues or questions about the Twitter API integration:

1. Check the console logs for detailed error messages
2. Verify your RapidAPI subscription status
3. Test with the provided test script
4. Review the API documentation at RapidAPI

## API Reference

### RapidAPITwitterService Methods

- `fetchUserTweets(userId, count)`: Fetch tweets for a user
- `transformToInternalFormat(tweets, analystId)`: Convert to internal format
- `isConfigured()`: Check if service is properly set up
- `getStatus()`: Get service configuration status

### TwitterIntegrationService Methods

- `fetchPostsForAllAnalysts(maxAnalysts, tweetsPerAnalyst)`: Bulk analyst processing
- `getAnalystTwitterSummary(analystId, days)`: Get engagement analytics
- `updateAnalystTwitterUserId(analystId, userId)`: Update analyst Twitter mapping

# Google Search API Setup Guide

This guide will walk you through setting up Google Custom Search API for the publication discovery feature in the Analyst Portal.

## Overview

The Google Custom Search API allows you to search the web programmatically. For the analyst portal, this enables automatic discovery of analyst publications, research reports, and other content.

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click **"Create Project"** or select an existing project
4. Enter a project name (e.g., "Analyst Portal Search")
5. Choose your organization (if applicable)
6. Click **"Create"**

## Step 2: Enable the Custom Search API

1. In the Google Cloud Console, make sure your project is selected
2. Navigate to **APIs & Services** > **Library**
3. Search for "Custom Search API"
4. Click on **"Custom Search API"**
5. Click **"Enable"**

## Step 3: Create API Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **"Create Credentials"** > **"API Key"**
3. Copy the generated API key immediately
4. (Optional but recommended) Click on the API key to restrict it:
   - Under "API restrictions", select "Restrict key"
   - Choose "Custom Search API" from the list
   - Add HTTP referrer restrictions if needed
5. Save your changes

## Step 4: Create a Custom Search Engine

1. Go to [Google Custom Search Engine](https://cse.google.com/cse/)
2. Click **"Get started"** or **"New search engine"**
3. Configure your search engine:
   - **Sites to search**: Enter `*` (asterisk) to search the entire web
   - **Language**: Select your preferred language
   - **Name**: Enter a name like "Analyst Portal Search"
4. Click **"Create"**
5. On the next page, click **"Control Panel"**

## Step 5: Configure Search Engine Settings

1. In the Control Panel, go to **"Setup"** > **"Basics"**
2. Under "Details", note your **Search engine ID** (you'll need this)
3. Configure additional settings:
   - **Search the entire web**: Make sure this is enabled
   - **Image search**: Enable if you want image results
   - **Safe search**: Set to appropriate level

## Step 6: Get Your Search Engine ID

1. In the Custom Search Control Panel
2. Go to **"Setup"** > **"Basics"**
3. Copy the **Search engine ID** (looks like: `012345678901234567890:abcdefghijk`)

## Step 7: Test Your Setup

You can test your API setup with a simple curl command:

```bash
curl "https://www.googleapis.com/customsearch/v1?key=YOUR_API_KEY&cx=YOUR_SEARCH_ENGINE_ID&q=test"
```

Replace:
- `YOUR_API_KEY` with your actual API key
- `YOUR_SEARCH_ENGINE_ID` with your search engine ID

## Step 8: Add to Environment Variables

Add the following to your `.env.local` file:

```bash
# Google Search API Configuration
GOOGLE_SEARCH_API_KEY=your_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
```

## Usage Limits and Pricing

### Free Tier
- **100 search queries per day** for free
- No credit card required for free tier

### Paid Usage
- **$5 per 1,000 queries** after free tier
- Up to 10,000 queries per day maximum
- Billing must be enabled on your Google Cloud project

### Rate Limits
- Maximum 10 queries per second
- Daily quota resets at midnight Pacific Time

## Environment Variables Reference

After setup, your `.env.local` should include:

```bash
# Google Search API
GOOGLE_SEARCH_API_KEY=AIzaSyDOCAbC123example
GOOGLE_SEARCH_ENGINE_ID=012345678901234567890:abcdefghijk

# Optional: Bing Search API (alternative/backup)
BING_SEARCH_API_KEY=your_bing_api_key_here
```

## Testing the Publication Discovery

Once configured, test the publication discovery:

```bash
# Run the publication discovery script
npm run discover:daily
```

You should see output like:
```
🔍 Starting daily publication discovery job...
📊 Found X active analysts to process
🔍 Processing John Doe...
   🔎 Searching for: John Doe
   📄 Found X potential publications
```

## Troubleshooting

### Common Issues

1. **"API key not valid"**
   - Verify your API key is correct
   - Check if the Custom Search API is enabled
   - Ensure your API key has proper restrictions

2. **"Custom search element not found"**
   - Verify your Search Engine ID is correct
   - Make sure your Custom Search Engine is active

3. **"Quota exceeded"**
   - You've hit the daily limit of 100 free searches
   - Consider upgrading to paid tier or wait until quota resets

4. **"Invalid search"**
   - Check your search queries aren't empty
   - Verify URL encoding for special characters

### API Response Format

Successful API responses look like:

```json
{
  "kind": "customsearch#search",
  "items": [
    {
      "title": "Publication Title",
      "link": "https://example.com/article",
      "snippet": "Article description...",
      "pagemap": {
        "metatags": [
          {
            "article:published_time": "2024-01-01"
          }
        ]
      }
    }
  ]
}
```

## Security Best Practices

1. **API Key Security**
   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys periodically

2. **Access Restrictions**
   - Restrict API key to specific APIs
   - Add HTTP referrer restrictions for web use
   - Monitor usage in Google Cloud Console

3. **Rate Limiting**
   - The application includes built-in rate limiting
   - Monitor your quota usage
   - Implement exponential backoff for failures

## Advanced Configuration

### Custom Search Features

You can enhance your search engine with:

1. **Site-specific searches**: Add domains like `gartner.com`, `forrester.com`
2. **Refinement labels**: Create categories for different types of content
3. **Synonyms**: Add industry-specific terminology
4. **Promotions**: Boost specific high-quality sources

### Search Query Optimization

The application automatically generates queries like:
- `"Analyst Name" Magic Quadrant 2024`
- `"Analyst Name" research report 2024`
- `site:linkedin.com "Analyst Name" "research shows"`

## Alternative: Bing Search API

If you prefer Bing or want a backup:

1. Go to [Azure Cognitive Services](https://azure.microsoft.com/en-us/services/cognitive-services/bing-web-search-api/)
2. Create a Bing Search resource
3. Get your subscription key
4. Add to environment variables:
   ```bash
   BING_SEARCH_API_KEY=your_bing_api_key_here
   ```

## Support

For issues with:
- **Google API**: Check [Google Custom Search documentation](https://developers.google.com/custom-search/v1/overview)
- **Application code**: Review the search engine implementation in `src/lib/publication-discovery/`
- **Rate limits**: Monitor usage in Google Cloud Console

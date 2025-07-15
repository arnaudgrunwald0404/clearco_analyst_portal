# Profile Picture Search Setup Guide

## Overview

The analyst portal now includes a real profile picture search feature that can find actual photos from the internet and social media instead of generating AI images. This feature searches multiple sources to find professional photos of analysts.

## How It Works

The profile picture search uses a multi-tier approach:

1. **Web Search** (SerpApi) - Searches Google Images for real photos
2. **LinkedIn Simulation** - Simulates finding LinkedIn profile pictures
3. **Stock Photo APIs** - Uses Unsplash and Pexels for professional photos
4. **Professional Avatars** - Fallback to high-quality letter avatars

## API Keys Required

To enable full functionality, you need to add these environment variables to your `.env.local` file:

### 1. SerpApi (Web Search)
```env
SERPAPI_KEY=your_serpapi_key_here
```
- **Cost**: Free tier available (100 searches/month)
- **Sign up**: https://serpapi.com/
- **Purpose**: Searches Google Images for real photos of analysts

### 2. Unsplash API
```env
UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
```
- **Cost**: Free (5000 requests/month)
- **Sign up**: https://unsplash.com/developers
- **Purpose**: High-quality professional stock photos

### 3. Pexels API
```env
PEXELS_API_KEY=your_pexels_api_key_here
```
- **Cost**: Free (200 requests/hour)
- **Sign up**: https://www.pexels.com/api/
- **Purpose**: Professional stock photos as backup

## Setup Instructions

### Step 1: Get SerpApi Key
1. Go to https://serpapi.com/
2. Create a free account
3. Get your API key from the dashboard
4. Add to `.env.local`: `SERPAPI_KEY=your_key_here`

### Step 2: Get Unsplash Access Key
1. Go to https://unsplash.com/developers
2. Create a developer account
3. Create a new application
4. Copy the Access Key
5. Add to `.env.local`: `UNSPLASH_ACCESS_KEY=your_key_here`

### Step 3: Get Pexels API Key
1. Go to https://www.pexels.com/api/
2. Create an account
3. Get your API key
4. Add to `.env.local`: `PEXELS_API_KEY=your_key_here`

### Step 4: Restart Your Development Server
```bash
npm run dev
```

## Testing the Feature

### Manual Testing
1. Open any analyst profile in edit mode
2. Click the "Select Photo" button
3. Wait for search results to load
4. You should see real photos from the internet

### Automated Testing
Run the test script:
```bash
npm run test:profile-pictures
```

This will:
- Select a random analyst from your database
- Search for their profile pictures using the API
- Display the results with confidence scores
- Automatically update their profile with the best result

## Search Strategy

The system uses these search queries in order of priority:

1. `{analystName} {company} headshot`
2. `{analystName} {title} professional photo`
3. `{analystName} {company} linkedin profile`
4. `{analystName} {company} executive photo`

## Results Ranking

Results are ranked by confidence score:
- **90-100%**: High-confidence matches (likely real photos)
- **75-89%**: Medium-confidence matches (professional stock photos)
- **60-74%**: Lower-confidence matches (avatars/fallbacks)

## Fallback Strategy

If no real photos are found, the system falls back to:
1. Professional letter avatars (blue background)
2. Executive-style avatars (green background)

## Rate Limiting

The system includes built-in rate limiting:
- SerpApi: 2 queries per search
- Unsplash: 2 queries per search
- Pexels: 2 queries per search
- Total: Maximum 6 API calls per profile search

## Privacy & Compliance

### GDPR Considerations
- Only searches for publicly available photos
- Respects robots.txt and rate limits
- Logs search activities for audit purposes

### Content Safety
- Images come from reputable sources (Google, Unsplash, Pexels)
- No user-generated content without moderation
- Professional context only

## Troubleshooting

### No Results Found
1. Check API keys are correctly set in `.env.local`
2. Verify the development server is running on port 3001
3. Check browser console for API errors
4. Ensure analyst has a public online presence

### API Errors
1. **SerpApi**: Check API key and remaining quota
2. **Unsplash**: Verify Access Key format
3. **Pexels**: Check API key and rate limits

### Images Not Loading
1. Check CORS policies
2. Verify image URLs are accessible
3. Check network connectivity

## Cost Estimation

### Free Tier Usage
- **SerpApi**: 100 searches/month (free)
- **Unsplash**: 5000 requests/month (free)
- **Pexels**: 200 requests/hour (free)

### Typical Usage
- 10 analysts per day = 300 searches/month
- Estimated cost: $0 (within free tiers)

## Future Enhancements

### Planned Features
1. **LinkedIn API Integration**: Direct access to LinkedIn profile photos
2. **Face Recognition**: Verify photos show the correct person
3. **Image Quality Scoring**: Rank by resolution, lighting, etc.
4. **Bulk Search**: Search all analysts without profile pictures
5. **User Approval Workflow**: Require admin approval before updating

### Advanced APIs to Consider
1. **Google Custom Search API**: More comprehensive image search
2. **Bing Image Search API**: Alternative to Google
3. **LinkedIn Marketing API**: Direct profile access
4. **Twitter API**: Profile picture extraction

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify all API keys are correctly configured
3. Test with the automated test script
4. Check the server logs for detailed error information 
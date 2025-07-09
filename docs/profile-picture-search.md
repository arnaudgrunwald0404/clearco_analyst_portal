# Profile Picture Search Feature

## Overview

The Profile Picture Search feature allows users to automatically search the internet for profile pictures when editing an analyst profile. Instead of manually uploading images or relying on initials/avatars, users can search for and select professional photos of analysts from online sources.

## How It Works

### 1. User Interface

- When editing an analyst profile, users see a "Select Photo" button in the header area
- Clicking this button opens a modal that automatically searches for profile pictures
- The search happens instantly using the analyst's name, company, and title information

### 2. Search Process

The search API (`/api/analysts/search-profile-pictures`) performs the following:

1. **Input Parameters:**
   - `analystName`: Full name of the analyst (required)
   - `company`: Company name (optional)
   - `title`: Job title (optional)

2. **Search Strategy:**
   - Constructs search queries like "John Doe ClearCompany headshot"
   - Uses multiple query variations for better results
   - Prioritizes professional photos and LinkedIn images

3. **Results Processing:**
   - Returns up to 3 picture options
   - Each result includes confidence score, source, and metadata
   - Results are sorted by confidence level

### 3. Picture Selection

- Results are displayed in a 3-column grid layout
- Each option shows:
  - Preview image
  - Source website
  - Confidence percentage
  - Image dimensions
  - "Select This Picture" button

- Users can click any image to select it
- Selected image immediately updates the analyst's profile
- Profile picture replaces initials/default avatar throughout the app

## Current Implementation

### Mock Search (Development)

Currently, the feature uses mock search results for demonstration:

```typescript
const mockResults = [
  {
    url: "https://via.placeholder.com/200x200/4F46E5/FFFFFF?text=JD",
    source: "Generated Avatar",
    confidence: 85,
    title: "John Doe - Professional Avatar"
  },
  // ... more results
]
```

### API Endpoints

- **POST** `/api/analysts/search-profile-pictures`
  - Searches for profile pictures
  - Returns array of picture options with confidence scores

- **PATCH** `/api/analysts/[id]`
  - Updates analyst with selected profile picture URL
  - Saves `profileImageUrl` field

## Production Implementation

### Real Image Search APIs

To implement real image search, replace the mock logic with one of these services:

#### 1. Google Custom Search API
```typescript
const response = await fetch(
  `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${query}&searchType=image&imgType=face`
)
```

#### 2. Bing Image Search API
```typescript
const response = await fetch(
  `https://api.bing.microsoft.com/v7.0/images/search?q=${query}&imageType=Photo&aspect=Square`,
  {
    headers: { 'Ocp-Apim-Subscription-Key': API_KEY }
  }
)
```

#### 3. SerpApi (Google Images)
```typescript
const response = await fetch(
  `https://serpapi.com/search.json?engine=google_images&q=${query}&api_key=${API_KEY}`
)
```

### Image Validation

Add these validations for production:

```typescript
// Image safety and appropriateness
const isImageSafe = await moderateImage(imageUrl)

// Face detection
const hasFace = await detectFace(imageUrl)

// Image quality (resolution, format)
const isGoodQuality = await validateImageQuality(imageUrl)
```

### Storage Strategy

Consider these approaches for image storage:

1. **Direct Linking**: Store URLs directly (current approach)
2. **Proxy/Cache**: Download and serve through your CDN
3. **Upload to Storage**: Save to AWS S3, Google Cloud Storage, etc.

```typescript
// Example: Upload to cloud storage
const uploadedUrl = await uploadImageToStorage(originalUrl, analystId)
await updateAnalyst(analystId, { profileImageUrl: uploadedUrl })
```

## Security Considerations

### Privacy & Compliance

- **GDPR Compliance**: Ensure you have consent to search for and store personal images
- **Right to be Forgotten**: Allow users to remove automatically-found images
- **Data Retention**: Define policies for how long to keep image URLs

### Content Safety

- **Image Moderation**: Use AI services to detect inappropriate content
- **Source Verification**: Validate that images come from reputable sources
- **Copyright Respect**: Avoid using copyrighted professional headshots

### Access Control

```typescript
// Only allow authorized users to search for images
if (!user.canEditAnalysts) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
}

// Log all image search activities
await auditLog.create({
  action: 'PROFILE_IMAGE_SEARCH',
  userId: user.id,
  analystId: analystId,
  searchQuery: analystName
})
```

## Testing

### Manual Testing

1. Open any analyst profile in edit mode
2. Click "Select Photo" button
3. Wait for search results to load
4. Click on any image to select it
5. Verify the image appears in the profile header

### Automated Testing

Run the demo script:

```bash
npm run test:profile-pictures
```

This script will:
- Select a random analyst from the database
- Perform a mock search for their profile pictures
- Display the results with confidence scores
- Automatically update their profile with the highest-confidence result

### Test Cases

- [x] Search with full name only
- [x] Search with name + company
- [x] Search with name + title + company
- [x] Handle no results found
- [x] Handle API errors gracefully
- [x] Validate image URLs before saving
- [x] Display confidence scores correctly
- [x] Update profile picture immediately after selection

## Future Enhancements

### Advanced Features

1. **Bulk Image Search**: Search for all analysts without profile pictures
2. **Image Quality Scoring**: Rank results by image quality (resolution, lighting, etc.)
3. **Face Recognition**: Verify that found images actually show the correct person
4. **Multiple Image Sources**: Combine results from LinkedIn, company websites, etc.
5. **User Approval Workflow**: Require admin approval before updating profile pictures

### UI Improvements

1. **Image Comparison**: Side-by-side comparison with current profile picture
2. **Search Refinement**: Allow users to add more specific search terms
3. **Batch Operations**: Select images for multiple analysts at once
4. **Image Editing**: Basic cropping and adjustment tools
5. **Usage Analytics**: Track which images perform best

### Integration Options

1. **LinkedIn Integration**: Direct API access to LinkedIn profile photos
2. **Company Directory**: Search internal employee directories first
3. **CRM Sync**: Pull images from existing CRM systems
4. **Social Media APIs**: Twitter, Facebook, GitHub profile images

## Configuration

### Environment Variables

Add these to your `.env.local` file for production:

```env
# Google Custom Search
GOOGLE_API_KEY=your_google_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id

# Bing Image Search
BING_API_KEY=your_bing_api_key

# SerpApi
SERPAPI_KEY=your_serpapi_key

# Image moderation
AZURE_CONTENT_MODERATOR_KEY=your_azure_key
AZURE_CONTENT_MODERATOR_ENDPOINT=your_azure_endpoint
```

### Feature Flags

Control the feature rollout:

```typescript
const PROFILE_SEARCH_ENABLED = process.env.ENABLE_PROFILE_SEARCH === 'true'
const PROFILE_SEARCH_BETA_USERS = process.env.PROFILE_SEARCH_BETA_USERS?.split(',') || []
```

## Troubleshooting

### Common Issues

1. **No Results Found**
   - Verify analyst name spelling
   - Check if analyst has public online presence
   - Try broader search terms

2. **Images Not Loading**
   - Check CORS policies on source websites
   - Verify image URLs are accessible
   - Consider using image proxy service

3. **Low Confidence Scores**
   - Add more specific search terms (company, title)
   - Improve search query construction
   - Fine-tune confidence calculation algorithm

### Debug Mode

Enable detailed logging:

```typescript
const DEBUG_PROFILE_SEARCH = process.env.DEBUG_PROFILE_SEARCH === 'true'

if (DEBUG_PROFILE_SEARCH) {
  console.log('Search query:', searchQuery)
  console.log('API response:', response)
  console.log('Processed results:', results)
}
```

## Support

For questions about this feature:

1. Check the troubleshooting section above
2. Review the test scripts in `/scripts/`
3. Examine the API implementation in `/src/app/api/analysts/search-profile-pictures/`
4. Test with the demo script: `npm run test:profile-pictures`

# Google Calendar Integration Setup

This guide walks you through setting up Google Calendar integration for the Analyst Portal to track meetings with industry analysts.

## Overview

The calendar integration allows:
- Team members to connect their Google Calendars with read-only access
- Automatic identification of meetings with known industry analysts
- Tracking conversation history and timing with precision
- Secure processing of all calendar data

## Google Cloud Console Setup

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your project ID

### 2. Enable Required APIs

Enable the following APIs in your Google Cloud project:
- **Google Calendar API**
- **Google+ API** (for user profile information)

To enable these APIs:
1. Go to **APIs & Services** > **Library**
2. Search for "Google Calendar API" and enable it
3. Search for "Google+ API" and enable it

### 3. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - Choose **External** user type
   - Fill in the required fields:
     - App name: "Analyst Portal"
     - User support email: your email
     - Developer contact email: your email
   - Add scopes:
     - `auth/calendar.readonly`
     - `auth/userinfo.email`
     - `auth/userinfo.profile`
   - Add test users (the emails that will be connecting their calendars)

4. Create OAuth client ID:
   - Application type: **Web application**
   - Name: "Analyst Portal Calendar Integration"
   - Authorized redirect URIs:
     - For development: `http://localhost:3000/api/auth/google-calendar/callback`
     - For production: `https://yourdomain.com/api/auth/google-calendar/callback`

5. Download the JSON credentials file or copy the Client ID and Client Secret

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Google Calendar Integration
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google-calendar/callback

# Encryption Key for storing OAuth tokens (generate a secure 32-character key)
ENCRYPTION_KEY=your_32_character_encryption_key_here
```

### Generating an Encryption Key

You can generate a secure encryption key using Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Database Setup

The calendar integration requires new database tables. Run the migration:

```bash
npx prisma migrate dev
```

This will create the following tables:
- `CalendarConnection` - Stores connected Google Calendar accounts
- `CalendarMeeting` - Stores calendar events and analyst meeting identification

## Testing the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/settings` in your application

3. In the "Calendar Integration" section:
   - Enter a display name (e.g., "Chief Product Officer")
   - Click "Connect Google Calendar"
   - Authorize the application with your Google account
   - You should be redirected back with a success message

## Security Considerations

- **Token Encryption**: All OAuth tokens are encrypted before being stored in the database
- **Read-Only Access**: The integration only requests read-only access to calendars
- **Minimal Scopes**: Only the necessary OAuth scopes are requested
- **User Control**: Users can activate/deactivate connections and delete them at any time

## Production Deployment

For production deployment:

1. Update the `GOOGLE_REDIRECT_URI` in your environment variables
2. Add the production redirect URI to your Google OAuth client configuration
3. Ensure your encryption key is securely generated and stored
4. Consider implementing proper user authentication instead of the hardcoded user ID

## Troubleshooting

### Common Issues

1. **"OAuth client not found"** - Check that your Client ID and Secret are correct
2. **"Redirect URI mismatch"** - Ensure your redirect URI matches exactly what's configured in Google Cloud Console
3. **"Access denied"** - Make sure the user is added as a test user in the OAuth consent screen (for development)

### Error Messages

The application provides specific error messages for different OAuth failures:
- `google_auth_denied` - User denied authorization
- `missing_auth_params` - Missing code or state parameters
- `invalid_state` - Invalid or corrupted state parameter
- `no_access_token` - Google didn't provide an access token
- `no_user_email` - Unable to retrieve user email from Google

## Next Steps

Once the calendar integration is set up, you can:
1. Add calendar sync functionality to automatically fetch events
2. Implement AI-powered analyst meeting detection
3. Create analytics and reporting features for meeting insights
4. Set up automated alerts for upcoming analyst meetings

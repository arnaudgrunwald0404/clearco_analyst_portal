#!/usr/bin/env tsx

import { config } from 'dotenv'
import { google } from 'googleapis'

// Load environment variables
config()

console.log('🔍 Testing Google Calendar OAuth Configuration...\n')

// Check environment variables
console.log('📋 Environment Variables:')
console.log('  GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Present ✅' : 'Missing ❌')
console.log('  GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Present ✅' : 'Missing ❌')
console.log('  GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI || 'Missing ❌')
console.log('  ENCRYPTION_KEY:', process.env.ENCRYPTION_KEY ? 'Present ✅' : 'Missing ❌')

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.log('\n❌ Missing required Google OAuth credentials!')
  process.exit(1)
}

// Initialize OAuth client
console.log('\n🔧 Initializing OAuth2 Client...')
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

// Generate auth URL to test the configuration
console.log('\n🔗 Generating Authorization URL...')
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ],
  prompt: 'consent',
  state: Buffer.from(JSON.stringify({
    connectFirst: true,
    title: 'Test Connection'
  })).toString('base64')
})

console.log('\n✅ OAuth Configuration appears valid!')
console.log('\n🌐 Authorization URL generated:')
console.log(authUrl)

console.log('\n📝 Steps to test:')
console.log('1. Open the URL above in your browser')
console.log('2. Complete the Google OAuth flow')
console.log('3. Check if you get redirected back to your application')
console.log('4. Look for any errors in the callback')

console.log('\n🔍 Redirect URI Configuration:')
console.log('  Current:', process.env.GOOGLE_REDIRECT_URI)
console.log('  Expected format: http://localhost:3000/api/auth/google-calendar/callback')
console.log('  ⚠️  Make sure this matches your Google Cloud Console OAuth configuration!')

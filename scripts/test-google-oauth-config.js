#!/usr/bin/env node

/**
 * Test Google OAuth Configuration
 * This script helps debug Google OAuth setup by showing the current configuration
 */

require('dotenv').config()

console.log('🔍 Google OAuth Configuration Test')
console.log('='.repeat(50))

// Check environment variables
const requiredVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET', 
  'GOOGLE_REDIRECT_URI'
]

console.log('📋 Environment Variables:')
requiredVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: ${varName.includes('SECRET') ? '[HIDDEN]' : value}`)
  } else {
    console.log(`❌ ${varName}: Missing!`)
  }
})

console.log('\n🔗 Expected Callback URLs for Google Console:')
console.log('Add BOTH of these to your Google OAuth client:')
console.log('')
console.log('1. Calendar Integration:')
console.log(`   ${process.env.APP_URL || 'http://localhost:3000'}/api/auth/google-calendar/callback`)
console.log('')
console.log('2. General Authentication:')
console.log(`   ${process.env.APP_URL || 'http://localhost:3000'}/api/auth/google/callback`)

console.log('\n🎯 Testing OAuth Flow URLs:')

if (process.env.GOOGLE_CLIENT_ID) {
  const baseAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth'
  
  // Calendar OAuth URL
  const calendarScopes = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ].join(' ')
  
  const calendarUrl = `${baseAuthUrl}?` + new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/google-calendar/callback`,
    response_type: 'code',
    scope: calendarScopes,
    access_type: 'offline',
    prompt: 'consent'
  }).toString()
  
  console.log('\n📅 Calendar OAuth URL:')
  console.log(calendarUrl)
  
  // General OAuth URL  
  const generalScopes = [
    'openid',
    'email', 
    'profile'
  ].join(' ')
  
  const generalUrl = `${baseAuthUrl}?` + new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/google/callback`,
    response_type: 'code',
    scope: generalScopes,
    access_type: 'offline'
  }).toString()
  
  console.log('\n👤 General OAuth URL:')
  console.log(generalUrl)
  
  console.log('\n🧪 Manual Test Instructions:')
  console.log('1. Copy one of the URLs above and paste it in your browser')
  console.log('2. Complete the Google OAuth flow')
  console.log('3. Check if you get redirected back to your app successfully')
  console.log('4. If you get a "redirect_uri_mismatch" error, the URL is not configured in Google Console')
}

console.log('\n📝 Quick Setup Steps:')
console.log('1. Go to: https://console.cloud.google.com/')
console.log('2. Navigate: APIs & Services > Credentials')
console.log('3. Edit your OAuth 2.0 Client ID')
console.log('4. Add both callback URLs listed above to "Authorized redirect URIs"')
console.log('5. Save changes')
console.log('6. Test the calendar connection in your app')

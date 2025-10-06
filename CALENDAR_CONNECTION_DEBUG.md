# Calendar Connection Debug Guide

## 🔍 **Troubleshooting Calendar Connection Failures**

### **Common Issues & Solutions:**

#### **1. Authentication Issues**
- **Problem**: "Authentication required" error
- **Solution**: Make sure you're logged in as an analyst
- **Check**: Navigate to `/analyst_portal/settings` while logged in

#### **2. Google OAuth Configuration**
- **Problem**: OAuth redirect fails or shows "access denied"
- **Solutions**:
  - Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
  - Ensure `GOOGLE_REDIRECT_URI` matches exactly: `http://localhost:3000/api/auth/google-calendar/callback`
  - Check Google Console OAuth consent screen is configured
  - Verify Calendar API is enabled in Google Console

#### **3. Database Connection Issues**
- **Problem**: Database errors during connection creation
- **Solutions**:
  - Check Supabase connection is working
  - Verify `calendar_connections` table exists
  - Ensure proper permissions on the table

#### **4. Encryption Key Issues**
- **Problem**: Token encryption/decryption failures
- **Solutions**:
  - Verify `ENCRYPTION_KEY` is set in `.env`
  - Ensure key is consistent between sessions

### **🔧 Debug Steps:**

#### **Step 1: Check Authentication**
```bash
# Verify you're logged in as an analyst
curl -X GET "http://localhost:3000/api/settings/calendar-connections" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie"
```

#### **Step 2: Test OAuth URL Generation**
1. Navigate to `/analyst_portal/settings`
2. Click "Add Calendar Connection"
3. Check browser network tab for API calls
4. Verify OAuth URL is generated correctly

#### **Step 3: Check Google Console Setup**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Credentials
3. Check OAuth 2.0 Client IDs
4. Verify authorized redirect URIs include: `http://localhost:3000/api/auth/google-calendar/callback`

#### **Step 4: Enable Required APIs**
1. Go to APIs & Services > Library
2. Enable "Google Calendar API"
3. Enable "Gmail API" (if using email features)

### **🐛 Common Error Messages:**

#### **"Authentication required"**
- **Cause**: Not logged in or session expired
- **Fix**: Log in as an analyst and try again

#### **"Failed to get authorization URL"**
- **Cause**: Google OAuth configuration missing
- **Fix**: Check environment variables and Google Console setup

#### **"No calendar found"**
- **Cause**: Google account has no calendars
- **Fix**: Create a calendar in Google Calendar or use a different account

#### **"Failed to connect calendar. Please try again."**
- **Cause**: Generic error - check server logs
- **Fix**: Look at browser console and server logs for specific error

### **📋 Environment Variables Checklist:**
```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google-calendar/callback
ENCRYPTION_KEY=your_encryption_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
```

### **🔍 Browser Debug Steps:**

1. **Open Developer Tools** (F12)
2. **Go to Network Tab**
3. **Navigate to** `/analyst_portal/settings`
4. **Click "Add Calendar Connection"**
5. **Check for failed requests** in Network tab
6. **Look at Console tab** for JavaScript errors
7. **Check Response** for API error messages

### **📊 Server Log Debug:**

Look for these log patterns in your terminal:
```
🔍 [Calendar Connections POST] Request started
🔐 [Calendar Connections POST] Starting authentication check...
✅ [Calendar Connections] OAuth URL generated
```

If you see errors, note the specific error message and line number.

### **✅ Quick Fix Checklist:**

- [ ] Logged in as analyst
- [ ] Environment variables set correctly
- [ ] Google OAuth consent screen configured
- [ ] Calendar API enabled in Google Console
- [ ] Redirect URI matches exactly
- [ ] Supabase connection working
- [ ] No JavaScript errors in browser console
- [ ] No network errors in browser dev tools

### **🚨 If Still Failing:**

1. **Check server logs** for specific error messages
2. **Try with a different Google account**
3. **Clear browser cache and cookies**
4. **Restart the development server**
5. **Check if calendar_connections table exists in Supabase**

### **📞 Getting Help:**

When reporting issues, include:
- Browser console errors
- Network tab failed requests
- Server terminal error messages
- Steps to reproduce the issue
- Google account type (personal vs. workspace)

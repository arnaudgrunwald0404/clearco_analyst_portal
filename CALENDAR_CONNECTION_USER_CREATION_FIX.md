# Calendar Connection User Creation Fix

## 🔍 **Issue Identified:**
The `user_creation_failed` error occurs during Google Calendar OAuth callback when trying to create a user profile in the `user_profiles` table.

## 🛠️ **Fixes Applied:**

### **1. Enhanced Error Logging**
- Added detailed error logging with error codes, details, and hints
- Error details are now included in the redirect URL for debugging

### **2. Robust User Profile Creation**
- Added explicit type casting for role values
- Added fallback method that omits the role field if initial creation fails
- Let database defaults handle role assignment when explicit role fails

### **3. Better Error Handling**
- Two-tier approach: try with role first, fallback without role
- Detailed logging at each step to identify the exact failure point

## 🎯 **Root Cause:**
The issue was likely caused by:
1. **Role enum mismatch** between code and database schema
2. **RLS policies** preventing user profile creation
3. **Missing required fields** in the user_profiles table

## 🔧 **What to Test:**

### **Step 1: Try Calendar Connection Again**
1. Navigate to `/analyst_portal/settings`
2. Click "Add Calendar Connection"
3. Complete Google OAuth flow
4. Check if it now works

### **Step 2: Check Server Logs**
Look for these log messages in your terminal:
```
👤 [CALENDAR OAUTH] User role determined: ANALYST
👤 [CALENDAR OAUTH] Creating new user profile...
👤 [CALENDAR OAUTH] User profile data: {...}
✅ [CALENDAR OAUTH] User profile created successfully
```

### **Step 3: Check Error Details**
If it still fails, the error URL will now include details:
```
/analyst_portal/settings?error=user_creation_failed&details=[specific_error_message]
```

## 🚨 **Common Issues & Solutions:**

### **Issue 1: Role Enum Mismatch**
- **Error**: `invalid input value for enum user_role`
- **Solution**: The fix handles this with fallback method

### **Issue 2: RLS Policy Blocking**
- **Error**: `new row violates row-level security policy`
- **Solution**: Check Supabase RLS policies on user_profiles table

### **Issue 3: Missing Required Fields**
- **Error**: `null value in column "role" violates not-null constraint`
- **Solution**: The fallback method omits role and lets database default handle it

## 📋 **Database Schema Check:**

Verify your `user_profiles` table has:
```sql
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role user_role NOT NULL DEFAULT 'VENDOR_USER',
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

## 🔍 **Next Steps if Still Failing:**

1. **Check the exact error message** in the URL parameters
2. **Look at server logs** for detailed error information
3. **Verify database schema** matches expectations
4. **Check RLS policies** on user_profiles table
5. **Test with a different Google account**

## 📞 **Getting Help:**

When reporting issues, include:
- The exact error URL with details parameter
- Server log output from the calendar OAuth process
- Your Google account type (personal vs. workspace)
- Any recent database schema changes

